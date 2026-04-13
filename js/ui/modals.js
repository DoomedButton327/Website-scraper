/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/ui/modals.js
   Agent create/edit modal, confirm dialogs
   ═══════════════════════════════════════════ */

const Modals = (() => {

  let currentAgent = null;

  // ── Open agent modal ──
  function openAgent(agentId = null) {
    currentAgent = agentId ? Storage.getAgent(agentId) : AgentManager.createAgent();
    renderAgentModal(currentAgent);
    document.getElementById('modal-agent').classList.add('open');
  }

  function closeAgent() {
    document.getElementById('modal-agent').classList.remove('open');
    currentAgent = null;
  }

  // ── Open confirm modal ──
  function confirm(title, msg, onConfirm, danger = false) {
    const overlay = document.getElementById('modal-confirm');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    const btn = document.getElementById('confirm-ok');
    btn.textContent = danger ? 'Delete' : 'Confirm';
    btn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    btn.onclick = () => { onConfirm(); overlay.classList.remove('open'); };
    overlay.classList.add('open');
  }

  function closeConfirm() {
    document.getElementById('modal-confirm').classList.remove('open');
  }

  // ── Platform rule fields ──
  function getPlatformFields(platform) {
    const fields = {
      twitter: `
        <div class="form-group">
          <label class="form-label">Twitter Username</label>
          <input class="form-input" id="r-username" placeholder="@elonmusk" value="">
          <span class="form-hint">Without @ is fine</span>
        </div>
        <div class="form-group">
          <label class="form-label">Keywords (comma separated)</label>
          <input class="form-input" id="r-keywords" placeholder="AI, crypto, web3">
        </div>
        <label class="toggle-wrap">
          <span class="toggle-label">Exclude Retweets
            <span class="toggle-sub">Skip RT @... posts</span>
          </span>
          <span class="toggle"><input type="checkbox" id="r-excludeRetweets"><span class="toggle-track"></span><span class="toggle-thumb"></span></span>
        </label>
        <label class="toggle-wrap">
          <span class="toggle-label">Include Media
            <span class="toggle-sub">Attach images/videos</span>
          </span>
          <span class="toggle"><input type="checkbox" id="r-includeMedia" checked><span class="toggle-track"></span><span class="toggle-thumb"></span></span>
        </label>
      `,
      reddit: `
        <div class="form-group">
          <label class="form-label">Subreddit</label>
          <input class="form-input" id="r-subreddit" placeholder="learnprogramming">
        </div>
        <div class="form-group">
          <label class="form-label">Sort By</label>
          <select class="form-select" id="r-sortBy">
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="top">Top</option>
            <option value="rising">Rising</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Min Score</label>
          <input class="form-input" id="r-minScore" type="number" value="0" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Keywords Filter</label>
          <input class="form-input" id="r-keywords" placeholder="tutorial, guide, help">
        </div>
        <div class="form-group">
          <label class="form-label">Flair Filter</label>
          <input class="form-input" id="r-flairs" placeholder="Discussion, News">
        </div>
      `,
      rss: `
        <div class="form-group">
          <label class="form-label">RSS / Atom Feed URL</label>
          <input class="form-input" id="r-feedUrl" type="url" placeholder="https://example.com/feed.xml">
        </div>
        <div class="form-group">
          <label class="form-label">Keywords Filter</label>
          <input class="form-input" id="r-keywords" placeholder="news, update, release">
        </div>
        <div class="form-group">
          <label class="form-label">Max Items Per Run</label>
          <input class="form-input" id="r-maxItems" type="number" value="5" min="1" max="20">
        </div>
      `,
      web: `
        <div class="form-group">
          <label class="form-label">Target URL</label>
          <input class="form-input" id="r-targetUrl" type="url" placeholder="https://example.com/news">
        </div>
        <div class="form-group">
          <label class="form-label">CSS Selector (optional)</label>
          <input class="form-input" id="r-cssSelector" placeholder=".article-title, h2.post-name">
          <span class="form-hint">Leave blank to auto-detect headlines</span>
        </div>
        <div class="form-group">
          <label class="form-label">Keywords Filter</label>
          <input class="form-input" id="r-keywords" placeholder="breaking, exclusive">
        </div>
      `,
      github: `
        <div class="form-group">
          <label class="form-label">Repository (owner/repo)</label>
          <input class="form-input" id="r-repo" placeholder="torvalds/linux">
        </div>
        <div class="form-group">
          <label class="form-label">Watch Events</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
            ${['PushEvent','IssuesEvent','PullRequestEvent','ReleaseEvent','StarEvent','ForkEvent'].map(ev =>
              `<label class="checkbox-wrap" style="width:auto">
                <span class="custom-checkbox" data-ev="${ev}"></span>
                <span class="checkbox-label" style="font-size:0.75rem">${ev.replace('Event','')}</span>
              </label>`
            ).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Keywords Filter</label>
          <input class="form-input" id="r-keywords" placeholder="fix, feat, release">
        </div>
      `,
      youtube: `
        <div class="form-group">
          <label class="form-label">Channel ID</label>
          <input class="form-input" id="r-channelId" placeholder="UCxxxxxxxxxxxxxxxxxxxxxx">
          <span class="form-hint">Find on youtube.com/channel/[ID]</span>
        </div>
        <div class="form-group">
          <label class="form-label">Keywords Filter</label>
          <input class="form-input" id="r-keywords" placeholder="tutorial, review, vlog">
        </div>
        <div class="form-group">
          <label class="form-label">Max Videos Per Run</label>
          <input class="form-input" id="r-maxResults" type="number" value="5" min="1" max="20">
        </div>
      `,
    };
    return fields[platform] || '';
  }

  function renderAgentModal(agent) {
    const modal = document.getElementById('modal-agent');
    const body  = modal.querySelector('.modal-body');
    const title = modal.querySelector('.modal-title');
    title.textContent = agent.id && Storage.getAgent(agent.id) ? 'Edit Agent' : 'New Agent';

    body.innerHTML = `
      <!-- Basic -->
      <div class="form-group">
        <label class="form-label">Agent Name</label>
        <input class="form-input" id="a-name" value="${agent.name}" placeholder="My Twitter Watcher">
      </div>

      <div class="form-group">
        <label class="form-label">Platform</label>
        <select class="form-select" id="a-platform">
          ${Object.entries(AgentManager.PLATFORMS).map(([k,v]) =>
            `<option value="${k}" ${agent.platform === k ? 'selected' : ''}>${v.emoji} ${v.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Scrape Interval (minutes)</label>
        <input class="form-input" id="a-interval" type="number" value="${agent.intervalMinutes}" min="1">
      </div>

      <!-- Platform rules -->
      <div class="divider"></div>
      <div id="platform-rules" class="settings-section" style="background:rgba(255,255,255,0.02);padding:14px;border-radius:12px;margin-bottom:16px;">
        ${getPlatformFields(agent.platform)}
      </div>

      <!-- Discord -->
      <div class="divider"></div>
      <div class="settings-section">
        <div class="settings-section-title">📨 Discord</div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Webhook URL</label>
            <input class="form-input" id="a-webhook" type="url"
              value="${agent.discordWebhook}"
              placeholder="https://discord.com/api/webhooks/...">
          </div>
        </div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Embed Color</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="color" id="a-embedcolor" value="${agent.features.embedColor || '#7c3aed'}"
                style="width:40px;height:36px;border:1px solid var(--glass-border);border-radius:8px;background:none;cursor:pointer;padding:2px;">
              <input class="form-input" id="a-embedcolor-text" value="${agent.features.embedColor || '#7c3aed'}" style="width:100px;font-family:var(--font-mono)">
            </div>
          </div>
        </div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Mention Role ID (optional)</label>
            <input class="form-input" id="a-mention" placeholder="123456789012345678"
              value="${agent.features.mentionRole || ''}">
          </div>
        </div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Custom Message (before embed)</label>
            <input class="form-input" id="a-custommsg" placeholder="🚨 New alert!"
              value="${agent.features.customMessage || ''}">
          </div>
        </div>
        <div class="settings-row">
          <button class="btn btn-secondary btn-sm" id="test-webhook-btn" style="width:100%">
            🔔 Test Webhook
          </button>
        </div>
      </div>

      <!-- Features -->
      <div class="settings-section" style="margin-top:12px">
        <div class="settings-section-title">⚙️ Features</div>
        <div class="settings-row">
          <label class="toggle-wrap">
            <span class="toggle-label">Post to Discord
              <span class="toggle-sub">Send results to your webhook</span>
            </span>
            <span class="toggle">
              <input type="checkbox" id="f-postToDiscord" ${agent.features.postToDiscord ? 'checked' : ''}>
              <span class="toggle-track"></span><span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
        <div class="settings-row">
          <label class="toggle-wrap">
            <span class="toggle-label">Dry Run Mode
              <span class="toggle-sub">Scrape but don't post</span>
            </span>
            <span class="toggle">
              <input type="checkbox" id="f-dryRun" ${agent.features.dryRun ? 'checked' : ''}>
              <span class="toggle-track"></span><span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
        <div class="settings-row">
          <label class="toggle-wrap">
            <span class="toggle-label">Filter Duplicates
              <span class="toggle-sub">Skip already-seen URLs</span>
            </span>
            <span class="toggle">
              <input type="checkbox" id="f-filterDuplicates" ${agent.features.filterDuplicates ? 'checked' : ''}>
              <span class="toggle-track"></span><span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
        <div class="settings-row">
          <label class="toggle-wrap">
            <span class="toggle-label">Include Thumbnails
              <span class="toggle-sub">Attach images to embeds</span>
            </span>
            <span class="toggle">
              <input type="checkbox" id="f-includeThumbnails" ${agent.features.includeThumbnails ? 'checked' : ''}>
              <span class="toggle-track"></span><span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
        <div class="settings-row">
          <label class="toggle-wrap">
            <span class="toggle-label">Agent Enabled
              <span class="toggle-sub">Activate auto-schedule</span>
            </span>
            <span class="toggle">
              <input type="checkbox" id="a-enabled" ${agent.enabled ? 'checked' : ''}>
              <span class="toggle-track"></span><span class="toggle-thumb"></span>
            </span>
          </label>
        </div>
      </div>
    `;

    // Restore platform-specific rule values
    restoreRuleValues(agent);

    // Platform switcher
    document.getElementById('a-platform').addEventListener('change', e => {
      document.getElementById('platform-rules').innerHTML = getPlatformFields(e.target.value);
      // Temporarily use empty rules for new platform
      restoreRuleValues({ ...agent, platform: e.target.value, rules: {} });
    });

    // Color sync
    const colorPicker = document.getElementById('a-embedcolor');
    const colorText   = document.getElementById('a-embedcolor-text');
    colorPicker.addEventListener('input', () => { colorText.value = colorPicker.value; });
    colorText.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) colorPicker.value = colorText.value;
    });

    // GitHub checkboxes
    setupGitHubCheckboxes(agent);

    // Test webhook
    document.getElementById('test-webhook-btn')?.addEventListener('click', async () => {
      const url = document.getElementById('a-webhook')?.value;
      const name = document.getElementById('a-name')?.value || 'Test';
      if (!url) { Toast.warn('Enter a webhook URL first'); return; }
      try {
        await DiscordWebhook.test(url, name);
        Toast.success('✅ Test message sent to Discord!');
      } catch (e) {
        Toast.error('Webhook test failed: ' + e.message);
      }
    });
  }

  function restoreRuleValues(agent) {
    const r = agent.rules || {};
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    setVal('r-username', r.username);
    setVal('r-keywords', r.keywords);
    setChk('r-excludeRetweets', r.excludeRetweets);
    setChk('r-includeMedia', r.includeMedia !== false);
    setVal('r-subreddit', r.subreddit);
    setVal('r-sortBy', r.sortBy);
    setVal('r-minScore', r.minScore);
    setVal('r-flairs', r.flairs);
    setVal('r-feedUrl', r.feedUrl);
    setVal('r-maxItems', r.maxItems);
    setVal('r-targetUrl', r.targetUrl);
    setVal('r-cssSelector', r.cssSelector);
    setVal('r-repo', r.repo);
    setVal('r-channelId', r.channelId);
    setVal('r-maxResults', r.maxResults);
  }

  function setupGitHubCheckboxes(agent) {
    const boxes = document.querySelectorAll('[data-ev]');
    if (!boxes.length) return;
    const watched = agent.rules?.watchEvents || [];
    boxes.forEach(box => {
      const ev = box.dataset.ev;
      if (watched.includes(ev)) box.classList.add('checked');
      box.addEventListener('click', () => box.classList.toggle('checked'));
    });
  }

  function collectRules(platform) {
    const g = id => document.getElementById(id);
    const val = id => g(id)?.value?.trim() || '';
    const chk = id => g(id)?.checked || false;
    const num = id => parseInt(g(id)?.value) || 0;

    const base = { keywords: val('r-keywords') };
    switch (platform) {
      case 'twitter': return { ...base, username: val('r-username'), excludeRetweets: chk('r-excludeRetweets'), includeMedia: chk('r-includeMedia') };
      case 'reddit':  return { ...base, subreddit: val('r-subreddit'), sortBy: val('r-sortBy'), minScore: num('r-minScore'), flairs: val('r-flairs') };
      case 'rss':     return { ...base, feedUrl: val('r-feedUrl'), maxItems: num('r-maxItems') || 5 };
      case 'web':     return { ...base, targetUrl: val('r-targetUrl'), cssSelector: val('r-cssSelector') };
      case 'github': {
        const evs = [...document.querySelectorAll('[data-ev].checked')].map(b => b.dataset.ev);
        return { ...base, repo: val('r-repo'), watchEvents: evs.length ? evs : ['PushEvent','IssuesEvent'] };
      }
      case 'youtube': return { ...base, channelId: val('r-channelId'), maxResults: num('r-maxResults') || 5 };
      default: return base;
    }
  }

  function saveAgent() {
    if (!currentAgent) return;
    const g = id => document.getElementById(id);
    const platform = g('a-platform')?.value || currentAgent.platform;

    const updated = {
      ...currentAgent,
      name:            g('a-name')?.value?.trim()      || 'Agent',
      platform,
      intervalMinutes: parseInt(g('a-interval')?.value) || 30,
      discordWebhook:  g('a-webhook')?.value?.trim()   || '',
      enabled:         g('a-enabled')?.checked          ?? false,
      rules: collectRules(platform),
      features: {
        ...currentAgent.features,
        postToDiscord:    g('f-postToDiscord')?.checked    ?? true,
        dryRun:           g('f-dryRun')?.checked           ?? false,
        filterDuplicates: g('f-filterDuplicates')?.checked ?? true,
        includeThumbnails:g('f-includeThumbnails')?.checked ?? true,
        embedColor:       g('a-embedcolor-text')?.value    || '#7c3aed',
        mentionRole:      g('a-mention')?.value?.trim()    || '',
        customMessage:    g('a-custommsg')?.value?.trim()  || '',
      },
    };

    AgentManager.save(updated);
    if (updated.enabled) AgentManager.startSchedule(updated);
    else AgentManager.stopSchedule(updated.id);

    closeAgent();
    Toast.success(`Agent "${updated.name}" saved!`);
  }

  return {
    openAgent,
    closeAgent,
    saveAgent,
    confirm,
    closeConfirm,
  };
})();

window.Modals = Modals;
