/* Writeup pages: light up the step you're reading in the sidebar route, and fill the path
   up to it, like nodes being visited on the StS map. Works without this file too (plain links). */
const links = [...document.querySelectorAll('.wu-route a')];
const steps = links.map(a => document.querySelector(a.hash)).filter(Boolean);
const route = document.querySelector('.wu-route');
function mark() {
  const line = innerHeight * 0.35;
  let cur = 0;
  steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) cur = i; });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = steps.length - 1;   // bottom of the page
  links.forEach((a, i) => {
    a.classList.toggle('on', i === cur);
    a.classList.toggle('seen', i < cur);
  });
  route?.style.setProperty('--progress', steps.length > 1 ? cur / (steps.length - 1) : 1);
}
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; mark(); }); } }, { passive: true });
mark();

/* Screenshots open enlarged in place (a lightbox) instead of navigating to the image file.
   Click anywhere, press Esc or the close button to go back. Without JS the link still works. */
const box = document.createElement('div');
box.className = 'wu-lightbox';
box.hidden = true;
box.setAttribute('role', 'dialog');
box.setAttribute('aria-modal', 'true');
box.innerHTML = '<button type="button" class="wu-lightbox-close" aria-label="Close image"><i class="ii ii-x" aria-hidden="true"></i></button><img alt=""><p></p>';
document.body.append(box);
let opener = null;
function closeBox() {
  box.hidden = true;
  document.body.style.overflow = '';
  opener?.focus();
}
document.querySelectorAll('.wu-step figure a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  opener = a;
  const img = a.querySelector('img');
  box.querySelector('img').src = a.href;
  box.querySelector('img').alt = img.alt;
  box.querySelector('p').textContent = img.alt;
  box.hidden = false;
  document.body.style.overflow = 'hidden';
  box.querySelector('.wu-lightbox-close').focus();
}));
box.addEventListener('click', closeBox);
addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) closeBox(); });

/* Flag spoilers: a tap toggles the reveal (hover and focus already reveal it with a mouse or keyboard). */
document.querySelectorAll('.flag').forEach(f => f.addEventListener('click', () => f.classList.toggle('shown')));

/* Torchlight: move the background glow to the mouse (CSS draws it; off on touch and in Simple mode). */
let torchQueued = false, tx = 0, ty = 0;
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  tx = e.clientX; ty = e.clientY;
  if (torchQueued) return;
  torchQueued = true;
  requestAnimationFrame(() => {
    torchQueued = false;
    document.documentElement.style.setProperty('--mx', `${tx}px`);
    document.documentElement.style.setProperty('--my', `${ty}px`);
  });
}, { passive: true });
