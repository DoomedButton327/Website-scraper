/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/app.js
   Main entry point
   ═══════════════════════════════════════════ */

// ── Current page state ──
let currentPage = 'home';

// ════════════════════════════════
// NAVIGATION
// ════════════════════════════════
function navigate(page) {
  if (currentPage === page) return;
  currentPage = page;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  // Show target
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  // Render page content
  switch (page) {
    case 'home':     Dashboard.renderDashboard(); break;
    case 'agents':   Dashboard.renderAgents();    break;
    case 'logs':     Dashboard.renderLogs();      break;
    case 'settings': Dashboard.renderSettings();  break;
  }
}

// ════════════════════════════════
// AGENT ACTIONS (global)
// ════════════════════════════════
async function runAgent(id) {
  const agent = Storage.getAgent(id);
  if (!agent) return;

  // Visual feedback
  const card = document.getElementById(`card-${id}`);
  if (card) {
    const bar = document.createElement('div');
    bar.className = 'running-bar';
    card.appendChild(bar);
  }

  Toast.info(`Running ${agent.name}...`);
  await AgentManager.runAgent(id);
}

async function runAllAgents() {
  const agents = Storage.getAgents().filter(a => a.enabled);
  if (!agents.length) { Toast.warn('No active agents to run'); return; }
  Toast.info(`Running ${agents.length} agents...`);
  await Promise.allSettled(agents.map(a => AgentManager.runAgent(a.id)));
}

function toggleAgent(id) {
  AgentManager.toggle(id);
  // Re-render the card
  setTimeout(() => {
    if (currentPage === 'agents') Dashboard.renderAgents();
    if (currentPage === 'home')   Dashboard.renderDashboard();
  }, 100);
}

function confirmDelete(id, name) {
  Modals.confirm(
    'Delete Agent',
    `Are you sure you want to delete "${name}"? This cannot be undone.`,
    () => {
      AgentManager.remove(id);
      if (currentPage === 'agents') Dashboard.renderAgents();
      Toast.success(`Agent "${name}" deleted`);
    },
    true
  );
}

// ════════════════════════════════
// LOGS
// ════════════════════════════════
function filterLogs(btn, filter) {
  document.querySelectorAll('.log-filter').forEach(b => b.classList.remove('active', 'btn-secondary'));
  document.querySelectorAll('.log-filter').forEach(b => b.classList.add('btn-ghost'));
  btn.classList.add('active', 'btn-secondary');
  btn.classList.remove('btn-ghost');

  const list = document.getElementById('log-list');
  if (!list) return;
  const cards = list.querySelectorAll('[data-agent]');
  cards.forEach(card => {
    card.style.display = (filter === 'all' || card.dataset.agent === filter) ? '' : 'none';
  });
}

function clearLogs() {
  Modals.confirm('Clear All Logs', 'This will delete all activity logs permanently.', () => {
    Storage.clearLogs();
    if (currentPage === 'logs') Dashboard.renderLogs();
    if (currentPage === 'home') Dashboard.renderDashboard();
    Toast.success('Logs cleared');
  }, true);
}

function exportLogs() {
  const logs = Storage.getLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scraper-nexus-logs-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success(`Exported ${logs.length} logs`);
}

// ════════════════════════════════
// SETTINGS
// ════════════════════════════════
function saveSettings() {
  const s = {
    discordWebhook:  document.getElementById('s-webhook')?.value?.trim()  || '',
    defaultInterval: parseInt(document.getElementById('s-interval')?.value) || 30,
    maxLogsKept:     parseInt(document.getElementById('s-maxlogs')?.value)  || 200,
  };
  Storage.saveSettings(s);
  Events.emit(EV.SETTINGS_SAVED, s);
  Toast.success('Settings saved!');
}

async function testGlobalWebhook() {
  const url = document.getElementById('s-webhook')?.value?.trim();
  if (!url) { Toast.warn('Enter a webhook URL first'); return; }
  try {
    await DiscordWebhook.test(url, 'Global');
    Toast.success('✅ Test sent to Discord!');
  } catch (e) {
    Toast.error('Webhook test failed: ' + e.message);
  }
}

