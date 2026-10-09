/* ==========================================================================
   LOADER — initial page-loader splash + scroll-reveal animation
   ========================================================================== */

const Loader = (() => {
  /* Split the loader title into one <span> per character so each letter can
     stagger in with its own animation-delay (set via CSS custom property).
     Runs as early as possible (script is loaded in <head> before body
     paints) so the split happens before the splash is ever visible. */
  function buildTitleLetters(){
    const el = document.getElementById('pl-title');
    if (!el || el.dataset.built) return;
    const text = el.dataset.text || el.textContent || '';
    el.innerHTML = '';
    let visibleIndex = 0;
    for (const ch of text){
      const span = document.createElement('span');
      span.className = 'plc' + (ch === ' ' ? ' plsp' : '');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      if (ch !== ' '){
        span.style.animationDelay = (visibleIndex * 0.035) + 's';
        visibleIndex++;
      } else {
        span.style.animationDuration = '0s';
      }
      el.appendChild(span);
    }
    el.dataset.built = '1';
  }
  buildTitleLetters();

  function hidePageLoader(){
    const el = document.getElementById('page-loader');
    if (!el) return;
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 600);
    }, 250);
  }

  function initReveal(){
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((el, i) => {
      el.style.setProperty('--d', (Math.min(i % 6, 5) * 0.08) + 's');
      io.observe(el);
    });
  }

  return { hidePageLoader, initReveal };
})();

window.addEventListener('load', Loader.hidePageLoader);
