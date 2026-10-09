/* ==========================================================================
   IMAGE VIEWER — full-screen zoom/pan/edit modal, built for the admin to
   properly inspect a customer's payment screenshot before confirming or
   rejecting a payment (illegible amounts, tiny UPI reference numbers, dark
   screenshots, sideways photos, etc. are common — this makes all of that
   checkable without leaving the admin panel).

   Controls: scroll-to-zoom, drag-to-pan when zoomed, +/- zoom buttons,
   rotate left/right, brightness + contrast sliders, reset, download, close.
   ========================================================================== */

const ImageViewer = (() => {
  let state = null;

  function close(){
    const overlay = document.getElementById('iv-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', onKeydown);
    state = null;
  }

  function onKeydown(e){
    if (e.key === 'Escape') close();
  }

  function applyTransform(){
    const img = document.getElementById('iv-img');
    if (!img || !state) return;
    img.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom}) rotate(${state.rotate}deg)`;
    img.style.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%)`;
    document.getElementById('iv-zoom-label').textContent = Math.round(state.zoom * 100) + '%';
  }

  function open(url, title){
    if (!url) return;
    close(); // just in case one is already open

    state = { zoom:1, panX:0, panY:0, rotate:0, brightness:100, contrast:100 };

    const overlay = document.createElement('div');
    overlay.id = 'iv-overlay';
    overlay.innerHTML = `
      <div class="iv-toolbar">
        <span class="iv-title">${title ? Utils.escapeHtml(title) : 'Payment Screenshot'}</span>
        <div class="iv-controls">
          <button data-iv="zoom-out" title="Zoom out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
          <span id="iv-zoom-label">100%</span>
          <button data-iv="zoom-in" title="Zoom in"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
          <button data-iv="rotate-left" title="Rotate left"><i class="fa-solid fa-rotate-left"></i></button>
          <button data-iv="rotate-right" title="Rotate right"><i class="fa-solid fa-rotate-right"></i></button>
          <label class="iv-slider-label">Brightness <input type="range" id="iv-brightness" min="40" max="180" value="100"></label>
          <label class="iv-slider-label">Contrast <input type="range" id="iv-contrast" min="40" max="180" value="100"></label>
          <button data-iv="reset" title="Reset"><i class="fa-solid fa-arrows-rotate"></i></button>
          <a href="${url}" download target="_blank" rel="noopener" title="Download original"><i class="fa-solid fa-download"></i></a>
          <button data-iv="close" title="Close (Esc)"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="iv-canvas" id="iv-canvas">
        <img id="iv-img" src="${url}" alt="${title ? Utils.escapeHtml(title) : 'Payment screenshot'}" draggable="false">
      </div>
      <p class="iv-hint">Scroll to zoom · drag to pan when zoomed · Esc to close</p>`;
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);

    const canvas = document.getElementById('iv-canvas');
    const img = document.getElementById('iv-img');

    overlay.querySelectorAll('[data-iv]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.iv;
        if (action === 'zoom-in')  state.zoom = Math.min(6, state.zoom + 0.3);
        if (action === 'zoom-out') state.zoom = Math.max(0.3, state.zoom - 0.3);
        if (action === 'rotate-left')  state.rotate -= 90;
        if (action === 'rotate-right') state.rotate += 90;
        if (action === 'reset'){ state = { zoom:1, panX:0, panY:0, rotate:0, brightness:100, contrast:100 }; document.getElementById('iv-brightness').value = 100; document.getElementById('iv-contrast').value = 100; }
        if (action === 'close') { close(); return; }
        applyTransform();
      });
    });

    document.getElementById('iv-brightness').addEventListener('input', (e) => { state.brightness = e.target.value; applyTransform(); });
    document.getElementById('iv-contrast').addEventListener('input', (e) => { state.contrast = e.target.value; applyTransform(); });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.zoom = Math.max(0.3, Math.min(6, state.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
      applyTransform();
    }, { passive:false });

    // Click the dark backdrop (not the image or toolbar) to close.
    overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target === canvas) close(); });

    // Drag to pan, once zoomed in.
    let dragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
    img.addEventListener('mousedown', (e) => {
      if (state.zoom <= 1) return;
      dragging = true; startX = e.clientX; startY = e.clientY; startPanX = state.panX; startPanY = state.panY;
      img.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging || !state) return;
      state.panX = startPanX + (e.clientX - startX);
      state.panY = startPanY + (e.clientY - startY);
      applyTransform();
    });
    window.addEventListener('mouseup', () => { dragging = false; if (img) img.style.cursor = state && state.zoom > 1 ? 'grab' : 'default'; });

    applyTransform();
  }

  return { open, close };
})();
