/* Pushing electrons: drawing, animation and interface. */

/* ===== UI ===== */
const NS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = p => p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
const lerp = (a, b, t) => a + (b - a)*t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const svg = $('#mol');
const L = {};
['bonds', 'lp', 'charges', 'labels', 'arrows', 'elec', 'hits'].forEach(k => L[k] = el('g', {}, svg));

let cur = 0, P = null, formIdx = 0, mode = 'watch', hybrid = false, busy = false, runId = 0, speed = 1;
let V = null, sel = null, found = [], arrowObjs = [], hintMark = null;
const T = ms => ms*speed*(reduce ? .35 : 1);

function animate(dur, fn, id) {
  return new Promise(res => {
    const t0 = performance.now();
    function f(now) {
      if (id !== runId) { res(false); return; }
      const t = dur <= 0 ? 1 : Math.min(1, (now - t0)/dur);
      fn(t);
      if (t < 1) requestAnimationFrame(f); else res(true);
    }
    requestAnimationFrame(f);
  });
}

/* ---------- geometry helpers ---------- */
const nameOf = id => ELS[P.atoms[id].el][2];
const symOf = id => P.atoms[id].el;
function lpPos(id, ang, r = 16) { const A = P.atoms[id], t = ang*Math.PI/180; return {x: A.x + r*Math.cos(t), y: A.y + r*Math.sin(t)}; }
function bondMid(k) { const b = P.bonds[k], A = P.atoms[b.a], B = P.atoms[b.b]; return {x: (A.x + B.x)/2, y: (A.y + B.y)/2}; }
function nearestAngle(angles, id, pt) {
  let best = angles[0], bd = 1e9;
  for (const a of angles) { const p = lpPos(id, a), d = Math.hypot(p.x - pt.x, p.y - pt.y); if (d < bd) { bd = d; best = a; } }
  return best;
}
function resolve(ar, fa, fb) {
  const r = {from: {...ar.from}, to: {...ar.to}};
  const tg = r.to.bond ? bondMid(r.to.bond) : P.atoms[r.to.atom];
  if (r.from.lp) r.from.a = nearestAngle(fa.lpA[r.from.lp], r.from.lp, tg);
  const sp = r.from.bond ? bondMid(r.from.bond) : lpPos(r.from.lp, r.from.a);
  if (r.to.atom) {
    const now = fa.lpA[r.to.atom], nxt = fb.lpA[r.to.atom], fresh = nxt.filter(a => !now.includes(a));
    r.to.a = nearestAngle(fresh.length ? fresh : nxt, r.to.atom, sp);
  }
  return r;
}
function ptOf(s) { return s.bond ? bondMid(s.bond) : lpPos(s.lp || s.atom, s.a); }

