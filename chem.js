/* ChemFluent — chemistry engine: elements, formulas, structures, naming, stereochemistry, geometry. */
'use strict';

/* ---------- small helpers ---------- */
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  real: (a, b, d = 2) => +(a + Math.random() * (b - a)).toFixed(d),
};
function sig(x, n = 3) {
  if (x === 0 || !isFinite(x)) return String(x);
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-3) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${(+m.toPrecision(n))} × 10<sup>${e}</sup>`; }
  return String(+x.toPrecision(n));
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
const SUB = s => String(s).replace(/(\d+)/g, '<sub>$1</sub>');
/* formula with subscripts but keep leading coefficients and charges readable */
function fmtFormula(f) {
  return f.replace(/([A-Za-z\)])(\d+)/g, '$1<sub>$2</sub>').replace(/·(\d+)/, '·$1').replace(/\^(\d*[+-])/g, '<sup>$1</sup>');
}

/* ---------- periodic table ---------- */
const EL_RAW = `H Hydrogen 1.008 2.20|He Helium 4.0026|Li Lithium 6.94 0.98|Be Beryllium 9.0122 1.57|B Boron 10.81 2.04|C Carbon 12.011 2.55|N Nitrogen 14.007 3.04|O Oxygen 15.999 3.44|F Fluorine 18.998 3.98|Ne Neon 20.180|Na Sodium 22.990 0.93|Mg Magnesium 24.305 1.31|Al Aluminum 26.982 1.61|Si Silicon 28.085 1.90|P Phosphorus 30.974 2.19|S Sulfur 32.06 2.58|Cl Chlorine 35.45 3.16|Ar Argon 39.948|K Potassium 39.098 0.82|Ca Calcium 40.078 1.00|Sc Scandium 44.956 1.36|Ti Titanium 47.867 1.54|V Vanadium 50.942 1.63|Cr Chromium 51.996 1.66|Mn Manganese 54.938 1.55|Fe Iron 55.845 1.83|Co Cobalt 58.933 1.88|Ni Nickel 58.693 1.91|Cu Copper 63.546 1.90|Zn Zinc 65.38 1.65|Ga Gallium 69.723 1.81|Ge Germanium 72.630 2.01|As Arsenic 74.922 2.18|Se Selenium 78.971 2.55|Br Bromine 79.904 2.96|Kr Krypton 83.798 3.00|Rb Rubidium 85.468 0.82|Sr Strontium 87.62 0.95|Y Yttrium 88.906 1.22|Zr Zirconium 91.224 1.33|Nb Niobium 92.906 1.6|Mo Molybdenum 95.95 2.16|Tc Technetium 98 1.9|Ru Ruthenium 101.07 2.2|Rh Rhodium 102.91 2.28|Pd Palladium 106.42 2.20|Ag Silver 107.87 1.93|Cd Cadmium 112.41 1.69|In Indium 114.82 1.78|Sn Tin 118.71 1.96|Sb Antimony 121.76 2.05|Te Tellurium 127.60 2.1|I Iodine 126.90 2.66|Xe Xenon 131.29 2.6|Cs Cesium 132.91 0.79|Ba Barium 137.33 0.89|La Lanthanum 138.91 1.10|Ce Cerium 140.12 1.12|Pr Praseodymium 140.91 1.13|Nd Neodymium 144.24 1.14|Pm Promethium 145|Sm Samarium 150.36 1.17|Eu Europium 151.96|Gd Gadolinium 157.25 1.20|Tb Terbium 158.93|Dy Dysprosium 162.50 1.22|Ho Holmium 164.93 1.23|Er Erbium 167.26 1.24|Tm Thulium 168.93 1.25|Yb Ytterbium 173.05|Lu Lutetium 174.97 1.27|Hf Hafnium 178.49 1.3|Ta Tantalum 180.95 1.5|W Tungsten 183.84 2.36|Re Rhenium 186.21 1.9|Os Osmium 190.23 2.2|Ir Iridium 192.22 2.20|Pt Platinum 195.08 2.28|Au Gold 196.97 2.54|Hg Mercury 200.59 2.00|Tl Thallium 204.38 1.62|Pb Lead 207.2 2.33|Bi Bismuth 208.98 2.02|Po Polonium 209 2.0|At Astatine 210 2.2|Rn Radon 222|Fr Francium 223 0.7|Ra Radium 226 0.9|Ac Actinium 227 1.1|Th Thorium 232.04 1.3|Pa Protactinium 231.04 1.5|U Uranium 238.03 1.38|Np Neptunium 237 1.36|Pu Plutonium 244 1.28|Am Americium 243 1.3|Cm Curium 247 1.3|Bk Berkelium 247 1.3|Cf Californium 251 1.3|Es Einsteinium 252 1.3|Fm Fermium 257 1.3|Md Mendelevium 258 1.3|No Nobelium 259 1.3|Lr Lawrencium 266|Rf Rutherfordium 267|Db Dubnium 268|Sg Seaborgium 269|Bh Bohrium 270|Hs Hassium 277|Mt Meitnerium 278|Ds Darmstadtium 281|Rg Roentgenium 282|Cn Copernicium 285|Nh Nihonium 286|Fl Flerovium 289|Mc Moscovium 290|Lv Livermorium 293|Ts Tennessine 294|Og Oganesson 294`;
const ELEMENTS = EL_RAW.split('|').map((s, i) => {
  const [sym, name, mass, en] = s.split(' ');
  const Z = i + 1, pos = tablePos(Z);
  return { Z, sym, name, mass: +mass, en: en ? +en : null, ...pos, cat: category(Z, sym, pos.group) };
});
const EL = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));
function tablePos(Z) {
  if (Z === 1) return { period: 1, group: 1, row: 1, col: 1 };
  if (Z === 2) return { period: 1, group: 18, row: 1, col: 18 };
  const P = [[3, 10, 2], [11, 18, 3]];
  for (const [a, b, p] of P) if (Z >= a && Z <= b) { const o = Z - a + 1, g = o <= 2 ? o : o + 10; return { period: p, group: g, row: p, col: g }; }
  if (Z <= 36) { const g = Z - 18; return { period: 4, group: g, row: 4, col: g }; }
  if (Z <= 54) { const g = Z - 36; return { period: 5, group: g, row: 5, col: g }; }
  if (Z <= 56) { const g = Z - 54; return { period: 6, group: g, row: 6, col: g }; }
  if (Z <= 71) return { period: 6, group: 3, row: 9, col: 3 + (Z - 57), f: true };
  if (Z <= 86) { const g = Z - 68; return { period: 6, group: g, row: 6, col: g }; }
  if (Z <= 88) { const g = Z - 86; return { period: 7, group: g, row: 7, col: g }; }
  if (Z <= 103) return { period: 7, group: 3, row: 10, col: 3 + (Z - 89), f: true };
  const g = Z - 100; return { period: 7, group: g, row: 7, col: g };
}
function category(Z, sym, g) {
  if (Z >= 57 && Z <= 71) return 'lanthanide';
  if (Z >= 89 && Z <= 103) return 'actinide';
  if (g === 18) return 'noble';
  if (g === 17) return 'halogen';
  if (['H', 'C', 'N', 'O', 'P', 'S', 'Se'].includes(sym)) return 'nonmetal';
  if (['B', 'Si', 'Ge', 'As', 'Sb', 'Te'].includes(sym)) return 'metalloid';
  if (g === 1) return 'alkali';
  if (g === 2) return 'alkaline';
  if (g >= 3 && g <= 12) return 'transition';
  return 'post-transition';
}

/* ---------- electron configuration ---------- */
const AUFBAU = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAP = { s: 2, p: 6, d: 10, f: 14 };
const EXCEPTIONS = { 24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 }, 41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 }, 44: { '5s': 1, '4d': 7 }, 45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 }, 78: { '6s': 1, '5d': 9 }, 79: { '6s': 1, '5d': 10 } };
function econfig(Z) {
  const occ = {}; let left = Z;
  for (const o of AUFBAU) { if (!left) break; const n = Math.min(CAP[o[1]], left); occ[o] = n; left -= n; }
  if (EXCEPTIONS[Z]) Object.assign(occ, EXCEPTIONS[Z]);
  for (const k in occ) if (!occ[k]) delete occ[k];
  return occ;
}
function econfigStr(Z, html = true) {
  const o = econfig(Z);
  return AUFBAU.filter(k => o[k]).map(k => html ? `${k}<sup>${o[k]}</sup>` : `${k}${o[k]}`).join(' ');
}
const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];
function econfigShort(Z) {
  let core = null; for (const [z, s] of NOBLE) if (z < Z) core = [z, s];
  if (!core) return econfigStr(Z);
  const full = econfig(Z), c = econfig(core[0]);
  const rest = AUFBAU.filter(k => full[k] && full[k] !== c[k]).map(k => `${k}<sup>${full[k]}</sup>`).join(' ');
  return `[${core[1]}] ${rest}`;
}
/* parse a typed configuration like "1s2 2s2 2p6" or "[Ar] 4s2 3d6" into an occupancy map */
function parseConfig(str) {
  str = str.replace(/<\/?su[bp]>/g, '').replace(/\s+/g, ' ').trim();
  const occ = {};
  const m = str.match(/^\[(\w{1,2})\]/);
  if (m) { const e = EL[m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()]; if (!e || e.group !== 18) return null; Object.assign(occ, econfig(e.Z)); str = str.slice(m[0].length); }
  const re = /([1-7])\s*([spdf])\s*\^?\s*(\d{1,2})/gi; let t, any = false;
  while ((t = re.exec(str))) { any = true; occ[t[1] + t[2].toLowerCase()] = +t[3]; }
  if (!any && !m) return null;
  return occ;
}
const sameOcc = (a, b) => { const k = new Set([...Object.keys(a), ...Object.keys(b)]); for (const x of k) if ((a[x] || 0) !== (b[x] || 0)) return false; return true; };

/* ---------- formulas ---------- */
function parseFormula(f) {
  f = f.replace(/\s/g, '').replace(/\^?\d*[+-]$/, '');
  const parts = f.split(/[·*.]/);
  const total = {};
  for (let p of parts) {
    let mult = 1; const lead = p.match(/^(\d+)(?=[A-Z(])/); if (lead) { mult = +lead[1]; p = p.slice(lead[1].length); }
    const counts = parseGroup(p);
    for (const k in counts) total[k] = (total[k] || 0) + counts[k] * mult;
  }
  return total;
}
function parseGroup(s) {
  const stack = [{}]; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(' || ch === '[') { stack.push({}); i++; }
    else if (ch === ')' || ch === ']') {
      i++; let n = ''; while (/\d/.test(s[i] || '')) n += s[i++];
      const g = stack.pop(), top = stack[stack.length - 1];
      for (const k in g) top[k] = (top[k] || 0) + g[k] * (n ? +n : 1);
    } else if (/[A-Z]/.test(ch)) {
      let sym = ch; i++; if (/[a-z]/.test(s[i] || '')) sym += s[i++];
      let n = ''; while (/\d/.test(s[i] || '')) n += s[i++];
      if (!EL[sym]) throw new Error('Unknown element ' + sym);
      const top = stack[stack.length - 1]; top[sym] = (top[sym] || 0) + (n ? +n : 1);
    } else throw new Error('Bad character ' + ch);
  }
  if (stack.length !== 1) throw new Error('Unbalanced parentheses');
  return stack[0];
}
function molarMass(f) { const c = parseFormula(f); let m = 0; for (const k in c) m += EL[k].mass * c[k]; return m; }
function hillFormula(counts) {
  const keys = Object.keys(counts).filter(k => counts[k]);
  const order = keys.includes('C') ? ['C', 'H', ...keys.filter(k => k !== 'C' && k !== 'H').sort()] : keys.sort();
  return order.filter(k => counts[k]).map(k => k + (counts[k] > 1 ? counts[k] : '')).join('');
}

/* ---------- 2D structure drawing (bond-line) ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const VAL = { C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, S: 2 };
function hCount(mol, i) {
  const a = mol.atoms[i]; let used = 0;
  for (const b of mol.bonds) if (b.a === i || b.b === i) used += b.o;
  return Math.max(0, (VAL[a.el] || 0) - used - (a.q ? -a.q : 0));
}
function molFormula(mol) {
  const c = {};
  mol.atoms.forEach((a, i) => { c[a.el] = (c[a.el] || 0) + 1; c.H = (c.H || 0) + hCount(mol, i); });
  return hillFormula(c);
}
/* render to an SVG string; opts.hl = atom index to highlight, opts.labels = map index->text */
function drawMol(mol, opts = {}) {
  const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
  const pad = 34, minx = Math.min(...xs) - pad, miny = Math.min(...ys) - pad, w = Math.max(...xs) - minx + pad, h = Math.max(...ys) - miny + pad;
  const out = [];
  const lab = i => { const a = mol.atoms[i]; if (opts.labels && opts.labels[i] != null) return opts.labels[i]; if (a.el === 'C' && !a.show) return null; const n = hCount(mol, i); return a.el + (n ? 'H' + (n > 1 ? `<tspan baseline-shift="sub" font-size="70%">${n}</tspan>` : '') : ''); };
  const trim = (i, x, y, ox, oy) => { if (!lab(i)) return [x, y]; const dx = ox - x, dy = oy - y, L = Math.hypot(dx, dy); return [x + dx / L * 13, y + dy / L * 13]; };
  for (const b of mol.bonds) {
    const A = mol.atoms[b.a], B = mol.atoms[b.b];
    let [x1, y1] = trim(b.a, A.x, A.y, B.x, B.y), [x2, y2] = trim(b.b, B.x, B.y, A.x, A.y);
    const cls = opts.hlBond && opts.hlBond.includes(mol.bonds.indexOf(b)) ? ' class="hlb"' : '';
    out.push(`<line${cls} x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
    if (b.o >= 2) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); let nx = -dy / L, ny = dx / L;
      if (b.side) { nx *= b.side; ny *= b.side; }
      const cx = mol.atoms.reduce((s, a) => s + a.x, 0) / mol.atoms.length, cy = mol.atoms.reduce((s, a) => s + a.y, 0) / mol.atoms.length;
      if (!b.side && ((x1 + x2) / 2 + nx * 6 - cx) ** 2 + ((y1 + y2) / 2 + ny * 6 - cy) ** 2 > ((x1 + x2) / 2 - nx * 6 - cx) ** 2 + ((y1 + y2) / 2 - ny * 6 - cy) ** 2) { nx = -nx; ny = -ny; }
      const off = 6, sh = lab(b.a) || lab(b.b) ? 0 : 5;
      const ux = dx / L, uy = dy / L;
      const lines = b.o === 3 ? [off, -off] : [off];
      for (const o of lines) out.push(`<line x1="${(x1 + nx * o + ux * sh).toFixed(1)}" y1="${(y1 + ny * o + uy * sh).toFixed(1)}" x2="${(x2 + nx * o - ux * sh).toFixed(1)}" y2="${(y2 + ny * o - uy * sh).toFixed(1)}"/>`);
    }
  }
  mol.atoms.forEach((a, i) => {
    if (opts.hl === i || (opts.hlSet && opts.hlSet.includes(i))) out.unshift(`<circle class="hl" cx="${a.x}" cy="${a.y}" r="15"/>`);
    const t = lab(i);
    if (t) out.push(`<text x="${a.x}" y="${a.y}" class="lab ${'el-' + a.el}">${t}</text>`);
  });
  return `<svg class="mol" viewBox="${minx.toFixed(0)} ${miny.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="${opts.aria || 'Bond-line structure'}">${out.join('')}</svg>`;
}
/* zigzag chain builder */
const BL = 50, DX = BL * Math.cos(Math.PI / 6), DY = BL * Math.sin(Math.PI / 6);
function chain(n) {
  const atoms = [], bonds = [];
  for (let i = 0; i < n; i++) { atoms.push({ el: 'C', x: i * DX, y: i % 2 ? -DY : 0 }); if (i) bonds.push({ a: i - 1, b: i, o: 1 }); }
  return { atoms, bonds };
}
const isUp = (mol, i) => mol.atoms[i].y < -1;
function addBranch(mol, i, el = 'C', o = 1, angle = null) {
  const a = mol.atoms[i], up = isUp(mol, i);
  const ang = angle ?? (up ? -90 : 90);
  const t = ang * Math.PI / 180;
  mol.atoms.push({ el, x: a.x + BL * Math.cos(t), y: a.y + BL * Math.sin(t) });
  const j = mol.atoms.length - 1; mol.bonds.push({ a: i, b: j, o }); return j;
}
/* random molecule for bond-line practice */
function randomSkeleton() {
  for (let tries = 0; tries < 50; tries++) {
    const n = R.int(4, 7), m = chain(n);
    const used = new Set();
    const nb = R.int(1, 3);
    for (let k = 0; k < nb; k++) {
      const i = R.int(1, n - 2); if (used.has(i)) continue; used.add(i);
      const kind = R.pick(['Me', 'Me', 'OH', 'Cl', 'O=', 'Br', 'NH2']);
      if (kind === 'Me') addBranch(m, i);
      else if (kind === 'OH') addBranch(m, i, 'O');
      else if (kind === 'NH2') addBranch(m, i, 'N');
      else if (kind === 'Cl') addBranch(m, i, 'Cl');
      else if (kind === 'Br') addBranch(m, i, 'Br');
      else addBranch(m, i, 'O', 2);
    }
    if (Math.random() < .4) { const i = R.int(0, n - 2); const b = m.bonds.find(b => b.a === i && b.b === i + 1); if (b) { b.o = 2; if (m.atoms.some((_, j) => hCount(m, j) < 0)) b.o = 1; } }
    if (m.atoms.every((_, j) => { let u = 0; for (const b of m.bonds) if (b.a === j || b.b === j) u += b.o; return u <= VAL[m.atoms[j].el]; })) return m;
  }
  return chain(5);
}

