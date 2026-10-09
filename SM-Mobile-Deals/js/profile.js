/* ==========================================================================
   PROFILE — customer profile update helpers
   ========================================================================== */

const Profile = (() => {
  async function save({ name, phone, address, city, state, pincode }){
    if (!name || !name.trim()) return { ok:false, error:'Name is required.' };
    await Auth.updateProfile({
      name: name.trim(), phone: (phone||'').trim(), address: (address||'').trim(),
      city: (city||'').trim(), state: (state||'').trim(), pincode: (pincode||'').trim()
    });
    return { ok:true };
  }
  return { save };
})();