/* ---------- text generation ---------- */
const SYM = ['', '\u2013', '=', '\u2261'];
function bstr(k, o, first) { const b = P.bonds[k]; const [x, y] = first === b.b ? [b.b, b.a] : [b.a, b.b]; return symOf(x) + SYM[o] + symOf(y); }
function stepText(ar, f) {
  if (ar.from.lp) { const k = ar.to.bond, o = f.bonds[k]; return `A lone pair on ${nameOf(ar.from.lp)} moves in to make a new π bond: ${bstr(k, o, ar.from.lp)} becomes ${bstr(k, o + 1, ar.from.lp)}.`; }
  const o = f.bonds[ar.from.bond];
  if (ar.to.bond) {
    const b1 = P.bonds[ar.from.bond], b2 = P.bonds[ar.to.bond];
    const shared = [b1.a, b1.b].find(x => x === b2.a || x === b2.b);
    return `${o === 3 ? 'One set of' : 'The'} π electrons of ${bstr(ar.from.bond, o, [b1.a, b1.b].find(x => x !== shared))} shift over to the neighboring ${bstr(ar.to.bond, f.bonds[ar.to.bond], shared)} bond.`;
  }
  const other = P.bonds[ar.from.bond].a === ar.to.atom ? P.bonds[ar.from.bond].b : P.bonds[ar.from.bond].a;
  return `${o === 3 ? 'One π bond of' : 'The π bond of'} ${bstr(ar.from.bond, o, other)} breaks, and its electrons move onto ${nameOf(ar.to.atom)} as a lone pair.`;
}
const fmtQ = q => (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '\u2212');
function chargeList(f) {
  const items = Object.entries(f.q).map(([id, q]) => `${fmtQ(q)} on ${symOf(id)}`);
  return items.length ? items.join(', ') : '';
}
function resultText(fb) {
  const tot = Object.values(fb.q).reduce((s, q) => s + q, 0);
  const cl = chargeList(fb);
  return (cl ? `Now: ${cl}.` : 'Now there are no formal charges.') + ` Total charge is still ${tot === 0 ? 'zero' : (tot > 0 ? '+' : '\u2212') + Math.abs(tot)}.`;
}
function noteFor(f, i) {
  const parts = [];
  const defs = Object.keys(P.atoms).filter(id => { const e = P.atoms[id].el; return (e === 'C' || e === 'N' || e === 'O') && electrons(P, f, id) < 8; });
  if (defs.length) parts.push(defs.map(id => { const n = nameOf(id); return n[0].toUpperCase() + n.slice(1) + ` (${chargeOrBlank(f, id)}) has only ${electrons(P, f, id)} electrons.`; }).join(' '));
  else parts.push('Every C, N and O has a full octet.');
  const cl = chargeList(f);
  parts.push(cl ? `Formal charges: ${cl}.` : 'No formal charges.');
  const custom = P.raw.notes && P.raw.notes[i];
  if (custom) parts.push(custom);
  else if (f.tag === 'equal') parts.push(P.forms.length === 2 ? 'The two contributors are equivalent, so they count equally.' : 'All the contributors are equivalent, so they count equally.');
  else if (f.tag === 'major') parts.push(P.forms.filter(g => g.tag === 'major').length > 1 ? 'This is one of the major contributors.' : 'This is the major contributor.');
  else {
    const best = P.forms.reduce((a, b) => b.score < a.score ? b : a);
    if (f.def > best.def) parts.push('Minor contributor: fewer atoms have full octets.');
    else if (f.chg > best.chg) parts.push('Minor contributor: it separates more charge.');
    else parts.push('Minor contributor: the charges sit on less suitable atoms (\u2212 prefers electronegative atoms, + prefers less electronegative ones).');
  }
  return parts.join(' ');
}
function chargeOrBlank(f, id) { const q = f.q[id]; return q ? fmtQ(q) : 'neutral'; }

/* ---------- drawing ---------- */
function setLabel(t, label) {
  let sub = false;
  for (const ch of label) {
    const ts = el('tspan', {}, t);
    if (/\d/.test(ch)) { ts.setAttribute('dy', '6'); ts.setAttribute('font-size', '15'); sub = true; }
    else if (sub) { ts.setAttribute('dy', '-6'); sub = false; }
    ts.textContent = ch;
  }
}

function build() {
  runId++; busy = false; sel = null; found = []; arrowObjs = []; hintMark = null;
  Object.values(L).forEach(g => g.innerHTML = '');
  V = {bonds: {}, lps: {}, charges: {}};
  for (const k in P.bonds) {
    const g = el('g', {}, L.bonds);
    V.bonds[k] = {l1: el('line', {class: 'bond'}, g), l2: el('line', {class: 'bond'}, g), l3: el('line', {class: 'bond'}, g)};
  }
  for (const id in P.atoms) {
    const A = P.atoms[id]; if (!A.label) continue;
    const w = A.el.length > 1 ? 10 : 7.5;
    const dx = A.anchor === 'start' ? -w : A.anchor === 'end' ? w : 0;
    setLabel(el('text', {x: A.x + dx, y: A.y + 8, 'text-anchor': A.anchor, class: 'atom'}, L.labels), A.label);
  }
  for (const id in P.atoms) {
    const all = new Set(); P.forms.forEach(f => f.lpA[id].forEach(a => all.add(a)));
    if (!all.size) continue;
    V.lps[id] = {};
    all.forEach(ang => {
      const g = el('g', {class: 'lp'}, L.lp);
      const c = lpPos(id, ang), t = ang*Math.PI/180, px = -Math.sin(t)*3.3, py = Math.cos(t)*3.3;
      el('circle', {cx: c.x + px, cy: c.y + py, r: 2.4}, g); el('circle', {cx: c.x - px, cy: c.y - py, r: 2.4}, g);
      V.lps[id][ang] = g;
    });
  }
  for (const id in P.atoms) {
    if (!P.forms.some(f => f.q[id])) continue;
    const A = P.atoms[id], a = A.qa*Math.PI/180, x = A.x + 29*Math.cos(a), y = A.y + 29*Math.sin(a);
    const pos = el('g', {class: 'charge pos'}, L.charges); el('circle', {cx: x, cy: y, r: 9.5}, pos);
    const pt = el('text', {x, y: y + .5}, pos);
    const neg = el('g', {class: 'charge neg'}, L.charges); el('circle', {cx: x, cy: y, r: 9.5}, neg);
    const nt = el('text', {x, y: y - .5}, neg);
    const delta = el('text', {x, y, class: 'delta'}, L.charges);
    V.charges[id] = {pos, neg, pt, nt, delta};
  }
}