/* ---------- IUPAC naming of substituted alkanes ---------- */
const PARENT = { 3: 'prop', 4: 'but', 5: 'pent', 6: 'hex', 7: 'hept', 8: 'oct', 9: 'non', 10: 'dec' };
const MULT = { 2: 'di', 3: 'tri', 4: 'tetra' };
function nameFrom(n, subs /* [{pos, name}] positions numbered from left 1..n */) {
  const L = subs.map(s => s.pos).sort((a, b) => a - b), Rr = subs.map(s => n + 1 - s.pos).sort((a, b) => a - b);
  let flip = false, decided = false;
  for (let i = 0; i < L.length; i++) if (L[i] !== Rr[i]) { flip = Rr[i] < L[i]; decided = true; break; }
  if (!decided) { // tie: first-cited (alphabetical) substituent gets lower number
    const first = subs.map(s => s.name).sort()[0];
    const l = Math.min(...subs.filter(s => s.name === first).map(s => s.pos)), r = Math.min(...subs.filter(s => s.name === first).map(s => n + 1 - s.pos));
    flip = r < l;
  }
  return build(n, subs.map(s => ({ name: s.name, pos: flip ? n + 1 - s.pos : s.pos })));
}
function build(n, subs, opt = {}) {
  const groups = {};
  subs.forEach(s => (groups[s.name] ??= []).push(s.pos));
  let names = Object.keys(groups);
  names = opt.noAlpha ? names : names.sort();
  const parts = names.map(nm => { const p = groups[nm].sort((a, b) => a - b); return p.join(',') + '-' + (opt.noMult ? '' : (MULT[p.length] || '')) + nm; });
  let s = parts.join('-');
  s += PARENT[n] + 'ane';
  return s;
}
function randomAlkane() {
  for (let t = 0; t < 100; t++) {
    const n = R.int(5, 8), m = chain(n), subs = [], count = R.int(1, 3), occ = {};
    for (let k = 0; k < count; k++) {
      const kind = R.pick(['methyl', 'methyl', 'methyl', 'ethyl', 'chloro', 'bromo', 'fluoro']);
      let pos;
      if (kind === 'ethyl') { if (n < 7) continue; pos = R.int(4, n - 3); }
      else if (kind === 'methyl') pos = R.int(2, n - 1);
      else pos = R.int(1, n);
      const deg = (pos === 1 || pos === n) ? 1 : 2;
      if ((occ[pos] || 0) + deg >= 4) continue;
      if (kind !== 'methyl' && occ[pos]) continue;
      occ[pos] = (occ[pos] || 0) + 1;
      subs.push({ pos, name: kind });
    }
    if (!subs.length) continue;
    // methyl on C2 and C(n-1) at the same time with n small is fine; ensure no geminal halogen weirdness
    // draw
    const byPos = {};
    subs.forEach(s => (byPos[s.pos] ??= []).push(s.name));
    for (const p in byPos) {
      const i = +p - 1, list = byPos[p], up = isUp(m, i);
      const endAng = i === 0 ? (up ? -150 : 150) : i === n - 1 ? (up ? -30 : 30) : null;
      const angs = list.length === 1 ? [endAng ?? (up ? -90 : 90)] : (up ? [-120, -60] : [120, 60]);
      list.forEach((nm, k) => {
        const el = { methyl: 'C', ethyl: 'C', chloro: 'Cl', bromo: 'Br', fluoro: 'F' }[nm];
        const j = addBranch(m, i, el, 1, angs[k]);
        if (nm === 'ethyl') { const a = m.atoms[j]; const t2 = (angs[k] + (up ? 60 : -60)) * Math.PI / 180; m.atoms.push({ el: 'C', x: a.x + BL * Math.cos(t2), y: a.y + BL * Math.sin(t2) }); m.bonds.push({ a: j, b: m.atoms.length - 1, o: 1 }); }
      });
    }
    const correct = nameFrom(n, subs);
    // distractors
    const wrong = new Set();
    wrong.add(build(n, subs.map(s => ({ ...s, pos: correct === build(n, subs) ? n + 1 - s.pos : s.pos }))));
    wrong.add(build(n, subs.map(s => ({ ...s, pos: correct === build(n, subs) ? n + 1 - s.pos : s.pos }))).replace(/^.*$/, x => x));
    const corrSubs = parseName(correct);
    wrong.add(build(n, corrSubs, { noAlpha: true }).replace(/^/, '') );
    if (corrSubs.some(s => s.name === 'methyl' && (s.pos === 2 || s.pos === n - 1))) {
      // wrong parent: treat a methyl as part of the chain
      const pp = corrSubs.filter(s => !(s.name === 'methyl' && s.pos === 2)).map(s => ({ ...s, pos: s.pos + 1 }));
      wrong.add(pp.length ? build(n + 1, pp) : PARENT[n + 1] + 'ane');
    }
    wrong.add(build(n, corrSubs, { noMult: true }));
    wrong.add(build(n, corrSubs.map(s => ({ ...s, pos: n + 1 - s.pos }))));
    wrong.delete(correct);
    const opts = R.shuffle([correct, ...R.shuffle([...wrong]).slice(0, 3)]);
    if (opts.length < 3) continue;
    return { mol: m, name: correct, options: opts, n, subs };
  }
}
function parseName(nm) { // inverse of build for our generated names
  const out = []; const re = /([\d,]+)-(?:di|tri|tetra)?(methyl|ethyl|chloro|bromo|fluoro)/g; let t;
  while ((t = re.exec(nm))) t[1].split(',').forEach(p => out.push({ pos: +p, name: t[2] }));
  return out;
}

