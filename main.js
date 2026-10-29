// Theodore Garcia portfolio: intro, character palettes, card hand, synthesized SFX.
// All content lives in index.html; this file only adds behavior, so the page still works without JS.
window.TG_OK = true;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Preferences (localStorage can throw in private mode) ---------- */
const prefs = (() => { try { return JSON.parse(localStorage.getItem('tg-prefs')) || {}; } catch { return {}; } })();
function save(key, val) {
  prefs[key] = val;
  try { localStorage.setItem('tg-prefs', JSON.stringify(prefs)); } catch {}
}
const calm = () => root.classList.contains('simple') || root.classList.contains('reduced');

/* ---------- Sound: Kenney CC0 card samples, with a synthesized fallback ----------
   On for every visitor by default. Browsers block audio until the first user gesture
   (a click, tap or key press), so the engine unlocks itself on that first gesture.
   - Sample files download immediately, so they're ready by the first click.
   - Nothing is scheduled while audio is suspended, so sounds never pile up and burst out later.
   - Sounds are panned left/right to match where the element sits on screen, with slight
     random pitch, so repeated hovers don't sound robotic.
   - If a browser can't decode .ogg (older Safari), the synth versions play instead. */
const SAMPLES = {
  hover: ['card-slide-1', 'card-slide-2', 'card-slide-3'],
  deal: ['card-place-1', 'card-place-2', 'card-place-3'],
  card: ['card-shove-1'],
  proceed: ['card-shove-2'],
  select: ['chip-lay-1'],
  chime: ['card-fan-1'],
  gong: ['card-shuffle', 'cards-pack-open-1'],
  flip: ['card-fan-2'],
  tick: ['chips-handle-1', 'chips-handle-2'],
  toggle: ['chips-stack-1', 'chips-stack-2'],
  coin: ['chips-collide-1', 'chips-collide-2'],
  nav: ['cards-pack-take-out-1'],
  section: ['card-slide-4', 'card-slide-5'],
  shuffle: ['card-shuffle'],
};
const sfx = (() => {
  // "sfx" replaces the old "sound" key: earlier builds saved sound=false for visitors who
  // skipped the intro, which left SFX off for them forever.
  let ctx = null, noise = null, master = null, send = null, on = prefs.sfx ?? true;
  const names = [...new Set(Object.values(SAMPLES).flat())];
  const raw = {}, buffers = {}, lastAt = {};
  const fetched = Promise.all(names.map(async n => {
    try { const r = await fetch(`audio/${n}.ogg`); if (r.ok) raw[n] = await r.arrayBuffer(); } catch {}
  }));
  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      // Master bus with a gentle compressor so overlapping sounds never clip.
      master = ctx.createDynamicsCompressor();
      master.threshold.value = -14; master.ratio.value = 4;
      master.connect(ctx.destination);
      // A little room reverb on every sound so they all sit in the same space (a stone hall, StS-ish).
      const len = ctx.sampleRate * 1.3, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const ch = ir.getChannelData(c);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
      }
      const verb = ctx.createConvolver(), wet = ctx.createGain();
      verb.buffer = ir; wet.gain.value = 0.16;
      verb.connect(wet).connect(master);
      send = verb;
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      fetched.then(() => names.forEach(n => {
        if (raw[n]) ctx.decodeAudioData(raw[n]).then(b => { buffers[n] = b; }, () => {});
      }));
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  }
  // Any first gesture unlocks audio; kept on (cheap) because iOS can suspend it again later.
  ['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  });
  // Try to start audio right away: browsers that already trust this site (you've interacted
  // with it before) allow it, so the loading-screen shuffle can play. Otherwise this waits
  // quietly for the first click, tap or key press.
  if (on) unlock();
  const ready = () => on && ctx && ctx.state === 'running';

  // gain -> (stereo pan) -> master
  function out(gain, pan = 0) {
    const g = ctx.createGain(); g.gain.value = gain;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, pan));
      g.connect(p).connect(master);
      if (send) p.connect(send);
    } else { g.connect(master); if (send) g.connect(send); }
    return g;
  }
  // Plays a random decoded sample for `kind`; returns false so callers can fall back to synth.
  function sample(kind, { gain = 0.6, delay = 0, pan = 0, rate = 1 } = {}) {
    const pick = SAMPLES[kind].filter(n => buffers[n]);
    if (!pick.length) return false;
    const s = ctx.createBufferSource();
    s.buffer = buffers[pick[Math.floor(Math.random() * pick.length)]];
    s.playbackRate.value = rate * (0.95 + Math.random() * 0.1);  // slight pitch variety, like StS
    s.connect(out(gain, pan));
    s.start(ctx.currentTime + delay);
    return true;
  }
  function env(g, t, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // Band-passed noise sweeping between two frequencies: the "whoosh" of a card.
  function whoosh(dur, f0, f1, peak, delay = 0, pan = 0) {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, peak, dur);
    src.connect(f).connect(g).connect(out(1, pan));
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, peak, type = 'sine', delay = 0, slideTo, pan = 0) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain(); env(g, t, peak, dur);
    o.connect(g).connect(out(1, pan)); o.start(t); o.stop(t + dur + 0.05);
  }
  // Rate-limit per sound so fast mouse movement doesn't machine-gun the same effect.
  const throttled = (kind, ms) => { const n = performance.now(); if (n - (lastAt[kind] || 0) < ms) return true; lastAt[kind] = n; return false; };
  const play = fn => (...a) => { if (ready()) try { fn(...a); } catch {} };
  return {
    get on() { return on; },
    set on(v) { on = v; if (v) unlock(); },
    // pan: -1 (left) .. 1 (right), usually from panOf(element)
    hover: play((pan = 0) => { if (!throttled('hover', 160)) sample('hover', { gain: 0.2, pan }) || whoosh(0.07, 4200, 2600, 0.05, 0, pan); }),
    flip: play((pan = 0) => { if (!throttled('flip', 120)) sample('flip', { gain: 0.45, pan, rate: 1.1 }) || whoosh(0.12, 2500, 5200, 0.1, 0, pan); }),
    tick: play((pan = 0) => { if (!throttled('tick', 60)) sample('tick', { gain: 0.28, pan, rate: 1.15 }) || tone(1800, 0.04, 0.05, 'triangle', 0, null, pan); }),
    // Switches click up in pitch when turned on and down when turned off.
    toggle: play((v) => sample('toggle', { gain: 0.5, rate: v === undefined ? 1 : v ? 1.15 : 0.85 }) || tone(v === false ? 330 : 440, 0.12, 0.1, 'triangle')),
    nav: play(() => sample('nav', { gain: 0.55 }) || whoosh(0.2, 1200, 3800, 0.12)),
    coin: play((pan = 0) => { sample('coin', { gain: 0.6, pan }) || tone(1320, 0.3, 0.08, 'triangle', 0, null, pan); tone(1568, 0.5, 0.05, 'sine', 0.06, null, pan); }),
    // Two-note coin blip for the social tiles' shine sweep.
    shine: play((pan = 0) => {
      if (throttled('shine', 150)) return;
      tone(988, 0.09, 0.035, 'square', 0, null, pan);
      tone(1319, 0.38, 0.03, 'square', 0.08, null, pan);
    }),
    // Experience details popping up: a card fan plus a soft rising note.
    popup: play((pan = 0) => { sample('flip', { gain: 0.4, pan, rate: 1.2 }) || whoosh(0.12, 2000, 5200, 0.1, 0, pan); tone(523, 0.25, 0.05, 'triangle', 0.03, 784, pan); }),
    // Little rising sparkle, for a successful copy.
    sparkle: play((pan = 0) => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 0.35, 0.035, 'triangle', i * 0.045, null, pan))),
    // Page turn for the field notes opening and closing.
    page: play((open = true) => { sample('section', { gain: 0.35, rate: open ? 1.1 : 0.9 }) || whoosh(0.18, open ? 1500 : 4000, open ? 4000 : 1500, 0.08); }),
    // Day/night switch: a bright rising pair for light mode, a low falling pair for dark mode.
    mode: play((light = true) => (light ? [659.25, 987.77] : [392, 261.63]).forEach((f, i) => tone(f, 0.6, 0.06, 'triangle', i * 0.09))),
    denied: play((pan = 0) => tone(160, 0.18, 0.25, 'square', 0, 90, pan)),
    // Quick rising pop for floating 'damage number' text.
    pop: play((pan = 0, i = 0) => tone(380 + i * 70, 0.14, 0.1, 'triangle', 0, 760 + i * 90, pan)),
    shuffle: play(() => sample('shuffle', { gain: 0.35, rate: 1.05 }) || whoosh(0.3, 2500, 1200, 0.08)),
    // Deal: each card a touch higher in pitch, like a run of cards hitting the table.
    deal: play((d = 0, i = 0, pan = 0) => sample('deal', { gain: 0.45, delay: d, pan, rate: 0.92 + Math.min(i, 14) * 0.018 }) || whoosh(0.16, 3200, 900, 0.16, d, pan)),
    card: play((pan = 0) => { sample('card', { gain: 0.7, pan }) || whoosh(0.22, 900, 5000, 0.2, 0, pan); tone(150, 0.28, 0.3, 'sine', 0.12, 50, pan); }),
    // One bell per letter as G, R and C light up (rising, matches the CSS delays).
    letters: play(() => [523.25, 659.25, 783.99].forEach((f, i) => { tone(f, 0.9, 0.07, 'triangle', i * 0.35); tone(f * 2, 0.6, 0.02, 'sine', i * 0.35); })),
    chime: play(() => sample('chime', { gain: 0.6 }) || [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => tone(f, 1.1, 0.06, 'triangle', i * 0.07))),
    select: play((pan = 0) => sample('select', { gain: 0.6, pan }) || tone(220, 0.45, 0.14, 'triangle', 0, null, pan)),
    gong: play(() => { sample('gong', { gain: 0.7 }); tone(98, 2.2, 0.3); tone(196, 1.6, 0.08, 'triangle'); }),
    proceed: play(() => { sample('proceed', { gain: 0.6 }) || whoosh(0.25, 600, 2600, 0.1, 0.02); tone(90, 0.3, 0.3, 'sine', 0, 45); }),
  };
})();
// Where an element sits horizontally, as a stereo pan value (-1 left .. 1 right).
const panOf = el => { const r = el.getBoundingClientRect(); return ((r.left + r.width / 2) / innerWidth) * 2 - 1; };

