/* ==========================================================================
   CHARGING — works out the correct charging spec for a given product.

   WHY THIS EXISTS
   The homepage used to show a hardcoded "100W Fast Charging" badge next to
   whatever phone was featured. That is wrong for most models: iPhones cap
   out around 20-27W over USB-C PD, mid-range Androids are usually 18-33W,
   and only a handful of flagships (OnePlus/Realme/iQOO/Xiaomi HyperCharge)
   actually take 80W-120W. Showing 100W on an iPhone would mislead a buyer
   into ordering the wrong charger.

   HOW IT WORKS
   Product records in data.js do not carry a wattage field, so the spec is
   resolved from the MODEL NAME using an ordered rule list. The list is
   ordered most-specific-first: "iPhone 15 Pro Max" must be tested before
   the generic "iPhone 15" rule, otherwise the generic rule would swallow it.
   The first rule whose pattern matches the name wins.

   WHAT IT RETURNS
   {
     watts,          // number, peak wired charging the phone accepts
     label,          // e.g. "20W Fast Charging"
     charger,        // the adapter a customer should buy for that phone
     port,           // connector on the phone
     inBox,          // whether a charger ships in the retail box
     note            // short buyer-facing caveat, may be empty
   }

   These figures are peak WIRED charging as published by the manufacturer for
   the Indian retail variant. Real-world speed is lower once the battery is
   warm or past ~80%. Wireless charging is deliberately not covered here.
   ========================================================================== */

