/* The writeups home page (writeups/index.html): the homepage's CTF solve grid on its own.
   Hovering a square shows that solve; the legend highlights a category. Same behavior as the block in
   main.js, without the homepage's sounds. Without this file the squares are still plain links. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const solveInfo = $('.solve-info'), solveSquares = $$('.solve:not(.empty)'), solveLegend = $$('.solve-legend button');
function showSolve(s) {
  const d = s.dataset;
  solveInfo.innerHTML = '<p class="solve-kicker"></p><h4></h4><p class="solve-meta"></p><p class="solve-trick"></p><a class="solve-read">Read the writeup <i class="ii ii-go" aria-hidden="true"></i></a>';
  $('h4', solveInfo).textContent = d.title;            // textContent: never parse writeup text as HTML
  $('.solve-meta', solveInfo).textContent = d.meta;
  $('.solve-trick', solveInfo).textContent = d.trick;
  $('.solve-kicker', solveInfo).textContent = d.event;
  $('.solve-read', solveInfo).href = s.getAttribute('href');
  solveSquares.forEach(x => x.classList.toggle('on', x === s));
}
// Touch has no hover: the first tap on a square previews it, a second tap opens the writeup.
// "Already showing" is read at pointerdown: Chrome focuses a tapped link before its click, and focus
// previews it, so checking at click time would open the writeup on the first tap. Keyboard clicks (detail 0) pass.
let solvePointer = 'mouse', solveWasOn = false;
solveSquares.forEach(s => {
  s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showSolve(s); });
  s.addEventListener('focus', () => showSolve(s));
  s.addEventListener('pointerdown', e => { solvePointer = e.pointerType; solveWasOn = s.classList.contains('on'); });
  s.addEventListener('click', e => {
    if (solvePointer === 'mouse' || solveWasOn || !e.detail) return;
    e.preventDefault(); showSolve(s);
    // On a phone the panel sits under a tall grid: bring it into view so the tap visibly did something.
    solveInfo.scrollIntoView({ block: 'nearest', behavior: document.documentElement.matches('.reduced, .simple') ? 'auto' : 'smooth' });
  });
});
// Rows in the 'Hardest solves' list preview the same way as their squares.
$$('.solve-ranked a').forEach(a => a.addEventListener('pointerenter', () => {
  const sq = solveSquares.find(s => s.getAttribute('href') === a.getAttribute('href'));
  if (sq) showSolve(sq);
}));
solveLegend.forEach(b => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  solveLegend.forEach(x => x.setAttribute('aria-pressed', on && x === b));
  solveSquares.forEach(s => s.classList.toggle('dim', on && s.dataset.cat !== b.dataset.cat));
}));