function setLine(l, x1, y1, x2, y2) { l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); }

function geomBond(k, d, dashLine) {
  const b = P.bonds[k], B = V.bonds[k], A = P.atoms[b.a], C = P.atoms[b.b];
  const dx = C.x - A.x, dy = C.y - A.y, len = Math.hypot(dx, dy), ux = dx/len, uy = dy/len;
  const sa = A.label ? 15 : 0, sb = C.label ? 15 : 0;
  const x1 = A.x + ux*sa, y1 = A.y + uy*sa, x2 = C.x - ux*sb, y2 = C.y - uy*sb;
  let nx = -uy, ny = ux;
  if (b.c) {
    const cc = P.centers[b.c], mx = cc.x - (A.x + C.x)/2, my = cc.y - (A.y + C.y)/2;
    if (nx*mx + ny*my < 0) { nx = -nx; ny = -ny; }
    setLine(B.l1, x1, y1, x2, y2);
    const off = 9*Math.min(d, 1), sh = len*.17;
    setLine(B.l2, x1 + ux*sh + nx*off, y1 + uy*sh + ny*off, x2 - ux*sh + nx*off, y2 - uy*sh + ny*off);
    B.l2.style.opacity = clamp(d*1.6); B.l3.style.opacity = 0;
  } else {
    let off, mid;
    if (d <= 1) { off = 3.7*d; mid = 0; } else { off = lerp(3.7, 6.3, d - 1); mid = d - 1; }
    setLine(B.l1, x1 + nx*off, y1 + ny*off, x2 + nx*off, y2 + ny*off);
    setLine(B.l2, x1 - nx*off, y1 - ny*off, x2 - nx*off, y2 - ny*off);
    setLine(B.l3, x1, y1, x2, y2);
    B.l2.style.opacity = 1; B.l3.style.opacity = mid;
  }
  B.l2.classList.toggle('dash', dashLine === 2);
  B.l3.classList.toggle('dash', dashLine === 3);
}

function applyState(fa, fb, p) {
  const e = ease(p);
  for (const k in P.bonds) geomBond(k, lerp(fa.bonds[k] - 1, fb.bonds[k] - 1, e), 0);
  for (const id in V.lps) for (const ang in V.lps[id]) {
    const va = fa.lpA[id].includes(+ang) ? 1 : 0, vb = fb.lpA[id].includes(+ang) ? 1 : 0;
    V.lps[id][ang].style.opacity = lerp(va, vb, e);
  }
  for (const id in V.charges) {
    const c = V.charges[id], qa = fa.q[id] || 0, qb = fb.q[id] || 0;
    c.pos.style.opacity = lerp(qa > 0 ? 1 : 0, qb > 0 ? 1 : 0, e);
    c.neg.style.opacity = lerp(qa < 0 ? 1 : 0, qb < 0 ? 1 : 0, e);
    const shown = e < .5 ? (qa || qb) : (qb || qa);
    c.pt.textContent = shown > 1 ? shown + '+' : '+';
    c.nt.textContent = shown < -1 ? (-shown) + '\u2212' : '\u2212';
    c.pt.style.fontSize = c.nt.style.fontSize = Math.abs(shown) > 1 ? '12px' : '';
    c.delta.style.opacity = 0;
  }
}

