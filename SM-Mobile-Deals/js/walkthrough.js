/* ==========================================================================
   WALKTHROUGH — a looping, ~55 second animated clip that shows a new visitor
   how the whole site works before they have an account: search a product,
   add it to the cart, place the order, pay by UPI, and then see the three
   possible payment outcomes.

   WHY IT IS BUILT THIS WAY
   A real screen recording would mean shipping a large video file and would
   go stale every time the UI changes. This is drawn entirely with DOM nodes
   and CSS, so it stays in the site's own colours and weighs nothing.

   PAYMENT STATUS COLOURS (the important part)
     CONFIRMED  green  #22c55e   tick mark    — payment verified, order placed
     PENDING    amber  #f59e0b   hourglass    — waiting for admin confirmation,
                                                refunded to the same account if
                                                it cannot be confirmed
     FAILED     red    #ef4444   cross mark   — payment failed, nothing charged

   These are the same three states the real order pipeline uses, so what a
   customer sees in the demo matches what they will see after checkout.
   ========================================================================== */

const Walkthrough = (() => {

  /* Each step renders its own little scene inside the phone frame. Durations
     are in milliseconds and add up to roughly 55 seconds per loop. */
  const STEPS = [
    {
      key: 'browse', ms: 6000, label: 'Browse the catalog',
      caption: 'Over 2,000 mobiles, laptops, watches and accessories.',
      scene: () => `
        <div class="wt-screen">
          <div class="wt-searchbar"><i class="fa-solid fa-magnifying-glass"></i><span class="wt-typing" data-type="iPhone 15"></span></div>
          <div class="wt-grid">
            ${[1,2,3,4].map(i => `<div class="wt-tile wt-pop" style="animation-delay:${i*0.14}s"><div class="wt-tile-img"></div><div class="wt-tile-bar"></div></div>`).join('')}
          </div>
        </div>`
    },
    {
      key: 'product', ms: 6000, label: 'Open a product',
      caption: 'Full specs, real photos, and the exact charger that model needs.',
      scene: () => `
        <div class="wt-screen">
          <div class="wt-hero-img wt-pop"></div>
          <div class="wt-line wt-w70 wt-pop" style="animation-delay:.1s"></div>
          <div class="wt-price wt-pop" style="animation-delay:.2s">₹64,900</div>
          <div class="wt-chiprow">
            ${['128GB','6.1" OLED','20W'].map((t,i)=>`<span class="wt-chip wt-pop" style="animation-delay:${.3+i*.1}s">${t}</span>`).join('')}
          </div>
        </div>`
    },
    {
      key: 'cart', ms: 5500, label: 'Add to cart',
      caption: 'Cart and wishlist stay saved on your account.',
      scene: () => `
        <div class="wt-screen wt-center">
          <div class="wt-cart-icon"><i class="fa-solid fa-cart-shopping"></i><span class="wt-cart-badge">1</span></div>
          <div class="wt-line wt-w60" style="margin-top:18px;"></div>
          <div class="wt-btn wt-pop" style="animation-delay:.4s">Proceed to checkout</div>
        </div>`
    },
    {
      key: 'address', ms: 6000, label: 'Enter delivery details',
      caption: 'Pincode decides your delivery speed and whether COD is available.',
      scene: () => `
        <div class="wt-screen">
          <div class="wt-field wt-pop"><span>Name</span></div>
          <div class="wt-field wt-pop" style="animation-delay:.12s"><span>Address</span></div>
          <div class="wt-field wt-pop" style="animation-delay:.24s"><span class="wt-typing" data-type="641001"></span></div>
          <div class="wt-note wt-pop" style="animation-delay:.9s"><i class="fa-solid fa-truck-fast"></i> Coimbatore district — 1-day delivery</div>
        </div>`
    },
    {
      key: 'pay', ms: 6500, label: 'Pay by UPI',
      caption: 'Scan with GPay, PhonePe or Paytm — then upload the screenshot.',
      scene: () => `
        <div class="wt-screen wt-center">
          <div class="wt-qr wt-pop">
            ${Array.from({length:36}).map((_,i)=>`<i style="animation-delay:${(i%9)*0.05}s;${[0,1,2,9,10,11,18,19,20,6,7,8,15,16,17,27,28,29,33,34,35,24,25,26].includes(i)?'opacity:1':'opacity:.25'}"></i>`).join('')}
          </div>
          <div class="wt-line wt-w50" style="margin-top:14px;"></div>
          <div class="wt-upi-row">
            ${['GPay','PhonePe','Paytm'].map((t,i)=>`<span class="wt-chip wt-pop" style="animation-delay:${.3+i*.12}s">${t}</span>`).join('')}
          </div>
        </div>`
    },
    {
      key: 'verify', ms: 5500, label: 'We verify your payment',
      caption: 'Our team checks the screenshot against the bank record.',
      scene: () => `
        <div class="wt-screen wt-center">
          <div class="wt-spinner"></div>
          <div class="wt-line wt-w60" style="margin-top:20px;"></div>
          <div class="wt-line wt-w40" style="margin-top:8px;"></div>
        </div>`
    },

    /* ---- the three payment outcomes, each with its own colour ---- */
    {
      key: 'ok', ms: 6500, label: 'Payment confirmed', status: 'ok',
      caption: 'Green means the money reached us and your order is placed.',
      scene: () => `
        <div class="wt-screen wt-center wt-status wt-status-ok">
          <div class="wt-mark wt-mark-ok">
            <svg viewBox="0 0 52 52"><circle class="wt-mark-ring" cx="26" cy="26" r="23"/><path class="wt-mark-path" d="M15 27 l8 8 l15 -16"/></svg>
          </div>
          <div class="wt-status-title">Order Confirmed</div>
          <div class="wt-status-sub">Payment received · packing starts today</div>
        </div>`
    },
    {
      key: 'wait', ms: 6500, label: 'Awaiting confirmation', status: 'wait',
      caption: 'Amber means we are still checking — if it cannot be confirmed, the money goes back to the same account.',
      scene: () => `
        <div class="wt-screen wt-center wt-status wt-status-wait">
          <div class="wt-mark wt-mark-wait"><i class="fa-solid fa-hourglass-half"></i></div>
          <div class="wt-status-title">Waiting for order confirmation</div>
          <div class="wt-status-sub">Or your money is refunded to the same account</div>
        </div>`
    },
    {
      key: 'fail', ms: 6500, label: 'Payment failed', status: 'fail',
      caption: 'Red means nothing was charged — you can simply try again.',
      scene: () => `
        <div class="wt-screen wt-center wt-status wt-status-fail">
          <div class="wt-mark wt-mark-fail">
            <svg viewBox="0 0 52 52"><circle class="wt-mark-ring" cx="26" cy="26" r="23"/><path class="wt-mark-path" d="M17 17 l18 18"/><path class="wt-mark-path wt-mark-path-2" d="M35 17 l-18 18"/></svg>
          </div>
          <div class="wt-status-title">Payment Failed</div>
          <div class="wt-status-sub">Nothing was charged — try again</div>
        </div>`
    }
  ];

  const TOTAL_MS = STEPS.reduce((a, s) => a + s.ms, 0);

  function shellHTML(){
    return `
      <div class="wt-root" id="wt-root">
        <div class="wt-head">
          <span class="wt-eyebrow">How it works</span>
          <span class="wt-clock" id="wt-clock"></span>
        </div>

        <div class="wt-phone">
          <div class="wt-notch"></div>
          <div class="wt-viewport" id="wt-viewport"></div>
        </div>

        <div class="wt-caption" id="wt-caption"></div>

        <div class="wt-dots" id="wt-dots">
          ${STEPS.map((s,i) => `<button class="wt-dot" data-i="${i}" aria-label="${s.label}"></button>`).join('')}
        </div>

        <div class="wt-progress"><div class="wt-progress-bar" id="wt-progress-bar"></div></div>

        <div class="wt-legend">
          <span><i class="wt-key wt-key-ok"></i> Confirmed</span>
          <span><i class="wt-key wt-key-wait"></i> Awaiting / refund</span>
          <span><i class="wt-key wt-key-fail"></i> Failed</span>
        </div>
      </div>`;
  }

  /** Type-on effect for any element carrying data-type. */
  function runTypers(root){
    root.querySelectorAll('[data-type]').forEach(el => {
      const full = el.dataset.type;
      el.textContent = '';
      let i = 0;
      const t = setInterval(() => {
        el.textContent = full.slice(0, ++i);
        if (i >= full.length) clearInterval(t);
      }, 90);
      el._typer = t;
    });
  }

  function mount(container){
    if (!container) return;
    container.innerHTML = shellHTML();

    const viewport = container.querySelector('#wt-viewport');
    const caption  = container.querySelector('#wt-caption');
    const clock    = container.querySelector('#wt-clock');
    const bar      = container.querySelector('#wt-progress-bar');
    const dots     = Array.from(container.querySelectorAll('.wt-dot'));

    let idx = 0, timer = null, rafId = null, startedAt = 0, elapsedBefore = 0;

    function paint(i){
      idx = i;
      const step = STEPS[i];
      viewport.innerHTML = step.scene();
      viewport.className = 'wt-viewport wt-enter';
      // restart the enter animation
      void viewport.offsetWidth;
      viewport.classList.remove('wt-enter');
      void viewport.offsetWidth;
      viewport.classList.add('wt-enter');

      caption.innerHTML = `<strong>${step.label}</strong><span>${step.caption}</span>`;
      dots.forEach((d, di) => d.classList.toggle('active', di === i));
      runTypers(viewport);
    }

    function schedule(){
      clearTimeout(timer);
      startedAt = performance.now();
      timer = setTimeout(() => {
        elapsedBefore = STEPS.slice(0, idx + 1).reduce((a,s)=>a+s.ms, 0) % TOTAL_MS;
        const next = (idx + 1) % STEPS.length;
        if (next === 0) elapsedBefore = 0;
        paint(next);
        schedule();
      }, STEPS[idx].ms);
    }

    function tick(){
      const within  = performance.now() - startedAt;
      const total   = elapsedBefore + Math.min(within, STEPS[idx].ms);
      const pct     = Math.min(100, (total / TOTAL_MS) * 100);
      bar.style.width = pct + '%';
      clock.textContent = `${Math.round(total/1000)}s / ${Math.round(TOTAL_MS/1000)}s`;
      rafId = requestAnimationFrame(tick);
    }

    // Jumping straight to a step from the dots
    dots.forEach(d => d.addEventListener('click', () => {
      const i = Number(d.dataset.i);
      elapsedBefore = STEPS.slice(0, i).reduce((a,s)=>a+s.ms, 0);
      paint(i);
      schedule();
    }));

    // Pause while the tab is hidden so the clip is not halfway through when
    // the visitor comes back to it.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){ clearTimeout(timer); cancelAnimationFrame(rafId); }
      else { schedule(); rafId = requestAnimationFrame(tick); }
    });

    paint(0);
    schedule();
    rafId = requestAnimationFrame(tick);
  }

  return { mount, STEPS, TOTAL_MS };
})();
