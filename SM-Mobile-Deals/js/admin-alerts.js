/* ==========================================================================
   ADMIN ALERTS — real OS-level browser notifications for the admin, for:
     (a) new visitors landing on the site
     (b) new orders / payments awaiting confirmation

   HONEST LIMITATION: these are browser Notification API alerts. They fire
   while this admin dashboard tab is open (or recently open) in a browser
   that's running — NOT a true mobile push notification that arrives even
   when the browser/app is fully closed. A "closed app" push needs a VAPID
   push subscription + a server that sends it (e.g. a Supabase Edge
   Function triggered by a Database Webhook) — a bigger, separate build.
   This module is the practical version that works today with zero extra
   infrastructure, and requires Supabase to be connected (site visits and
   live order data are only tracked there, not in the localStorage fallback).
   ========================================================================== */

const AdminAlerts = (() => {
  const POLL_MS = 20000;
  let timer = null;
  let lastVisitCheck = new Date().toISOString();
  let seenOrderIds = new Set();

  function supported(){ return 'Notification' in window; }

  function permission(){ return supported() ? Notification.permission : 'unsupported'; }

  async function requestPermission(){
    if (!supported()) return 'unsupported';
    return await Notification.requestPermission();
  }

  function fire(title, body){
    if (!supported() || Notification.permission !== 'granted') return;
    try{ new Notification(title, { body, icon: UI.link('assets/icons/icon-192.png') }); }
    catch(e){ /* some mobile browsers require a service-worker-based notification; ignore quietly */ }
  }

  async function checkVisits(){
    if (!DB.useSupabase()) return;
    try{
      const { data, error } = await supabaseClient.from('site_visits').select('*').gt('visited_at', lastVisitCheck).order('visited_at', { ascending:false });
      if (error) throw error;
      if (data && data.length){
        fire('New visitor on your site', `${data.length} visit${data.length>1?'s':''} in the last check — someone's browsing SM Mobile Deals right now.`);
      }
      lastVisitCheck = new Date().toISOString();
    }catch(e){ /* stay quiet on transient errors */ }
  }

  async function checkOrders(){
    if (!DB.useSupabase()) return;
    try{
      await Orders.refresh();
      const pending = Orders.pendingConfirmationQueue();
      pending.forEach(o => {
        if (!seenOrderIds.has(o.id)){
          seenOrderIds.add(o.id);
          fire('Payment awaiting confirmation', `Order ${o.id} — ${Utils.formatINR(o.totals.total)} — needs your review.`);
        }
      });
    }catch(e){ /* stay quiet */ }
  }

  function start(){
    if (timer) return;
    checkVisits(); checkOrders();
    timer = setInterval(() => { checkVisits(); checkOrders(); }, POLL_MS);
  }

  function stop(){
    clearInterval(timer);
    timer = null;
  }

  return { supported, permission, requestPermission, start, stop };
})();