const Charging = (() => {

  // Common charger recommendations, reused across rules.
  const PD20  = '20W USB-C Power Delivery adapter';
  const PD30  = '30W USB-C PD adapter';
  const PD33  = '33W USB-C adapter';
  const PD45  = '45W USB-C PD adapter';
  const PD67  = '67W USB-C adapter';
  const PD80  = '80W USB-C SuperVOOC adapter';
  const PD100 = '100W+ proprietary adapter (use the one supplied by the brand)';
  const PD120 = '120W HyperCharge adapter (brand adapter only)';

  /* Ordered rules — FIRST MATCH WINS, so specific patterns come first.
     `test` is matched against the lowercased product name. */
  const RULES = [

    /* ---------------- Apple — USB-C PD, no charger in the box ------------ */
    // Apple has never published a wattage number; these are the widely
    // measured peaks. 20W is the adapter Apple itself recommends.
    { test:/iphone\s*1[6-8]\s*pro\s*max/, watts:35, charger:PD45, port:'USB-C',
      note:'Peaks around 35W with a 45W adapter; no charger in the box.' },
    { test:/iphone\s*1[6-8]\s*pro/,       watts:30, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/iphone\s*1[6-8]/,             watts:27, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/iphone\s*15\s*pro/,           watts:27, charger:PD30, port:'USB-C',
      note:'USB-C from the 15 series onward. No charger in the box.' },
    { test:/iphone\s*15/,                 watts:20, charger:PD20, port:'USB-C',
      note:'USB-C from the 15 series onward. No charger in the box.' },
    { test:/iphone\s*1[1-4]/,             watts:20, charger:PD20, port:'Lightning',
      note:'Lightning port — needs a USB-C to Lightning cable. No charger in the box.' },
    { test:/iphone\s*(x|xr|xs)/,          watts:18, charger:PD20, port:'Lightning',
      note:'Lightning port. No charger in the box.' },
    { test:/iphone\s*se/,                 watts:20, charger:PD20, port:'Lightning',
      note:'Lightning port. No charger in the box.' },
    { test:/iphone/,                      watts:20, charger:PD20, port:'Lightning',
      note:'No charger in the box.' },

    /* ---------------- Samsung — Super Fast Charging --------------------- */
    // Samsung also ships without an adapter on most models.
    { test:/galaxy\s*s2[4-9]\s*ultra/,    watts:45, charger:PD45, port:'USB-C',
      note:'45W Super Fast Charging 2.0. No charger in the box.' },
    { test:/galaxy\s*s2[0-9]\+|galaxy\s*s2[0-9]\s*plus/, watts:45, charger:PD45, port:'USB-C',
      note:'No charger in the box.' },
    { test:/galaxy\s*s2[0-9]\s*ultra/,    watts:45, charger:PD45, port:'USB-C',
      note:'No charger in the box.' },
    { test:/galaxy\s*z\s*fold/,           watts:25, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/galaxy\s*z\s*flip/,           watts:25, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/galaxy\s*s2[0-9]/,            watts:25, charger:PD30, port:'USB-C',
      note:'25W Super Fast Charging. No charger in the box.' },
    { test:/galaxy\s*m5[0-9]|galaxy\s*f5[0-9]/, watts:45, charger:PD45, port:'USB-C' },
    { test:/galaxy\s*a5[0-9]|galaxy\s*a7[0-9]/, watts:45, charger:PD45, port:'USB-C' },
    { test:/galaxy\s*a3[0-9]/,            watts:25, charger:PD30, port:'USB-C' },
    { test:/galaxy\s*a1[0-9]|galaxy\s*m1[0-9]/, watts:15, charger:'15W USB-C adapter', port:'USB-C' },
    { test:/galaxy/,                      watts:25, charger:PD30, port:'USB-C' },

    /* ---------------- OnePlus — SUPERVOOC ------------------------------- */
    { test:/oneplus\s*1[2-9]\s*pro|oneplus\s*1[2-9]r?/, watts:100, charger:PD100, port:'USB-C',
      note:'Needs the OnePlus SUPERVOOC adapter to reach full speed.' },
    { test:/oneplus\s*11/,                watts:100, charger:PD100, port:'USB-C',
      note:'Needs the OnePlus SUPERVOOC adapter.' },
    { test:/oneplus\s*nord\s*ce/,         watts:80, charger:PD80, port:'USB-C' },
    { test:/oneplus\s*nord/,              watts:80, charger:PD80, port:'USB-C' },
    { test:/oneplus/,                     watts:80, charger:PD80, port:'USB-C' },

    /* ---------------- Xiaomi / Redmi / Poco ----------------------------- */
    { test:/xiaomi\s*1[3-9]\s*(pro|ultra)/, watts:120, charger:PD120, port:'USB-C',
      note:'120W HyperCharge — only the bundled brand adapter hits this speed.' },
    { test:/xiaomi\s*1[3-9]/,             watts:67, charger:PD67, port:'USB-C' },
    { test:/redmi\s*note\s*1[3-9]\s*pro/, watts:67, charger:PD67, port:'USB-C' },
    { test:/redmi\s*note\s*1[3-9]/,       watts:33, charger:PD33, port:'USB-C' },
    { test:/redmi\s*note\s*1[0-2]\s*pro/, watts:67, charger:PD67, port:'USB-C' },
    { test:/redmi\s*note/,                watts:33, charger:PD33, port:'USB-C' },
    { test:/poco\s*[fx]\d/,               watts:67, charger:PD67, port:'USB-C' },
    { test:/poco/,                        watts:33, charger:PD33, port:'USB-C' },
    { test:/redmi/,                       watts:18, charger:'18W USB-C adapter', port:'USB-C' },
    { test:/xiaomi/,                      watts:33, charger:PD33, port:'USB-C' },

    /* ---------------- Vivo / iQOO --------------------------------------- */
    { test:/iqoo\s*\d+\s*pro/,            watts:120, charger:PD120, port:'USB-C',
      note:'120W FlashCharge — brand adapter only.' },
    { test:/iqoo/,                        watts:80, charger:PD80, port:'USB-C' },
    { test:/vivo\s*x\d+\s*pro/,           watts:100, charger:PD100, port:'USB-C',
      note:'100W FlashCharge — brand adapter only.' },
    { test:/vivo\s*x\d+/,                 watts:80, charger:PD80, port:'USB-C' },
    { test:/vivo\s*v\d+/,                 watts:80, charger:PD80, port:'USB-C' },
    { test:/vivo\s*t\d+/,                 watts:44, charger:PD45, port:'USB-C' },
    { test:/vivo\s*y\d+/,                 watts:18, charger:'18W USB-C adapter', port:'USB-C' },
    { test:/vivo/,                        watts:44, charger:PD45, port:'USB-C' },

    /* ---------------- Oppo / Realme ------------------------------------- */
    { test:/oppo\s*find\s*x/,             watts:100, charger:PD100, port:'USB-C',
      note:'SUPERVOOC — brand adapter only.' },
    { test:/oppo\s*reno\s*\d+\s*pro/,     watts:80, charger:PD80, port:'USB-C' },
    { test:/oppo\s*reno/,                 watts:67, charger:PD67, port:'USB-C' },
    { test:/oppo\s*f\d+/,                 watts:67, charger:PD67, port:'USB-C' },
    { test:/oppo\s*a\d+/,                 watts:33, charger:PD33, port:'USB-C' },
    { test:/oppo/,                        watts:67, charger:PD67, port:'USB-C' },
    { test:/realme\s*gt/,                 watts:100, charger:PD100, port:'USB-C',
      note:'SUPERVOOC — brand adapter only.' },
    { test:/realme\s*\d+\s*pro/,          watts:67, charger:PD67, port:'USB-C' },
    { test:/realme\s*narzo/,              watts:33, charger:PD33, port:'USB-C' },
    { test:/realme\s*c\d+/,               watts:18, charger:'18W USB-C adapter', port:'USB-C' },
    { test:/realme/,                      watts:33, charger:PD33, port:'USB-C' },

    /* ---------------- Others -------------------------------------------- */
    { test:/pixel\s*\d+\s*pro/,           watts:30, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/pixel/,                       watts:27, charger:PD30, port:'USB-C',
      note:'No charger in the box.' },
    { test:/nothing\s*phone/,             watts:45, charger:PD45, port:'USB-C',
      note:'No charger in the box.' },
    { test:/motorola|moto\s*(g|e|edge)/,  watts:33, charger:PD33, port:'USB-C' },
    { test:/infinix|tecno/,               watts:45, charger:PD45, port:'USB-C' },
    { test:/lava/,                        watts:18, charger:'18W USB-C adapter', port:'USB-C' },
    { test:/honor|huawei/,                watts:66, charger:PD67, port:'USB-C' },
    { test:/nokia/,                       watts:20, charger:PD20, port:'USB-C' }
  ];

  // Brands that ship the retail box WITHOUT a charger in India.
  const NO_CHARGER_BRANDS = /apple|samsung|google|nothing/i;

  /**
   * Resolve the charging spec for a product.
   * Returns null for anything that is not a phone, since laptops, watches
   * and accessories have their own very different charging stories.
   */
  function forProduct(p){
    if (!p) return null;
    if (p.type && p.type !== 'phone') return null;
    if (p.category && !/mobile/.test(p.category)) return null;

    const name = String(p.name || '').toLowerCase();
    const rule = RULES.find(r => r.test.test(name));
    if (!rule) return null;

    const inBox = !NO_CHARGER_BRANDS.test(p.brand || name);

    return {
      watts:   rule.watts,
      label:   `${rule.watts}W Fast Charging`,
      charger: rule.charger,
      port:    rule.port,
      inBox,
      note:    rule.note || (inBox ? '' : 'No charger in the box.')
    };
  }

  /** Short one-line summary used on cards and badges. */
  function labelFor(p){
    const c = forProduct(p);
    return c ? c.label : null;
  }

  return { forProduct, labelFor, RULES };
})();
