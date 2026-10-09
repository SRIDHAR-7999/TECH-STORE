/* ==========================================================================
   ADMIN — render helpers for the admin dashboard (products, pending
   payments queue, orders, categories). Data access always goes through DB /
   Payment / Orders so the same functions could later point at Firestore.
   ========================================================================== */

const AdminUI = (() => {

  function statsHTML(){
    const s = Analytics.summary();
    const pending = Orders.pendingConfirmationQueue().length + Orders.balanceConfirmationQueue().length;
    const cards = [
      { label:'Confirmed Revenue', value: Utils.formatINR(s.revenue), icon:'fa-sack-dollar', color:'var(--success)' },
      { label:'Total Orders', value: s.orderCount, icon:'fa-receipt', color:'var(--accent-2)' },
      { label:'Pending Payments', value: pending, icon:'fa-hourglass-half', color:'var(--pending)' },
      { label:'Products Listed', value: DB.getProducts().length, icon:'fa-boxes-stacked', color:'var(--deal)' }
    ];
    return cards.map(c => `
      <div class="card" style="padding:20px;">
        <div class="flex items-center justify-between" style="margin-bottom:10px;">
          <span class="text-faint" style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">${c.label}</span>
          <i class="fa-solid ${c.icon}" style="color:${c.color};font-size:18px;"></i>
        </div>
        <div style="font-family:var(--font-display);font-size:26px;font-weight:700;">${c.value}</div>
      </div>`).join('');
  }

  function pendingPaymentCard(order){
    return `
    <div class="card" style="padding:18px;display:grid;grid-template-columns:100px 1fr auto;gap:16px;align-items:center;" data-order="${order.id}">
      <img src="${order.screenshot || ''}" alt="Payment screenshot" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:1px solid var(--border-soft);cursor:pointer;" onclick="AdminUI.previewImage('${order.id}')">
      <div>
        <div style="font-family:var(--font-mono);font-weight:700;">${order.id}</div>
        <div class="text-dim" style="font-size:13px;">${Utils.escapeHtml(order.address.name)} · ${Utils.escapeHtml(order.address.phone)}</div>
        <div class="text-faint" style="font-size:12.5px;">${order.items.length} item(s) · screenshot should show <span class="text-deal" style="font-family:var(--font-mono);">${Utils.formatINR(order.amountDueNow ?? order.totals.total)}</span>${order.paymentMethod==='cod' ? ` <span class="badge badge-pending" style="margin-left:4px;">COD advance</span>` : ''}</div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary btn-sm" onclick="AdminUI.confirmPayment('${order.id}')"><i class="fa-solid fa-check"></i> Confirm</button>
        <button class="btn btn-outline btn-sm" onclick="AdminUI.reject('${order.id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
      </div>
    </div>`;
  }

  function balancePaymentCard(order){
    return `
    <div class="card" style="padding:18px;display:grid;grid-template-columns:100px 1fr auto;gap:16px;align-items:center;" data-order="${order.id}">
      <img src="${order.balanceScreenshot || ''}" alt="Balance payment screenshot" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:1px solid var(--border-soft);cursor:pointer;" onclick="ImageViewer.open('${order.balanceScreenshot || ''}', 'Balance Payment Screenshot — Order ${order.id}')">
      <div>
        <div style="font-family:var(--font-mono);font-weight:700;">${order.id} <span class="badge badge-accent" style="margin-left:4px;">Balance</span></div>
        <div class="text-dim" style="font-size:13px;">${Utils.escapeHtml(order.address.name)} · ${Utils.escapeHtml(order.address.phone)}</div>
        <div class="text-faint" style="font-size:12.5px;">Balance should show <span class="text-deal" style="font-family:var(--font-mono);">${Utils.formatINR(order.totals.balanceAmount)}</span> — confirming now decides same-day vs next-day dispatch (6 PM cutoff).</div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary btn-sm" onclick="AdminUI.confirmBalance('${order.id}')"><i class="fa-solid fa-check"></i> Confirm</button>
        <button class="btn btn-outline btn-sm" onclick="AdminUI.rejectBalance('${order.id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
      </div>
    </div>`;
  }

  async function confirmPayment(orderId){
    await Payment.confirmPayment(orderId);
    Notify.toast(`Order ${orderId} confirmed. Customer will now see "Order Confirmed".`, 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  async function confirmBalance(orderId){
    const res = await Payment.confirmBalance(orderId);
    Notify.toast(`Balance confirmed for ${orderId}. ${res.order?.dispatchNote || ''}`, 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  async function rejectBalance(orderId){
    const reason = window.prompt('Reason for rejecting this balance payment (shown to the customer):', 'Screenshot amount did not match the balance due.');
    if (reason === null) return;
    await Payment.rejectBalance(orderId, reason);
    Notify.toast(`Balance payment rejected for ${orderId}.`, 'info');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  async function reject(orderId){
    const reason = window.prompt('Reason for rejecting this payment (shown to customer):', 'Screenshot did not match the order amount.');
    if (reason === null) return;
    await Payment.rejectPayment(orderId, reason);
    Notify.toast(`Order ${orderId} marked as payment rejected.`, 'warn');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  function previewImage(orderId){
    const order = Orders.byId(orderId);
    if (!order || !order.screenshot) return;
    ImageViewer.open(order.screenshot, `Payment Screenshot — Order ${order.id}`);
  }

  /* Every product's details are already set up in the catalog, so the only
     outstanding job per row is attaching real media. The row therefore shows
     a MEDIA status column and the action button reads "Add photo". */
  function productRow(p){
    const imgCount = (p.images && p.images.length) || (p.imageUrl ? 1 : 0);
    const vidCount = (p.videos && p.videos.length) || (p.videoUrl ? 1 : 0);
    const thumb = (p.images && p.images[0]) || p.imageUrl
      ? `<img src="${Utils.assetSrc((p.images && p.images[0]) || p.imageUrl)}" style="width:36px;height:36px;object-fit:cover;border-radius:8px;">`
      : `<img src="${Utils.deviceImage(p.type,p.color)}" style="width:36px;height:36px;object-fit:contain;opacity:.5;">`;

    let media;
    if (imgCount && vidCount)  media = `<span class="badge badge-success">${imgCount} photo${imgCount>1?'s':''} + ${vidCount} video${vidCount>1?'s':''}</span>`;
    else if (imgCount)         media = `<span class="badge badge-success">${imgCount} photo${imgCount>1?'s':''}</span>`;
    else if (vidCount)         media = `<span class="badge badge-accent">${vidCount} video${vidCount>1?'s':''} only</span>`;
    else                       media = `<span class="badge badge-pending">No media</span>`;

    return `
    <tr data-id="${p.id}" data-hasmedia="${imgCount || vidCount ? '1' : '0'}">
      <td>${thumb}</td>
      <td>${Utils.escapeHtml(p.name)}<div class="text-faint" style="font-size:11.5px;">${Utils.escapeHtml(p.brand)} · ${Utils.escapeHtml(String(p.category).replace(/-/g,' '))}</div></td>
      <td>${media}</td>
      <td style="font-family:var(--font-mono);">${Utils.formatINR(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="AdminUI.editProduct('${p.id}')" title="Edit product"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="AdminUI.deleteProduct('${p.id}')" title="Delete product" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  async function deleteProduct(id){
    if (!window.confirm('Remove this product from the catalog?')) return;
    await DB.deleteProduct(id);
    Notify.toast('Product removed.', 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  function editProduct(id){
    document.dispatchEvent(new CustomEvent('admin:edit-product', { detail:{ id } }));
  }

  function orderRow(order){
    const meta = Orders.STATUS_META[Orders.displayStatus(order)];
    const courierName = order.courier ? (SITE_CONFIG.couriers[order.courier]?.name || order.courier) : null;
    return `
    <tr>
      <td style="font-family:var(--font-mono);">${order.id}</td>
      <td>${Utils.escapeHtml(order.address.name)}</td>
      <td style="font-family:var(--font-mono);">${Utils.formatINR(order.totals.total)}</td>
      <td><span class="badge ${meta.badge}"><i class="fa-solid ${meta.icon}"></i> ${meta.label}</span>${courierName ? `<div class="text-faint" style="font-size:11px;margin-top:3px;">${courierName} · ${Utils.escapeHtml(order.trackingNumber)}</div>` : ''}</td>
      <td>
        ${order.screenshot ? `<button class="btn btn-ghost btn-sm" onclick="AdminUI.previewImage('${order.id}')" title="View payment screenshot"><i class="fa-solid fa-image"></i></button>` : ''}
        <a class="btn btn-ghost btn-sm" href="invoice.html?order=${order.id}" title="Generate / view bill"><i class="fa-solid fa-file-invoice"></i></a>
        <button class="btn btn-ghost btn-sm" onclick="AdminUI.promptTracking('${order.id}')" title="${order.trackingNumber ? 'Update tracking' : 'Add tracking'}"><i class="fa-solid fa-truck-fast"></i></button>
        <select class="input" style="padding:6px 10px;font-size:12.5px;" onchange="AdminUI.setStatus('${order.id}', this.value)">
          ${Orders.TRACK_STEPS.map(s => `<option value="${s}" ${order.orderStatus===s?'selected':''}>${Orders.STATUS_META[s].label}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }

  // Admin pastes a courier's tracking number OR a full tracking URL — either
  // works. As soon as they confirm, the customer gets a live tracking link
  // sent to their notifications (see Orders.setTracking).
  async function promptTracking(orderId){
    const courierNames = Object.entries(SITE_CONFIG.couriers).map(([key,c], i) => `${i+1}. ${c.name}`).join('\n');
    const choice = prompt(`Which courier?\n${courierNames}\n\nEnter the number:`);
    if (!choice) return;
    const courierKeys = Object.keys(SITE_CONFIG.couriers);
    const courierKey = courierKeys[parseInt(choice, 10) - 1];
    if (!courierKey){ Notify.toast('Not a valid choice.', 'error'); return; }
    const trackingInput = prompt('Paste the tracking number/barcode, or the full tracking link:');
    if (!trackingInput || !trackingInput.trim()) return;
    const res = await Orders.setTracking(orderId, courierKey, trackingInput);
    if (!res.ok){ Notify.toast(res.error || 'Could not save tracking.', 'error'); return; }
    Notify.toast(`Tracking saved — customer notified with the live link.`, 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  async function setStatus(orderId, status){
    await Orders.advanceStatus(orderId, status);
    Notify.toast(`Order ${orderId} updated to "${Orders.STATUS_META[status].label}".`, 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  function refundCard(order){
    const days = Orders.daysLeft(order);
    const overdue = days !== null && days < 0;
    return `
    <div class="card" style="padding:18px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;" data-order="${order.id}">
      <div>
        <div style="font-family:var(--font-mono);font-weight:700;">${order.id}</div>
        <div class="text-dim" style="font-size:13px;">${Utils.escapeHtml(order.address.name)} · ${Utils.escapeHtml(order.address.phone)}</div>
        <div class="text-faint" style="font-size:12.5px;">Refund <b style="color:var(--accent-2);font-family:var(--font-mono);">${Utils.formatINR(order.refundAmount)}</b> · ₹${order.refundCommission} commission kept · <span style="color:${overdue?'var(--danger)':'var(--text-faint)'};">${overdue ? 'Overdue by ' + Math.abs(days) + ' day(s)' : days + ' day(s) left'}</span></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="AdminUI.markRefundSent('${order.id}')"><i class="fa-solid fa-money-bill-transfer"></i> Mark refund sent</button>
    </div>`;
  }

  async function markRefundSent(orderId){
    await Orders.markRefundSent(orderId);
    Notify.toast(`Refund for ${orderId} marked as sent.`, 'success');
    document.dispatchEvent(new CustomEvent('admin:refresh'));
  }

  return { statsHTML, pendingPaymentCard, balancePaymentCard, confirmPayment, confirmBalance, rejectBalance, reject, previewImage, productRow, deleteProduct, editProduct, orderRow, setStatus, refundCard, markRefundSent, promptTracking };
})();
