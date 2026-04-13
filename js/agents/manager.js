/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/agents/manager.js
   Agent CRUD + scheduler
   ═══════════════════════════════════════════ */

const AgentManager = (() => {
  const timers = {};   // agentId → intervalId
  const running = new Set();

  // ── Platform definitions ──
  const PLATFORMS = {
    twitter: {
      label: 'Twitter / X',
      icon: '𝕏',
      emoji: '🐦',
      color: '#1DA1F2',
      defaultUrl: 'https://nitter.privacydev.net',
      rules: ['username', 'keywords', 'excludeRetweets', 'includeMedia', 'minLikes'],
    },
    reddit: {
      label: 'Reddit',
      icon: '👾',
      emoji: '👾',
      color: '#FF4500',
      defaultUrl: 'https://www.reddit.com',
      rules: ['subreddit', 'flairs', 'sortBy', 'minScore', 'keywords'],
    },
    rss: {
      label: 'RSS Feed',
      icon: '📡',
      emoji: '📡',
      color: '#FFA500',
      defaultUrl: '',
      rules: ['feedUrl', 'keywords', 'maxItems'],
    },
    web: {
      label: 'Custom Web',
      icon: '🌐',
      emoji: '🌐',
      color: '#00D4FF',
      defaultUrl: '',
      rules: ['targetUrl', 'cssSelector', 'keywords', 'followLinks'],
    },
    github: {
      label: 'GitHub',
      icon: '🐙',
      emoji: '🐙',
      color: '#7B68EE',
      defaultUrl: 'https://github.com',
      rules: ['repo', 'watchEvents', 'keywords'],
    },
    youtube: {
      label: 'YouTube',
      icon: '▶',
      emoji: '▶️',
      color: '#FF0000',
      defaultUrl: 'https://www.youtube.com',
      rules: ['channelId', 'keywords', 'maxResults'],
    },
  };

  function getPlatforms() { return PLATFORMS; }

  // ── Create default agent ──
  function createAgent(overrides = {}) {
    const id = 'agent_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    return {
      id,
      name: 'New Agent',
      platform: 'twitter',
      enabled: false,
      intervalMinutes: 30,
      discordWebhook: '',
      targetUrl: '',
      rules: {
        username: '',
        keywords: '',
        excludeRetweets: false,
        includeMedia: true,
        minLikes: 0,
        subreddit: '',
        flairs: '',
        sortBy: 'new',
        minScore: 0,
        feedUrl: '',
        maxItems: 5,
        cssSelector: '',
        followLinks: false,
        repo: '',
        watchEvents: ['push', 'issues'],
        channelId: '',
        maxResults: 5,
      },
      features: {
        postToDiscord: true,
        dryRun: false,
        filterDuplicates: true,
        includeThumbnails: true,
        mentionRole: '',
        embedColor: '#7c3aed',
        customMessage: '',
      },
      stats: {
        totalRuns: 0,
        totalPosted: 0,
        lastRun: null,
        lastError: null,
      },
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // ── Save ──
  function save(agent) {
    Storage.saveAgent(agent);
    Events.emit(EV.AGENTS_CHANGED);
    return agent;
  }

  // ── Delete ──
  function remove(id) {
    stopSchedule(id);
    Storage.deleteAgent(id);
    Events.emit(EV.AGENTS_CHANGED);
  }

  // ── Toggle enabled ──
  function toggle(id) {
    const agent = Storage.getAgent(id);
    if (!agent) return;
    agent.enabled = !agent.enabled;
    save(agent);
    if (agent.enabled) startSchedule(agent);
    else stopSchedule(id);
  }

  // ── Get all ──
  function getAll() { return Storage.getAgents(); }

  // ── Schedule ──
  function startSchedule(agent) {
    stopSchedule(agent.id);
    if (!agent.enabled) return;
    const ms = (agent.intervalMinutes || 30) * 60 * 1000;
    timers[agent.id] = setInterval(() => runAgent(agent.id), ms);
  }

  function stopSchedule(id) {
    if (timers[id]) { clearInterval(timers[id]); delete timers[id]; }
  }

  function initSchedules() {
    getAll().forEach(agent => { if (agent.enabled) startSchedule(agent); });
  }

  // ── Run agent ──
  async function runAgent(id) {
    const agent = Storage.getAgent(id);
    if (!agent) return;
    if (running.has(id)) { console.log('[AgentManager] already running:', id); return; }

    running.add(id);
    Events.emit(EV.AGENT_RUN_START, { agentId: id });

    try {
      const results = await Scraper.run(agent);
      const agent2 = Storage.getAgent(id); // re-fetch fresh
      if (!agent2) return;

      agent2.stats.totalRuns += 1;
      agent2.stats.lastRun = new Date().toISOString();
      agent2.stats.lastError = null;

      let posted = 0;
      for (const item of results) {
        const logEntry = {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
          agentId: id,
          agentName: agent2.name,
          platform: agent2.platform,
          content: item.text || item.title || '(no content)',
          url: item.url || '',
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        if (agent2.features.postToDiscord && agent2.discordWebhook) {
          if (agent2.features.dryRun) {
            logEntry.status = 'dry';
            Events.emit(EV.TOAST, { type: 'warn', msg: `[DRY RUN] ${agent2.name}: ${results.length} items found` });
          } else {
            try {
              await DiscordWebhook.send(agent2, item);
              logEntry.status = 'posted';
              posted++;
              Storage.bumpStat('totalPosted');
            } catch (e) {
              logEntry.status = 'failed';
              logEntry.error = e.message;
              Storage.bumpStat('totalErrors');
            }
          }
        } else {
          logEntry.status = 'logged';
        }

        Storage.addLog(logEntry);
        Events.emit(EV.LOG_ADDED, logEntry);
      }

      agent2.stats.totalPosted += posted;
      save(agent2);
      Storage.bumpStat('totalScrapes');

      Events.emit(EV.AGENT_RUN_DONE, { agentId: id, count: results.length, posted });
      Events.emit(EV.TOAST, { type: 'success', msg: `${agent2.name}: ${results.length} results, ${posted} posted` });

    } catch (err) {
      const agent2 = Storage.getAgent(id);
      if (agent2) {
        agent2.stats.lastError = err.message;
        agent2.stats.totalRuns += 1;
        save(agent2);
      }
      Events.emit(EV.AGENT_RUN_ERROR, { agentId: id, error: err.message });
      Events.emit(EV.TOAST, { type: 'error', msg: `${agent?.name || id} error: ${err.message}` });
      Storage.bumpStat('totalErrors');
    } finally {
      running.delete(id);
    }
  }

  function isRunning(id) { return running.has(id); }

  return {
    PLATFORMS,
    getPlatforms,
    createAgent,
    save,
    remove,
    toggle,
    getAll,
    runAgent,
    isRunning,
    initSchedules,
    startSchedule,
    stopSchedule,
  };
})();

window.AgentManager = AgentManager;
