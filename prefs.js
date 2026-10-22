// Runs before first paint (loaded without defer) so the saved theme/mode never flashes the wrong colors.
// Kept as a separate file instead of an inline <script> so the Content Security Policy can forbid inline JS.
(function () {
  var d = document.documentElement, p = {};
  try { p = JSON.parse(localStorage.getItem('tg-prefs')) || {}; } catch (e) {}
  d.classList.add('js');
  d.dataset.mode = p.mode || 'dark';
  if (p.char && p.char !== 'none') d.dataset.char = p.char;
  if (p.simple) d.classList.add('simple');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('reduced');
  // Pages without the homepage intro (writeups, privacy) mark their script tag data-static: no intro/anim state there.
  var isStatic = document.currentScript && document.currentScript.hasAttribute('data-static');
  if (!isStatic && !p.simple && !d.classList.contains('reduced')) d.classList.add('intro', 'anim');
  // Safety net: if main.js never runs, drop the overlay and show everything.
  setTimeout(function () { if (!window.TG_OK) d.classList.remove('intro', 'anim'); }, 8000);
})();