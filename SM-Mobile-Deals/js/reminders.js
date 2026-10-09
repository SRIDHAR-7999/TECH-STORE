/* ==========================================================================
   REMINDERS — nudges the customer about items sitting in cart/wishlist that
   haven't been purchased yet.

   IMPORTANT LIMITATION: this is a static site with no push-notification
   server, so these reminders only fire while the browser tab is open and
   the site is loaded — they are NOT real phone push notifications. Real
   "remind 5x a day even when the app is closed" would need a backend +
   service-worker push subscriptions + a server that sends them, which is
   out of scope for a client-only site. What this DOES do: shows a toast
   reminder (max 5 times per calendar day) whenever the customer has items
   sitting in their cart or wishlist for more than a few minutes without
   checking out, capped so it never feels spammy within one visit.
   ========================================================================== */

const Reminders = (() => {
  const KEY = 'smd_reminder_log';
  const MAX_PER_DAY = 5;
  const MIN_GAP_MS = 45 * 1000; // don't nag more than once every 45s within a session

  function todayKey(){ return new Date().toISOString().slice(0,10); }

  function getLog(){
    return DB.read(KEY, { day: todayKey(), count: 0, lastAt: 0 });
  }
  function saveLog(log){ DB.write(KEY, log); }

  function canRemindNow(){
    const log = getLog();
    if (log.day !== todayKey()) return true; // new day, counter resets
    if (log.count >= MAX_PER_DAY) return false;
    if (Date.now() - log.lastAt < MIN_GAP_MS) return false;
    return true;
  }

  function recordReminder(){
    let log = getLog();
    if (log.day !== todayKey()) log = { day: todayKey(), count: 0, lastAt: 0 };
    log.count += 1;
    log.lastAt = Date.now();
    saveLog(log);
  }

  function remainingToday(){
    const log = getLog();
    if (log.day !== todayKey()) return MAX_PER_DAY;
    return Math.max(0, MAX_PER_DAY - log.count);
  }

  function maybeNudge(){
    if (!Auth.isLoggedIn() || Auth.isAdmin()) return;
    const cartItems = Cart.detailed();
    const wishItems = Wishlist.detailed();
    if (!cartItems.length && !wishItems.length) return;
    if (!canRemindNow()) return;

    let message;
    if (cartItems.length){
      const first = cartItems[0];
      message = cartItems.length === 1
        ? `Still thinking about the ${first.name}? It's waiting in your cart — checkout takes under a minute.`
        : `You have ${cartItems.length} items in your cart worth ${Utils.formatINR(Cart.subtotal())}. Ready to check out?`;
    } else {
      const first = wishItems[0];
      message = wishItems.length === 1
        ? `${first.name} is still on your wishlist — move it to cart before stock runs out.`
        : `${wishItems.length} items are waiting on your wishlist. Take another look?`;
    }

    Notify.toast(message, 'info', 6000);
    recordReminder();
  }

  // Called once per page load (from App.boot). Fires shortly after load, not instantly,
  // so it doesn't compete with the page's own toasts (e.g. "added to cart").
  function init(){
    setTimeout(maybeNudge, 4000);
  }

  return { init, maybeNudge, remainingToday };
})();
