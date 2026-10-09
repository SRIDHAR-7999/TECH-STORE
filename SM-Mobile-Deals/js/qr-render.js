/* ==========================================================================
   QR RENDER — draws a UPI payment QR entirely in the browser using the
   vendored qrcode-generator library (js/vendor/qrcode-generator.js). No
   network call, no third-party image service — the QR is generated from
   the exact UPI string locally, every time, so it never depends on an
   external API being up.

   Rendered onto a plain white canvas (no page background can show through
   it) so it stays scannable regardless of theme or page background.
   ========================================================================== */

const QRRender = (() => {
  // Renders into the given <canvas> element. Returns true on success.
  function draw(canvas, text, sizePx = 260){
    if (!canvas || !text) return false;
    try{
      const qr = qrcode(0, 'M'); // type 0 = auto-size to fit the data; M = medium error correction
      qr.addData(text);
      qr.make();

      const count = qr.getModuleCount();
      const margin = 2; // modules of quiet white border, keeps it scannable
      const cell = Math.floor(sizePx / (count + margin * 2));
      const actualSize = cell * (count + margin * 2);

      canvas.width = actualSize;
      canvas.height = actualSize;
      const ctx = canvas.getContext('2d');

      // Solid white fill first — guarantees a clean background with
      // nothing from the page showing through, on every theme.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, actualSize, actualSize);

      ctx.fillStyle = '#000000';
      for (let row = 0; row < count; row++){
        for (let col = 0; col < count; col++){
          if (qr.isDark(row, col)){
            ctx.fillRect((col + margin) * cell, (row + margin) * cell, cell, cell);
          }
        }
      }
      return true;
    }catch(err){
      console.warn('[QRRender] failed to generate QR:', err.message);
      return false;
    }
  }

  // Blink loop: visible for `visibleMs`, hidden for `hiddenMs`, repeating
  // for as long as the element stays on the page. Uses a self-scheduling
  // timeout (not setInterval) since the two phases have different durations.
  function blinkLoop(el, visibleMs = 5000, hiddenMs = 1000){
    if (!el || el.dataset.qrBlinking) return; // don't stack loops if called twice
    el.dataset.qrBlinking = '1';
    el.style.transition = 'opacity .2s ease';
    function tick(showing){
      el.style.opacity = showing ? '1' : '0.4'; // dim, never fully hide — a fully-hidden QR looks broken/empty
      setTimeout(() => tick(!showing), showing ? visibleMs : hiddenMs);
    }
    tick(true);
  }

  return { draw, blinkLoop };
})();
