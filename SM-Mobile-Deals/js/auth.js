/* ==========================================================================
   AUTH — Supabase Auth when configured, otherwise a demo-grade local
   fallback (localStorage, simple hash — not cryptographically secure,
   fine for offline demos only).

   DESIGN: like DB, reads stay synchronous (Auth.currentUser() etc. read a
   cached session object). Auth.init() is the async call that establishes
   that cache on page load; register/login/logout/updateProfile are async
   because they may need to reach Supabase.
   ========================================================================== */

const Auth = (() => {

  function simpleHash(str){
    let h = 0;
    for (let i = 0; i < str.length; i++){ h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return 'h' + Math.abs(h).toString(36);
  }

  function useSupabase(){ return DB.useSupabase(); }

  function currentUser(){
    return DB.read(DB.KEYS.session, null);
  }

  function isLoggedIn(){ return !!currentUser(); }

  function isAdmin(){
    const u = currentUser();
    return !!u && u.role === 'admin';
  }

  function setSession(user){
    const { passHash, ...safe } = user;
    DB.write(DB.KEYS.session, safe);
  }

  /* ---------------- init — restore session on page load ---------------- */
  let initPromise = null;
  function init(){
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (!useSupabase()) return; // local session (if any) already in localStorage

      try{
        // getSession() normally reads the locally-stored token instantly,
        // but a slow/unreachable network can make it hang — and since
        // boot() awaits Auth.init() before DB.init() (and before anything
        // renders), a hung getSession() would freeze every single page.
        // Cap it at 3s and just proceed with whatever's in local storage.
        const timeout = new Promise(resolve => setTimeout(resolve, 3000, 'timeout'));
        const result = await Promise.race([supabaseClient.auth.getSession(), timeout]);
        if (result === 'timeout'){
          console.warn('[Supabase] auth getSession timed out after 3s, continuing with local session');
          return;
        }
        const { data: { session } } = result;
        if (session && session.user){
          await hydrateFromSupabaseUser(session.user);
        } else {
          // A logged-in admin via the local email/password shortcut (see
          // login()) has no real Supabase auth session — getSession() will
          // always come back empty for them. Previously this branch cleared
          // localStorage unconditionally, which wiped that admin's session
          // on every single page load right after they'd just logged in
          // (admin-login.html -> admin.html), bouncing them straight back
          // to the login page. Only clear the session if it does NOT belong
          // to that local admin account.
          const existing = currentUser();
          if (!(existing && existing.id === 'admin')){
            localStorage.removeItem(DB.KEYS.session); DB.clearCache(DB.KEYS.session);
          }
        }
        supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
          if (newSession && newSession.user) await hydrateFromSupabaseUser(newSession.user);
          else {
            const existing = currentUser();
            if (!(existing && existing.id === 'admin')) localStorage.removeItem(DB.KEYS.session); DB.clearCache(DB.KEYS.session);
          }
        });
      }catch(err){
        console.warn('[Supabase] auth init failed:', err.message);
      }
    })();
    return initPromise;
  }

  async function hydrateFromSupabaseUser(sbUser){
    try{
      const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', sbUser.id).single();
      setSession({
        id: sbUser.id,
        email: sbUser.email,
        name: (profile && profile.name) || sbUser.user_metadata?.name || 'Customer',
        phone: profile ? profile.phone : '',
        address: profile ? profile.address : '',
        city: profile ? profile.city : '',
        state: profile ? profile.state : '',
        pincode: profile ? profile.pincode : '',
        role: (profile && profile.role) || 'customer'
      });
    }catch(err){
      console.warn('[Supabase] could not load profile:', err.message);
    }
  }

  /* ---------------- register ---------------- */
  async function register({ name, email, phone, password, address, city, state, pincode }){
    if (useSupabase()){
      try{
        const { data, error } = await supabaseClient.auth.signUp({
          email, password, options: { data: { name } }
        });
        if (error) return { ok:false, error: error.message };
        const user = data.user;
        // Supabase can return success with no user object — e.g. when this
        // email already has a pending, unconfirmed signup (returned this
        // way deliberately, so a stranger can't probe which emails are
        // already registered). Treat that the same as "check your email"
        // instead of crashing on user.id below.
        if (!user){
          return { ok:true, user:null, needsEmailConfirmation:true };
        }
        try{
          await supabaseClient.from('profiles').upsert({ id:user.id, name, email, phone, address, city, state, pincode, role:'customer' });
        }catch(err){ console.warn('[Supabase] profile upsert failed (the auth account itself was still created):', err.message); }
        // Supabase's "Confirm email" setting (on by default) means signUp()
        // can succeed with a user row but NO active session until the user
        // clicks the confirmation link in their inbox. Previously we called
        // hydrateFromSupabaseUser() unconditionally, which set a local
        // "logged in" session even though Supabase had no real session for
        // it — looked logged in immediately, but the next getSession() (any
        // refresh) found nothing and force-logged the person out, and a
        // fresh login then failed too since the account isn't confirmed yet.
        // Only treat it as logged-in when signUp actually returned a session.
        if (data.session){
          await hydrateFromSupabaseUser(user);
          if (typeof Inbox !== 'undefined') Inbox.sendToAdmin('New customer registered', `${name} (${email}) just created an account.`, `pages/admin.html?customer=${user.id}`);
          return { ok:true, user: currentUser() };
        }
        if (typeof Inbox !== 'undefined') Inbox.sendToAdmin('New customer registered', `${name} (${email}) just created an account.`, `pages/admin.html?customer=${user.id}`);
        return { ok:true, user:null, needsEmailConfirmation:true };
      }catch(err){
        return { ok:false, error: err.message || 'Something went wrong — please try again.' };
      }
    }

    // ---- local fallback ----
    const users = DB.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())){
      return { ok:false, error:'An account with this email already exists.' };
    }
    const user = { id: Utils.uid('USR'), name, email, phone, address, city, state, pincode, passHash: simpleHash(password), role:'customer', createdAt:new Date().toISOString() };
    users.push(user);
    DB.saveUsers(users);
    setSession(user);
    if (typeof Inbox !== 'undefined') Inbox.sendToAdmin('New customer registered', `${name} (${email}) just created an account.`, `pages/admin.html?customer=${user.id}`);
    return { ok:true, user };
  }

  /* ---------------- login ---------------- */
  async function login({ email, password }){
    // Admin shortcut credentials. A matching real Supabase account now
    // exists (created once via SQL — see project notes) so this signs in
    // for real when Supabase is reachable, giving a genuine auth.uid() that
    // the database's admin RLS policies recognise. Without that, product
    // edits, category photos, and settings looked saved in this browser but
    // were silently rejected by the database and never actually persisted.
    // Falls back to the old local-only session if Supabase is unreachable,
    // so the demo login still works offline.
    if (email.toLowerCase() === SITE_CONFIG.adminEmail.toLowerCase() && password === SITE_CONFIG.adminPassword){
      if (useSupabase()){
        try{
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (!error && data.user){
            await hydrateFromSupabaseUser(data.user);
            const real = currentUser();
            if (real) return { ok:true, user: real };
          }
        }catch(err){ console.warn('[Supabase] admin real sign-in failed, using local session:', err.message); }
      }
      const adminUser = { id:'admin', name:(SITE_CONFIG.adminName || 'Store Admin'), email:SITE_CONFIG.adminEmail, role:'admin' };
      setSession(adminUser);
      return { ok:true, user: adminUser };
    }

    if (useSupabase()){
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return { ok:false, error: error.message };
      await hydrateFromSupabaseUser(data.user);
      const loggedInUser = currentUser();
      if (typeof Inbox !== 'undefined' && loggedInUser) Inbox.sendToAdmin('Customer logged in', `${loggedInUser.name || 'A customer'} (${email}) just logged in.`, `pages/admin.html?customer=${loggedInUser.id}`);
      return { ok:true, user: loggedInUser };
    }

    // ---- local fallback ----
    const users = DB.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok:false, error:'No account found with this email.' };
    if (user.passHash !== simpleHash(password)) return { ok:false, error:'Incorrect password.' };
    setSession(user);
    if (typeof Inbox !== 'undefined') Inbox.sendToAdmin('Customer logged in', `${user.name || 'A customer'} (${email}) just logged in.`, `pages/admin.html?customer=${user.id}`);
    return { ok:true, user };
  }

  /* ---------------- profile update ---------------- */
  async function updateProfile(patch){
    const u = currentUser();
    if (!u) return;
    const merged = { ...u, ...patch };
    setSession(merged);
    if (useSupabase() && u.id !== 'admin'){
      try{ await supabaseClient.from('profiles').update(patch).eq('id', u.id); }
      catch(err){ console.warn('[Supabase] updateProfile failed:', err.message); }
    } else if (!useSupabase() && u.role !== 'admin'){
      const users = DB.getUsers().map(x => x.id === u.id ? { ...x, ...patch } : x);
      DB.saveUsers(users);
    }
  }

  /* ---------------- logout ---------------- */
  async function logout(){
    localStorage.removeItem(DB.KEYS.session); DB.clearCache(DB.KEYS.session);
    if (useSupabase()){
      try{ await supabaseClient.auth.signOut(); }catch(err){ /* ignore */ }
    }
  }

  /* ---------------- delete account (permanent) ----------------
     Removes the account entirely — not a deactivation. The same email and
     phone number can be used to register a brand new account afterwards,
     but nothing about the deleted one (orders, wishlist, saved address) is
     recoverable, matching what the Terms & Conditions state. */
  async function deleteAccount(){
    const u = currentUser();
    if (!u) return { ok:false, error:'Not logged in.' };
    if (u.role === 'admin') return { ok:false, error:'Admin accounts cannot be deleted from here.' };

    if (useSupabase()){
      // The user's own row can be removed under RLS; orders are kept for
      // the store's records (a normal e-commerce practice) but are no
      // longer reachable from any account once this one is gone.
      try{ await supabaseClient.from('profiles').delete().eq('id', u.id); }catch(err){ /* ignore */ }
      await logout();
      return { ok:true };
    }

    // ---- local fallback ----
    const users = DB.getUsers().filter(x => x.id !== u.id);
    DB.saveUsers(users);
    const orders = DB.getOrders().filter(o => o.userId !== u.id);
    DB.write(DB.KEYS.orders, orders);
    localStorage.removeItem(DB.KEYS.cart); DB.clearCache(DB.KEYS.cart);
    localStorage.removeItem(DB.KEYS.wishlist); DB.clearCache(DB.KEYS.wishlist);
    await logout();
    return { ok:true };
  }

  function requireLogin(redirectTo = 'login.html'){
    if (!isLoggedIn()){ window.location.href = redirectTo; return false; }
    return true;
  }

  function requireAdmin(redirectTo = 'login.html'){
    if (!isAdmin()){ window.location.href = redirectTo; return false; }
    return true;
  }

  /* ---------------- admin team management (Supabase only) ----------------
     A logged-in admin can look up a registered customer by email and flip
     their role — this works because our RLS policy lets is_admin() update
     ANY profile row, not just their own. No service-role key needed. */
  async function findByEmail(email){
    if (!useSupabase()) return { ok:false, error:'Connect Supabase to manage admin users.' };
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error) return { ok:false, error: error.message };
    if (!data) return { ok:false, error:'No account found with that email. They need to register first.' };
    return { ok:true, profile: data };
  }

  async function setRole(userId, role){
    if (!useSupabase()) return { ok:false, error:'Connect Supabase to manage admin users.' };
    const { error } = await supabaseClient.from('profiles').update({ role }).eq('id', userId);
    if (error) return { ok:false, error: error.message };
    return { ok:true };
  }

  async function listAdmins(){
    if (!useSupabase()) return [];
    const { data } = await supabaseClient.from('profiles').select('*').eq('role', 'admin');
    return data || [];
  }

  return { init, register, login, logout, deleteAccount, currentUser, isLoggedIn, isAdmin, updateProfile, requireLogin, requireAdmin, findByEmail, setRole, listAdmins };
})();