/* ---------- Top bar tools ---------- */
const tSound = $('#t-sound'), tMode = $('#t-mode'), tSimple = $('#t-simple');
/* Music: CC0 loop, off by default. A saved "on" resumes on the first click (autoplay rules). */
const music = $('#music'), tMusic = $('#t-music');
let musicOn = !!prefs.music;
function fadeTo(vol) {
  const step = () => {
    const d = vol - music.volume;
    if (Math.abs(d) < 0.02) { music.volume = vol; if (!vol) music.pause(); return; }
    music.volume = Math.min(1, Math.max(0, music.volume + Math.sign(d) * 0.02));
    requestAnimationFrame(step);
  };
  step();
}
function setMusic(v) {
  musicOn = v; save('music', v); syncTools();
  if (v) { music.volume = 0; music.play().then(() => fadeTo(0.3)).catch(() => {}); }
  else fadeTo(0);
}
tMusic.onclick = () => { setMusic(!musicOn); sfx.toggle(musicOn); };
if (musicOn) addEventListener('pointerdown', () => { if (musicOn && music.paused) setMusic(true); }, { once: true });

// Settings rows show an On/Off switch driven by aria-pressed (see .settings CSS).
function syncTools() {
  tSound.setAttribute('aria-pressed', sfx.on);
  tMusic.setAttribute('aria-pressed', musicOn);
  tMode.setAttribute('aria-pressed', root.dataset.mode === 'light');
  tSimple.setAttribute('aria-pressed', root.classList.contains('simple'));
}
function setSound(v) { sfx.on = v; save('sfx', v); syncTools(); }
tSound.onclick = () => { setSound(!sfx.on); sfx.toggle(sfx.on); };
tMode.onclick = () => {
  root.dataset.mode = root.dataset.mode === 'light' ? 'dark' : 'light';
  save('mode', root.dataset.mode); sfx.mode(root.dataset.mode === 'light'); syncTools();
};
tSimple.onclick = () => {
  const s = root.classList.toggle('simple');
  root.classList.toggle('anim', !s && !root.classList.contains('reduced'));
  root.classList.add('dealt');
  $('.name').classList.add('lit');
  save('simple', s); syncTools(); layoutHand(); scatter(); sfx.toggle(s);
};
$('#t-char').onclick = () => { sfx.toggle(); toggleSettings(false); openCharSelect(); };

