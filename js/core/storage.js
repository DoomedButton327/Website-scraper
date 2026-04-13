/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/core/storage.js
   LocalStorage wrapper with defaults
   ═══════════════════════════════════════════ */

const Storage = (() => {
  const PREFIX = 'snx_';

  const defaults = {
    agents: [],
    logs: [],
    settings: {
      discordWebhook: '',
      defaultInterval: 30,
      maxLogsKept: 200,
      darkMode: true,
      soundEnabled: false,
    },
    stats: {
      totalScrapes: 0,
      totalPosted: 0,
      totalErrors: 0,
    }
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : structuredClone(defaults[key] ?? null);
    } catch {
      return structuredClone(defaults[key] ?? null);
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      console.warn('[Storage] write failed:', key);
      return false;
    }
  }

  function update(key, updater) {
    const current = get(key);
    const updated = updater(current);
    return set(key, updated);
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  // ── Agents ──
  function getAgents() { return get('agents') || []; }

  function saveAgent(agent) {
    const agents = getAgents();
    const idx = agents.findIndex(a => a.id === agent.id);
    if (idx >= 0) agents[idx] = agent;
    else agents.push(agent);
    return set('agents', agents);
  }

  function deleteAgent(id) {
    update('agents', agents => agents.filter(a => a.id !== id));
  }

  function getAgent(id) {
    return getAgents().find(a => a.id === id) || null;
  }

  // ── Logs ──
  function getLogs() { return get('logs') || []; }

  function addLog(log) {
    update('logs', logs => {
      const max = getSettings().maxLogsKept || 200;
      return [log, ...logs].slice(0, max);
    });
  }

  function clearLogs() { set('logs', []); }

  // ── Settings ──
  function getSettings() {
    return { ...defaults.settings, ...(get('settings') || {}) };
  }

  function saveSettings(partial) {
    const current = getSettings();
    return set('settings', { ...current, ...partial });
  }

  // ── Stats ──
  function getStats() {
    return { ...defaults.stats, ...(get('stats') || {}) };
  }

  function bumpStat(key, delta = 1) {
    update('stats', stats => ({
      ...defaults.stats,
      ...stats,
      [key]: (stats[key] || 0) + delta
    }));
  }

  // ── Export / Import ──
  function exportAll() {
    return {
      version: '1.0.0',
      exported: new Date().toISOString(),
      agents: getAgents(),
      settings: getSettings(),
      stats: getStats(),
    };
  }

  function importAll(data) {
    if (!data || data.version !== '1.0.0') throw new Error('Invalid backup file');
    if (data.agents)   set('agents',   data.agents);
    if (data.settings) set('settings', data.settings);
    if (data.stats)    set('stats',    data.stats);
    return true;
  }

  return {
    get, set, update, remove,
    getAgents, saveAgent, deleteAgent, getAgent,
    getLogs, addLog, clearLogs,
    getSettings, saveSettings,
    getStats, bumpStat,
    exportAll, importAll,
  };
})();

window.Storage = Storage;
