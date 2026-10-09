/* ==========================================================================
   CELEBRATE — confetti + rising balloons, fired once for every customer on
   every order the moment payment/order success is shown (order-success.html).
   Pure DOM/CSS, no external library — keeps working even if a CDN is down.
   ========================================================================== */

const Celebrate = (() => {
  const CONFETTI_COLORS = ['#4c8dff', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#facc15'];
  const BALLOON_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#ec4899'];

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function fire(){
    // Respect reduced-motion preference — a full-screen burst of movement
    // is exactly what that setting exists to avoid.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layer = document.createElement('div');
    layer.className = 'celebrate-layer';
    document.body.appendChild(layer);

    // Confetti — a couple hundred small pieces falling from the top.
    const CONFETTI_COUNT = 120;
    for (let i = 0; i < CONFETTI_COUNT; i++){
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size = rand(6, 12);
      const isCircle = Math.random() < 0.4;
      el.style.left = rand(0, 100) + 'vw';
      el.style.width = size + 'px';
      el.style.height = (isCircle ? size : size * rand(1.6, 2.4)) + 'px';
      el.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      el.style.borderRadius = isCircle ? '50%' : '2px';
      el.style.setProperty('--drift', rand(-120, 120) + 'px');
      el.style.setProperty('--spin', rand(240, 900) + 'deg');
      el.style.animationDuration = rand(2.6, 4.2) + 's';
      el.style.animationDelay = rand(0, 0.9) + 's';
      layer.appendChild(el);
    }

    // A handful of balloons rising from the bottom for extra warmth.
    const BALLOON_COUNT = 8;
    for (let i = 0; i < BALLOON_COUNT; i++){
      const el = document.createElement('div');
      el.className = 'balloon-piece';
      const w = rand(34, 48);
      el.style.left = rand(4, 92) + 'vw';
      el.style.width = w + 'px';
      el.style.height = w * 1.25 + 'px';
      el.style.background = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      el.style.borderRadius = '50% 50% 50% 50% / 58% 58% 42% 42%';
      el.style.setProperty('--drift', rand(-60, 60) + 'px');
      el.style.setProperty('--sway', rand(-14, 14) + 'deg');
      el.style.animationDuration = rand(4.5, 6.5) + 's';
      el.style.animationDelay = rand(0, 1.2) + 's';
      layer.appendChild(el);
    }

    // Clean up after the longest possible animation finishes.
    setTimeout(() => layer.remove(), 8000);
  }

  // Fire at most once per order per browser, so re-visiting the success
  // page (or the 4s status-poll re-rendering the same success state)
  // doesn't replay it over and over.
  function fireOnceFor(orderId){
    const key = 'smd_celebrated_' + orderId;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fire();
  }

  return { fire, fireOnceFor };
})();