/* ---------- Character select ---------- */
const CHARS = {
  ironclad: ['The Ironclad', 'Crimson. Brute strength and grit, the red team favorite.'],
  silent: ['The Silent', 'Poison green. Quiet, precise, a thousand small cuts.'],
  regent: ['The Regent', 'Royal amber. Stars, crowns, and a well-governed court.'],
  necrobinder: ['The Necrobinder', 'Bone and rose. Patient, and very hard to kill.'],
  defect: ['The Defect', 'Electric blue. Orbs, circuits, and cold logic.'],
};
const cs = $('#charselect'), embark = $('#cs-embark');
let picked = null, before = null, csDone = null;

function setChar(c) { if (c) root.dataset.char = c; else delete root.dataset.char; }
function openCharSelect() {
  cs.hidden = false; cs.classList.remove('out');
  picked = before = root.dataset.char || null;
  $$('.cs-pick', cs).forEach(b => b.setAttribute('aria-pressed', b.dataset.char === picked));
  showChar(picked);
  ($(`.cs-pick[data-char="${picked}"]`, cs) || $('.cs-pick', cs)).focus();
  return new Promise(r => { csDone = r; });
}
function showChar(c) {
  $('#cs-name').innerHTML = c ? CHARS[c][0] : '&nbsp;';
  $('#cs-blurb').textContent = c ? CHARS[c][1] : 'Select a character below.';
  embark.disabled = !c;
}
async function closeCharSelect() {
  cs.classList.add('out');
  await wait(450);
  cs.hidden = true;
  if (csDone) { csDone(); csDone = null; }
}
cs.addEventListener('click', e => {
  const b = e.target.closest('.cs-pick');
  if (!b) return;
  picked = b.dataset.char;
  setChar(picked); // live preview
  $$('.cs-pick', cs).forEach(x => x.setAttribute('aria-pressed', x === b));
  showChar(picked); sfx.select(panOf(b));
});
embark.onclick = () => {
  save('char', picked);
  sfx.gong(); closeCharSelect();
};
$('[data-skip-char]').onclick = () => {
  setChar(null); save('char', 'none');
  closeCharSelect();
};
cs.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (prefs.char) { setChar(before); closeCharSelect(); }  // reopened from the top bar: just cancel
  else $('[data-skip-char]').click();
});

