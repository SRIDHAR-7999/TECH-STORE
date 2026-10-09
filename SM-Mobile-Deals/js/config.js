/* ==========================================================================
   CONFIG — single source of truth for shop identity, contact & payment info.
   Update values here and they flow through the entire site (footer, contact,
   payment page, chatbot, QR code, admin panel).
   ========================================================================== */

const SITE_CONFIG = {
  shopName: 'SM Mobile Deals',
  legalName: 'SM Mobiles',
  tagline: 'Coimbatore\'s trusted mobile & laptop store — online.',

  // Logo — drop your files at these paths (any size, transparent PNG/SVG recommended).
  // If a file is missing, the site quietly falls back to the icon+text mark — nothing breaks.
  logo: {
    dark: 'assets/logos/logo-dark.png',   // shown when the site is in dark mode
    light: 'assets/logos/logo-light.png'  // shown when the site is in light mode
  },
  // Real brand logos supplied by the store owner, one file per brand under
  // assets/brands/. Any brand not listed here falls back to a plain text
  // wordmark chip in the homepage brand strip (see index.html) rather than
  // a fabricated logo. Add more entries here as more files are supplied —
  // no other code needs to change.
  brandLogos: {
    Samsung: 'assets/brands/samsung.png',
    Vivo: 'assets/brands/vivo.png',
    Oppo: 'assets/brands/oppo.png',
    Xiaomi: 'assets/brands/xiaomi.png',
    Redmi: 'assets/brands/redmi.png',
    Poco: 'assets/brands/poco.png',
    Realme: 'assets/brands/realme.png',
    OnePlus: 'assets/brands/oneplus.png',
    iQOO: 'assets/brands/iqoo.png',
    Nothing: 'assets/brands/nothing.png',
    Motorola: 'assets/brands/motorola.png',
    Honor: 'assets/brands/honor.png',
    Tecno: 'assets/brands/tecno.png',
    Lava: 'assets/brands/lava.png',
    Dell: 'assets/brands/dell.png',
    Acer: 'assets/brands/acer.png',
    Asus: 'assets/brands/asus.png',
    Lenovo: 'assets/brands/lenovo.png',
    MSI: 'assets/brands/msi.png',
    Gigabyte: 'assets/brands/gigabyte.png',
    LG: 'assets/brands/lg.png',
    Razer: 'assets/brands/razer.png',
    Vaio: 'assets/brands/vaio.png',
    HP: 'assets/brands/hp.png',
    Amazfit: 'assets/brands/amazfit.png',
    Garmin: 'assets/brands/garmin.png',
    'Fire-Boltt': 'assets/brands/fireboltt.png',
    Noise: 'assets/brands/noise.png',
    boAt: 'assets/brands/boat.png',
    JBL: 'assets/brands/jbl.png',
    Mivi: 'assets/brands/mivi.png',
    Sony: 'assets/brands/sony.png',
    Zebronics: 'assets/brands/zebronics.png',
    Infinix: 'assets/brands/infinix.png'
    // All 39 catalog brands now have either a real logo here, or (Apple,
    // Google, Microsoft, Huawei) an official Font Awesome brand glyph — see
    // officialBrandIcon in index.html. SM Essentials is the store's own
    // private label, so it intentionally keeps the plain wordmark chip.
  },
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  address: 'Gandhipuram, Coimbatore - 641014, Tamil Nadu, India',
  timings: 'Mon – Sat, 10:00 AM – 11:00 PM · Sunday, Open 24 Hours',
  onlineNote: 'Online store is open 24/7 — orders welcome anytime, any day.',
  email: 'support@smmobiledeals.in',

  // Phone numbers — either can be used to reach the store or pay
  phones: ['+91 96982 60629', '+91 87606 33334'],
  whatsappNumber: '919698260629', // used to build wa.me link (no +, no spaces)

  // Payment
  upiId: 'sridharss400@oksbi',
  upiPayeeName: 'SM Mobile Deals',
  upiQrImage: 'assets/images/qr-upi-payment.jpg', // combine with ROOT_PREFIX when using
  paypalMeUsername: 'smmobiledeals', // change to the store's real paypal.me username
  codDistrict: 'Coimbatore', // COD only available within this district
  codAdvancePercent: 0.2, // 20% paid online upfront for COD orders, rest collected on delivery

  // Advance Payment option — available on every product/order, not just
  // Coimbatore/COD. Customer pays a fixed booking amount now; the rest is
  // paid separately as a balance. Courier dispatch same day only if the
  // balance clears before the cutoff time below; otherwise it moves to the
  // next day.
  advanceHoldingAmount: 1000,
  advanceBalanceCutoffHour: 18, // 6:00 PM, 24-hr clock, local time
  advanceDisclaimer: 'The ₹1,000 advance is a non-refundable booking/holding amount that reserves your order. It is not adjusted or returned if the order is later cancelled. Pay the remaining balance before 6:00 PM today for same-day courier dispatch — balance payments received after 6:00 PM will be dispatched the next day.',

  // Social — used in footer / contact / floating icons across every page
  social: {
    instagram: {
      url: 'https://www.instagram.com/sm_mobile_deals',
      handle: '@sm_mobile_deals',
      qr: 'assets/images/qr-instagram.png'
    },
    whatsapp: {
      url: 'https://wa.me/919698260629',
      qr: 'assets/images/qr-whatsapp.png'
    },
    threads: {
      url: 'https://www.threads.com/@sm_mobile_deals',
      handle: '@sm_mobile_deals',
      qr: 'assets/images/qr-threads.png'
    },
    facebook: {
      url: 'https://www.facebook.com/SriDharNaUgHt',
      handle: 'SriDharNaUgHt',
      qr: 'assets/images/qr-facebook.png'
    }
  },

  // Customer reels — real customer review videos posted on Instagram.
  // Paste the full Reel link here (either form works):
  //   https://www.instagram.com/reel/XXXXXXXXXXX/
  //   https://www.instagram.com/reels/XXXXXXXXXXX/
  // Add as many as you like, one per line. The homepage "What customers
  // say" section auto-plays through them, switching every 5 seconds —
  // nothing else on the page needs to change when you add/remove a link.
  instagramReels: [
    // First 5 — kept fixed, as requested.
    'https://www.instagram.com/reel/DaqXhwqyRDc/',
    'https://www.instagram.com/reel/DY1SwSrSeue/',
    'https://www.instagram.com/reel/DY1UP-Upmc3/',
    'https://www.instagram.com/reel/DY1GQ_2plmQ/',
    'https://www.instagram.com/reel/DY1HGDOzdcf/',
    // New batch — DU_OgqUksDW placed first per request, rest in the order sent.
    // Duplicates already in the first 5 above were skipped.
    'https://www.instagram.com/reel/DU_OgqUksDW/',
    'https://www.instagram.com/reel/Dai8Ut4z17a/',
    'https://www.instagram.com/reel/Dai6i5cS0-R/',
    'https://www.instagram.com/reel/Dai4qmqy6jh/',
    'https://www.instagram.com/reel/Dai3r4Ryxzv/',
    'https://www.instagram.com/reel/Dai2ivwSnU8/',
    'https://www.instagram.com/reel/Dai1nThz5Ak/',
    'https://www.instagram.com/reel/DaiyNl1zfnt/',
    'https://www.instagram.com/reel/DahuY04Noa6/',
    'https://www.instagram.com/reel/DacfxN2NoFq/',
    'https://www.instagram.com/reel/DY1JlzRSeii/',
    'https://www.instagram.com/reel/DXhSsUakhzt/',
    'https://www.instagram.com/reel/DWrG_IZEvzq/',
    'https://www.instagram.com/reel/DV6JeRRkl7z/',
    'https://www.instagram.com/reel/DV5TiwNkjT2/',
    'https://www.instagram.com/reel/DVBoERvktP3/',
    'https://www.instagram.com/reel/DVGn0sekp7o/',
    'https://www.instagram.com/reel/DVAMN0QEjVT/',
    'https://www.instagram.com/reel/DU-B1GSkuNU/',
    'https://www.instagram.com/reel/DU5sb5_kpLd/',
    'https://www.instagram.com/reel/DU0xR7Bklse/',
    'https://www.instagram.com/reel/DUqQXBaElxp/',
    'https://www.instagram.com/reel/DUggpv4khxO/',
    'https://www.instagram.com/reel/DUaYK0bEplG/',
    'https://www.instagram.com/reel/DUIvv0JEui2/',
    'https://www.instagram.com/reel/DUItm0eCemz/',
    'https://www.instagram.com/reel/DTXaZA4EiQ7/',
    'https://www.instagram.com/reel/DTS1n7mEg98/',
    'https://www.instagram.com/reel/DTSvuv7kvfU/',
    'https://www.instagram.com/reel/DS2emKtEsQm/',
    'https://www.instagram.com/reel/DSu0eJ_kiNR/',
    'https://www.instagram.com/reel/DSkDVFfknw8/',
    'https://www.instagram.com/reel/DSftRUxElMy/',
    'https://www.instagram.com/reel/DSfb6F_EoIu/',
    'https://www.instagram.com/reel/DSdFAj8EliD/',
    'https://www.instagram.com/reel/DSdB5AGkuDe/',
    'https://www.instagram.com/reel/DScYy-RkkWC/',
    'https://www.instagram.com/reel/DSb0iIIEhEb/',
    'https://www.instagram.com/reel/DSXsPM6kmXv/',
    'https://www.instagram.com/reel/DSVUMWrkrhF/',
    'https://www.instagram.com/reel/DLLGA83NmeV/',
    'https://www.instagram.com/reel/DSXAiTlklYB/',
    'https://www.instagram.com/reel/Dai5LkYyKZI/',
  ],

  // Admin login (demo credentials — change before real-world use)
  adminName: 'SRIDHAR',
  // Direct tracking page for ST Courier — used by the homepage "Fast Delivery"
  // card so a customer can jump straight to shipment tracking. Double-check
  // this URL against ST Courier's current site before going live; courier
  // sites occasionally restructure their tracking page path.
  // Double-check these URLs against each courier's current site before
  // going live; courier sites occasionally restructure their tracking
  // page path. trackingUrl is a template — {trackingNumber} gets replaced
  // with the actual number when a tracking link is generated.
  couriers: {
    st_courier: { name:'ST Courier', trackingUrl: 'https://www.stcourier.com/track/shipment?tracking_id={trackingNumber}' },
    bluedart: { name:'BlueDart', trackingUrl: 'https://www.bluedart.com/tracking?trackingId={trackingNumber}' }
  },
  courierTrackingUrl: 'https://www.stcourier.com/track/shipment',
  adminEmail: 'sridhariphone7@gmail.com',
  adminPassword: 'SRIDHAR7',

  currency: '₹',
  gstRate: 0.18, // shown on invoice as inclusive-of-GST note
  freeDeliveryOver: 999
};