function drawHybrid() {
  for (const k in P.bonds) {
    const avg = P.forms.reduce((s, f) => s + f.bonds[k], 0)/P.forms.length;
    const frac = Math.abs(avg - Math.round(avg)) > .01;
    const top = Math.ceil(avg - 1e-9);
    geomBond(k, frac ? top - 1 : avg - 1, frac ? top : 0);
  }
  for (const id in V.lps) for (const ang in V.lps[id]) V.lps[id][ang].style.opacity = 0;
  for (const id in V.charges) {
    const c = V.charges[id], sum = P.forms.reduce((s, f) => s + (f.q[id] || 0), 0);
    c.pos.style.opacity = 0; c.neg.style.opacity = 0;
    c.delta.textContent = sum > 0 ? '\u03B4+' : sum < 0 ? '\u03B4\u2212' : '';
    c.delta.setAttribute('class', 'delta ' + (sum > 0 ? 'pos' : 'neg'));
    c.delta.style.opacity = sum ? 1 : 0;
  }
}

/* ---------- arrows ---------- */
function toward(p, c, d) { const dx = c.x - p.x, dy = c.y - p.y, l = Math.hypot(dx, dy) || 1; return {x: p.x + dx/l*d, y: p.y + dy/l*d}; }
function makeArrow(ar0, fa, fb) {
  const ar = resolve(ar0, fa, fb);
  const S0 = ptOf(ar.from), Q = ptOf(ar.to);
  const dx = Q.x - S0.x, dy = Q.y - S0.y, dist = Math.hypot(dx, dy) || 1;
  let nx = -dy/dist, ny = dx/dist;
  const M = {x: (S0.x + Q.x)/2, y: (S0.y + Q.y)/2};
  let R, sg = -1, amt = Math.max(22, dist*.55);
  if (ar.from.lp) R = P.atoms[ar.from.lp];
  else if (ar.to.atom) R = P.atoms[ar.to.atom];
  else {
    const b1 = P.bonds[ar.from.bond], b2 = P.bonds[ar.to.bond];
    if (b1.c && b1.c === b2.c) { R = P.centers[b1.c]; sg = 1; amt = dist*.4; }
    else R = P.atoms[[b1.a, b1.b].find(x => x === b2.a || x === b2.b)];
  }
  const vx = (R.x - M.x)*sg, vy = (R.y - M.y)*sg;
  if (nx*vx + ny*vy < 0) { nx = -nx; ny = -ny; }
  const C = {x: M.x + nx*amt, y: M.y + ny*amt};
  const S = toward(S0, C, ar.from.bond ? 3 : 6), E = toward(Q, C, 6);
  const g = el('g', {class: 'arrow'}, L.arrows);
  const path = el('path', {class: 'shaft', d: `M${S.x},${S.y} Q${C.x},${C.y} ${E.x},${E.y}`}, g);
  const ul = Math.hypot(E.x - C.x, E.y - C.y), ux = (E.x - C.x)/ul, uy = (E.y - C.y)/ul, wx = -uy, wy = ux;
  const head = el('path', {class: 'head', d: `M${E.x + ux*2},${E.y + uy*2} L${E.x - ux*10 + wx*5.5},${E.y - uy*10 + wy*5.5} L${E.x - ux*6.5},${E.y - uy*6.5} L${E.x - ux*10 - wx*5.5},${E.y - uy*10 - wy*5.5}Z`}, g);
  const len = path.getTotalLength();
  path.style.strokeDasharray = len; path.style.strokeDashoffset = len; head.style.opacity = 0;
  const e1 = el('circle', {r: 3.3, class: 'e'}, L.elec), e2 = el('circle', {r: 3.3, class: 'e'}, L.elec);
  e1.style.opacity = 0; e2.style.opacity = 0;
  return {g, path, head, len, e1, e2};
}
function setDraw(o, t) { o.path.style.strokeDashoffset = o.len*(1 - t); o.head.style.opacity = clamp((t - .85)/.15); }
function setElectrons(o, t, op) {
  const a = o.path.getPointAtLength(o.len*t), b = o.path.getPointAtLength(Math.min(o.len, o.len*t + 1)), c = o.path.getPointAtLength(Math.max(0, o.len*t - 1));
  let tx = b.x - c.x, ty = b.y - c.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  o.e1.setAttribute('cx', a.x - ty*3.4); o.e1.setAttribute('cy', a.y + tx*3.4);
  o.e2.setAttribute('cx', a.x + ty*3.4); o.e2.setAttribute('cy', a.y - tx*3.4);
  o.e1.style.opacity = op; o.e2.style.opacity = op;
}
function drawArrows(objs, id) {
  const n = objs.length, each = T(650), stag = T(380), total = each + stag*(n - 1);
  return animate(total, t => {
    const ms = t*total;
    objs.forEach((o, i) => { const lt = clamp((ms - i*stag)/each); setDraw(o, lt); markStep(i, lt > 0 && lt < 1); });
  }, id);
}
async function electronsAndMorph(objs, fa, fb, id) {
  const travel = T(950), mStart = T(700), mDur = T(750), total = mStart + mDur;
  const ok = await animate(total, t => {
    const ms = t*total, te = clamp(ms/travel), op = 1 - clamp((ms - travel)/T(300));
    objs.forEach(o => setElectrons(o, ease(te), op));
    applyState(fa, fb, clamp((ms - mStart)/mDur));
  }, id);
  if (!ok) return false;
  applyState(fb, fb, 0);
  return animate(T(350), t => objs.forEach(o => { o.g.style.opacity = 1 - t; }), id);
}