/* ---------- Loader ---------- */
const TIPS = [
  'A risk with no owner is a risk nobody is managing.',
  'Likelihood times impact. Score it, then sort it.',
  'One framework rarely covers everything. Map your controls across several.',
  'Hardcoded credentials are a gift to the next attacker.',
  'Evidence or it did not happen. Auditors agree.',
  'Check the .git folder. Someone always forgets the .git folder.',
];
function imgReady(img) {
  if (img.complete) return Promise.resolve();
  return new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); });
}
function runLoader() {
  const el = $('#loader');
  $('#loader-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  let skip;
  const skipped = new Promise(r => { skip = r; });
  $('[data-skip-intro]', el).onclick = skip;
  const onKey = e => { if (e.key === 'Escape') skip(); };
  addEventListener('keydown', onKey);
  // Deck-shuffle sound in time with the riffling cards (plays once audio is allowed).
  sfx.shuffle();
  const shuffling = setInterval(() => sfx.shuffle(), 1100);
  const loaded = Promise.all([document.fonts.ready, imgReady($('.hero-photo')), wait(2300)]);
  return Promise.race([loaded, skipped, wait(6000)]).then(async () => {
    clearInterval(shuffling);
    removeEventListener('keydown', onKey);
    el.classList.add('out');
    await wait(450);
    root.classList.remove('intro');
  });
}

/* ---------- Hero: deal the floating cards, then light the G, R and C hidden in "GARCIA" ---------- */
function reveal() {
  scatter();  // layout is final by now; place cards right before they deal in
  sfx.flip();  // card-fan flourish as the deck opens
  [...$$('.token'), ...$$('.hand .card')].forEach((c, i) => { c.style.setProperty('--i', i); sfx.deal(0.6 + i * 0.07, i, panOf(c)); });
  root.classList.add('dealt');
  setTimeout(() => { $('.name').classList.add('lit'); sfx.letters(); }, 1500);
  setTimeout(() => sfx.chime(), 2600);
}

/* ---------- Floating logos: evenly spread, randomly placed ----------
   Each side of the photo is split into a grid with one cell per logo (plus spares).
   Every logo gets its own cell and a random spot inside it, so the layout looks
   scattered but logos never bunch up or overlap. */
const stage = $('.stage'), floaters = $$('.floater');
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function scatter() {
  floaters.forEach(f => {
    f.style.setProperty('--r', `${rand(-9, 9).toFixed(1)}deg`);
    f.style.setProperty('--dur', `${rand(3.8, 6.5).toFixed(2)}s`);   // each logo bobs on its own timer
    f.style.setProperty('--del', `${rand(-6, 0).toFixed(2)}s`);
  });
  // Follow whatever layout the CSS actually applied; on tablet/phone the logos sit in a grid.
  if (getComputedStyle(floaters[0]).position !== 'absolute') {
    floaters.forEach(f => {
      f.style.setProperty('--dx', `${rand(-8, 8).toFixed(0)}px`);
      f.style.setProperty('--dy', `${rand(-4, 12).toFixed(0)}px`);
    });
    return;
  }
  const W = stage.clientWidth, H = stage.clientHeight;
  const size = floaters[0].offsetWidth;                         // logo box (square)
  const photoW = $('.hero-photo').offsetWidth * 0.84;           // keep the face and torso clear
  const side = Math.max(size, (W - photoW) / 2 - 16);
  const half = Math.ceil(floaters.length / 2);
  [floaters.slice(0, half), floaters.slice(half)].forEach((group, z) => {
    const cols = side >= size * 2.1 ? 2 : 1;
    const rows = Math.ceil(group.length / cols);
    const cw = side / cols, chh = (H - 20) / rows;
    const cells = shuffle([...Array(cols * rows).keys()]);
    const x0 = z ? W - side : 0;
    group.forEach((f, i) => {
      const c = cells[i], col = c % cols, row = Math.floor(c / cols);
      // Columns are staggered by half a cell so the two columns don't form neat rows.
      const stagger = col % 2 ? chh * 0.35 : 0;
      const x = x0 + col * cw + rand(0, Math.max(0, cw - size));
      const y = 10 + Math.min(H - size - 10, row * chh + stagger + rand(0, Math.max(0, chh - size) * 0.8));
      f.style.setProperty('--x', `${x.toFixed(0)}px`);
      f.style.setProperty('--y', `${y.toFixed(0)}px`);
    });
  });
}
// Floating logos are plain links to their section; just add the card-play sound.
floaters.forEach(f => f.addEventListener('click', () => sfx.card(panOf(f))));

// Re-scatter whenever the stage's real size changes (window resize, fonts settling, zoom).
let resizeT, lastW = 0;
new ResizeObserver(([e]) => {
  const w = Math.round(e.contentRect.width);
  if (w === lastW) return;
  lastW = w;
  clearTimeout(resizeT); resizeT = setTimeout(scatter, 120);
}).observe(stage);

// Floating embers, like the StS main menu.
function embers() {
  const box = $('.embers');
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('i');
    e.style.left = `${Math.random() * 100}%`;
    e.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    e.style.animationDuration = `${7 + Math.random() * 8}s`;
    e.style.animationDelay = `${-Math.random() * 12}s`;
    box.append(e);
  }
}