function exportData() {
  const data = Storage.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scraper-nexus-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success('Backup exported!');
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      Storage.importAll(data);
      Events.emit(EV.AGENTS_CHANGED);
      Dashboard.renderSettings();
      Toast.success(`Imported: ${data.agents?.length||0} agents`);
    } catch (err) {
      Toast.error('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function confirmClearAll() {
  Modals.confirm('Clear All Logs', 'Delete all activity logs permanently?', () => {
    Storage.clearLogs();
    Toast.success('Logs cleared');
    Dashboard.renderSettings();
  }, true);
}

// ════════════════════════════════
// STARFIELD
// ════════════════════════════════
function initStarfield() {
  const container = document.getElementById('starfield');
  const count = 28;

  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const left = Math.random() * 110 - 5;
    const duration = 4 + Math.random() * 10;
    const delay    = Math.random() * -12;
    const height   = 30 + Math.random() * 80;
    const opacity  = 0.3 + Math.random() * 0.6;

    star.style.cssText = `
      left: ${left}%;
      height: ${height}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: ${opacity};
    `;
    container.appendChild(star);
  }
}

// ════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════
function initEventListeners() {
  // Agents changed → re-render current page
  Events.on(EV.AGENTS_CHANGED, () => {
    if (currentPage === 'home')   Dashboard.renderDashboard();
    if (currentPage === 'agents') Dashboard.renderAgents();
  });

  // Log added → re-render dashboard activity
  Events.on(EV.LOG_ADDED, () => {
    if (currentPage === 'home') Dashboard.renderDashboard();
    if (currentPage === 'logs') {
      const list = document.getElementById('log-list');
      if (list) {
        const log = Storage.getLogs()[0];
        if (log) {
          const div = document.createElement('div');
          div.innerHTML = Dashboard.renderMiniLog ? '' : '';
          // Re-render for simplicity
          Dashboard.renderLogs();
        }
      }
    }
  });

  // Agent run start/done → refresh card
  Events.on(EV.AGENT_RUN_DONE, ({ agentId }) => {
    if (currentPage === 'agents') {
      setTimeout(() => Dashboard.refreshAgentCard(agentId), 200);
    }
    if (currentPage === 'home') {
      setTimeout(() => Dashboard.renderDashboard(), 300);
    }
  });

  Events.on(EV.AGENT_RUN_ERROR, ({ agentId }) => {
    if (currentPage === 'agents') {
      setTimeout(() => Dashboard.refreshAgentCard(agentId), 200);
    }
  });

  // Modal close on overlay click
  document.getElementById('modal-agent')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) Modals.closeAgent();
  });
  document.getElementById('modal-confirm')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) Modals.closeConfirm();
  });
}

// ════════════════════════════════
// INIT
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initEventListeners();
  AgentManager.initSchedules();
  navigate('home');

  // Seed demo agent if no agents exist
  if (Storage.getAgents().length === 0) {
    const demo = AgentManager.createAgent({
      name: 'EA FC News',
      platform: 'rss',
      enabled: false,
      intervalMinutes: 60,
      rules: {
        feedUrl: 'https://www.ea.com/games/ea-sports-fc/rss',
        keywords: 'update, patch, season',
        maxItems: 5,
      },
      features: {
        postToDiscord: true,
        dryRun: true,
        filterDuplicates: true,
        includeThumbnails: true,
        embedColor: '#7c3aed',
        mentionRole: '',
        customMessage: '🎮 New EA FC update!',
      },
    });
    AgentManager.save(demo);
  }
});

window.navigate = navigate;
window.runAgent = runAgent;
window.runAllAgents = runAllAgents;
window.toggleAgent = toggleAgent;
window.confirmDelete = confirmDelete;
window.filterLogs = filterLogs;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.saveSettings = saveSettings;
window.testGlobalWebhook = testGlobalWebhook;
window.exportData = exportData;
window.importData = importData;
window.confirmClearAll = confirmClearAll;
