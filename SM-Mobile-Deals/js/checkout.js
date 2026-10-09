/* ==========================================================================
   CHECKOUT — address collection + delivery/COD rule + order creation

   Business rule (updated):
     Delivery TIME: Tamil Nadu (any district) -> 1 day. Other states -> a
       2-5 day range based on distance tier (see js/pincode.js).
     COD availability: Coimbatore district ONLY, and requires an advance
       payment online (SITE_CONFIG.codAdvancePercent) — the rest is
       collected in cash on delivery. Everywhere else (including the rest
       of Tamil Nadu) is online payment only, full amount upfront.
   ========================================================================== */

const Checkout = (() => {

  function deliveryEstimate(address){
    const { days } = Pincode.estimateDays(address.state);
    const codAllowed = Utils.isTamilNadu(address.state) && Utils.isCoimbatoreDistrict(address.city);
    return { days, codAllowed };
  }

  // Bulk-purchase discount — flat off for orders above ₹1,00,000 (from project spec)
  function bulkDiscount(subtotal){
    if (subtotal >= 200000) return 5000;
    if (subtotal >= 150000) return 3000;
    if (subtotal >= 100000) return 1000;
    return 0;
  }

  function computeTotals(items, address, paymentMethod){
    const subtotal = items.reduce((s,i) => s + i.price * i.qty, 0);
    const discount = bulkDiscount(subtotal);
    const deliveryFee = subtotal >= SITE_CONFIG.freeDeliveryOver ? 0 : 79;
    const cardSurcharge = paymentMethod === 'card' ? Math.round((subtotal - discount) * 0.02) : 0; // 2% card processing surcharge
    const total = subtotal - discount + deliveryFee + cardSurcharge;

    let advanceAmount = 0, codAmount = 0, balanceAmount = 0;
    if (paymentMethod === 'cod'){
      advanceAmount = Math.round((total * SITE_CONFIG.codAdvancePercent) / 10) * 10; // round to nearest 10
      codAmount = total - advanceAmount;
    } else if (paymentMethod === 'advance'){
      advanceAmount = Math.min(SITE_CONFIG.advanceHoldingAmount, total); // never exceed the order total
      balanceAmount = total - advanceAmount;
    }
    return { subtotal, discount, deliveryFee, cardSurcharge, total, advanceAmount, codAmount, balanceAmount };
  }

  async function createOrder({ address, paymentMethod }){
    const items = Cart.detailed();
    if (!items.length) return { ok:false, error:'Your cart is empty.' };
    const { days, codAllowed } = deliveryEstimate(address);
    if (paymentMethod === 'cod' && !codAllowed){
      return { ok:false, error:'Cash on Delivery is only available within Coimbatore district. Please choose online payment for this address.' };
    }
    const totals = computeTotals(items, address, paymentMethod);
    const user = Auth.currentUser();
    if (!user) return { ok:false, error:'Please log in before placing an order.' };

    // For COD orders, the "amount to pay online right now" is just the advance;
    // for the new Advance Payment option it's the fixed ₹1000 booking amount;
    // for pure online orders it's the full total.
    const amountDueNow = paymentMethod === 'cod' ? totals.advanceAmount
      : paymentMethod === 'advance' ? totals.advanceAmount
      : totals.total;

    const order = {
      id: Utils.orderId(),
      userId: user.id,
      items: items.map(i => ({ id:i.id, name:i.name, price:i.price, qty:i.qty, type:i.type, color:i.color })),
      address,
      paymentMethod,
      totals,
      amountDueNow,
      deliveryEstimate: days,
      paymentStatus: 'awaiting_payment',
      orderStatus: 'payment_pending',
      screenshot: null,
      balanceStatus: paymentMethod === 'advance' ? 'not_due' : null,
      timeline: [{ status:'placed', at:new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await DB.saveOrder(order);
    DB.logEvent('order_created', { id: order.id, method: paymentMethod });
    return { ok:true, order };
  }

  return { deliveryEstimate, computeTotals, bulkDiscount, createOrder };
})();