/* ---------- Hand: fan layout, neighbor push, play animation ---------- */
const hand = $('.hand'), handCards = $$('.card', hand);
function layoutHand() {
  const n = handCards.length, cw = handCards[0].offsetWidth;
  const step = Math.min(cw * 0.94, (hand.clientWidth - cw - 32) / (n - 1));  // little overlap so every card reads
  handCards.forEach((c, i) => {
    const t = i - (n - 1) / 2;
    c.style.setProperty('--x', `${t * step}px`);
    c.style.setProperty('--r', `${t * 4}deg`);
    c.style.setProperty('--y', `${t * t * 5}px`); // arc: outer cards sit lower
  });
}
function push(active) {
  const i = handCards.indexOf(active);
  handCards.forEach((c, j) => {
    const d = j - i;
    c.style.setProperty('--push', i < 0 || d === 0 ? '0px' : `${Math.sign(d) * Math.max(0, 46 - Math.abs(d) * 10)}px`);
  });
}
hand.addEventListener('pointerover', e => { if (!calm()) push(e.target.closest('.card')); });
hand.addEventListener('focusin', e => { if (!calm()) push(e.target.closest('.card')); });
hand.addEventListener('pointerleave', () => push(null));
hand.addEventListener('focusout', () => push(null));
hand.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  e.preventDefault();
  const target = $(card.hash);
  const go = () => {
    target.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' });
    $('h2', target).focus({ preventScroll: true });
    history.replaceState(null, '', card.hash);
  };
  sfx.card(panOf(card));
  if (calm()) return go();
  card.classList.add('playing');
  setTimeout(go, 380);
  setTimeout(() => card.classList.remove('playing'), 900);
});
addEventListener('resize', layoutHand);

/* ---------- Section cards: "card reward" reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  });
}, { threshold: 0.35 });
$$('.sec .card, .prow, .stop, .sec-head').forEach(c => io.observe(c));

/* ---------- Proceed button: optional, the page also scrolls normally ---------- */
const sections = $$('main > section'), proceed = $('#proceed');
function nextSection() {
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) return null;
  return sections.find(s => s.getBoundingClientRect().top > 70);
}
proceed.onclick = () => {
  sfx.proceed();
  (nextSection() || sections[0]).scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' });
};
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    $('span', proceed).textContent = nextSection() ? 'Proceed' : 'Return';
    updateFloor();
    ticking = false;
  });
}, { passive: true });

/* ---------- Hover sounds: each kind of element has its own, panned to where it sits ---------- */
// Scrolling slides elements under a still mouse, which fires pointerover; that isn't a real hover.
let lastScroll = 0;
addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse' || performance.now() - lastScroll < 250) return;
  const t = e.target.closest('.floater, .tiles li, .card, .plate, .soc, .cs-pick, .tb-nav a, .prow-links a, .view-toggle button, .prow, .btile, .solve-list a, .map .node, .mnode, .notes summary');
  if (!t || t.contains(e.relatedTarget)) return;
  const pan = panOf(t);
  if (t.matches('.floater')) sfx.hover(pan);          // quiet slide; the deck flip plays on page load instead
  else if (t.matches('.soc')) sfx.shine(pan);          // coin blip as the light sweeps across the tile
  else if (t.matches('.mnode')) sfx.tick(pan);
  else if (t.matches('.tiles li, .tb-nav a, .prow-links a, .view-toggle button')) sfx.tick(pan);
  else sfx.hover(pan);
});

