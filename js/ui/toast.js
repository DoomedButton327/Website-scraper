/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/ui/toast.js
   ═══════════════════════════════════════════ */

const Toast = (() => {
  const container = () => document.getElementById('toast-container');

  const ICONS = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warn:    '⚠️',
  };

  function show(msg, type = 'info', duration = 3500) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${ICONS[type] || 'ℹ️'}</span>
      <span class="toast-text">${msg}</span>
      <button class="toast-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    container()?.appendChild(el);
    if (duration > 0) setTimeout(() => el.remove(), duration);
    return el;
  }

  function success(msg) { return show(msg, 'success'); }
  function error(msg)   { return show(msg, 'error', 5000); }
  function info(msg)    { return show(msg, 'info'); }
  function warn(msg)    { return show(msg, 'warn'); }

  // Listen to global event bus
  Events.on(EV.TOAST, ({ type, msg }) => show(msg, type));

  return { show, success, error, info, warn };
})();

window.Toast = Toast;
