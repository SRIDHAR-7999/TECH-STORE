/* ==========================================================================
   PINCODE — looks up District/State/Area for any Indian PIN code using
   India Post's free public API (api.postalpincode.in), which covers every
   PIN code in the country. Results are cached in-memory + localStorage so
   repeat lookups (same pincode) don't re-hit the network.

   Also computes the delivery-day estimate used across checkout, product
   pages and the chatbot — single source of truth so they never disagree.
   ========================================================================== */

const Pincode = (() => {
  const CACHE_KEY = 'smd_pincode_cache';
  const memCache = new Map();

  function readCache(){
    try{ return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }catch(e){ return {}; }
  }
  function writeCache(cache){
    try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }catch(e){ /* ignore quota errors */ }
  }

  async function lookup(pin){
    pin = String(pin || '').trim();
    if (!/^\d{6}$/.test(pin)) return { ok:false, error:'Enter a valid 6-digit PIN code.' };

    if (memCache.has(pin)) return memCache.get(pin);
    const cache = readCache();
    if (cache[pin]){ memCache.set(pin, cache[pin]); return cache[pin]; }

    try{
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const top = Array.isArray(data) ? data[0] : null;
      if (!top || top.Status !== 'Success' || !top.PostOffice || !top.PostOffice.length){
        const result = { ok:false, error:'PIN code not found. Please double-check it.' };
        memCache.set(pin, result);
        return result;
      }
      const po = top.PostOffice[0];
      const result = {
        ok:true,
        pincode: pin,
        area: po.Name,
        district: po.District,
        state: po.State,
        region: po.Region
      };
      memCache.set(pin, result);
      cache[pin] = result;
      writeCache(cache);
      return result;
    }catch(err){
      return { ok:false, error:'Could not reach the PIN code lookup service. Enter your city/state manually.' };
    }
  }

  // ---- Delivery estimate tiers ----
  // Tamil Nadu (any district) -> 1 day. Neighbouring south states -> 2-3 days.
  // Rest of India -> 3-5 days depending on distance tier.
  const NEIGHBOUR_STATES = ['kerala','karnataka','andhra pradesh','telangana','puducherry'];
  const NEAR_STATES = ['maharashtra','goa','odisha'];
  // Everything else (far north/east/west) falls through to the 4-5 day tier.

  function estimateDays(state){
    const s = (state || '').trim().toLowerCase();
    if (Utils.isTamilNadu(s)) return { days:'1 day', minDays:1, maxDays:1 };
    if (NEIGHBOUR_STATES.includes(s)) return { days:'2-3 days', minDays:2, maxDays:3 };
    if (NEAR_STATES.includes(s)) return { days:'3-4 days', minDays:3, maxDays:4 };
    return { days:'4-5 days', minDays:4, maxDays:5 };
  }

  return { lookup, estimateDays };
})();