/* ---------- Click sounds for links and downloads ---------- */
$$('.tb-nav a').forEach(a => a.addEventListener('click', () => sfx.nav()));
$$('.prow-links a, .contact-links a:not([data-file]), .hero-actions a:not([data-file])').forEach(a =>
  a.addEventListener('click', () => sfx.select(panOf(a))));
$$('[data-file]').forEach(a => a.addEventListener('click', () =>
  a.classList.contains('missing') ? sfx.denied(panOf(a)) : sfx.coin(panOf(a))));

$$('.notes details').forEach(d => d.addEventListener('toggle', () => sfx.page(d.open)));


/* ---------- Boot ---------- */
(async function boot() {
  syncTools();
  layoutHand();
  scatter();
  if (calm()) { root.classList.add('dealt'); $('.name').classList.add('lit'); return; }
  try {
    embers();
    await runLoader();
    if (!prefs.char) await openCharSelect();
    reveal();
  } catch (err) {
    // Never leave a visitor stuck behind the intro: show the page as-is.
    root.classList.remove('intro', 'anim');
    root.classList.add('dealt');
    console.error(err);
  }
})();

/* ---------- CV / résumé buttons: disable any whose PDF isn't in /files yet ---------- */
const fileChecks = {};   // one request per file, even though each file has two buttons
$$('[data-file]').forEach(async a => {
  const url = a.getAttribute('href');
  fileChecks[url] ||= fetch(url, { method: 'HEAD' }).then(r => r.ok, () => false);
  if (await fileChecks[url]) return;
  a.classList.add('missing');
  a.setAttribute('aria-disabled', 'true');
  a.removeAttribute('download');
  a.addEventListener('click', e => e.preventDefault());
});

/* ---------- Copy-to-clipboard buttons (Discord username) ---------- */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const tip = b.dataset.tip;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.dataset.tip = 'Copied!'; sfx.sparkle(panOf(b)); }
  catch { b.dataset.tip = b.dataset.copy; sfx.denied(); }   // clipboard needs https or localhost
  setTimeout(() => { b.dataset.tip = tip; }, 1500);
}));

/* ---------- Experience: List / Map switch (remembered) ----------
   List ("compact") is the default so role, org and dates are readable at a glance. Stored under a
   new key: the old 'expView' was saved as 'map' for every past visitor, not chosen by them. */
const expMaps = $$('.map'), viewBtns = $$('.view-toggle button');
function setView(v) {
  expMaps.forEach(m => m.classList.toggle('compact', v === 'compact'));
  viewBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
  save('expLayout', v);
}
viewBtns.forEach(b => b.addEventListener('click', () => { setView(b.dataset.view); sfx.toggle(); }));
setView(prefs.expLayout === 'map' ? 'map' : 'compact');

/* ---------- Experience interactions ----------
   Map view: only the logos show. Pressing one pops its details up, one entry at a time.
   List view: each row shows role, org, dates, tags and its timeline bar; pressing it unfolds the bullets.
   A gold path fills down beside the logos as you scroll, lighting each entry it reaches. */
const stops = $$('.map .stop');
const isCompact = () => expMaps[0]?.classList.contains('compact');
stops.forEach((stop, i) => {
  const node = $('.node', stop), panel = $('.panel', stop);
  panel.id ||= `stop-${i}`;
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-controls', panel.id);
  node.setAttribute('aria-expanded', 'false');
  node.setAttribute('aria-label', `${$('h3', panel).textContent}: show details`);
});
function closeStops() {
  stops.forEach(s => { s.classList.remove('open'); $('.node', s).setAttribute('aria-expanded', 'false'); });
}
function toggleStop(stop) {
  const opening = !stop.classList.contains('open');
  closeStops();
  if (!opening) return sfx.tick(panOf(stop));
  stop.classList.add('open');
  $('.node', stop).setAttribute('aria-expanded', 'true');
  sfx.popup(panOf($('.panel', stop)));
}
document.addEventListener('click', e => {
  const stop = e.target.closest('.map .stop');
  // Compact: the whole row is the button (it only shows a name until opened). Map: the logo is.
  if (stop && isCompact()) { if (!e.target.closest('a')) toggleStop(stop); return; }
  if (e.target.closest('.map .node')) return toggleStop(stop);
  if (!e.target.closest('.map .panel') && $('.map .stop.open')) { closeStops(); sfx.tick(); }
});
document.addEventListener('keydown', e => {
  const node = e.target.closest?.('.map .node');
  if (node && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); node.click(); }
  if (e.key === 'Escape' && $('.map .stop.open')) closeStops();
});