/* ---------- stereochemistry: R/S ---------- */
/* CIP rank list (higher index = higher priority); each first atom differs or the substituent set is resolved at the 2nd sphere */
const CIP = [
  { t: 'H', why: 'H has the lowest atomic number (1)' },
  { t: 'CH<tspan baseline-shift="sub" font-size="70%">3</tspan>', h: 'CH₃', why: 'C attached to (H, H, H)' },
  { t: 'CH<tspan baseline-shift="sub" font-size="70%">2</tspan>CH<tspan baseline-shift="sub" font-size="70%">3</tspan>', h: 'CH₂CH₃', why: 'C attached to (C, H, H)' },
  { t: 'CH=CH<tspan baseline-shift="sub" font-size="70%">2</tspan>', h: 'CH=CH₂', why: 'C attached to (C, C, H): the double bond counts twice' },
  { t: 'CH<tspan baseline-shift="sub" font-size="70%">2</tspan>OH', h: 'CH₂OH', why: 'C attached to (O, H, H)' },
  { t: 'CHO', h: 'CHO', why: 'C attached to (O, O, H): C=O counts as two O' },
  { t: 'COOH', h: 'COOH', why: 'C attached to (O, O, O)' },
  { t: 'NH<tspan baseline-shift="sub" font-size="70%">2</tspan>', h: 'NH₂', why: 'N has atomic number 7' },
  { t: 'OH', h: 'OH', why: 'O has atomic number 8' },
  { t: 'F', why: 'F has atomic number 9' },
  { t: 'Cl', why: 'Cl has atomic number 17' },
  { t: 'Br', why: 'Br has atomic number 35' },
];
CIP.forEach((c, i) => { c.rank = i; c.h = c.h || c.t; });
/* positions: [angleDeg (svg, y down), kind] */
const STEREO_SLOTS = [[-150, 'plain'], [-30, 'plain'], [120, 'wedge'], [60, 'dash']];
function randomStereo() {
  let groups = R.shuffle(CIP.slice(1)).slice(0, 3);
  if (Math.random() < .85) groups.push(CIP[0]); else groups.push(R.shuffle(CIP.slice(1).filter(g => !groups.includes(g)))[0]);
  groups = R.shuffle(groups);
  const slots = STEREO_SLOTS.map(([ang, kind], i) => ({ ang, kind, g: groups[i] }));
  const vec = s => { const t = s.ang * Math.PI / 180; return [Math.cos(t), -Math.sin(t), s.kind === 'wedge' ? 1.1 : s.kind === 'dash' ? -1.1 : 0]; };
  const sorted = slots.slice().sort((a, b) => b.g.rank - a.g.rank);
  const [v1, v2, v3, v4] = sorted.map(vec);
  const d = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const a = d(v1, v4), b = d(v2, v4), c = d(v3, v4);
  const cross = [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]];
  const T = a[0] * cross[0] + a[1] * cross[1] + a[2] * cross[2];
  const config = T < 0 ? 'R' : 'S';
  return { slots, sorted, config, lowest: sorted[3] };
}
function drawStereo(st, opts = {}) {
  const L = 58, out = [];
  for (const s of st.slots) {
    const t = s.ang * Math.PI / 180, x = L * Math.cos(t), y = L * Math.sin(t), ex = (L - 16) * Math.cos(t), ey = (L - 16) * Math.sin(t);
    if (s.kind === 'plain') out.push(`<line x1="0" y1="0" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/>`);
    else if (s.kind === 'wedge') { const nx = -Math.sin(t) * 6, ny = Math.cos(t) * 6; out.push(`<polygon class="wedge" points="0,0 ${(ex + nx).toFixed(1)},${(ey + ny).toFixed(1)} ${(ex - nx).toFixed(1)},${(ey - ny).toFixed(1)}"/>`); }
    else { for (let k = 1; k <= 6; k++) { const f = k / 6.5, w = 6 * f, px = ex * f, py = ey * f, nx = -Math.sin(t) * w, ny = Math.cos(t) * w; out.push(`<line class="hash" x1="${(px + nx).toFixed(1)}" y1="${(py + ny).toFixed(1)}" x2="${(px - nx).toFixed(1)}" y2="${(py - ny).toFixed(1)}"/>`); } }
    const anchor = Math.cos(t) > .3 ? 'start' : Math.cos(t) < -.3 ? 'end' : 'middle';
    const pr = opts.showRank ? `<tspan class="rk" dx="4">${st.sorted.indexOf(s) + 1}</tspan>` : '';
    out.push(`<text class="lab g" x="${(x - (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0)).toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}">${s.g.t}${pr}</text>`);
  }
  out.push(`<circle cx="0" cy="0" r="3.5" class="ctr"/>`);
  return `<svg class="mol stereo" viewBox="-130 -90 260 180" role="img" aria-label="Stereocenter with four groups">${out.join('')}</svg>`;
}

