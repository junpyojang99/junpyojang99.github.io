// Light / dark switch (the choice is remembered only in this browser)
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

// Interactive moire: twist and uniaxial strain of the second lattice, with the moire period it gives.
// Periods are 1/|dg| for the three first-order reflections, with g' = R(twist) S^-1 g and S = diag(1 + strain, 1),
// using the Fe3GaTe2 in-plane lattice constant a = 0.3986 nm (Zhang et al., Nat. Commun. 13, 5067, 2022).
(function () {
  const A = 0.3986, G = 2 / (Math.sqrt(3) * A);
  const DIRS = [30, 90, 150].map(d => d * Math.PI / 180);
  function dgs(tDeg, ePct) {
    const t = tDeg * Math.PI / 180, e = ePct / 100, c = Math.cos(t), s = Math.sin(t);
    return DIRS.map(p => {
      const gx = G * Math.cos(p), gy = G * Math.sin(p), sx = gx / (1 + e), sy = gy;
      return Math.hypot(c * sx - s * sy - gx, s * sx + c * sy - gy);
    }).sort((a, b) => b - a);
  }
  const fmt = v => v >= 100 ? String(Math.round(v)) : v >= 10 ? v.toFixed(0) : v.toFixed(1);
  document.querySelectorAll('[data-moire]').forEach(fig => {
    const svg = fig.querySelector('svg'), pat = svg.querySelector('pattern[data-layer="b"]');
    const tIn = fig.querySelector('input[data-k="t"]'), eIn = fig.querySelector('input[data-k="e"]');
    const tOut = tIn.nextElementSibling, eOut = eIn.nextElementSibling, read = fig.querySelector('.moire-read');
    function update(tDeg, ePct) {
      pat.setAttribute('patternTransform', `translate(80 60) rotate(${tDeg}) scale(${(1 + ePct / 100).toFixed(4)} 1) translate(-80 -60)`);
      tOut.textContent = tDeg.toFixed(1) + '°';
      eOut.textContent = ePct.toFixed(1) + '%';
      const d = dgs(tDeg, ePct);
      let msg;
      if (d[0] < 1e-6) msg = 'No moiré: the two lattices line up';
      else if (d[2] / d[0] < 0.2) msg = `1D moiré (stripes), fringe period ≈ ${fmt(1 / d[0])} nm`;
      else if ((d[0] - d[2]) / d[0] < 0.05) msg = `2D moiré, fringe period ≈ ${fmt(1 / d[0])} nm`;
      else msg = `Distorted 2D moiré, fringe periods ≈ ${fmt(1 / d[0])} to ${fmt(1 / d[2])} nm`;
      read.textContent = msg;
    }
    const fromInputs = () => update(parseFloat(tIn.value), parseFloat(eIn.value));
    tIn.addEventListener('input', fromInputs);
    eIn.addEventListener('input', fromInputs);
    fromInputs();
  });
})();

// Home cards: the moire lattice twists back and forth (5 to 9 degrees) while hovered; the software card redraws its
// analysis with a scan line
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const TWIST_PERIOD = 1.25;   // seconds for one 5 -> 9 -> 5 degree cycle (was 5 s)
  document.querySelectorAll('svg.moire-hover').forEach(svg => {
    const card = svg.closest('.card'), pat = svg.querySelector('pattern[data-twist]');
    if (!card || !pat) return;
    let raf = null, t0 = 0, hover = false, angle = 5;
    const set = a => pat.setAttribute('patternTransform', `rotate(${a.toFixed(3)} 80 60)`);
    function frame(now) {
      raf = null;
      if (hover) angle = 5 + 4 * (1 - Math.cos((now - t0) / 1000 * 2 * Math.PI / TWIST_PERIOD)) / 2;
      else angle += (5 - angle) * 0.12;
      set(angle);
      if (hover || Math.abs(angle - 5) > 0.01) raf = requestAnimationFrame(frame); else set(5);
    }
    card.addEventListener('mouseenter', () => { hover = true; t0 = performance.now(); if (!raf) raf = requestAnimationFrame(frame); });
    card.addEventListener('mouseleave', () => { hover = false; if (!raf) raf = requestAnimationFrame(frame); });
  });
  document.querySelectorAll('.vor-hover').forEach(art => {
    const card = art.closest('.card'), clip = art.querySelector('.vor-clip'), scan = art.querySelector('.scan');
    if (!card || !clip || !scan) return;
    let raf = null, t0 = 0;
    function frame(now) {
      const p = Math.min(1, (now - t0) / 1300), x = 160 * p;
      clip.setAttribute('width', x.toFixed(1)); scan.setAttribute('x1', x); scan.setAttribute('x2', x);
      scan.style.opacity = p < 1 ? 1 : 0;
      raf = p < 1 ? requestAnimationFrame(frame) : null;
    }
    card.addEventListener('mouseenter', () => { t0 = performance.now(); if (!raf) raf = requestAnimationFrame(frame); });
    card.addEventListener('mouseleave', () => { if (raf) cancelAnimationFrame(raf); raf = null; clip.setAttribute('width', 160); scan.style.opacity = 0; });
  });
})();

// Figures that open larger when clicked (Esc, the Close button or a click on the picture closes them)
(function () {
  const lb = document.getElementById('lightbox');
  if (!lb || typeof lb.showModal !== 'function') return;
  const big = document.createElement('img'), cap = lb.querySelector('.lb-cap');   // created here so the page has no empty <img>
  lb.prepend(big);
  document.addEventListener('click', e => {
    const z = e.target.closest('.zoom');
    if (z) {
      const i = [...z.querySelectorAll('img')].find(x => x.offsetParent !== null) || z.querySelector('img');
      big.src = i.currentSrc || i.src; big.alt = i.alt;
      const fc = z.closest('figure') && z.closest('figure').querySelector('figcaption');
      cap.innerHTML = fc ? fc.innerHTML : '';   // our own caption markup (keeps the subscripts)
      lb.showModal();
      return;
    }
    if (lb.open && (e.target === lb || e.target === big || e.target.closest('.lb-close'))) lb.close();
  });
})();

// Research card filter
document.querySelectorAll('.chips').forEach(group => {
  const grid = group.nextElementSibling;
  group.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    group.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b ? 'true' : 'false'));
    const f = b.dataset.filter;
    grid.querySelectorAll('[data-cat]').forEach(el => { el.hidden = !(f === 'all' || el.dataset.cat === f); });
  });
});