/* ---------- watch mode ---------- */
const nextIdx = () => (formIdx + 1) % P.forms.length;
async function push() {
  if (busy || mode !== 'watch') return;
  if (hybrid) await setHybrid(false);
  busy = true; updateUI();
  const id = ++runId, fa = P.forms[formIdx], nb = nextIdx(), fb = P.forms[nb];
  L.arrows.innerHTML = ''; L.elec.innerHTML = ''; $('#result').textContent = '';
  const objs = P.steps[formIdx].map(a => makeArrow(a, fa, fb));
  if (!await drawArrows(objs, id)) return;
  if (!await electronsAndMorph(objs, fa, fb, id)) return;
  L.arrows.innerHTML = ''; L.elec.innerHTML = '';
  formIdx = nb; busy = false;
  updateUI();
  $('#result').textContent = resultText(fb);
}
async function jumpTo(i) {
  if (busy) return;
  if (hybrid) await setHybrid(false);
  if (i === formIdx) { resetTry(); updateUI(); return; }
  busy = true; const id = ++runId;
  L.arrows.innerHTML = ''; L.elec.innerHTML = ''; $('#result').textContent = '';
  await animate(T(350), t => applyState(P.forms[formIdx], P.forms[i], t), id);
  formIdx = i; busy = false; resetTry(); applyState(P.forms[i], P.forms[i], 0); updateUI();
}
async function setHybrid(on) {
  if (busy && on) return;
  hybrid = on; svg.classList.add('fade');
  await new Promise(r => setTimeout(r, reduce ? 0 : 180));
  L.arrows.innerHTML = ''; L.elec.innerHTML = '';
  if (on) drawHybrid(); else { applyState(P.forms[formIdx], P.forms[formIdx], 0); resetTry(); }
  svg.classList.remove('fade');
  updateUI();
}

/* ---------- try mode ---------- */
function tryMsg(text, kind) { const p = $('#tryMsg'); p.textContent = text; p.className = kind || ''; }
function resetTry() {
  sel = null; found = []; arrowObjs = []; hintMark = null;
  if (mode === 'try') { L.arrows.innerHTML = ''; L.elec.innerHTML = ''; tryMsg('Click the electrons that move (a lone pair or a π bond), then click where they go.'); }
  buildHits();
}
function remaining() { return P.steps[formIdx].map((a, i) => ({a, i})).filter(o => !found.includes(o.i)); }
const srcMatch = (ar, s) => (s.kind === 'bond' && ar.from.bond === s.id) || (s.kind === 'lp' && ar.from.lp === s.id);
const tgtMatch = (ar, t) => (t.kind === 'bond' && ar.to.bond === t.id) || ((t.kind === 'atom' || t.kind === 'lp') && ar.to.atom === t.id);

