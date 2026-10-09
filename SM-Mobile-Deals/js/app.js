/* ==========================================================================
   APP — bootstraps every page: waits for DB.init() + Auth.init() (which
   pull from Supabase when configured), then mounts header/footer, theme,
   AI widget, etc. Every page calls:

       App.boot('activeKey').then(() => { ...page's own render code... });

   so page-specific rendering always runs AFTER product/session data is
   ready — whether that data came from Supabase or the local fallback.
   ========================================================================== */

const App = (() => {
  // ---------------------------------------------------------------------
  // ERROR WATCHDOG — a static site has no server process watching pages
  // when nobody's on them, so true 24/7 monitoring without a visitor isn't
  // possible here. What IS real: the moment ANY visitor's browser hits a
  // JS error, a broken image, or a failed request on ANY page, this fires
  // immediately and notifies the admin (via the existing Inbox bell) with
  // the exact page, error, and time — no need to wait for someone to
  // report it. Rate-limited per browser session so one broken image loop
  // can't flood the admin inbox.
  // ---------------------------------------------------------------------
  function initErrorWatchdog(){
    if (typeof Inbox === 'undefined' || !DB.useSupabase()) return; // nothing to notify into
    const SESSION_KEY = 'smd_watchdog_sent';
    const MAX_PER_SESSION = 5;
    let sent = 0;
    try{ sent = Number(sessionStorage.getItem(SESSION_KEY) || 0); }catch(e){}
    const seen = new Set();

    function report(kind, detail){
      if (sent >= MAX_PER_SESSION) return;
      const key = kind + '::' + detail.slice(0, 120);
      if (seen.has(key)) return; // same error repeating on this page — only report once
      seen.add(key);
      sent++;
      try{ sessionStorage.setItem(SESSION_KEY, String(sent)); }catch(e){}
      const page = window.location.pathname.split('/').pop() || 'home';
      Inbox.sendToAdmin(
        `Site error detected — ${page}`,
        `${kind}: ${detail}\nPage: ${window.location.href}\nTime: ${new Date().toLocaleString()}`,
        window.location.pathname.includes('admin') ? undefined : window.location.pathname
      ).catch(() => {});
    }

    window.addEventListener('error', (e) => {
      // Broken image / script / css load — target is the failed element, no e.message.
      if (e.target && e.target !== window && e.target.tagName){
        const tag = e.target.tagName.toLowerCase();
        const src = e.target.src || e.target.href || '';
        if (src) report('Broken ' + tag, src);
        return;
      }
      // Real JS runtime error. Skip noisy, non-actionable browser/extension noise.
      const msg = e.message || '';
      if (!msg || msg === 'Script error.' || /ResizeObserver loop/i.test(msg)) return;
      report('JavaScript error', `${msg} (${e.filename || 'unknown file'}:${e.lineno || '?'})`);
    }, true); // capture phase — required to catch resource load errors, which don't bubble

    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason && (e.reason.message || String(e.reason));
      if (reason) report('Unhandled promise rejection', reason);
    });
  }

  function mountAIWidget(){
    if (document.getElementById('ai-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.className = 'ai-fab';
    fab.setAttribute('aria-label','AI Shopping Assistant');
    fab.innerHTML = `${UI.ICONS.headset('')}<span class="fab-badge"></span>`;
    document.body.appendChild(fab);
    fab.addEventListener('click', () => Chatbot.toggle());
    document.body.appendChild(Chatbot.panelElement());
  }

  function registerSW(){
    // Skip the service worker entirely on localhost/127.0.0.1 (Live Server,
    // dev builds). It caches css/js "cache-first" and the CACHE_NAME never
    // changes during active editing, so every edit kept getting served
    // stale from the SW cache and only a hard refresh (which browsers use
    // to bypass the SW) showed the real file — that's why every change
    // needed Ctrl+Shift+R. Real deployments (a real domain) still get the
    // offline PWA caching as before.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1'){
      // A service worker from an earlier visit may already be installed and
      // controlling this page — just skipping re-registration above isn't
      // enough to stop it. Unregister it so this fix takes effect on the
      // very next load instead of needing a manual DevTools cache clear.
      if ('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      return;
    }
    if ('serviceWorker' in navigator){
      const swPath = (typeof ROOT_PREFIX !== 'undefined' ? ROOT_PREFIX : '') + 'service-worker.js';
      navigator.serviceWorker.register(swPath).catch(() => {});
    }
  }

  async function boot(activeKey){
    registerSW();
    initErrorWatchdog();
    // Auth.init() MUST finish before DB.init() fires its Supabase queries.
    // orders are RLS-protected ("auth.uid() = user_id"), so if DB.init()'s
    // orders refresh runs while the Supabase client still has no restored
    // session, that query comes back empty and overwrites the local cache —
    // wiping out an order the customer just placed a second ago (seen as
    // "Order not found" right after checkout, on the very next page load).
    // Running them in sequence instead of Promise.all costs a few ms but
    // guarantees the session is attached before any RLS-gated read happens.
    await Auth.init();
    await DB.init(); // pulls from Supabase if configured, else local fallback (fast)
    UI.mount(activeKey);
    Theme.init();
    mountAIWidget();
    Loader.initReveal();
    UI.updateCounts();
    DB.logEvent('page_view', { page: activeKey || document.title });
    if (!Auth.isAdmin()) DB.pingVisit(window.location.pathname);
    document.querySelectorAll('main, body').forEach(el => el.classList.add('page-enter'));
    if (typeof Reminders !== 'undefined') Reminders.init();
  }

  return { boot };
})();
