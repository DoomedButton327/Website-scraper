/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/ui/dashboard.js
   Renders all page views
   ═══════════════════════════════════════════ */

const Dashboard = (() => {

  // ════════════════════════════════
  // DASHBOARD PAGE
  // ════════════════════════════════
  function renderDashboard() {
    const stats   = Storage.getStats();
    const agents  = Storage.getAgents();
    const logs    = Storage.getLogs();
    const active  = agents.filter(a => a.enabled).length;
    const running = agents.filter(a => AgentManager.isRunning(a.id)).length;

    document.getElementById('page-home').innerHTML = `
      <div class="stagger-children">

        <!-- Stats -->
        <div class="stats-grid">
          <div class="glass-card stat-card" style="--accent-color:var(--violet-glow)">
            <div class="stat-icon">🤖</div>
            <div class="stat-value">${agents.length}</div>
            <div class="stat-label">Total Agents</div>
            <div class="stat-delta">${active} active</div>
          </div>
          <div class="glass-card stat-card" style="--accent-color:var(--neon-cyan)">
            <div class="stat-icon">🔍</div>
            <div class="stat-value">${stats.totalScrapes}</div>
            <div class="stat-label">Total Scrapes</div>
            <div class="stat-delta">${running > 0 ? `${running} running` : 'idle'}</div>
          </div>
          <div class="glass-card stat-card" style="--accent-color:var(--neon-green)">
            <div class="stat-icon">📨</div>
            <div class="stat-value">${stats.totalPosted}</div>
            <div class="stat-label">Posted to Discord</div>
          </div>
          <div class="glass-card stat-card" style="--accent-color:var(--neon-red)">
            <div class="stat-icon">❌</div>
            <div class="stat-value">${stats.totalErrors}</div>
            <div class="stat-label">Errors</div>
          </div>
        </div>

        <!-- Quick run -->
        ${active > 0 ? `
        <div class="section-header" style="margin-bottom:10px">
          <span class="section-title">Quick Actions</span>
        </div>
        <div class="glass-card" style="padding:14px;margin-bottom:20px;display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-scrape" onclick="runAllAgents()" style="width:100%">
            ⚡ Run All Active Agents (${active})
          </button>
          <button class="btn btn-secondary" onclick="navigate('agents')" style="width:100%">
            🤖 Manage Agents
          </button>
        </div>` : `
        <div class="glass-card" style="padding:20px;margin-bottom:20px;text-align:center">
          <div style="font-size:32px;margin-bottom:10px">🚀</div>
          <div style="font-family:var(--font-display);font-size:0.8rem;letter-spacing:0.08em;margin-bottom:8px;color:var(--text-primary)">GET STARTED</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">Create your first scraping agent</div>
          <button class="btn btn-primary" onclick="navigate('agents')">Create Agent</button>
        </div>`}

        <!-- Recent activity -->
        <div class="section-header">
          <span class="section-title">Recent Activity</span>
          <span class="header-chip">${logs.length} logs</span>
        </div>
        <div class="glass-card">
          ${logs.slice(0, 5).map(log => renderMiniLog(log)).join('') || `
          <div class="empty-state" style="padding:24px">
            <div style="font-size:32px;margin-bottom:8px">📭</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">No activity yet. Run an agent to start!</div>
          </div>`}
          ${logs.length > 5 ? `
          <div style="padding:12px 16px;border-top:1px solid var(--glass-border);text-align:center">
            <button class="btn btn-ghost btn-sm" onclick="navigate('logs')">View all ${logs.length} logs →</button>
          </div>` : ''}
        </div>

      </div>
    `;
  }

  function renderMiniLog(log) {
    const icon = { posted:'✅', failed:'❌', dry:'🌵', logged:'📝', pending:'⏳' }[log.status] || '📋';
    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}) : '';
    return `
      <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:16px;margin-top:1px">${icon}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:3px">
            <span class="log-agent-badge">${log.agentName || log.agentId}</span>
            <span class="log-time">${timeStr}</span>
          </div>
          <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${log.content}</div>
        </div>
      </div>`;
  }

  // ════════════════════════════════
  // AGENTS PAGE
  // ════════════════════════════════
  function renderAgents() {
    const agents = AgentManager.getAll();
    const p = AgentManager.PLATFORMS;

    document.getElementById('page-agents').innerHTML = `
      <div class="section-header">
        <span class="section-title">Agents (${agents.length})</span>
        <button class="btn btn-primary btn-sm" onclick="Modals.openAgent()">+ New</button>
      </div>

      <div class="agents-grid stagger-children" id="agents-list">
        ${agents.length === 0 ? `
        <div class="empty-state glass-card" style="padding:48px 24px">
          <div class="empty-state-icon">🤖</div>
          <div class="empty-state-title">No Agents Yet</div>
          <div class="empty-state-text" style="margin-bottom:20px">Create an agent to start scraping</div>
          <button class="btn btn-primary" onclick="Modals.openAgent()">Create First Agent</button>
        </div>` : agents.map(a => renderAgentCard(a)).join('')}
      </div>
    `;
  }

  function renderAgentCard(agent) {
    const p = AgentManager.PLATFORMS[agent.platform] || {};
    const isRunning = AgentManager.isRunning(agent.id);
    const statusClass = isRunning ? 'running' : agent.enabled ? 'active' : 'disabled';
    const lastRun = agent.stats?.lastRun
      ? new Date(agent.stats.lastRun).toLocaleString('en-ZA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
      : 'Never';

    return `
    <div class="glass-card agent-card" id="card-${agent.id}">
      ${isRunning ? '<div class="running-bar"></div>' : ''}
      <div class="agent-card-header">
        <div class="agent-card-identity">
          <div class="agent-avatar" style="background:linear-gradient(135deg,${p.color||'#7c3aed'}22,${p.color||'#7c3aed'}44);border-color:${p.color||'#7c3aed'}44">
            ${p.emoji || '🤖'}
          </div>
          <div class="agent-info">
            <div class="agent-name">${agent.name}</div>
            <span class="agent-platform-badge platform-${agent.platform}">${p.emoji||''} ${p.label||agent.platform}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div class="status-dot ${statusClass}"></div>
          <label class="toggle" style="margin:0" onclick="event.stopPropagation()">
            <input type="checkbox" ${agent.enabled?'checked':''} onchange="toggleAgent('${agent.id}')">
            <span class="toggle-track"></span><span class="toggle-thumb"></span>
          </label>
        </div>
      </div>

      <div class="agent-card-meta">
        <span class="meta-chip">⏱ ${agent.intervalMinutes}min</span>
        ${agent.discordWebhook ? '<span class="meta-chip">📨 Discord</span>' : '<span class="meta-chip" style="color:var(--neon-red);border-color:rgba(255,51,102,0.2)">⚠️ No webhook</span>'}
        ${agent.features?.dryRun ? '<span class="meta-chip" style="color:var(--neon-amber)">🌵 Dry Run</span>' : ''}
        <span class="meta-chip">🔍 ${agent.stats?.totalRuns||0} runs</span>
        <span class="meta-chip">📨 ${agent.stats?.totalPosted||0} posted</span>
      </div>

      <div class="agent-card-footer">
        <span class="last-run-label">Last run: ${lastRun}</span>
        <div class="agent-card-actions">
          <button class="btn btn-ghost btn-icon" title="Run now" onclick="event.stopPropagation();runAgent('${agent.id}')">⚡</button>
          <button class="btn btn-ghost btn-icon" title="Edit" onclick="event.stopPropagation();Modals.openAgent('${agent.id}')">✏️</button>
          <button class="btn btn-ghost btn-icon" title="Delete" style="color:var(--neon-red)" onclick="event.stopPropagation();confirmDelete('${agent.id}','${agent.name.replace(/'/g,"\\'")}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }

  // ════════════════════════════════
  // LOGS PAGE
  // ════════════════════════════════
  function renderLogs() {
    const logs = Storage.getLogs();
    const agents = Storage.getAgents();

    document.getElementById('page-logs').innerHTML = `
      <div class="section-header">
        <span class="section-title">Activity Logs</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="exportLogs()">⬇ Export</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--neon-red)" onclick="clearLogs()">🗑 Clear</button>
        </div>
      </div>

      <!-- Filter chips -->
      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-ms-overflow-style:none;scrollbar-width:none">
        <button class="btn btn-secondary btn-sm log-filter active" data-filter="all" onclick="filterLogs(this,'all')">All</button>
        ${agents.map(a => `<button class="btn btn-ghost btn-sm log-filter" data-filter="${a.id}" onclick="filterLogs(this,'${a.id}')" style="white-space:nowrap">${AgentManager.PLATFORMS[a.platform]?.emoji||'🤖'} ${a.name}</button>`).join('')}
      </div>

      <div class="log-list" id="log-list">
        ${logs.length === 0 ? `
        <div class="empty-state glass-card" style="padding:48px 24px">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">No Logs Yet</div>
          <div class="empty-state-text">Run an agent to see activity here</div>
        </div>` : logs.map(renderLogCard).join('')}
      </div>
    `;
  }

  function renderLogCard(log) {
    const statusMap = { posted:'✅ Posted', failed:'❌ Failed', dry:'🌵 Dry Run', logged:'📝 Logged', pending:'⏳ Pending' };
    const statusCls = { posted:'posted', failed:'failed', dry:'dry', logged:'', pending:'' };
    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString('en-ZA',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
    const platIcon = AgentManager.PLATFORMS[log.platform]?.emoji || '🔍';

    return `
    <div class="glass-card log-entry" data-agent="${log.agentId}">
      <div class="log-entry-header">
        <span style="font-size:16px">${platIcon}</span>
        <span class="log-agent-badge">${log.agentName || log.agentId}</span>
        <span class="log-time">${timeStr}</span>
      </div>
      <div class="log-content">${(log.content||'').replace(/</g,'&lt;').slice(0,250)}${log.url ? `<br><a href="${log.url}" target="_blank" style="color:var(--violet-glow);font-size:0.65rem;word-break:break-all">${log.url}</a>` : ''}</div>
      <div class="log-status ${statusCls[log.status]||''}">${statusMap[log.status]||log.status}${log.error ? ` — ${log.error}` : ''}</div>
    </div>`;
  }

  // ════════════════════════════════
  // SETTINGS PAGE
  // ════════════════════════════════
  function renderSettings() {
    const settings = Storage.getSettings();

    document.getElementById('page-settings').innerHTML = `
      <div class="section-title" style="margin-bottom:16px">⚙️ Settings</div>

      <div class="settings-section">
        <div class="settings-section-title">🔗 Global Discord</div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Default Webhook URL</label>
            <input class="form-input" id="s-webhook" type="url"
              value="${settings.discordWebhook}"
              placeholder="https://discord.com/api/webhooks/...">
            <span class="form-hint">Used for agents without their own webhook</span>
          </div>
        </div>
        <div class="settings-row">
          <button class="btn btn-secondary btn-sm" onclick="testGlobalWebhook()" style="width:100%">
            🔔 Test Global Webhook
          </button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">⚙️ Scraping</div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Default Interval (minutes)</label>
            <input class="form-input" id="s-interval" type="number"
              value="${settings.defaultInterval}" min="1">
          </div>
        </div>
        <div class="settings-row">
          <div class="form-group" style="margin:0">
            <label class="form-label">Max Logs to Keep</label>
            <input class="form-input" id="s-maxlogs" type="number"
              value="${settings.maxLogsKept}" min="10" max="1000">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">💾 Data</div>
        <div class="settings-row">
          <button class="btn btn-secondary" onclick="exportData()" style="width:100%;margin-bottom:8px">
            ⬇️ Export All Data (JSON)
          </button>
          <label class="btn btn-secondary" style="width:100%;text-align:center;cursor:pointer">
            ⬆️ Import Data (JSON)
            <input type="file" accept=".json" style="display:none" onchange="importData(event)">
          </label>
        </div>
        <div class="settings-row">
          <button class="btn btn-danger" onclick="confirmClearAll()" style="width:100%">
            🗑️ Clear All Logs
          </button>
        </div>
      </div>

      <div style="padding:8px 0 4px;text-align:center">
        <button class="btn btn-primary" onclick="saveSettings()" style="width:100%">
          💾 Save Settings
        </button>
      </div>

      <div style="margin-top:24px;text-align:center">
        <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-dim);letter-spacing:0.1em">
          SCRAPER NEXUS v1.0.0 · GHOST EDITION<br>
          Built with 💜 for Mettlestate
        </div>
      </div>
    `;
  }

  // ════════════════════════════════
  // UPDATE AGENT CARD (partial)
  // ════════════════════════════════
  function refreshAgentCard(agentId) {
    const card = document.getElementById(`card-${agentId}`);
    if (!card) return;
    const agent = Storage.getAgent(agentId);
    if (!agent) { card.remove(); return; }
    card.outerHTML = renderAgentCard(agent);
  }

  return {
    renderDashboard,
    renderAgents,
    renderLogs,
    renderSettings,
    renderAgentCard,
    refreshAgentCard,
    renderMiniLog,
  };
})();

window.Dashboard = Dashboard;
