/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/agents/scraper.js
   Platform scrapers via CORS proxy
   ═══════════════════════════════════════════ */

const Scraper = (() => {

  // ── CORS proxies (try in order) ──
  const PROXIES = [
    url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  async function proxyFetch(url) {
    let lastErr;
    for (const makeProxy of PROXIES) {
      try {
        const resp = await fetch(makeProxy(url), { signal: AbortSignal.timeout(12000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        // allorigins wraps in { contents }
        return data.contents || (typeof data === 'string' ? data : JSON.stringify(data));
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(`Proxy fetch failed: ${lastErr?.message}`);
  }

  function parseXML(str) {
    return new DOMParser().parseFromString(str, 'text/xml');
  }

  // ── Keyword filter ──
  function matchesKeywords(text, keywords) {
    if (!keywords || !keywords.trim()) return true;
    const kws = keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
    const t = (text || '').toLowerCase();
    return kws.some(kw => t.includes(kw));
  }

  // ── Deduplicate ──
  const seenUrls = new Set();
  function isDuplicate(agent, url) {
    if (!agent.features?.filterDuplicates) return false;
    const key = agent.id + '::' + url;
    if (seenUrls.has(key)) return true;
    seenUrls.add(key);
    // Keep set bounded
    if (seenUrls.size > 5000) {
      const first = seenUrls.values().next().value;
      seenUrls.delete(first);
    }
    return false;
  }

  // ════════════════════════════════
  // TWITTER (via Nitter RSS)
  // ════════════════════════════════
  async function scrapeTwitter(agent) {
    const { username, keywords, excludeRetweets, minLikes } = agent.rules;
    if (!username) throw new Error('Twitter agent: username is required');

    // Try multiple nitter instances
    const nitterInstances = [
      'https://nitter.privacydev.net',
      'https://nitter.cz',
      'https://nitter.poast.org',
    ];

    let xml = null;
    let lastErr;
    for (const inst of nitterInstances) {
      try {
        const url = `${inst}/${username.replace('@','')}/rss`;
        xml = await proxyFetch(url);
        if (xml && xml.includes('<rss')) break;
      } catch (e) { lastErr = e; }
    }

    if (!xml || !xml.includes('<rss')) {
      throw new Error(`Twitter/Nitter RSS unavailable. ${lastErr?.message || ''}`);
    }

    const doc = parseXML(xml);
    const items = [...doc.querySelectorAll('item')];

    return items
      .map(item => ({
        title: item.querySelector('title')?.textContent || '',
        text: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '') || '',
        url: item.querySelector('link')?.textContent || '',
        date: item.querySelector('pubDate')?.textContent || '',
        platform: 'twitter',
      }))
      .filter(item => {
        if (excludeRetweets && item.title.startsWith('RT ')) return false;
        if (keywords && !matchesKeywords(item.text + ' ' + item.title, keywords)) return false;
        return true;
      })
      .filter(item => !isDuplicate(agent, item.url))
      .slice(0, 10);
  }

  // ════════════════════════════════
  // REDDIT (via JSON API)
  // ════════════════════════════════
  async function scrapeReddit(agent) {
    const { subreddit, sortBy = 'new', minScore = 0, keywords, flairs } = agent.rules;
    if (!subreddit) throw new Error('Reddit agent: subreddit is required');

    const url = `https://www.reddit.com/r/${subreddit}/${sortBy}.json?limit=25`;
    const raw = await proxyFetch(url);
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('Reddit: invalid JSON response'); }

    const posts = data?.data?.children || [];
    return posts
      .map(p => p.data)
      .filter(p => {
        if (p.score < minScore) return false;
        if (keywords && !matchesKeywords(p.title + ' ' + p.selftext, keywords)) return false;
        if (flairs && flairs.trim()) {
          const fl = flairs.split(',').map(f => f.trim().toLowerCase());
          if (!fl.some(f => (p.link_flair_text || '').toLowerCase().includes(f))) return false;
        }
        return true;
      })
      .filter(p => !isDuplicate(agent, `https://reddit.com${p.permalink}`))
      .slice(0, agent.rules.maxItems || 5)
      .map(p => ({
        title: p.title,
        text: p.selftext?.slice(0, 300) || '',
        url: `https://reddit.com${p.permalink}`,
        score: p.score,
        author: p.author,
        subreddit: p.subreddit,
        thumbnail: p.thumbnail?.startsWith('http') ? p.thumbnail : null,
        platform: 'reddit',
      }));
  }

  // ════════════════════════════════
  // RSS FEED
  // ════════════════════════════════
  async function scrapeRSS(agent) {
    const { feedUrl, keywords, maxItems = 5 } = agent.rules;
    if (!feedUrl) throw new Error('RSS agent: feedUrl is required');

    const raw = await proxyFetch(feedUrl);
    const doc = parseXML(raw);

    const isAtom = !!doc.querySelector('feed');
    const items = isAtom
      ? [...doc.querySelectorAll('entry')]
      : [...doc.querySelectorAll('item')];

    const getEl = (el, ...selectors) => {
      for (const sel of selectors) {
        const found = el.querySelector(sel);
        if (found) return found.textContent?.trim() || '';
      }
      return '';
    };

    const getLinkAtom = (el) => {
      const link = el.querySelector('link');
      return link?.getAttribute('href') || link?.textContent || '';
    };

    return items
      .map(item => ({
        title: getEl(item, 'title'),
        text: getEl(item, 'description', 'summary', 'content').replace(/<[^>]+>/g, '').slice(0, 400),
        url: isAtom ? getLinkAtom(item) : getEl(item, 'link'),
        date: getEl(item, 'pubDate', 'published', 'updated'),
        platform: 'rss',
      }))
      .filter(item => !keywords || matchesKeywords(item.title + ' ' + item.text, keywords))
      .filter(item => !isDuplicate(agent, item.url))
      .slice(0, maxItems);
  }

  // ════════════════════════════════
  // CUSTOM WEB (CSS selector)
  // ════════════════════════════════
  async function scrapeWeb(agent) {
    const { targetUrl, cssSelector, keywords } = agent.rules;
    if (!targetUrl) throw new Error('Web agent: targetUrl is required');

    const raw = await proxyFetch(targetUrl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');

    let elements = [];
    if (cssSelector && cssSelector.trim()) {
      elements = [...doc.querySelectorAll(cssSelector)];
    } else {
      // Default: grab headlines (h1-h3, articles)
      elements = [...doc.querySelectorAll('h1, h2, h3, article, .post-title, .entry-title')];
    }

    return elements
      .slice(0, 15)
      .map(el => {
        const text = el.textContent?.trim() || '';
        const link = el.tagName === 'A' ? el.href : el.querySelector('a')?.href || targetUrl;
        return { title: text.slice(0, 200), text, url: link, platform: 'web' };
      })
      .filter(item => !keywords || matchesKeywords(item.text, keywords))
      .filter(item => !isDuplicate(agent, item.url))
      .slice(0, agent.rules.maxItems || 8);
  }

  // ════════════════════════════════
  // GITHUB (public events API)
  // ════════════════════════════════
  async function scrapeGitHub(agent) {
    const { repo, keywords } = agent.rules;
    if (!repo) throw new Error('GitHub agent: repo is required (owner/repo)');

    const url = `https://api.github.com/repos/${repo}/events?per_page=15`;
    const raw = await proxyFetch(url);
    let events;
    try { events = JSON.parse(raw); } catch { throw new Error('GitHub: invalid response'); }

    const watchTypes = agent.rules.watchEvents || ['PushEvent', 'IssuesEvent', 'PullRequestEvent'];

    return events
      .filter(e => watchTypes.includes(e.type))
      .filter(e => !keywords || matchesKeywords(JSON.stringify(e.payload), keywords))
      .filter(e => !isDuplicate(agent, e.id))
      .slice(0, 8)
      .map(e => {
        let text = '';
        if (e.type === 'PushEvent') text = `${e.actor.login} pushed ${e.payload.commits?.length || 0} commit(s) to ${e.repo.name}`;
        else if (e.type === 'IssuesEvent') text = `[${e.payload.action}] Issue: ${e.payload.issue?.title}`;
        else if (e.type === 'PullRequestEvent') text = `[${e.payload.action}] PR: ${e.payload.pull_request?.title}`;
        else text = `${e.type} by ${e.actor.login}`;
        return {
          title: e.type,
          text,
          url: `https://github.com/${e.repo.name}`,
          platform: 'github',
        };
      });
  }

  // ════════════════════════════════
  // YOUTUBE (RSS)
  // ════════════════════════════════
  async function scrapeYouTube(agent) {
    const { channelId, keywords, maxResults = 5 } = agent.rules;
    if (!channelId) throw new Error('YouTube agent: channelId is required');

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const raw = await proxyFetch(url);
    const doc = parseXML(raw);
    const entries = [...doc.querySelectorAll('entry')];

    return entries
      .slice(0, maxResults)
      .map(e => ({
        title: e.querySelector('title')?.textContent || '',
        text: e.querySelector('media\\:description, description')?.textContent?.slice(0, 200) || '',
        url: e.querySelector('link')?.getAttribute('href') || '',
        author: e.querySelector('author name')?.textContent || '',
        platform: 'youtube',
      }))
      .filter(item => !keywords || matchesKeywords(item.title + ' ' + item.text, keywords))
      .filter(item => !isDuplicate(agent, item.url));
  }

  // ── Main dispatcher ──
  async function run(agent) {
    switch (agent.platform) {
      case 'twitter': return scrapeTwitter(agent);
      case 'reddit':  return scrapeReddit(agent);
      case 'rss':     return scrapeRSS(agent);
      case 'web':     return scrapeWeb(agent);
      case 'github':  return scrapeGitHub(agent);
      case 'youtube': return scrapeYouTube(agent);
      default: throw new Error(`Unknown platform: ${agent.platform}`);
    }
  }

  return { run };
})();

window.Scraper = Scraper;
