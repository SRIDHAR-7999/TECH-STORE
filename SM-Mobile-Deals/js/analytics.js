/* ==========================================================================
   ANALYTICS — very small local summary used on the admin dashboard.
   (A hosted analytics service could replace this for deeper insights; the
   lightweight event log DB.logEvent() writes on every page.)
   ========================================================================== */

const Analytics = (() => {
  function summary(){
    const events = DB.getEvents();
    const orders = DB.getOrders();
    const pageViews = events.filter(e => e.type === 'page_view').length;
    const revenue = orders.filter(o => o.paymentStatus === 'confirmed' || o.paymentStatus === 'cod')
      .reduce((s,o) => s + o.totals.total, 0);
    const topProducts = {};
    orders.forEach(o => o.items.forEach(i => { topProducts[i.name] = (topProducts[i.name]||0) + i.qty; }));
    const topList = Object.entries(topProducts).sort((a,b) => b[1]-a[1]).slice(0,5);
    return { pageViews, revenue, orderCount: orders.length, topList };
  }
  return { summary };
})();
