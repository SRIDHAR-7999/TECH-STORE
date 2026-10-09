/* ==========================================================================
   UI — header/footer templates, product card renderer, modal + FAQ helpers.
   Every page sets `const ROOT_PREFIX = '' | '../'` before this script loads
   so links resolve correctly whether the page lives at the site root or
   inside /pages/.
   ========================================================================== */

const UI = (() => {
  const prefix = () => (typeof ROOT_PREFIX !== 'undefined' ? ROOT_PREFIX : '');
  function link(path){ return prefix() + path; }

  /* ---- Inline SVG icons for the header actions ----------------------------
     These were Font Awesome <i> tags. FA is loaded from a CDN, so if that
     request is blocked or slow (ad-blocker, offline, CDN outage, restricted
     network) EVERY header icon silently collapses to a 0px-wide empty box —
     the buttons still work but look like blank circles, which is exactly
     what the store owner reported seeing. Inlining these seven as SVG means
     the primary navigation always shows real icons with no network
     dependency at all. Font Awesome is still used elsewhere on the site for
     decorative icons where a missing glyph is far less damaging.
     `stroke="currentColor"` keeps them following the theme colour, and the
     extra class hook lets the theme toggle animate sun/moon as before. */
  const svg = (paths, cls = '') =>
    `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" focusable="false">${paths}</svg>`;

  const ICONS = {
    moon: (cls) => svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', cls),
    sun: (cls) => svg(
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>', cls),
    compare: (cls) => svg(
      '<path d="M12 3v18M3 7h18M6 7l-3 6h6L6 7zM18 7l-3 6h6l-3-6z"/>', cls),
    heart: (cls) => svg(
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>', cls),
    cart: (cls) => svg(
      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>', cls),
    user: (cls) => svg(
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', cls),
    menu: (cls) => svg('<path d="M3 12h18M3 6h18M3 18h18"/>', cls),
    // ---- Added: social + category icons, same reasoning as above ----------
    // These were Font Awesome <i class="fa-brands ..."> / <i class="fa-solid ...">
    // tags (Instagram/Facebook/WhatsApp/Threads in the footer + mobile drawer,
    // and the small badge on each "Shop by category" tile). Same CDN
    // dependency, same silent blank-circle failure the store owner reported —
    // now inlined so they never depend on the network.
    instagram: (cls) => svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>', cls),
    facebook: (cls) => svg('<path d="M15 8.5h2V5.2c-.35-.05-1.55-.15-2.95-.15C11.5 5.05 9.9 6.6 9.9 9.4v2.1H7.5v3.6h2.4V21h3.4v-5.9h2.5l.4-3.6h-2.9V9.7c0-.85.24-1.2 1.7-1.2z" fill="currentColor" stroke="none"/>', cls),
    whatsapp: (cls) => svg('<path d="M6.4 17.6 5 21l3.5-1.35A8 8 0 1 0 5.5 15.9z"/><path d="M9 9.6c0-.5.4-1 1-1h.6c.35 0 .65.2.75.55l.6 1.9c.1.3 0 .65-.25.85l-.7.6c.55 1.15 1.5 2.1 2.65 2.65l.6-.7c.2-.25.55-.35.85-.25l1.9.6c.35.1.55.4.55.75v.6c0 .55-.45 1-1 1h-.5C11.9 17.15 8.85 14.1 8.4 9.5z" fill="currentColor" stroke="none"/>', cls),
    threads: (cls) => svg('<path d="M12 2.5c-5.2 0-8 3-8 9.5s2.8 9.5 8 9.5c4.4 0 7-2.15 7.5-5.5.35-2.35-.7-4-2.9-4.6.15-2.3-1.15-4-3.85-4-1.9 0-3.3.85-3.95 2.15l1.7.85c.4-.75 1.15-1.2 2.15-1.2 1.25 0 1.95.7 2 1.85-.6-.1-1.3-.15-2.05-.1-2.55.15-4.15 1.5-4.05 3.4.1 1.85 1.75 2.95 3.85 2.85 1.65-.1 2.85-.85 3.5-2.1.5-.95.65-2.05.55-3.15 1.1.45 1.6 1.3 1.4 2.6-.35 2.35-2.3 3.65-5.4 3.65-3.95 0-6.1-2.3-6.1-7.6s2.15-7.6 6.1-7.6c2.05 0 3.55.65 4.55 1.85l1.5-1.3C16.85 3.4 14.75 2.5 12 2.5z" fill="currentColor" stroke="none"/>', cls),
    catMobile: (cls) => svg('<rect x="7" y="2" width="10" height="20" rx="2.2"/><path d="M11 18h2"/>', cls),
    catLaptop: (cls) => svg('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M2 19h20"/>', cls),
    catWatch: (cls) => svg('<circle cx="12" cy="12" r="7"/><path d="M12 8.5V12l2.3 1.4M9.5 3h5M9.5 21h5"/>', cls),
    catAudio: (cls) => svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/>', cls),
    catAccessory: (cls) => svg('<path d="M9 3v4M15 3v4M6 7h12l-1 5a5 5 0 0 1-10 0L6 7z"/><path d="M12 15.5V21"/>', cls),
    catMobileRetro: (cls) => svg('<rect x="7" y="2" width="10" height="20" rx="2.2"/><path d="M9.5 5.5h5M11 18h2"/>', cls),
    catLaptopCode: (cls) => svg('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M2 19h20M9.5 8l-2 2 2 2M14.5 8l2 2-2 2"/>', cls),
    catSparePart: (cls) => svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z"/>', cls),
    headset: (cls) => svg('<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="12" width="4" height="6" rx="1.5"/><rect x="17.5" y="12" width="4" height="6" rx="1.5"/><path d="M19.5 18.5v.5a3 3 0 0 1-3 3h-3.5"/>', cls),
    admin: (cls) => svg('<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9.5 12l1.8 1.8L15 10"/>', cls)
  };

  const NAV_LINKS = [
    { href:'index.html', label:'Home', key:'home' },
    { href:'pages/products.html', label:'Shop', key:'shop' },
    { href:'pages/service.html', label:'Service', key:'service' },
    { href:'pages/compare.html', label:'Compare', key:'compare' },
    { href:'pages/about.html', label:'About', key:'about' },
    { href:'pages/contact.html', label:'Contact', key:'contact' }
  ];

  // Lets the 7999@gmail.com account reach the admin panel without being an
  // admin session itself — prompts for the real admin email/password,
  // signs in as that admin (replacing the current session) only if they're
  // correct, then opens the panel. Wrong credentials leave the session
  // untouched.
  async function openAdminGateway(){
    const email = prompt('Admin email:');
    if (!email) return;
    const password = prompt('Admin password:');
    if (!password) return;
    const res = await Auth.login({ email, password });
    if (res.ok && Auth.isAdmin()){
      window.location.href = link('pages/admin.html');
    } else {
      Notify.toast('Incorrect admin credentials.', 'error');
    }
  }

  function socialIconsHTML(size = 'footer'){
    const s = SITE_CONFIG.social;
    const items = [
      { url: s.instagram.url, icon: ICONS.instagram, label:'instagram' },
      { url: s.facebook.url, icon: ICONS.facebook, label:'facebook' },
      { url: s.whatsapp.url, icon: ICONS.whatsapp, label:'whatsapp' },
      { url: s.threads.url, icon: ICONS.threads, label:'threads' }
    ].filter(i => i.url);
    return items.map(i => `<a href="${i.url}" target="_blank" rel="noopener" class="social-${i.label}" aria-label="${i.label}">${i.icon('social-icon')}</a>`).join('');
  }

  function headerHTML(activeKey){
    const cartCount = typeof Cart !== 'undefined' ? Cart.count() : 0;
    const wishCount = typeof Wishlist !== 'undefined' ? Wishlist.count() : 0;
    const loggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();
    const isAdminUser = typeof Auth !== 'undefined' && Auth.isAdmin();
    const curUser = loggedIn && typeof Auth !== 'undefined' ? Auth.currentUser() : null;
    // The 7999@gmail.com account gets an "admin gateway" icon even though
    // it's a normal customer account — clicking it prompts for the real
    // admin credentials (see UI.openAdminGateway) rather than going
    // straight into the panel like an actual admin session does.
    const showAdminGateway = isAdminUser || (curUser && curUser.email && curUser.email.toLowerCase() === '7999@gmail.com');
    return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="${link('index.html')}" class="logo" data-logo-slot>
          <img class="logo-img" alt="${SITE_CONFIG.shopName}" style="display:none;height:34px;">
          <span class="logo-fallback" style="display:flex;align-items:center;gap:9px;">
            <span class="logo-mark"><i class="fa-solid fa-bolt"></i></span>
            <span>${SITE_CONFIG.shopName}<span class="sub">MOBILES · LAPTOPS · ACCESSORIES</span></span>
          </span>
        </a>
        <nav class="main-nav">
          ${NAV_LINKS.map(n => `<a href="${link(n.href)}" class="${activeKey===n.key?'active':''}">${n.label}</a>`).join('')}
        </nav>
        <div class="header-search" style="position:relative;">
          <div class="input-group"><i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" class="input" id="header-search-input" placeholder="Search phones, laptops, accessories…">
          </div>
          <div id="header-search-panel" style="display:none;position:absolute;top:52px;left:0;right:0;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:6px;max-height:340px;overflow-y:auto;z-index:50;"></div>
        </div>
        <div class="header-actions">
          <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">${ICONS.moon('icon-moon')}${ICONS.sun('icon-sun')}</button>
          ${loggedIn ? `
          <div style="position:relative;">
            <button class="icon-btn" id="inbox-bell-btn" aria-label="Notifications"><i class="fa-solid fa-bell"></i><span class="count" id="inbox-bell-count" style="display:none;"></span></button>
            <div id="inbox-bell-panel" style="display:none;position:absolute;top:52px;right:0;width:320px;max-height:400px;overflow-y:auto;background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);z-index:60;"></div>
          </div>` : ''}
          <a href="${link('pages/compare.html')}" class="icon-btn" aria-label="Compare">${ICONS.compare()}</a>
          <a href="${link('pages/wishlist.html')}" class="icon-btn" aria-label="Wishlist">${ICONS.heart()}${wishCount?`<span class="count">${wishCount}</span>`:''}</a>
          <a href="${link('pages/cart.html')}" class="icon-btn" aria-label="Cart">${ICONS.cart()}${cartCount?`<span class="count">${cartCount}</span>`:''}</a>
          <a href="${link(loggedIn ? 'pages/profile.html' : 'pages/login.html')}" class="icon-btn" aria-label="Account">${ICONS.user()}</a>
          ${isAdminUser ? `<a href="${link('pages/admin.html')}" class="icon-btn" aria-label="Admin panel" title="Admin panel">${ICONS.admin()}</a>` : (showAdminGateway ? `<button type="button" class="icon-btn" onclick="UI.openAdminGateway()" aria-label="Admin login" title="Admin login">${ICONS.admin()}</button>` : '')}
          <button class="icon-btn mobile-menu-btn" id="mobile-menu-open" aria-label="Menu">${ICONS.menu()}</button>
        </div>
      </div>
    </header>
    <div class="mobile-drawer" id="mobile-drawer">
      <div class="backdrop"></div>
      <div class="panel">
        <div class="flex justify-between items-center" style="margin-bottom:20px;">
          <strong style="font-family:var(--font-display);">Menu</strong>
          <button class="modal-close" id="mobile-menu-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${NAV_LINKS.map(n => `<a href="${link(n.href)}">${n.label}</a>`).join('')}
        <a href="${link('pages/wishlist.html')}">Wishlist</a>
        <a href="${link('pages/cart.html')}">Cart</a>
        <a href="${link('pages/orders.html')}">My Orders</a>
        <div class="social-row" style="margin-top:20px;">${socialIconsHTML()}</div>
      </div>
    </div>`;
  }

  function footerHTML(){
    const s = SITE_CONFIG.social;
    // Announcement strip — scrolling marquee (same technique as the brand
    // strip below: the item list is duplicated once so the loop is
    // seamless, then CSS animates the doubled track left by exactly one
    // copy's width). footerHTML() is shared, so this renders — already
    // running — on every single page; nothing page-specific to change.
    const announceItems = [
      '🚚 1-day delivery in Coimbatore district (COD available, 20% advance)',
      '💳 Pay via UPI / GPay / PhonePe / Paytm — screenshot verified by our team',
      `🕐 ${SITE_CONFIG.timings}`,
      `🌐 ${SITE_CONFIG.onlineNote}`,
      `📍 ${SITE_CONFIG.address}`
    ];
    const announceHTML = [...announceItems, ...announceItems].map(t => `<span>${t}</span>`).join('');
    return `
    <div class="announce-bar"><div class="track">${announceHTML}</div></div>
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <a href="${link('index.html')}" class="logo" data-logo-slot style="margin-bottom:12px;">
              <img class="logo-img" alt="${SITE_CONFIG.shopName}" style="display:none;height:30px;">
              <span class="logo-fallback" style="display:flex;align-items:center;gap:9px;">
                <span class="logo-mark"><i class="fa-solid fa-bolt"></i></span><span>${SITE_CONFIG.shopName}</span>
              </span>
            </a>
            <p>${SITE_CONFIG.tagline} Genuine mobiles, laptops & accessories with in-store pickup and same-day dispatch across ${SITE_CONFIG.state}.</p>
            <div class="social-row">${socialIconsHTML()}</div>
          </div>
          <div>
            <h5>Shop</h5>
            <ul>
              <li><a href="${link('pages/products.html?cat=mobiles')}">Mobiles</a></li>
              <li><a href="${link('pages/products.html?cat=laptops')}">Laptops</a></li>
              <li><a href="${link('pages/products.html?cat=watches')}">Smart Watches</a></li>
              <li><a href="${link('pages/products.html?cat=earbuds')}">Audio</a></li>
              <li><a href="${link('pages/products.html?cat=accessories')}">Accessories</a></li>
              <li><a href="${link('pages/products.html?cat=mobile-spare-parts')}">Mobile Spare Parts</a></li>
              <li><a href="${link('pages/products.html?cat=laptop-spare-parts')}">Laptop Spare Parts</a></li>
              <li><a href="${link('pages/second-hand-mobiles.html')}">Second Hand Mobiles</a></li>
              <li><a href="${link('pages/second-hand-laptops.html')}">Second Hand Laptops</a></li>
            </ul>
          </div>
          <div>
            <h5>Account</h5>
            <ul>
              <li><a href="${link('pages/login.html')}">Login</a></li>
              <li><a href="${link('pages/register.html')}">Register</a></li>
              <li><a href="${link('pages/orders.html')}">My Orders</a></li>
              <li><a href="${link('pages/tracking.html')}">Track Order</a></li>
              <li><a href="${link('pages/wishlist.html')}">Wishlist</a></li>
            </ul>
          </div>
          <div>
            <h5>Get in touch</h5>
            <ul>
              <li><i class="fa-solid fa-location-dot"></i> &nbsp;${SITE_CONFIG.address}</li>
              <li><i class="fa-solid fa-clock"></i> &nbsp;${SITE_CONFIG.timings}</li>
              <li><i class="fa-solid fa-phone"></i> &nbsp;${SITE_CONFIG.phones.join(' / ')}</li>
              <li><i class="fa-solid fa-envelope"></i> &nbsp;${SITE_CONFIG.email}</li>
              <li><a href="${s.whatsapp.url}" target="_blank" rel="noopener" style="color:#25D366;font-weight:700;display:inline-flex;align-items:center;gap:6px;">${ICONS.whatsapp('wa-inline-icon')} Chat on WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${SITE_CONFIG.legalName}, Coimbatore. All rights reserved.</span>
          <div class="payment-icons"><i class="fa-solid fa-qrcode"></i><i class="fa-solid fa-credit-card"></i><i class="fa-solid fa-money-bill-wave"></i></div>
          <div><a href="${link('pages/privacy.html')}">Privacy Policy</a> &nbsp;·&nbsp; <a href="${link('pages/about.html')}">About Us</a>${(() => {
            const isAdminUser = typeof Auth !== 'undefined' && Auth.isAdmin();
            const curUser = typeof Auth !== 'undefined' && Auth.isLoggedIn() ? Auth.currentUser() : null;
            const showAdminGateway = isAdminUser || (curUser && curUser.email && curUser.email.toLowerCase() === '7999@gmail.com');
            if (isAdminUser) return ` &nbsp;·&nbsp; <a href="${link('pages/admin.html')}" style="opacity:.55;">Admin</a>`;
            if (showAdminGateway) return ` &nbsp;·&nbsp; <a href="javascript:void(0)" onclick="UI.openAdminGateway()" style="opacity:.55;">Admin</a>`;
            return '';
          })()}</div>
        </div>
      </div>
    </footer>`;
  }

  function stars(rating){
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let html = '';
    for (let i=0;i<5;i++){
      if (i < full) html += '<i class="fa-solid fa-star"></i>';
      else if (i === full && half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
      else html += '<i class="fa-regular fa-star"></i>';
    }
    return `<span class="stars">${html}</span>`;
  }

  function stockBadge(p){
    if (p.isPreOrder) return `<span class="badge badge-accent"><i class="fa-solid fa-hourglass-half"></i> Coming Soon</span>`;
    if (p.stock <= 0) return `<span class="badge badge-danger">Out of Stock</span>`;
    if (p.stock <= 3) return `<span class="badge badge-pending">Only ${p.stock} left!</span>`;
    return `<span class="badge badge-success">Available</span>`;
  }

  function productCardHTML(p){
    const inWish = typeof Wishlist !== 'undefined' && Wishlist.has(p.id);
    // Cards are deliberately MINIMAL: image + model name only.
    // Brand, specs, price, condition and stock are NOT shown here — they live
    // on the product-details page, reached by clicking the card.
    return `
    <div class="product-card reveal" data-id="${p.id}" onclick="if(!event.target.closest('.pc-actions')) window.location.href='${link('pages/product-details.html?id=' + p.id)}'">
      <div class="pc-actions">
        <button class="pc-fav ${inWish?'active':''}" onclick="event.stopPropagation(); UI.toggleWishFromCard(this,'${p.id}')" aria-label="Wishlist"><i class="fa-solid fa-heart"></i></button>
      </div>
      <div class="pc-media">${
        (!p.imageUrl && !(p.images && p.images.length) && p.videoUrl)
          ? `<video src="${Utils.assetSrc(p.videoUrl)}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
          : `<img src="${Utils.productImage(p)}" alt="${Utils.escapeHtml(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.style.objectFit='contain';this.src='${Utils.deviceImage(p.type, '#e0a458')}';">`
      }</div>
      <div class="pc-body pc-minimal">
        <div class="pc-name">${Utils.escapeHtml(p.name)}</div>
      </div>
    </div>`;
  }

  function toggleWishFromCard(btn, id){
    const active = Wishlist.toggle(id);
    btn.classList.toggle('active', active);
    Notify.toast(active ? 'Added to wishlist' : 'Removed from wishlist', active ? 'success' : 'info');
  }

  function updateCounts(){
    document.querySelectorAll('a[aria-label="Cart"] .count').forEach(e => e.remove());
    document.querySelectorAll('a[aria-label="Wishlist"] .count').forEach(e => e.remove());
    const cartBtn = document.querySelector('a[aria-label="Cart"]');
    const wishBtn = document.querySelector('a[aria-label="Wishlist"]');
    if (cartBtn && Cart.count()) cartBtn.insertAdjacentHTML('beforeend', `<span class="count">${Cart.count()}</span>`);
    if (wishBtn && Wishlist.count()) wishBtn.insertAdjacentHTML('beforeend', `<span class="count">${Wishlist.count()}</span>`);
  }

  function initFAQ(container){
    (container || document).querySelectorAll('.faq-item').forEach(item => {
      const q = item.querySelector('.faq-q');
      const a = item.querySelector('.faq-a');
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.faq-item.open').forEach(o => {
          o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null;
        });
        if (!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
      });
    });
  }

  function openModal(id){ document.getElementById(id)?.classList.add('open'); }
  function closeModal(id){ document.getElementById(id)?.classList.remove('open'); }

  function initMobileDrawer(){
    const drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;
    document.getElementById('mobile-menu-open')?.addEventListener('click', () => drawer.classList.add('open'));
    document.getElementById('mobile-menu-close')?.addEventListener('click', () => drawer.classList.remove('open'));
    drawer.querySelector('.backdrop')?.addEventListener('click', () => drawer.classList.remove('open'));
  }

  let customLogo = { light:null, dark:null };
  function mountLogos(){
    /* Logo choice follows the theme, as requested: the tile is meant to
       contrast against the page, so the DARK-tile logo is used in light
       mode and the WHITE-tile logo in dark mode. */
    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const custom = theme === 'light' ? customLogo.dark : customLogo.light; // same theme->variant mapping as the SITE_CONFIG.logo pick below
    const file = theme === 'light' ? SITE_CONFIG.logo.dark : SITE_CONFIG.logo.light;
    const src = custom || link(file || SITE_CONFIG.logo.light || SITE_CONFIG.logo.dark);
    document.querySelectorAll('[data-logo-slot]').forEach(slot => {
      const img = slot.querySelector('.logo-img');
      const fallback = slot.querySelector('.logo-fallback');
      if (!img) return;
      img.onload = () => { img.style.display = 'block'; fallback.style.display = 'none'; };
      img.onerror = () => { img.style.display = 'none'; fallback.style.display = 'flex'; };
      img.src = src + (custom ? '' : '?v=' + theme);   // cache-bust across theme switches (skip for admin-uploaded URLs, which already change per upload)
    });
  }
  async function loadCustomLogos(){
    if (typeof Inbox === 'undefined') return;
    const [light, dark] = await Promise.all([Inbox.getSetting('logo_light_url'), Inbox.getSetting('logo_dark_url')]);
    customLogo = { light, dark };
    mountLogos();
  }

  let inboxPollTimer = null;
  async function renderInboxBell(){
    const btn = document.getElementById('inbox-bell-btn');
    if (!btn) return; // not logged in on this page load
    const list = await Inbox.listMine();
    const unread = list.filter(n => !n.read);
    const countEl = document.getElementById('inbox-bell-count');
    if (unread.length){ countEl.textContent = unread.length > 9 ? '9+' : unread.length; countEl.style.display = 'inline-flex'; }
    else countEl.style.display = 'none';

    const panel = document.getElementById('inbox-bell-panel');
    // With polling this frequent, rebuilding the panel's markup while
    // someone has it open to read would flicker and reset their scroll
    // position under them. The unread badge above still updates live every
    // tick; the list itself refreshes next time the panel is opened.
    if (panel.style.display === 'block') return;
    panel.innerHTML = list.length
      ? `<div style="padding:10px 14px;border-bottom:1px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-faint);">Notifications</span>
          <button id="inbox-clear-all" style="background:none;border:none;color:var(--accent-2);font-size:11.5px;font-weight:700;cursor:pointer;">Clear all</button>
        </div>` +
        list.map(n => `
        <div class="inbox-item" data-id="${n.id}" data-link="${n.link ? Utils.escapeHtml(n.link) : ''}" style="padding:12px 14px;border-bottom:1px solid var(--border-soft);cursor:pointer;position:relative;">
          <button class="inbox-item-delete" data-id="${n.id}" title="Delete" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--text-faint);cursor:pointer;font-size:13px;padding:2px 6px;">✕</button>
          <div style="font-size:13px;font-weight:${n.read?'600':'700'};margin-bottom:2px;color:var(--text);padding-right:20px;">${!n.read?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent-2);margin-right:6px;"></span>':''}${Utils.escapeHtml(n.title)}</div>
          <div style="font-size:12.5px;color:var(--text-dim);line-height:1.4;">${Utils.escapeHtml(n.body||'')}</div>
          <div style="font-size:11px;color:var(--text-faint);margin-top:4px;">${Utils.formatDate(n.created_at)}</div>
        </div>`).join('')
      : `<div style="padding:22px 14px;text-align:center;font-size:13px;color:var(--text-faint);">No notifications yet.</div>`;

    panel.querySelectorAll('.inbox-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.inbox-item-delete')) return; // handled separately below
        await Inbox.markRead(item.dataset.id);
        if (item.dataset.link) window.location.href = link(item.dataset.link);
        else renderInboxBell();
      });
    });
    panel.querySelectorAll('.inbox-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await Inbox.deleteNotification(btn.dataset.id);
        renderInboxBell();
      });
    });
    const clearAllBtn = document.getElementById('inbox-clear-all');
    if (clearAllBtn){
      clearAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await Inbox.clearAll();
        renderInboxBell();
      });
    }
  }

  function initInboxBell(){
    const btn = document.getElementById('inbox-bell-btn');
    if (!btn) return;
    const panel = document.getElementById('inbox-bell-panel');
    renderInboxBell();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (panel.style.display !== 'none' && !panel.contains(e.target) && e.target !== btn) panel.style.display = 'none';
    });
    clearInterval(inboxPollTimer);
    inboxPollTimer = setInterval(() => {
      // Pause while the tab is in the background — no one's watching the
      // bell right then, and it resumes at full speed the moment they
      // switch back, so nothing is missed, just not fetched needlessly.
      if (!document.hidden) renderInboxBell();
    }, 1000);
  }

  function mount(activeKey){
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) h.innerHTML = headerHTML(activeKey);
    if (f) f.innerHTML = footerHTML();
    initMobileDrawer();
    mountLogos();
    loadCustomLogos();
    if (typeof Branding !== 'undefined') Branding.applyBackground();
    initInboxBell();
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => setTimeout(mountLogos, 0)));
    Search.attachHeaderSearch(document.getElementById('header-search-input'), document.getElementById('header-search-panel'));
    document.addEventListener('cart:change', updateCounts);
    document.addEventListener('wishlist:change', updateCounts);
  }

  return { link, prefix, headerHTML, footerHTML, mount, stars, productCardHTML, stockBadge, toggleWishFromCard, updateCounts, initFAQ, openModal, closeModal, socialIconsHTML, openAdminGateway, NAV_LINKS, ICONS, refreshLogos: loadCustomLogos };
})();
