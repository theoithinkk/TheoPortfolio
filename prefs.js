// Runs before first paint (loaded without defer) so the saved theme/mode never flashes the wrong colors.
// Kept as a separate file instead of an inline <script> so the Content Security Policy can forbid inline JS.
(function () {
  var d = document.documentElement, p = {}, vt = null;
  try { p = JSON.parse(localStorage.getItem('tg-prefs')) || {}; } catch (e) {}
  // One-time marker left by the theme switch on the other homepage ('to-dark' when it sent us here).
  try { vt = sessionStorage.getItem('tg-vt'); sessionStorage.removeItem('tg-vt'); } catch (e) {}
  // Pages without the homepage intro (writeups, privacy) mark their script tag data-static: no intro/anim state there.
  var isStatic = document.currentScript && document.currentScript.hasAttribute('data-static');
  // Light mode on the homepage is the paper edition. Blank this page to the paper colour so nothing of it
  // paints while the browser swaps; replace() keeps / out of history, so Back never bounces through here.
  if (!isStatic && p.mode === 'light') {
    d.style.cssText = 'visibility:hidden;background:#f2ead9';
    location.replace('paper.html' + location.hash);
    return;
  }
  d.classList.add('js');
  d.dataset.mode = p.mode || 'dark';
  if (p.char && p.char !== 'none') d.dataset.char = p.char;
  if (p.simple) d.classList.add('simple');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('reduced');
  if (!isStatic && !p.simple && !d.classList.contains('reduced')) {
    d.classList.add('anim');
    // Arriving from the paper page's Dark switch: the paper is already falling away, so no loader.
    if (vt !== 'to-dark') d.classList.add('intro');
  }
  // Cross-document view transitions (style.css opts in) play only for the theme switch; every other
  // navigation between pages stays a plain page load.
  addEventListener('pagereveal', function (e) {
    var from = vt;
    vt = null;   // first reveal only: Back to this page from the bfcache gets no replay
    if (!e.viewTransition) return;
    e.viewTransition.ready.catch(function () {});   // rejects when skipped; that is expected
    if (from === 'to-dark') e.viewTransition.types.add('to-dark');
    else e.viewTransition.skipTransition();
  });
  // Safety net: if main.js never runs, drop the overlay and show everything.
  setTimeout(function () { if (!window.TG_OK) d.classList.remove('intro', 'anim'); }, 8000);
})();