let tracing = false;
function tracePath() {
  tracing = false;
  if (!isCompact()) return;
  const mid = innerHeight * 0.5;
  expMaps.forEach(map => {
    const list = $$(':scope > .stop', map);
    let on = 0;
    list.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) on = i; });
    list.forEach((s, i) => { s.classList.toggle('on', i === on); s.classList.toggle('seen', i < on); });
    const cur = list[on], node = $('.node', cur);
    map.style.setProperty('--fill', `${cur.offsetTop + node.offsetTop + node.offsetHeight / 2}px`);
    if (map.dataset.on !== String(on)) {
      map.dataset.on = on;
    }
  });
}
addEventListener('scroll', () => { if (!tracing) { tracing = true; requestAnimationFrame(tracePath); } }, { passive: true });
addEventListener('resize', tracePath);
viewBtns.forEach(b => b.addEventListener('click', () => { closeStops(); tracePath(); }));
tracePath();

/* ---------- CTF solves: hovering a square shows that solve; the legend highlights a category ---------- */
const solveInfo = $('.solve-info'), solveSquares = $$('.solve:not(.empty)'), solveLegend = $$('.solve-legend button');
function showSolve(s) {
  const d = s.dataset;
  solveInfo.innerHTML = `<p class="solve-kicker">${d.event}</p><h4></h4><p class="solve-meta"></p><p class="solve-trick"></p><a class="solve-read">Read the writeup <i class="ii ii-go" aria-hidden="true"></i></a>`;
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
  s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { showSolve(s); sfx.tick(panOf(s)); } });
  s.addEventListener('focus', () => showSolve(s));
  s.addEventListener('pointerdown', e => { solvePointer = e.pointerType; });
  s.addEventListener('click', e => {
    if (solvePointer === 'mouse' || s.classList.contains('on')) return;
    e.preventDefault(); showSolve(s); sfx.tick(panOf(s));
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
  sfx.toggle(on);
}));
/* ---------- Projects: relic shelf ----------
   Filter chips show only matching tiles; pressing a tile opens it full width with its details.
   Where the browser supports view transitions, tiles glide to their new spots instead of jumping. */
const tiles = $$('.shelf .prow'), chips = $$('.shelf-filters:not(.wu-filters) button');
const glide = fn => (document.startViewTransition && !calm()) ? document.startViewTransition(fn) : fn();
tiles.forEach((t, i) => {
  t.style.viewTransitionName = `proj-${i}`;
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'prow-more';
  more.textContent = 'Details';
  more.setAttribute('aria-expanded', 'false');
  $('.prow-body', t).append(more);
});
chips.forEach(c => {
  const f = c.dataset.f;
  const n = f === 'all' ? tiles.length : tiles.filter(t => t.dataset.tags.split(' ').includes(f)).length;
  c.insertAdjacentHTML('beforeend', `<span>${n}</span>`);
  c.addEventListener('click', () => glide(() => {
    chips.forEach(x => x.setAttribute('aria-pressed', x === c));
    tiles.forEach(t => { t.hidden = f !== 'all' && !t.dataset.tags.split(' ').includes(f); });
    sfx.shuffle();
  }));
});
function openTile(tile) {
  const opening = !tile.classList.contains('open');
  glide(() => tiles.forEach(t => {
    const o = t === tile && opening;
    t.classList.toggle('open', o);
    const b = $('.prow-more', t);
    b.textContent = o ? 'Close' : 'Details';
    b.setAttribute('aria-expanded', o);
  }));
  opening ? sfx.popup(panOf(tile)) : sfx.tick(panOf(tile));
}
tiles.forEach(t => t.addEventListener('click', e => {
  if (e.target.closest('a')) return;
  if (t.classList.contains('open') && !e.target.closest('.prow-more')) return;   // reading an open tile shouldn't close it
  openTile(t);
}));

/* ---------- Header: floor counter, settings menu, map ---------- */
const FLOORS = { top: 'Start', education: 'Education', experience: 'Experience', projects: 'Projects', stack: 'Stack', certifications: 'Certifications', notes: 'Writeups & Notes', contact: 'Contact' };
const floorNum = $('#floor-num'), floorName = $('#floor-name'), mapDlg = $('#mapdlg');
function currentSection() {
  let cur = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top <= 140) cur = s;
  return cur;
}
function updateFloor() {
  const s = currentSection();
  const boss = s.id === 'contact';                       // the last floor is the boss, like StS
  floorNum.textContent = boss ? 'Boss' : sections.indexOf(s) + 1;
  floorName.textContent = FLOORS[s.id] || '';
  floorNum.parentElement.classList.toggle('boss', boss);
  $$('.mnode', mapDlg).forEach(n => n.classList.toggle('here', n.hash === '#' + s.id));
}
updateFloor();

