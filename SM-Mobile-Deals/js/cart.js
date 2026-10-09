/* ==========================================================================
   CART — add / remove / update quantity / totals
   ========================================================================== */

const Cart = (() => {
  function get(){ return DB.read(DB.KEYS.cart, []); }
  function save(items){ DB.write(DB.KEYS.cart, items); document.dispatchEvent(new CustomEvent('cart:change')); }

  function add(productId, qty = 1){
    const items = get();
    const existing = items.find(i => i.id === productId);
    if (existing) existing.qty += qty;
    else items.push({ id: productId, qty });
    save(items);
  }

  function remove(productId){
    save(get().filter(i => i.id !== productId));
  }

  function setQty(productId, qty){
    const items = get();
    const item = items.find(i => i.id === productId);
    if (item){ item.qty = Math.max(1, qty); save(items); }
  }

  function clear(){ save([]); }

  function count(){ return get().reduce((s,i) => s + i.qty, 0); }

  function detailed(){
    const products = DB.getProducts();
    return get().map(i => {
      const p = products.find(p => p.id === i.id);
      return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
    }).filter(Boolean);
  }

  function subtotal(){ return detailed().reduce((s,i) => s + i.lineTotal, 0); }

  return { get, add, remove, setQty, clear, count, detailed, subtotal };
})();

/* ==========================================================================
   WISHLIST
   ========================================================================== */

const Wishlist = (() => {
  function get(){ return DB.read(DB.KEYS.wishlist, []); }
  function save(items){
    DB.write(DB.KEYS.wishlist, items);
    document.dispatchEvent(new CustomEvent('wishlist:change'));
    // Push to Supabase too (best-effort) so the admin panel can see a
    // customer's wishlist — previously this lived only in that one
    // browser's localStorage, invisible to anyone else including admin.
    if (DB.useSupabase() && typeof Auth !== 'undefined' && Auth.isLoggedIn()){
      const u = Auth.currentUser();
      if (u && u.id && u.id !== 'admin'){
        (async () => {
          try{
            await supabaseClient.from('wishlist').delete().eq('user_id', u.id);
            if (items.length) await supabaseClient.from('wishlist').insert(items.map(pid => ({ user_id:u.id, product_id:pid })));
          }catch(err){ console.warn('[Supabase] wishlist sync failed:', err.message); }
        })();
      }
    }
  }
  function has(productId){ return get().includes(productId); }
  function toggle(productId){
    let items = get();
    if (items.includes(productId)) items = items.filter(id => id !== productId);
    else items.push(productId);
    save(items);
    return items.includes(productId);
  }
  function remove(productId){ save(get().filter(id => id !== productId)); }
  function count(){ return get().length; }
  function detailed(){
    const products = DB.getProducts();
    return get().map(id => products.find(p => p.id === id)).filter(Boolean);
  }
  // Admin-only: read ANY customer's wishlist straight from Supabase (not
  // this browser's local one) for the customer detail view.
  async function detailedForUser(userId){
    if (!DB.useSupabase()) return [];
    try{
      const { data, error } = await supabaseClient.from('wishlist').select('product_id').eq('user_id', userId);
      if (error) throw error;
      const products = DB.getProducts();
      return (data || []).map(r => products.find(p => p.id === r.product_id)).filter(Boolean);
    }catch(err){ console.warn('[Supabase] detailedForUser failed:', err.message); return []; }
  }
  return { get, has, toggle, remove, count, detailed, detailedForUser };
})();

/* ==========================================================================
   COMPARE — up to 4 products side by side
   ========================================================================== */

const Compare = (() => {
  const MAX = 4;
  function get(){ return DB.read(DB.KEYS.compare, []); }
  function save(items){ DB.write(DB.KEYS.compare, items); document.dispatchEvent(new CustomEvent('compare:change')); }
  function has(productId){ return get().includes(productId); }
  function toggle(productId){
    let items = get();
    if (items.includes(productId)){ items = items.filter(id => id !== productId); }
    else{
      if (items.length >= MAX){ Notify.toast(`You can compare up to ${MAX} products at a time.`, 'warn'); return has(productId); }
      items.push(productId);
    }
    save(items);
    return has(productId);
  }
  function remove(productId){ save(get().filter(id => id !== productId)); }
  function clear(){ save([]); }
  function detailed(){
    const products = DB.getProducts();
    return get().map(id => products.find(p => p.id === id)).filter(Boolean);
  }
  return { get, has, toggle, remove, clear, detailed, MAX };
})();
