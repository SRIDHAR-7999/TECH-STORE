/* ==========================================================================
   NOTIFICATIONS — lightweight toast system
   ========================================================================== */

const Notify = (() => {
  function ensureStack(){
    let stack = document.querySelector('.toast-stack');
    if (!stack){
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  const icons = { success:'fa-circle-check', error:'fa-circle-exclamation', warn:'fa-triangle-exclamation', info:'fa-circle-info' };

  function toast(message, type = 'info', duration = 3400){
    const stack = ensureStack();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return { toast };
})();
