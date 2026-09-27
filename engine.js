/* Pushing electrons: chemistry engine.
   Builds every resonance contributor by applying curved arrows to the first structure,
   then computes lone pairs, formal charges, layout and major/minor ranking. */

const BL = 70;
const ELS = {H:[1,2.20,'hydrogen'],C:[4,2.55,'carbon'],N:[5,3.04,'nitrogen'],O:[6,3.44,'oxygen'],S:[6,2.58,'sulfur'],P:[5,2.19,'phosphorus'],Cl:[7,3.16,'chlorine'],Br:[7,2.96,'bromine'],F:[7,3.98,'fluorine']};
const bkey = (a,b) => a < b ? a + '-' + b : b + '-' + a;
const R2D = Math.PI/180;

/* ---------- simulator ---------- */
function parseArrow(s) {
  const [f, t] = s.split('>');
  const side = x => x.includes('-') ? {bond: bkey(...x.split('-'))} : {atom: x};
  const from = side(f), to = side(t);
  if (from.atom) { from.lp = from.atom; delete from.atom; }
  return {from, to};
}
function reverseArrow(a) {
  if (a.from.lp) return {from: {bond: a.to.bond}, to: {atom: a.from.lp}};
  if (a.to.atom) return {from: {lp: a.to.atom}, to: {bond: a.from.bond}};
  return {from: {bond: a.to.bond}, to: {bond: a.from.bond}};
}
function bondSum(P, f, id) { let s = 0; for (const k in P.bonds) { const b = P.bonds[k]; if (b.a === id || b.b === id) s += f.bonds[k]; } return s; }
function electrons(P, f, id) { const A = P.atoms[id]; return 2*f.lp[id] + 2*(bondSum(P, f, id) + A.h); }
function applyArrows(P, f, arrows, errs, label) {
  const g = {bonds: {...f.bonds}, lp: {...f.lp}, q: {}};
  for (const a of arrows) {
    if (a.from.lp) { if (g.lp[a.from.lp] < 1) errs.push(`${label}: no lone pair on ${a.from.lp}`); g.lp[a.from.lp]--; }
    else { if (!(a.from.bond in g.bonds)) errs.push(`${label}: no bond ${a.from.bond}`); if (g.bonds[a.from.bond] < 2) errs.push(`${label}: ${a.from.bond} has no π bond`); g.bonds[a.from.bond]--; }
    if (a.to.bond) { if (!(a.to.bond in g.bonds)) errs.push(`${label}: no bond ${a.to.bond}`); g.bonds[a.to.bond]++; }
    else g.lp[a.to.atom]++;
  }
  for (const id in P.atoms) {
    const A = P.atoms[id];
    const q = ELS[A.el][0] - 2*g.lp[id] - bondSum(P, g, id) - A.h;
    if (q) g.q[id] = q;
  }
  return g;
}
const sameForm = (P, f, g) => Object.keys(P.bonds).every(k => f.bonds[k] === g.bonds[k]) && Object.keys(P.atoms).every(k => f.lp[k] === g.lp[k]);

function normA(a) { a %= 360; return a < 0 ? a + 360 : a; }
function spread(blocked, n) {
  if (!n) return [];
  if (!blocked.length) return Array.from({length: n}, (_, i) => normA(-90 + 360*i/n));
  const b = [...new Set(blocked.map(x => Math.round(normA(x))))].sort((x, y) => x - y);
  const gaps = b.map((s, i) => ({s, size: (i+1 < b.length ? b[i+1] : b[0] + 360) - s, m: 0}));
  for (let k = 0; k < n; k++) { let best = gaps[0]; for (const g of gaps) if (g.size/(g.m+1) > best.size/(best.m+1) + 1e-6) best = g; best.m++; }
  const out = [];
  for (const g of gaps) for (let j = 1; j <= g.m; j++) out.push(Math.round(normA(g.s + g.size*j/(g.m+1))));
  return out;
}

