/* ==========================================================================
   THEME — dark/light toggle (persisted) + cursor glow micro-interaction
   ========================================================================== */

const Theme = (() => {
  const KEY = 'smd_theme';

  function get(){ return localStorage.getItem(KEY) || 'dark'; }

  function apply(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }

  function toggle(){
    apply(get() === 'dark' ? 'light' : 'dark');
  }

  function init(){
    apply(get());
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { get, apply, toggle, init };
})();