function buildHits() {
  L.hits.innerHTML = '';
  if (mode !== 'try' || hybrid) return;
  const f = P.forms[formIdx];
  if (sel) {
    if (sel.kind === 'bond') { const b = P.bonds[sel.id], A = P.atoms[b.a], B = P.atoms[b.b]; el('line', {x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'sel-line'}, L.hits); }
    else { const c = lpPos(sel.id, sel.ang); el('circle', {cx: c.x, cy: c.y, r: 8, class: 'sel-dot'}, L.hits); }
  }
  if (hintMark) el('circle', {cx: hintMark.x, cy: hintMark.y, r: 14, class: 'pulse'}, L.hits);
  for (const k in P.bonds) {
    const b = P.bonds[k], A = P.atoms[b.a], B = P.atoms[b.b], dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy), s = 16/l;
    el('line', {x1: A.x + dx*s, y1: A.y + dy*s, x2: B.x - dx*s, y2: B.y - dy*s, class: 'hit-line'}, L.hits).addEventListener('click', () => onHit({kind: 'bond', id: k}));
  }
  for (const id in P.atoms) {
    const A = P.atoms[id];
    el('circle', {cx: A.x, cy: A.y, r: A.label ? 15 : 10, class: 'hit'}, L.hits).addEventListener('click', () => onHit({kind: 'atom', id}));
  }
  for (const id in P.atoms) f.lpA[id].forEach(ang => {
    const p = lpPos(id, ang);
    el('circle', {cx: p.x, cy: p.y, r: 9, class: 'hit'}, L.hits).addEventListener('click', e => { e.stopPropagation(); onHit({kind: 'lp', id, ang}); });
  });
}

async function onHit(h) {
  if (mode !== 'try' || busy || hybrid) return;
  const f = P.forms[formIdx], rem = remaining();
  hintMark = null;
  if (!sel) {
    if (h.kind === 'atom') {
      tryMsg((f.q[h.id] || 0) > 0 && !f.lp[h.id] ? 'That atom is positive and has no lone pair, so it has no electrons to give. Arrows start at electrons: a lone pair or a π bond.' : 'Arrows start at electrons, not at an atom. Click a lone pair (the dots) or a multiple bond.', 'bad');
      buildHits(); return;
    }
    if (h.kind === 'bond' && f.bonds[h.id] < 2) { tryMsg('That\u2019s a single (σ) bond. σ bonds are the skeleton and stay put in resonance. Only π electrons and lone pairs move.', 'bad'); buildHits(); return; }
    if (!rem.some(o => srcMatch(o.a, h))) {
      tryMsg(h.kind === 'lp' ? 'Those are real electrons, but they aren\u2019t part of this step. Look for electrons right next to a π bond or an electron-poor atom.' : 'That π bond isn\u2019t the one that moves here. Which π bond sits next to the spot that needs (or has too many) electrons?', 'bad');
      buildHits(); return;
    }
    sel = h; tryMsg('Good start. Now click where those two electrons go: a bond or an atom.'); buildHits(); return;
  }
  if (h.kind === sel.kind && h.id === sel.id) { sel = null; tryMsg('Selection cleared. Pick the electrons that move.'); buildHits(); return; }
  const match = rem.find(o => srcMatch(o.a, sel) && tgtMatch(o.a, h));
  if (!match) {
    let m = 'Not there. Picture the next structure: where must those electrons land so that no C, N or O goes over eight?';
    if (h.kind === 'bond' && f.bonds[h.id] >= 2 && !rem.some(o => o.a.to.bond === h.id)) m = 'That bond already has a π bond. Pushing more electrons into it would overload an atom.';
    else if (h.kind !== 'bond' && (f.q[h.id] || 0) < 0) m = 'That atom is already negative. Electrons flow away from negative charge, not toward it.';
    else if (h.kind === 'bond' && sel.kind === 'bond') m = 'Close. A π bond moves to a neighboring bond or onto a neighboring atom. Try another neighbor.';
    tryMsg(m, 'bad'); buildHits(); return;
  }
  found.push(match.i); sel = null; busy = true;
  const fb = P.forms[nextIdx()];
  const o = makeArrow(match.a, f, fb); arrowObjs.push(o);
  updateSteps(); buildHits();
  const id = runId;
  await animate(T(600), t => setDraw(o, t), id);
  if (id !== runId) return;
  busy = false;
  const arrows = P.steps[formIdx];
  if (found.length < arrows.length) {
    const allShift = arrows.every(a => a.from.bond && a.to.bond);
    tryMsg(allShift ? 'Yes! Now shift the other π bonds the same way.' : 'Yes! Now find the next arrow. Check: does any atom now have more than eight electrons, or fewer than it should?', 'good');
    buildHits(); return;
  }
  busy = true; L.hits.innerHTML = '';
  tryMsg('All arrows placed. Watch the electrons move\u2026', 'good');
  const ok = await electronsAndMorph(arrowObjs, f, fb, id);
  if (!ok) return;
  formIdx = nextIdx(); busy = false;
  L.arrows.innerHTML = ''; L.elec.innerHTML = '';
  sel = null; found = []; arrowObjs = [];
  updateUI();
  $('#result').textContent = resultText(fb);
  tryMsg(`Nailed it. Now take it from contributor ${P.forms[formIdx].name} to ${P.forms[nextIdx()].name}.`, 'good');
}
function hint() {
  if (mode !== 'try' || busy || hybrid) return;
  const rem = remaining(); if (!rem.length) return;
  const f = P.forms[formIdx], fb = P.forms[nextIdx()];
  const pick = (sel && rem.find(o => srcMatch(o.a, sel))) || rem[0];
  const r = resolve(pick.a, f, fb);
  if (sel && srcMatch(pick.a, sel)) { hintMark = ptOf(r.to); tryMsg('Those electrons go to the pulsing spot.'); }
  else { sel = null; hintMark = r.from.bond ? bondMid(r.from.bond) : lpPos(r.from.lp, r.from.a); tryMsg('Start with the electrons at the pulsing circle.'); }
  buildHits();
}