function prep(raw) {
  if (raw._p) return raw._p;
  const errs = [];
  const P = {raw, name: raw.n, cat: raw.c, blurb: raw.b, intro: raw.i, hybrid: raw.h, atoms: {}, bonds: {}, centers: {}, errs};
  // coordinates
  for (const id in raw.atoms) {
    const s = raw.atoms[id];
    let x, y, label, o;
    if (typeof s[0] === 'number') { [x, y, label, o] = s; }
    else { const r = P.atoms[s[0]]; const t = s[1]*R2D, l = BL*((s[3] && s[3].len) || 1); x = r.x + l*Math.cos(t); y = r.y + l*Math.sin(t); label = s[2]; o = s[3]; }
    o = o || {};
    let el = o.el, h = o.h;
    if (label === 'H') { el = 'H'; h = 0; }
    if (el === undefined) el = label ? label.replace(/H\d*/g, '') : 'C';
    if (h === undefined) { if (label) { h = 0; label.replace(/H(\d*)/g, (m, d) => { h += d ? +d : 1; }); } else h = null; }
    let anchor = o.a;
    if (!anchor) anchor = (label && label.length > 1 && label !== el) ? (label[0] === 'H' ? 'end' : 'start') : 'middle';
    if (!ELS[el]) errs.push('unknown element ' + el);
    P.atoms[id] = {id, x, y, label, el, h, anchor, qa: o.qa};
  }
  for (const s of raw.bonds.trim().split(/\s+/)) {
    const [pair, c] = s.split('@'); const [a, b] = pair.split('-');
    if (!P.atoms[a] || !P.atoms[b]) errs.push('bad bond ' + s);
    P.bonds[bkey(a, b)] = {a, b, c: c || null};
  }
  // fit into view
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const id in P.atoms) {
    const A = P.atoms[id], w = A.label ? A.label.length*12 : 0;
    const l = A.anchor === 'end' ? A.x - w : A.x - 10, r = A.anchor === 'start' ? A.x + w : A.x + 10;
    x0 = Math.min(x0, l - 26); x1 = Math.max(x1, r + 26); y0 = Math.min(y0, A.y - 34); y1 = Math.max(y1, A.y + 34);
  }
  const sc = Math.min(1.15, 540/(x1 - x0), 255/(y1 - y0)), cx = (x0 + x1)/2, cy = (y0 + y1)/2;
  for (const id in P.atoms) { const A = P.atoms[id]; A.x = 300 + (A.x - cx)*sc; A.y = 168 + (A.y - cy)*sc; }
  for (const k in (raw.centers || {})) { const c = raw.centers[k]; P.centers[k] = {x: 300 + (c.x - cx)*sc, y: 168 + (c.y - cy)*sc}; }
  // first form
  const f0 = {bonds: {}, q: {...(raw.q || {})}, lp: {}};
  for (const k in P.bonds) f0.bonds[k] = 1;
  for (const s of (raw.d || '').split(/\s+/).filter(Boolean)) { const k = bkey(...s.split('-')); if (!(k in f0.bonds)) errs.push('bad double ' + s); f0.bonds[k] = 2; }
  for (const s of (raw.t || '').split(/\s+/).filter(Boolean)) { const k = bkey(...s.split('-')); if (!(k in f0.bonds)) errs.push('bad triple ' + s); f0.bonds[k] = 3; }
  for (const id in P.atoms) {
    const A = P.atoms[id], q = f0.q[id] || 0, bs = bondSum(P, f0, id);
    if (A.h === null) A.h = 4 - bs - (q ? 1 : 0);
    const lp = (ELS[A.el][0] - q - bs - A.h)/2;
    if (lp < 0 || lp !== Math.floor(lp)) errs.push(`bad lone pairs on ${id}: ${lp}`);
    f0.lp[id] = lp;
  }
  // forms via electron pushing
  let steps = raw.steps.map(s => s.trim().split(/\s+/).map(parseArrow));
  if (steps.length === 1) steps.push(steps[0].map(reverseArrow).reverse());
  const forms = [f0];
  steps.forEach((arrows, i) => {
    const g = applyArrows(P, forms[i], arrows, errs, `${raw.n} step ${i+1}`);
    if (i === steps.length - 1) { if (!sameForm(P, g, f0)) errs.push(`${raw.n}: cycle does not close`); }
    else forms.push(g);
  });
  // octet check
  forms.forEach((f, i) => { for (const id in P.atoms) { const A = P.atoms[id]; if ('CNO'.includes(A.el) && A.el.length === 1 && electrons(P, f, id) > 8) errs.push(`${raw.n} form ${i}: ${id} exceeds octet`); } });
  // lone pair angles & charge positions
  const blocked = {};
  for (const id in P.atoms) {
    const A = P.atoms[id], bl = [];
    for (const k in P.bonds) { const b = P.bonds[k]; if (b.a === id || b.b === id) { const o = P.atoms[b.a === id ? b.b : b.a]; bl.push(Math.atan2(o.y - A.y, o.x - A.x)/R2D); } }
    if (A.anchor === 'start') bl.push(0); if (A.anchor === 'end') bl.push(180);
    blocked[id] = bl;
  }
  const lpCache = {};
  const lpAngles = (id, n) => { const k = id + ':' + n; return lpCache[k] || (lpCache[k] = spread(blocked[id], n)); };
  forms.forEach(f => { f.lpA = {}; for (const id in P.atoms) f.lpA[id] = lpAngles(id, f.lp[id]); });
  for (const id in P.atoms) {
    const A = P.atoms[id];
    if (A.qa !== undefined) continue;
    const all = new Set(); forms.forEach(f => f.lpA[id].forEach(a => all.add(a)));
    A.qa = spread(blocked[id].concat([...all]), 1)[0];
  }
  // ranking
  forms.forEach(f => {
    let def = 0, chg = 0, en = 0, big = 0;
    for (const id in P.atoms) {
      const A = P.atoms[id], q = f.q[id] || 0, E = ELS[A.el];
      if ('CNO'.includes(A.el) && A.el.length === 1 && electrons(P, f, id) < 8) def++;
      chg += Math.abs(q); if (Math.abs(q) >= 2) big++;
      if (q < 0) en += (3.44 - E[1])*(-q)*2; if (q > 0) en += (E[1] - 2.55)*q*2;
    }
    f.def = def; f.chg = chg; f.en = en; f.score = 100*def + 10*chg + 15*big + en;
  });
  const best = Math.min(...forms.map(f => f.score));
  const allEq = forms.every(f => f.score - best < 0.3);
  forms.forEach((f, i) => {
    f.name = String.fromCharCode(65 + i);
    f.tag = allEq ? 'equal' : (f.score - best < 0.3 ? 'major' : 'minor');
    if (raw.tags) f.tag = raw.tags[i] === 'M' ? 'major' : raw.tags[i] === 'm' ? 'minor' : 'equal';
  });
  P.forms = forms;
  P.steps = steps;
  return P;
}

