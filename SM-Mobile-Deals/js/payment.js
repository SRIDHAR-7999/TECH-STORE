/* ==========================================================================
   PAYMENT — UPI QR (auto-filled amount) + GPay/PhonePe/Paytm links + card
   surcharge note + screenshot upload → order goes to "pending confirmation"
   until the admin manually verifies the screenshot and confirms it.

   Screenshot storage: uploaded to the Supabase Storage bucket
   "payment-screenshots" when Supabase is configured; otherwise stored as a
   base64 data URL directly on the order object in localStorage.
   ========================================================================== */

const Payment = (() => {

  function upiLink(amount, orderId){
    const params = new URLSearchParams({
      pa: SITE_CONFIG.upiId,
      pn: SITE_CONFIG.upiPayeeName,
      am: amount,
      cu: 'INR',
      tn: `Order ${orderId}`
    });
    return 'upi://pay?' + params.toString();
  }

  // Each app has its own URI scheme it registers with the OS, so tapping
  // "GPay" opens Google Pay specifically (not a generic app-picker) when
  // that app is installed — same for PhonePe and Paytm. All three carry the
  // exact same payee/amount/note as the generic UPI link above.
  function appPayLink(app, amount, orderId){
    const params = new URLSearchParams({
      pa: SITE_CONFIG.upiId,
      pn: SITE_CONFIG.upiPayeeName,
      am: amount,
      cu: 'INR',
      tn: `Order ${orderId}`
    });
    const qs = params.toString();
    const schemes = { gpay:'tez://upi/pay?', phonepe:'phonepe://pay?', paytm:'paytmmp://pay?' };
    return (schemes[app] || 'upi://pay?') + qs;
  }

  // PayPal — for customers who'd rather pay via PayPal than UPI. Sends them
  // to the store's paypal.me link with the amount pre-filled; PayPal itself
  // handles the actual payment, so there's no screenshot step for this path —
  // the admin confirms it manually from the PayPal account like a bank transfer.
  function paypalLink(amount){
    return `https://paypal.me/${SITE_CONFIG.paypalMeUsername}/${amount}INR`;
  }

  // Dynamic QR (auto-filled amount) rendered via a public QR-image endpoint.
  // Falls back to the store's static UPI QR image if offline.
  function dynamicQrImageUrl(amount, orderId){
    const data = encodeURIComponent(upiLink(amount, orderId));
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${data}`;
  }

  async function uploadScreenshot(orderId, file){
    if (DB.useSupabase()){
      try{
        const path = `${orderId}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi,'_')}`;
        const { error } = await supabaseClient.storage.from('payment-screenshots').upload(path, file, { upsert:true });
        if (error) throw error;
        const { data } = supabaseClient.storage.from('payment-screenshots').getPublicUrl(path);
        return data.publicUrl;
      }catch(err){
        console.warn('[Supabase] screenshot upload failed, falling back to base64:', err.message);
      }
    }
    return await Utils.fileToBase64(file);
  }

  async function markAwaitingConfirmation(orderId, file){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false, error:'Order not found.' };
    const screenshotUrl = await uploadScreenshot(orderId, file);
    order.screenshot = screenshotUrl;
    order.paymentStatus = 'pending_confirmation';
    order.timeline.push({ status:'payment_screenshot_uploaded', at:new Date().toISOString() });
    order.updatedAt = new Date().toISOString();
    await DB.saveOrder(order);
    Cart.clear();
    DB.logEvent('payment_screenshot_uploaded', { id: orderId });
    return { ok:true, order };
  }

  // --- Admin actions ---
  async function confirmPayment(orderId){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false };
    order.paymentStatus = 'confirmed';
    order.orderStatus = 'confirmed';
    order.timeline.push({ status:'confirmed', at:new Date().toISOString() });
    // Advance Payment orders: the ₹1000 booking amount just cleared, but the
    // balance is now owed separately — don't treat this as fully paid.
    if (order.paymentMethod === 'advance' && order.balanceStatus === 'not_due'){
      order.balanceStatus = 'due';
    }
    order.updatedAt = new Date().toISOString();
    await DB.saveOrder(order);

    // Payment-received acknowledgment — one to the customer, one to the
    // admin inbox — plus a link straight to the printable bill.
    const amountLabel = Utils.formatINR(order.totals?.total || 0);
    const invoiceLink = `pages/invoice.html?order=${order.id}`;
    const isAdvance = order.paymentMethod === 'advance' && order.totals?.balanceAmount > 0;
    Inbox.sendToCustomer(
      order.userId,
      isAdvance ? 'Advance payment received' : 'Payment received',
      isAdvance
        ? `Your ₹${order.totals.advanceAmount} advance for order ${order.id} is confirmed (non-refundable). Balance due: ${Utils.formatINR(order.totals.balanceAmount)} — pay before 6:00 PM today for same-day dispatch.`
        : `Your payment of ${amountLabel} for order ${order.id} has been confirmed. Your bill is ready to download.`,
      isAdvance ? `pages/payment.html?order=${order.id}` : invoiceLink
    );
    Inbox.sendToAdmin(
      isAdvance ? 'Advance payment confirmed' : 'Payment confirmed',
      isAdvance
        ? `Order ${order.id} — ₹${order.totals.advanceAmount} advance confirmed — balance ${Utils.formatINR(order.totals.balanceAmount)} still due.`
        : `Order ${order.id} — ${amountLabel} — marked as paid.`,
      invoiceLink
    );

    return { ok:true, order };
  }

  // --- Advance Payment: balance leg ---
  // Customer uploads a screenshot for the remaining balance amount.
  async function markBalanceAwaitingConfirmation(orderId, file){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false, error:'Order not found.' };
    const screenshotUrl = await uploadScreenshot(orderId, file);
    order.balanceScreenshot = screenshotUrl;
    order.balanceStatus = 'pending_confirmation';
    order.timeline.push({ status:'balance_screenshot_uploaded', at:new Date().toISOString() });
    order.updatedAt = new Date().toISOString();
    await DB.saveOrder(order);
    DB.logEvent('balance_screenshot_uploaded', { id: orderId });
    return { ok:true, order };
  }

  // Admin confirms the balance — this is the moment that decides same-day
  // vs next-day dispatch, based on SITE_CONFIG.advanceBalanceCutoffHour.
  async function confirmBalance(orderId){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false };
    const now = new Date();
    order.balanceStatus = 'paid';
    order.balancePaidAt = now.toISOString();
    const sameDayOk = now.getHours() < SITE_CONFIG.advanceBalanceCutoffHour;
    order.dispatchNote = sameDayOk
      ? `Balance received before ${SITE_CONFIG.advanceBalanceCutoffHour > 12 ? SITE_CONFIG.advanceBalanceCutoffHour-12 : SITE_CONFIG.advanceBalanceCutoffHour} PM cutoff — dispatching today via courier.`
      : `Balance received after ${SITE_CONFIG.advanceBalanceCutoffHour > 12 ? SITE_CONFIG.advanceBalanceCutoffHour-12 : SITE_CONFIG.advanceBalanceCutoffHour} PM cutoff — dispatching tomorrow.`;
    order.timeline.push({ status:'balance_confirmed', at:now.toISOString(), note: order.dispatchNote });
    order.updatedAt = now.toISOString();
    await DB.saveOrder(order);

    const invoiceLink = `pages/invoice.html?order=${order.id}`;
    Inbox.sendToCustomer(order.userId, 'Balance payment received', `Order ${order.id} is fully paid. ${order.dispatchNote}`, invoiceLink);
    Inbox.sendToAdmin('Balance confirmed', `Order ${order.id} — balance confirmed. ${order.dispatchNote}`, invoiceLink);

    return { ok:true, order };
  }

  async function rejectBalance(orderId, reason){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false };
    order.balanceStatus = 'due';
    order.rejectReason = reason || 'Balance payment could not be verified.';
    order.timeline.push({ status:'balance_rejected', at:new Date().toISOString(), note: order.rejectReason });
    order.updatedAt = new Date().toISOString();
    await DB.saveOrder(order);
    return { ok:true, order };
  }

  async function rejectPayment(orderId, reason){
    const order = Orders.byId(orderId);
    if (!order) return { ok:false };
    order.paymentStatus = 'rejected';
    order.orderStatus = 'payment_pending';
    order.rejectReason = reason || 'Payment could not be verified.';
    order.timeline.push({ status:'payment_rejected', at:new Date().toISOString(), note: order.rejectReason });
    order.updatedAt = new Date().toISOString();
    await DB.saveOrder(order);
    return { ok:true, order };
  }

  return { upiLink, appPayLink, paypalLink, dynamicQrImageUrl, markAwaitingConfirmation, confirmPayment, rejectPayment,
    markBalanceAwaitingConfirmation, confirmBalance, rejectBalance };
})();
