/* ==========================================================================
   INBOX — persistent notification bell/message-list for both customers and
   the admin (separate from Notify.toast, which is a fleeting on-screen
   toast, and separate from AdminAlerts, which is OS-level push-style alerts
   for the admin only). Also holds tiny key/value STORE SETTINGS — currently
   just the admin's uploaded signature image, used on the printable invoice.

   Falls back to a silent no-op in local-storage-only mode (no Supabase) —
   there's no cross-device inbox without a real backend to hold it.
   ========================================================================== */

const Inbox = (() => {
  function useSupabase(){ return DB.useSupabase(); }

  // ---------------- Store settings (key/value) ----------------
  async function getSetting(key){
    if (!useSupabase()) return null;
    try{
      const { data, error } = await supabaseClient.from('store_settings').select('value').eq('key', key).maybeSingle();
      if (error) throw error;
      return data ? data.value : null;
    }catch(err){ console.warn('[Inbox] getSetting failed:', err.message); return null; }
  }
  async function setSetting(key, value){
    if (!useSupabase()) return { ok:false, error:'Connect Supabase first.' };
    try{
      const { error } = await supabaseClient.from('store_settings').upsert({ key, value, updated_at:new Date().toISOString() });
      if (error) throw error;
      return { ok:true };
    }catch(err){ return { ok:false, error: err.message }; }
  }

  // ---------------- Notifications ----------------
  // Sends one to the specific customer, and one to the shared admin inbox —
  // used together whenever a payment is confirmed, so both sides get the
  // acknowledgment.
  async function sendToCustomer(userId, title, body, link){
    if (!useSupabase() || !userId) return;
    try{ await supabaseClient.from('notifications').insert({ user_id:userId, audience:'customer', title, body, link }); }
    catch(err){ console.warn('[Inbox] sendToCustomer failed:', err.message); }
  }
  async function sendToAdmin(title, body, link){
    if (!useSupabase()) return;
    try{ await supabaseClient.from('notifications').insert({ user_id:null, audience:'admin', title, body, link }); }
    catch(err){ console.warn('[Inbox] sendToAdmin failed:', err.message); }
  }

  async function listMine(){
    if (!useSupabase() || !Auth.isLoggedIn()) return [];
    const u = Auth.currentUser();
    try{
      const audience = u.role === 'admin' ? 'admin' : 'customer';
      let q = supabaseClient.from('notifications').select('*').eq('audience', audience).order('created_at', { ascending:false }).limit(25);
      if (audience === 'customer') q = q.eq('user_id', u.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }catch(err){ console.warn('[Inbox] listMine failed:', err.message); return []; }
  }

  async function markRead(id){
    if (!useSupabase()) return;
    try{ await supabaseClient.from('notifications').update({ read:true }).eq('id', id); }
    catch(err){ /* quiet */ }
  }
  async function markAllRead(ids){
    if (!useSupabase() || !ids.length) return;
    try{ await supabaseClient.from('notifications').update({ read:true }).in('id', ids); }
    catch(err){ /* quiet */ }
  }
  // Delete a single notification — works for both the admin's own inbox and
  // a customer's own inbox, RLS makes sure each can only delete their kind.
  async function deleteNotification(id){
    if (!useSupabase()) return { ok:false, error:'Connect Supabase first.' };
    try{
      const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
      if (error) throw error;
      return { ok:true };
    }catch(err){ return { ok:false, error: err.message }; }
  }
  // Clears every notification the current user (admin or customer) can see.
  async function clearAll(){
    if (!useSupabase() || !Auth.isLoggedIn()) return { ok:false, error:'Not logged in.' };
    const u = Auth.currentUser();
    try{
      const audience = u.role === 'admin' ? 'admin' : 'customer';
      let q = supabaseClient.from('notifications').delete().eq('audience', audience);
      if (audience === 'customer') q = q.eq('user_id', u.id);
      const { error } = await q;
      if (error) throw error;
      return { ok:true };
    }catch(err){ return { ok:false, error: err.message }; }
  }

  return { getSetting, setSetting, sendToCustomer, sendToAdmin, listMine, markRead, markAllRead, deleteNotification, clearAll };
})();