/* ---------- VSEPR ---------- */
const VSEPR = [
  ['CO2', 'C', 2, 0], ['BeCl2', 'Be', 2, 0], ['HCN', 'C', 2, 0],
  ['BF3', 'B', 3, 0], ['SO3', 'S', 3, 0], ['CH2O', 'C', 3, 0], ['CO3^2-', 'C', 3, 0], ['NO3^-', 'N', 3, 0], ['SO2', 'S', 3, 1], ['O3', 'O', 3, 1], ['NO2^-', 'N', 3, 1],
  ['CH4', 'C', 4, 0], ['CCl4', 'C', 4, 0], ['NH4^+', 'N', 4, 0], ['NH3', 'N', 4, 1], ['PCl3', 'P', 4, 1], ['H3O^+', 'O', 4, 1], ['H2O', 'O', 4, 2], ['H2S', 'S', 4, 2],
  ['PCl5', 'P', 5, 0], ['SF4', 'S', 5, 1], ['ClF3', 'Cl', 5, 2], ['XeF2', 'Xe', 5, 3], ['I3^-', 'I', 5, 3],
  ['SF6', 'S', 6, 0], ['BrF5', 'Br', 6, 1], ['XeF4', 'Xe', 6, 2],
].map(([f, c, sn, lp]) => ({ f, c, sn, lp, ...geomInfo(sn, lp) }));
function geomInfo(sn, lp) {
  const T = {
    '2,0': ['linear', 'linear', '180°', 'sp'],
    '3,0': ['trigonal planar', 'trigonal planar', '120°', 'sp²'], '3,1': ['trigonal planar', 'bent', 'slightly less than 120°', 'sp²'],
    '4,0': ['tetrahedral', 'tetrahedral', '109.5°', 'sp³'], '4,1': ['tetrahedral', 'trigonal pyramidal', 'about 107°', 'sp³'], '4,2': ['tetrahedral', 'bent', 'about 104.5°', 'sp³'],
    '5,0': ['trigonal bipyramidal', 'trigonal bipyramidal', '90° and 120°', 'sp³d'], '5,1': ['trigonal bipyramidal', 'seesaw', 'less than 90° and 120°', 'sp³d'], '5,2': ['trigonal bipyramidal', 'T-shaped', 'less than 90°', 'sp³d'], '5,3': ['trigonal bipyramidal', 'linear', '180°', 'sp³d'],
    '6,0': ['octahedral', 'octahedral', '90°', 'sp³d²'], '6,1': ['octahedral', 'square pyramidal', 'less than 90°', 'sp³d²'], '6,2': ['octahedral', 'square planar', '90°', 'sp³d²'],
  }[sn + ',' + lp];
  return { eg: T[0], shape: T[1], angle: T[2], hyb: T[3] };
}
const SHAPES = [...new Set(VSEPR.map(v => v.shape))];
/* ideal 3D directions; lone pairs take equatorial spots in sn5, trans spots in sn6 */
function geomDirs(sn, lp) {
  const s3 = Math.sqrt(3) / 2;
  let d, lpIdx = [];
  if (sn === 2) d = [[1, 0, 0], [-1, 0, 0]];
  else if (sn === 3) { d = [[0, 1, 0], [s3, -.5, 0], [-s3, -.5, 0]]; lpIdx = [0]; }
  else if (sn === 4) { const k = 1 / Math.sqrt(3); d = [[0, 1, 0], [.943, -.333, 0], [-.471, -.333, .816], [-.471, -.333, -.816]]; lpIdx = [0, 1]; void k; }
  else if (sn === 5) { d = [[1, 0, 0], [-.5, 0, s3], [-.5, 0, -s3], [0, 1, 0], [0, -1, 0]]; lpIdx = [0, 1, 2]; }
  else { d = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]; lpIdx = [0, 1]; }
  const lps = lpIdx.slice(0, lp);
  return d.map((v, i) => ({ v, lp: lps.includes(i) }));
}
/* simple rotating 3D renderer on a canvas */
function vseprViewer(canvas, sn, lp, labels = {}) {
  const ctx = canvas.getContext('2d'); let ry = .6, rx = -.35, drag = null, raf = 0, auto = true;
  const dirs = geomDirs(sn, lp);
  const css = getComputedStyle(document.documentElement);
  function draw() {
    const W = canvas.width = canvas.clientWidth * devicePixelRatio, H = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.clearRect(0, 0, W, H);
    const S = Math.min(W, H) * .32, cx = W / 2, cy = H / 2;
    const rot = ([x, y, z]) => { const c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; const c2 = Math.cos(rx), s2 = Math.sin(rx); [y, z] = [y * c2 - z * s2, y * s2 + z * c2]; return [x, y, z]; };
    const items = dirs.map(d => { const p = rot(d.v); return { ...d, p }; });
    items.sort((a, b) => a.p[2] - b.p[2]);
    const half = items.filter(i => i.p[2] < 0), front = items.filter(i => i.p[2] >= 0);
    const ink = css.getPropertyValue('--ink').trim() || '#fff', acc = css.getPropertyValue('--acc').trim() || '#43D9A0', acc2 = css.getPropertyValue('--acc2').trim() || '#7FA9FF';
    const drawItem = it => {
      const [x, y, z] = it.p, sx = cx + x * S, sy = cy - y * S, sc = 1 + z * .18;
      if (it.lp) {
        ctx.save(); ctx.translate(cx + x * S * .62, cy - y * S * .62); ctx.rotate(Math.atan2(-y, x)); ctx.globalAlpha = .28 + z * .08;
        ctx.fillStyle = acc2; ctx.beginPath(); ctx.ellipse(0, 0, S * .42 * sc, S * .2 * sc, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = .9; ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(S * .12, -S * .05, 3 * devicePixelRatio, 0, 7); ctx.arc(S * .12, S * .05, 3 * devicePixelRatio, 0, 7); ctx.fill(); ctx.restore();
      } else {
        ctx.strokeStyle = ink; ctx.globalAlpha = .55 + z * .3; ctx.lineWidth = 7 * devicePixelRatio * sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy); ctx.stroke(); ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(sx - 6, sy - 6, 2, sx, sy, S * .2 * sc); g.addColorStop(0, '#fff'); g.addColorStop(.35, acc); g.addColorStop(1, '#0b3a2c');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, S * .17 * sc, 0, 7); ctx.fill();
      }
    };
    half.forEach(drawItem);
    const g = ctx.createRadialGradient(cx - 8, cy - 8, 3, cx, cy, S * .3); g.addColorStop(0, '#fff'); g.addColorStop(.4, acc2); g.addColorStop(1, '#1a2c66');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, S * .24, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 ${14 * devicePixelRatio}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(labels.center || '', cx, cy);
    front.forEach(drawItem);
  }
  function loop() { if (auto && !drag) ry += .008; draw(); raf = requestAnimationFrame(loop); }
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches; if (rm) auto = false;
  canvas.onpointerdown = e => { drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); };
  canvas.onpointermove = e => { if (!drag) return; ry += (e.clientX - drag[0]) * .01; rx += (e.clientY - drag[1]) * .01; drag = [e.clientX, e.clientY]; };
  canvas.onpointerup = () => { drag = null; };
  loop();
  return () => cancelAnimationFrame(raf);
}

/* exports for node tests */
if (typeof module !== 'undefined') module.exports = { R, sig, gcd, ELEMENTS, EL, econfig, econfigStr, econfigShort, parseConfig, sameOcc, parseFormula, molarMass, hillFormula, chain, addBranch, hCount, molFormula, randomSkeleton, randomAlkane, nameFrom, build, parseName, randomStereo, CIP, VSEPR, SHAPES, geomInfo, drawMol, drawStereo };
