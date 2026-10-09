/* ==========================================================================
   BRANDING — applies admin-uploaded overrides (site background photo, logo
   light/dark variants) on every page. Falls back to the built-in defaults
   (css/variables.css, config.js) whenever nothing custom has been set, so
   the site looks exactly as it does today until the admin actually
   uploads something.
   ========================================================================== */

const Branding = (() => {
  async function applyBackground(){
    const url = await Inbox.getSetting('site_background_url');
    if (url) document.documentElement.style.setProperty('--site-bg-url', `url('${url}')`);
  }

  // Returns the custom logo URL for the given theme ('light'|'dark'), or
  // null if the admin hasn't uploaded one — callers fall back to
  // SITE_CONFIG.logo in that case.
  async function customLogoUrl(theme){
    return await Inbox.getSetting(theme === 'light' ? 'logo_light_url' : 'logo_dark_url');
  }

  async function applyAll(){
    await applyBackground();
  }

  return { applyBackground, customLogoUrl, applyAll };
})();