const setBtn = $('#open-settings'), setPanel = $('#settings');
function toggleSettings(open = setPanel.hidden) {
  setPanel.hidden = !open;
  setBtn.setAttribute('aria-expanded', open);
}
setBtn.addEventListener('click', e => { e.stopPropagation(); toggleSettings(); sfx.toggle(); });
document.addEventListener('click', e => { if (!setPanel.hidden && !setPanel.contains(e.target)) toggleSettings(false); });

/* Each time the map opens, the nodes land in slightly different spots (StS maps are
   generated per run). Order stays fixed: Start at the bottom, the Boss at the top. */
function layoutMap() {
  const nodes = $$('.mnode', mapDlg), n = nodes.length, pts = [];
  let side = Math.random() < 0.5 ? -1 : 1;
  nodes.forEach((m, i) => {
    const y = 7 + i * (86 / (n - 1)) + rand(-2.5, 2.5);
    let x;
    if (i === 0 || i === n - 1) x = 50 + rand(-7, 7);   // boss and start sit near the middle
    else { x = 50 + side * rand(10, 28); side = Math.random() < 0.75 ? -side : side; }
    m.style.setProperty('--x', `${x.toFixed(1)}%`);
    m.style.setProperty('--y', `${y.toFixed(1)}%`);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  $('.map-lines polyline', mapDlg).setAttribute('points', pts.join(' '));
}
function openMap() {
  toggleSettings(false);
  layoutMap();
  updateFloor();
  mapDlg.hidden = false;
  sfx.nav();
  ($('.mnode.here', mapDlg) || $('.mnode', mapDlg)).focus();
}
function closeMap() { mapDlg.hidden = true; $('#open-map').focus(); }
$('#open-map').addEventListener('click', openMap);
$('.map-close').addEventListener('click', () => { sfx.toggle(); closeMap(); });
mapDlg.addEventListener('click', e => {
  if (e.target === mapDlg) return closeMap();              // click on the backdrop
  if (e.target.closest('.mnode')) { sfx.card(); mapDlg.hidden = true; }   // link does the scrolling
});
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!mapDlg.hidden) closeMap(); toggleSettings(false); }
  if (e.key.toLowerCase() === 'm' && !e.target.closest('input, textarea') && mapDlg.hidden && document.getElementById('charselect').hidden) openMap();
});

/* ---------- Name hover: embers rise off the name (gold shimmer is CSS) ---------- */
const nameText = $('.tb-real');
const nameFx = () => ($('.tb-name').dataset.fx || '').split(' ');
nameText.addEventListener('pointerenter', () => {
  if (calm() || !nameFx().includes('shimmer')) return;
  for (let i = 0; i < 7; i++) {
    const e = document.createElement('i');
    e.className = 'name-ember';
    e.style.left = `${rand(5, 95).toFixed(0)}%`;
    e.style.setProperty('--dx', `${rand(-14, 14).toFixed(0)}px`);
    e.style.animationDelay = `${(i * 0.06).toFixed(2)}s`;
    nameText.append(e);
    setTimeout(() => e.remove(), 1400);
  }
});
$('.mono').addEventListener('pointerenter', () => { if (nameFx().includes('flip')) sfx.flip(); });

/* ---------- Big name hover: StS-style floating "damage numbers" ---------- */
const DMG = [
  ['+GRC', '#f5c542'], ['+Cloud', '#7fc0e6'], ['+AI', '#c6a6ff'], ['+3 Certs', '#f5c542'],
  ['+2 CTFs', '#ff6b57'], ['+13 Findings', '#ff6b57'], ["Dean's List ×6", '#9be38a'],
];
const bigName = $('.name');
let dmgAt = 0;
bigName.addEventListener('pointerenter', () => {
  const now = performance.now();
  if (calm() || now - dmgAt < 900) return;        // don't stack bursts if the mouse wiggles
  dmgAt = now;
  const slots = shuffle([14, 38, 62, 86]);         // spread across the name so they don't overlap
  shuffle([...DMG]).slice(0, 4).forEach(([text, color], i) => {
    const d = document.createElement('span');
    d.className = 'dmg';
    d.setAttribute('aria-hidden', 'true');
    d.textContent = text;
    d.style.setProperty('--x', `${slots[i] + rand(-5, 5)}%`);
    d.style.setProperty('--dx', `${rand(-26, 26).toFixed(0)}px`);
    d.style.setProperty('--c', color);
    d.style.animationDelay = `${i * 0.12}s`;
    bigName.append(d);
    setTimeout(() => sfx.pop((slots[i] / 50) - 1, i), i * 120);
    setTimeout(() => d.remove(), 1500 + i * 120);
  });
});

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
