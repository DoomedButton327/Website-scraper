/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/core/events.js
   Lightweight event bus
   ═══════════════════════════════════════════ */

const Events = (() => {
  const listeners = {};

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => off(event, cb);
  }

  function off(event, cb) {
    if (listeners[event])
      listeners[event] = listeners[event].filter(fn => fn !== cb);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => {
      try { fn(data); }
      catch (e) { console.error('[Events]', event, e); }
    });
  }

  function once(event, cb) {
    const wrapper = (data) => { cb(data); off(event, wrapper); };
    on(event, wrapper);
  }

  return { on, off, emit, once };
})();

// ── App-level event names ──
const EV = {
  AGENTS_CHANGED:   'agents:changed',
  AGENT_RUN_START:  'agent:run:start',
  AGENT_RUN_DONE:   'agent:run:done',
  AGENT_RUN_ERROR:  'agent:run:error',
  LOG_ADDED:        'log:added',
  LOGS_CLEARED:     'logs:cleared',
  SETTINGS_SAVED:   'settings:saved',
  DISCORD_SENT:     'discord:sent',
  DISCORD_ERROR:    'discord:error',
  NAVIGATE:         'navigate',
  MODAL_OPEN:       'modal:open',
  MODAL_CLOSE:      'modal:close',
  TOAST:            'toast',
};

window.Events = Events;
window.EV = EV;
