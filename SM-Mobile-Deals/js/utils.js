/* ==========================================================================
   UTILS — shared helper functions used across every page
   ========================================================================== */

const Utils = (() => {

  function formatINR(n){
    n = Number(n) || 0;
    return '₹' + n.toLocaleString('en-IN');
  }

  function uid(prefix = 'ID'){
    return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
  }

  function orderId(){
    const d = new Date();
    const y = d.getFullYear().toString().slice(-2);
    const m = String(d.getMonth()+1).padStart(2,'0');
    return `SMD${y}${m}${String(Date.now()).slice(-6)}`;
  }

  function debounce(fn, wait = 250){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function qs(name, fallback = null){
    const params = new URLSearchParams(window.location.search);
    return params.has(name) ? params.get(name) : fallback;
  }

  function escapeHtml(str = ''){
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  }

  function fileToBase64(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Detect if TN address (case-insensitive match on state field)
  function isTamilNadu(state = ''){
    return /tamil\s*nadu|^tn$/i.test(state.trim());
  }

  function isCoimbatoreDistrict(city = ''){
    return /coimbatore|kovai/i.test(city.trim());
  }

  // Generates a clean inline-SVG "device" placeholder image (no real photos needed)
  function deviceImage(type = 'phone', accent = '#e0a458'){
    let inner = '';
    if (type === 'laptop'){
      inner = `
        <rect x="20" y="30" width="160" height="100" rx="8" fill="#161d30" stroke="${accent}" stroke-width="2"/>
        <rect x="30" y="40" width="140" height="80" rx="3" fill="${accent}" opacity="0.18"/>
        <path d="M8 138 L192 138 L182 156 L18 156 Z" fill="#1c2438" stroke="${accent}" stroke-width="1.5"/>`;
    } else if (type === 'watch'){
      inner = `
        <rect x="70" y="10" width="60" height="16" rx="6" fill="#1c2438"/>
        <rect x="70" y="154" width="60" height="16" rx="6" fill="#1c2438"/>
        <rect x="52" y="50" width="96" height="80" rx="20" fill="#161d30" stroke="${accent}" stroke-width="2"/>
        <circle cx="100" cy="90" r="30" fill="${accent}" opacity="0.2"/>`;
    } else if (type === 'earbuds'){
      inner = `
        <rect x="70" y="20" width="60" height="90" rx="16" fill="#161d30" stroke="${accent}" stroke-width="2"/>
        <circle cx="80" cy="120" r="14" fill="${accent}" opacity="0.35"/>
        <circle cx="120" cy="120" r="14" fill="${accent}" opacity="0.35"/>`;
    } else {
      inner = `
        <rect x="62" y="10" width="76" height="160" rx="14" fill="#161d30" stroke="${accent}" stroke-width="2"/>
        <rect x="70" y="24" width="60" height="120" rx="4" fill="${accent}" opacity="0.18"/>
        <circle cx="100" cy="158" r="5" fill="${accent}" opacity="0.6"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180">${inner}</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function initials(name = ''){
    return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  }

  /* ---------------- Model photo resolution ----------------
     Most catalog rows are storage/colour variants that carry imageUrl:null,
     even though the MODEL itself has real photos on disk under
     assets/images/products/<slug>/1.jpg. These helpers map any product back
     to its model folder so cards (including Related products) show the real
     device photo instead of an empty placeholder. */

  // Folders that actually contain photos in assets/images/products/
  const PHOTO_MODELS = [
    'apple-iphone-15','apple-iphone-15-pro-max','apple-iphone-16-pro-max',
    'apple-iphone-17-pro','apple-iphone-17-pro-max','apple-iphone-se',
    'apple-macbook-air-m2','oneplus-12','samsung-galaxy-a15','samsung-galaxy-a36',
    'samsung-galaxy-a55','samsung-galaxy-s23-fe','samsung-galaxy-s24-ultra',
    'samsung-galaxy-s25','samsung-galaxy-s26-ultra','samsung-galaxy-watch-ultra',
    'vivo-x300-pro','xiaomi-13-pro'
  ];
  const PHOTO_SET = new Set(PHOTO_MODELS);

  function slugify(str = ''){
    return String(str).toLowerCase()
      .replace(/\(.*?\)/g, ' ')      // drop "(256GB, Blue Titanium)", "(2022)" etc.
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Base model slug for a product: "Apple iPhone 15 Pro Max (256GB, Blue)" -> apple-iphone-15-pro-max
  function modelSlug(p){
    if (!p) return '';
    const name = String(p.name || '');
    const brand = String(p.brand || '');
    const withBrand = new RegExp('^' + brand.toLowerCase().replace(/[^a-z0-9]/g,'') ) ;
    let slug = slugify(name);
    // If the name doesn't already start with the brand, prefix it (folders are brand-first)
    if (brand && !withBrand.test(slug.replace(/-/g,''))) slug = slugify(brand + ' ' + name);
    return slug;
  }

  // Longest-prefix match against the folders we actually have photos for
  function photoFolder(p){
    const slug = modelSlug(p);
    if (!slug) return null;
    if (PHOTO_SET.has(slug)) return slug;
    let best = null;
    for (const m of PHOTO_MODELS){
      if (slug.startsWith(m + '-') && (!best || m.length > best.length)) best = m;
    }
    return best;
  }

  // Main entry point: always returns something displayable for a product card.
  function productImage(p){
    if (!p) return deviceImage('phone');
    if (p.imageUrl) return assetSrc(p.imageUrl);
    if (p.images && p.images.length) return assetSrc(p.images[0]);
    const folder = photoFolder(p);
    if (folder) return assetSrc('assets/images/products/' + folder + '/1.jpg');
    return deviceImage(p.type, '#e0a458');
  }

  // True only when a real photo file backs this product (used to rank Related products)
  function hasRealPhoto(p){
    return !!(p && (p.imageUrl || (p.images && p.images.length) || photoFolder(p)));
  }

  // Resolves a stored asset path (e.g. product.imageUrl = 'assets/images/products/x.jpg')
  // against the current page's ROOT_PREFIX ('' at site root, '../' inside /pages/).
  // Absolute URLs (http/https/data/blob) and paths already starting with '/' or the
  // prefix are left untouched, so this is safe to call on every image/video path.
  function assetSrc(path){
    if (!path) return path;
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('/')) return path;
    const prefix = (typeof ROOT_PREFIX !== 'undefined' ? ROOT_PREFIX : '');
    if (prefix && path.startsWith(prefix)) return path;
    return prefix + path;
  }

  // Turns a normal Instagram Reel link (…/reel/XXXX/ or …/reels/XXXX/, with
  // or without query params) into the public embeddable iframe URL. Returns
  // null if the string doesn't look like a reel link at all, so callers can
  // skip anything mistyped in SITE_CONFIG.instagramReels instead of
  // rendering a broken iframe.
  function instagramEmbedUrl(url){
    if (!url) return null;
    const m = String(url).match(/instagram\.com\/reels?\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    return `https://www.instagram.com/reel/${m[1]}/embed/`;
  }

  // Used by the payment page to decide whether tapping GPay/PhonePe/Paytm
  // should try to open the app directly (phones/tablets) or point the
  // customer at the QR code instead (desktop browsers, which have no app
  // to hand the custom URI scheme off to).
  function isMobileDevice(){
    const ua = navigator.userAgent || navigator.vendor || '';
    const uaMatch = /android|iphone|ipad|ipod|iemobile|blackberry|opera mini/i.test(ua);
    const touchAndNarrow = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && window.innerWidth <= 900;
    return uaMatch || touchAndNarrow;
  }

  return { formatINR, uid, orderId, debounce, qs, escapeHtml, formatDate, fileToBase64, isTamilNadu, isCoimbatoreDistrict, deviceImage, initials, assetSrc, slugify, modelSlug, photoFolder, productImage, hasRealPhoto, PHOTO_MODELS, isMobileDevice, instagramEmbedUrl };
})();