/* ---------- panels ---------- */
function markStep(i, on) { const ch = $('#steps').children; const li = ch[Math.min(i, ch.length - 1)]; if (li && !li.classList.contains('empty')) li.classList.toggle('active', on); }
function updateSteps() {
  const ul = $('#steps'); ul.innerHTML = '';
  if (hybrid) { $('#stepsSec').hidden = true; return; }
  $('#stepsSec').hidden = false;
  const f = P.forms[formIdx], arrows = P.steps[formIdx];
  const add = t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); return li; };
  if (mode === 'try') {
    $('#stepsHead').textContent = 'Arrows you\u2019ve found';
    if (!found.length) add(`This step needs ${arrows.length} arrow${arrows.length > 1 ? 's' : ''}.`).className = 'empty';
    found.forEach(i => add(stepText(arrows[i], f)));
  } else {
    $('#stepsHead').textContent = `What the arrows do (${f.name} to ${P.forms[nextIdx()].name})`;
    const texts = arrows.map(a => stepText(a, f));
    if (texts.length > 1 && texts.every(t => t === texts[0])) add(`All ${texts.length} at once: ${texts[0][0].toLowerCase() + texts[0].slice(1)}`);
    else texts.forEach(t => add(t));
  }
}
function updateUI() {
  const f = P.forms[formIdx];
  document.querySelectorAll('.ex-btn').forEach(b => b.setAttribute('aria-current', +b.dataset.i === cur ? 'true' : 'false'));
  $('#exName').textContent = P.name; $('#exIntro').textContent = P.intro;
  const pills = $('#formPills'); pills.innerHTML = '';
  P.forms.forEach((fm, i) => {
    if (i > 0) { const s = document.createElement('span'); s.className = 'rarr'; s.textContent = '\u2194'; s.setAttribute('aria-hidden', 'true'); pills.appendChild(s); }
    const b = document.createElement('button'); b.className = 'pill'; b.textContent = fm.name;
    b.setAttribute('aria-label', 'Contributor ' + fm.name + ' (' + fm.tag + ')');
    b.setAttribute('aria-pressed', !hybrid && i === formIdx ? 'true' : 'false');
    if (fm.tag === 'minor') b.classList.add('minor');
    b.onclick = () => jumpTo(i); pills.appendChild(b);
  });
  const g = document.createElement('span'); g.className = 'gap'; pills.appendChild(g);
  const hb = document.createElement('button'); hb.className = 'pill'; hb.textContent = 'Hybrid';
  hb.setAttribute('aria-pressed', hybrid ? 'true' : 'false'); hb.onclick = () => setHybrid(!hybrid); pills.appendChild(hb);
  if (hybrid) {
    $('#stageTag').textContent = 'resonance hybrid';
    $('#formHead').textContent = 'The resonance hybrid';
    $('#formNote').textContent = P.hybrid;
  } else {
    const tag = f.tag === 'equal' ? '' : ` (${f.tag})`;
    $('#stageTag').textContent = `contributor ${f.name}${tag}`;
    $('#formHead').textContent = `Contributor ${f.name}${tag}`;
    $('#formNote').textContent = noteFor(f, formIdx);
  }
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false'));
  $('#pushBtn').hidden = mode !== 'watch';
  $('#pushBtn').disabled = busy;
  $('#hybridBtn').setAttribute('aria-pressed', hybrid ? 'true' : 'false');
  $('#hybridBtn').textContent = hybrid ? 'Hide hybrid' : 'Show hybrid';
  $('#tryBox').hidden = mode !== 'try';
  const nx = EX[(cur + 1) % EX.length];
  $('#nextBtn').textContent = 'Next molecule: ' + nx.n;
  updateSteps(); buildHits();
}
function loadExample(i) {
  cur = i; P = prep(EX[i]); formIdx = 0; hybrid = false;
  build();
  applyState(P.forms[0], P.forms[0], 0);
  $('#result').textContent = '';
  resetTry(); updateUI();
  const btn = document.querySelector(`.ex-btn[data-i="${i}"]`);
  const list = $('#exList');
  if (btn && list) { const br = btn.getBoundingClientRect(), lr = list.getBoundingClientRect(); if (br.top < lr.top || br.bottom > lr.bottom) list.scrollTop += br.top - lr.top - lr.height/2 + br.height/2; }
}

