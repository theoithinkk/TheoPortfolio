// Homepage motion and small interactions. Loaded in <head> without defer so the .js class lands
// before first paint; everything else waits for the DOM. The page is complete without this file.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  // Safety net: if init throws, show everything rather than leave pieces hidden.
  setTimeout(function () { if (!window.VOX_OK) root.classList.remove('js'); }, 4000);

  // Theme switch with the dark homepage (/). The choice is saved under the same key prefs.js reads there
  // ('tg-prefs', mode light or dark); light on / sends visitors here before it paints. This page is the
  // light edition and never redirects. The switch on either page also leaves a one-time marker in
  // sessionStorage, so the page it opens knows to play the cross-document view transition (vox.css,
  // style.css). Every other navigation skips the transition.
  var readPrefs = function () { try { return JSON.parse(localStorage.getItem('tg-prefs')) || {}; } catch (e) { return {}; } };
  var arrival = null;
  try { arrival = sessionStorage.getItem('tg-vt'); sessionStorage.removeItem('tg-vt'); } catch (e) {}
  addEventListener('pagereveal', function (e) {
    var from = arrival;
    arrival = null;   // first reveal only: Back to this page from the bfcache gets no replay
    if (!e.viewTransition) return;
    e.viewTransition.ready.catch(function () {});   // rejects when skipped; that is expected
    if (from !== 'to-paper') return e.viewTransition.skipTransition();
    e.viewTransition.types.add('to-paper');
    root.classList.add('vt-arrive');
    ['kraft', 'grid', 'cream'].forEach(function (k) {
      var s = document.createElement('i');
      s.className = 'vt-sheet ' + k;
      document.body.appendChild(s);
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

    // Number the children of staggered groups so CSS can delay each one: calc(var(--i) * ...)
    $$('[data-stagger], .solve-grid').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });

    // Count numbers up from zero when they land (the final value is already in the HTML)
    function countUp(el) {
      var to = +el.dataset.count, t0 = performance.now();
      (function step(t) {
        var k = Math.min(1, (t - t0) / 900);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    // Reveal: add .in once, the first time each piece scrolls into view. [data-in] pieces start
    // hidden and slide in; [data-watch] blocks are always visible and only use .in to start the
    // artwork inside them (heat map, red string, count-up, solve tiles).
    var targets = $$('[data-in], [data-watch], .hl, [data-draw]');
    function reveal(el) {
      el.classList.add('in');
      if (!still) $$('[data-count]', el).forEach(countUp);
    }
    if (still || !('IntersectionObserver' in window)) targets.forEach(reveal);
    else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -12% 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }

    // Small screens: the Menu button drops the section links down as a sheet. It closes when a
    // link is chosen, on Escape, or on a tap anywhere outside the bar.
    var bar = document.querySelector('.bar'), menuBtn = document.querySelector('.menu-btn');
    if (bar && menuBtn) {
      var setMenu = function (open) {
        bar.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      menuBtn.addEventListener('click', function () { setMenu(!bar.classList.contains('open')); });
      document.addEventListener('click', function (e) {
        if (!bar.contains(e.target) || e.target.closest('.nav a')) setMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && bar.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
      });
    }

    // Footer switch: freeze the looping motion (ticker, paper jitter). Not remembered between visits.
    $$('[data-still]').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = root.classList.toggle('still');
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? 'Resume motion' : 'Pause motion';
      });
    });

    // Nav: mark the section currently on screen
    var links = $$('.nav a[href^="#"]');
    if (links.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.setAttribute('aria-current', a.hash === '#' + e.target.id ? 'true' : 'false'); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var s = document.querySelector(a.hash); if (s) spy.observe(s); });
      // the hero has no link of its own: watching it clears the mark when you scroll back to the top
      var heroSection = document.getElementById('top');
      if (heroSection) spy.observe(heroSection);
    }

    // Toast for copy feedback
    var toast = document.querySelector('.toast'), toastTimer;
    function say(msg) {
      toast.textContent = msg; toast.classList.add('show');
      clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.copy;
        (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
          .then(function () { say('Copied Discord username: ' + v); }, function () { say('Discord: ' + v); });
      });
    });

    // CTF solve grid (markup generated by tools/build_writeups.py): hover or focus a tile to
    // preview it in the side panel; legend buttons highlight one category.
    var grid = document.querySelector('.solve-grid'), info = document.querySelector('.solve-info');
    if (grid && info) {
      var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
      var show = function (sq) {
        $$('.solve.on', grid).forEach(function (s) { s.classList.remove('on'); });
        sq.classList.add('on');
        var d = sq.dataset, read = el('a', 'solve-read', 'Read the writeup ');
        read.href = sq.getAttribute('href');
        read.appendChild(el('i', 'ii ii-go')).setAttribute('aria-hidden', 'true');
        info.replaceChildren(el('p', 'solve-kicker', 'Solve'), el('h4', '', d.title), el('p', 'solve-meta', d.meta + ' · ' + d.event), el('p', '', d.trick), read);
      };
      $$('a.solve', grid).forEach(function (sq) {
        sq.addEventListener('mouseenter', function () { show(sq); });
        sq.addEventListener('focus', function () { show(sq); });
      });
      // Ranked rows preview their square too
      $$('.solve-list a').forEach(function (a) {
        var sq = grid.querySelector('a.solve[href="' + a.getAttribute('href') + '"]');
        if (sq) a.addEventListener('mouseenter', function () { show(sq); });
      });
      var btns = $$('.solve-legend button');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') !== 'true';
          btns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          grid.classList.toggle('filtering', on);
          $$('a.solve', grid).forEach(function (s) { s.classList.toggle('match', on && s.dataset.cat === b.dataset.cat); });
        });
      });
    }

    // ---------- Hero board ----------
    // Replays a one-shot CSS animation: drop the class, force a reflow, add it back.
    var replay = function (el) { el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
    // The red stamp thunks down again when clicked
    $$('.hero .stamp').forEach(function (s) { s.addEventListener('click', function () { replay(s); }); });
    // Tap the photo (or the bubble) and he says the next line
    var board = document.querySelector('.hero .collage'), photo = board && board.querySelector('.photo');
    var bubble = board && board.querySelector('.say');
    if (bubble) {
      var lines = bubble.dataset.lines.split('|'), line = 0;
      bubble.addEventListener('click', function () {
        bubble.firstElementChild.textContent = lines[line = (line + 1) % lines.length];
        replay(bubble);
      });
      if (photo) photo.addEventListener('click', function () { bubble.click(); });
    }
    // Thread: every [data-tie] piece is tied to a map pin on its own side of him. The map pins sit on
    // the board just outside his outline (shoulder, sleeve, elbow) and the thread layer is behind the
    // photo, so a thread can never cross his face. On each side the pieces are taken top to bottom and
    // shared out over the pins top to bottom, so two threads never cross. A pin hidden under a note is
    // skipped. Positions come from layout boxes (offsetLeft/Top ignore the entrance transforms), so the
    // thread is only redrawn on resize.
    var threads = board && board.querySelector('.threads');
    if (threads && photo) {
      var NS = 'http://www.w3.org/2000/svg', f = function (v) { return v.toFixed(1); };
      // [x, y] as fractions of the photo box, read off img/theodore.webp
      var spots = [[.19, .49], [.03, .66], [.015, .9], [.81, .49], [.965, .66], [.985, .9]];
      var pins = spots.map(function () { var i = document.createElement('i'); i.className = 'anchor'; return board.appendChild(i); });
      var ties = $$('[data-tie]', board).map(function (n, i) {
        var mk = function (tag, wait) {
          var e = threads.appendChild(document.createElementNS(NS, tag));
          e.setAttribute('class', tag === 'path' ? 'draw' : 'draw knot');
          e.setAttribute('pathLength', '1');
          e.style.stroke = 'var(--t-' + n.dataset.tie + ')';
          e.style.setProperty('--d', (.9 + i * .15 + wait) + 's');
          return e;
        };
        return { el: n, path: mk('path', 0), knot: mk('circle', 1.2) };
      });
      var tie = function () {
        var mid = photo.offsetLeft + photo.offsetWidth / 2;
        var at = spots.map(function (s) { return { x: photo.offsetLeft + s[0] * photo.offsetWidth, y: photo.offsetTop + s[1] * photo.offsetHeight, k: 0 }; });
        var inside = function (n, p, m) { return p.x > n.offsetLeft - m && p.x < n.offsetLeft + n.offsetWidth + m && p.y > n.offsetTop - m && p.y < n.offsetTop + n.offsetHeight + m; };
        var shown = ties.filter(function (t) { return t.el.offsetWidth; });   // pieces hidden on this screen size get no thread
        // the thread from t to a: a little slack, so it sags below the straight line between the pins
        var curve = function (t, a) {
          var cx = (t.x + a.x) / 2, cy = (t.y + a.y) / 2 + Math.hypot(a.x - t.x, a.y - t.y) * .1 + 14;
          return { d: 'M' + f(t.x) + ' ' + f(t.y) + 'Q' + f(cx) + ' ' + f(cy) + ' ' + f(a.x) + ' ' + f(a.y),
            at: function (s) { var u = 1 - s; return { x: u * u * t.x + 2 * s * u * cx + s * s * a.x, y: u * u * t.y + 2 * s * u * cy + s * s * a.y }; } };
        };
        threads.setAttribute('viewBox', '0 0 ' + board.offsetWidth + ' ' + board.offsetHeight);
        ties.forEach(function (t) { t.path.setAttribute('d', ''); t.knot.setAttribute('r', 0); t.x = t.el.offsetLeft + t.el.offsetWidth / 2; t.y = t.el.offsetTop + 1; });
        [true, false].forEach(function (left) {
          var side = function (x) { return (x < mid) === left; };
          var free = at.filter(function (a) { return side(a.x) && !shown.some(function (t) { return inside(t.el, a, 9); }); });
          if (!free.length) free = at.filter(function (a) { return side(a.x); });
          var mine = shown.filter(function (t) { return side(t.x); }).sort(function (p, q) { return p.y - q.y; });
          var pick = function (list, t, r) { return free[Math.floor(r * free.length / list.length)]; };
          // another note in the way of the thread: tie to that note's pin instead, so no thread runs under paper
          mine.forEach(function (t, r) {
            var c = curve(t, pick(mine, t, r));
            t.hit = null;
            for (var s = .15; s < .96 && !t.hit; s += .05) {
              var p = c.at(s);
              t.hit = shown.filter(function (o) { return o !== t && inside(o.el, p, 0); })[0];
            }
          });
          // the rest are shared out over the map pins, top to bottom
          var direct = mine.filter(function (t) { return !t.hit; });
          mine.forEach(function (t) {
            var a = t.hit || pick(direct, t, direct.indexOf(t));
            if (!t.hit) a.k++;
            t.path.setAttribute('d', curve(t, a).d);
            // a turn of thread round the pin, a little wider for each thread tied there
            t.knot.setAttribute('cx', f(a.x)); t.knot.setAttribute('cy', f(a.y)); t.knot.setAttribute('r', t.hit ? 5 : 3.5 + 2.5 * a.k);
          });
        });
        pins.forEach(function (p, i) { p.hidden = !at[i].k; p.style.left = f(at[i].x) + 'px'; p.style.top = f(at[i].y) + 'px'; });
      };
      tie();
      addEventListener('load', tie);
      if (document.fonts) document.fonts.ready.then(tie);   // label widths change once the fonts arrive
      addEventListener('resize', function () { requestAnimationFrame(tie); });
    }

    // Dark switch: save dark, go to the dark homepage. When the transition starts (pageswap), every hero
    // piece on screen gets a fall-N name in a shuffled order, so style.css can drop them one by one.
    // replace(): Back from / should not return to the page that was just switched away from.
    var going = false;
    $$('[data-dark]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = readPrefs();
        p.mode = 'dark';
        try { localStorage.setItem('tg-prefs', JSON.stringify(p)); } catch (e) {}
        if (!p.simple && !still) { going = true; try { sessionStorage.setItem('tg-vt', 'to-dark'); } catch (e) {} }
        location.replace('./');
      });
    });
    addEventListener('pageswap', function (e) {
      if (!e.viewTransition || !going) return;
      e.viewTransition.ready.catch(function () {});   // rejects if the browser skips it
      e.viewTransition.types.add('to-dark');
      $$('.hero-head, .collage > :not(.anchor)')
        .filter(function (el) { var r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; })
        .sort(function () { return Math.random() - .5; })
        .forEach(function (el, i) { el.style.viewTransitionName = 'fall-' + i; });
    });

    window.VOX_OK = true;
  });
})();
