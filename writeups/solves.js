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
let solvePointer = 'mouse';
solveSquares.forEach(s => {
  s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') showSolve(s); });
  s.addEventListener('focus', () => showSolve(s));
  s.addEventListener('pointerdown', e => { solvePointer = e.pointerType; });
  s.addEventListener('click', e => {
    if (solvePointer === 'mouse' || s.classList.contains('on')) return;
    e.preventDefault(); showSolve(s);
  });
});
// Rows in the 'Hardest solves' list preview the same way as their squares.
$$('.solve-list a').forEach(a => a.addEventListener('pointerenter', () => {
  const sq = solveSquares.find(s => s.getAttribute('href') === a.getAttribute('href'));
  if (sq) showSolve(sq);
}));
solveLegend.forEach(b => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  solveLegend.forEach(x => x.setAttribute('aria-pressed', on && x === b));
  solveSquares.forEach(s => s.classList.toggle('dim', on && s.dataset.cat !== b.dataset.cat));
}));