/* ---------- nav ---------- */
function buildNav(filter = '') {
  const nav = $('#exList'); nav.innerHTML = '';
  const q = filter.trim().toLowerCase();
  let lastCat = null, count = 0;
  EX.forEach((ex, i) => {
    if (q && !(ex.n + ' ' + ex.b + ' ' + ex.c).toLowerCase().includes(q)) return;
    if (ex.c !== lastCat) { const h = document.createElement('h3'); h.className = 'cat'; h.textContent = ex.c; nav.appendChild(h); lastCat = ex.c; }
    const b = document.createElement('button'); b.className = 'ex-btn'; b.dataset.i = i;
    b.setAttribute('aria-current', i === cur ? 'true' : 'false');
    const n = document.createElement('span'); n.className = 'name'; n.textContent = ex.n;
    const s = document.createElement('small'); s.textContent = ex.b;
    b.append(n, s); b.onclick = () => loadExample(i); nav.appendChild(b); count++;
  });
  if (!count) { const p = document.createElement('p'); p.className = 'empty-nav'; p.textContent = 'No molecules match. Try a shorter word, like \u201Cion\u201D or \u201Cring\u201D.'; nav.appendChild(p); }
}
$('#search').addEventListener('input', e => buildNav(e.target.value));
$('#countLabel').textContent = `${EX.length} molecules`;
$('#pushBtn').onclick = push;
$('#hybridBtn').onclick = () => setHybrid(!hybrid);
$('#hintBtn').onclick = hint;
$('#nextBtn').onclick = () => loadExample((cur + 1) % EX.length);
$('#randBtn').onclick = () => { let i; do { i = Math.floor(Math.random()*EX.length); } while (i === cur); loadExample(i); };
$('#speedSel').onchange = e => speed = +e.target.value;
document.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
  if (b.dataset.mode === mode) return;
  mode = b.dataset.mode; runId++; busy = false; hybrid = false;
  applyState(P.forms[formIdx], P.forms[formIdx], 0);
  L.arrows.innerHTML = ''; L.elec.innerHTML = ''; $('#result').textContent = '';
  resetTry(); updateUI();
});
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (e.key === 'ArrowRight' && mode === 'watch') { e.preventDefault(); push(); }
});
buildNav();
loadExample(0);
const loadErr = document.getElementById('loadError'); if (loadErr) loadErr.remove();
