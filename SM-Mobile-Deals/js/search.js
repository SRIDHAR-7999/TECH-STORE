/* ==========================================================================
   SEARCH — keyword / category / brand / price filtering used by the
   products page and the header search box (with live suggestions)
   ========================================================================== */

const Search = (() => {

  function matches(product, keyword){
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    return product.name.toLowerCase().includes(k) ||
           product.brand.toLowerCase().includes(k) ||
           product.category.toLowerCase().includes(k) ||
           (product.specs || []).some(s => s.toLowerCase().includes(k));
  }

  function filter(products, { keyword = '', category = '', brand = '', minPrice = 0, maxPrice = Infinity, sort = '' } = {}){
    let list = products.filter(p =>
      matches(p, keyword) &&
      (!category || p.category === category) &&
      (!brand || p.brand === brand) &&
      p.price >= minPrice && p.price <= maxPrice
    );
    switch(sort){
      case 'price-asc': list.sort((a,b) => a.price - b.price); break;
      case 'price-desc': list.sort((a,b) => b.price - a.price); break;
      case 'rating': list.sort((a,b) => b.rating - a.rating); break;
      case 'newest': list.sort((a,b) => (b.id > a.id ? 1 : -1)); break;
      default: break;
    }
    return list;
  }

  // Live suggestion dropdown wired to the header search input
  function attachHeaderSearch(inputEl, panelEl){
    if (!inputEl || !panelEl) return;
    const run = Utils.debounce(() => {
      const val = inputEl.value.trim();
      if (!val){ panelEl.innerHTML = ''; panelEl.style.display = 'none'; return; }
      const results = filter(DB.getProducts(), { keyword: val }).slice(0, 6);
      if (!results.length){
        panelEl.innerHTML = `<div style="padding:14px;color:var(--text-faint);font-size:13px;">No products found for "${Utils.escapeHtml(val)}"</div>`;
      } else {
        panelEl.innerHTML = results.map(p => `
          <a href="${UI.link('pages/product-details.html?id=' + p.id)}" class="search-result-item" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;">
            <img src="${Utils.deviceImage(p.type, p.color)}" style="width:34px;height:34px;object-fit:contain;">
            <div><div style="font-size:13.5px;font-weight:600;">${Utils.escapeHtml(p.name)}</div>
            <div style="font-size:12px;color:var(--text-faint);font-family:var(--font-mono);">${Utils.formatINR(p.price)}</div></div>
          </a>`).join('');
      }
      panelEl.style.display = 'block';
    }, 200);
    inputEl.addEventListener('input', run);
    inputEl.addEventListener('focus', run);
    document.addEventListener('click', (e) => {
      if (!panelEl.contains(e.target) && e.target !== inputEl) panelEl.style.display = 'none';
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && inputEl.value.trim()){
        window.location.href = UI.link('pages/products.html?q=' + encodeURIComponent(inputEl.value.trim()));
      }
    });
  }

  return { filter, matches, attachHeaderSearch };
})();
