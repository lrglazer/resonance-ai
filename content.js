/* ChemFluent — chapters: lessons ("Learn"), worked examples ("Watch") and question generators ("Do"). */
'use strict';
const sub = SUB, F = fmtFormula;
const mc = (prompt, options, answer, steps, extra = {}) => ({ type: 'mc', prompt, options, answer, steps, ...extra });
function mcFrom(prompt, correct, wrongs, steps, extra) { const opts = R.shuffle([correct, ...R.shuffle([...new Set(wrongs)].filter(w => w !== correct)).slice(0, 3)]); return mc(prompt, opts, opts.indexOf(correct), steps, extra); }
function parseNum(s) {
  s = String(s).trim().replace(/,/g, '').replace(/\s+/g, '');
  const m = s.match(/^([-+]?\d*\.?\d+)(?:(?:[x×*]10\^?|e|E)([-+]?\d+))?/);
  return m ? parseFloat(m[1]) * 10 ** (m[2] ? +m[2] : 0) : NaN;
}
const numQ = (prompt, value, unit, steps, extra = {}) => ({ type: 'num', prompt, value, unit, tol: extra.tol ?? 0.02, steps, ...extra });

/* =====================================================================
   GENERAL CHEMISTRY
   ===================================================================== */
const CH = [];

CH.push({
  id: 'econfig', unit: 'gen', emoji: '⚛️', title: 'Electron configuration',
  blurb: 'Where an atom keeps its electrons, and how to write it down.',
  learn: [
    { h: 'Electrons live in subshells', body: `<p>Every electron sits in an <b>orbital</b>, and orbitals are grouped into <b>subshells</b>: s, p, d and f. Each orbital holds two electrons, so the subshells hold:</p>
      <div class="chips-row"><span class="pill">s = 2</span><span class="pill">p = 6</span><span class="pill">d = 10</span><span class="pill">f = 14</span></div>
      <p>A configuration like <b>1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>4</sup></b> means 2 electrons in 1s, 2 in 2s and 4 in 2p. Add the superscripts and you get the number of electrons: 8, which is oxygen.</p>` },
    { h: 'Fill in this order (Aufbau)', body: `<p>Electrons fill the lowest-energy subshell first. The order is:</p>
      <p class="mono big">1s → 2s → 2p → 3s → 3p → <mark>4s → 3d</mark> → 4p → 5s → 4d → 5p → 6s → 4f → 5d → 6p</p>
      <p><b>The trap:</b> 4s fills <i>before</i> 3d. The periodic table is a map of this order: the s-block is groups 1–2, the d-block is the transition metals, and the p-block is groups 13–18.</p>` },
    { h: 'Shorthand and the two famous exceptions', body: `<p>Write the previous noble gas in brackets, then the rest: iron is <b>[Ar] 4s<sup>2</sup> 3d<sup>6</sup></b>.</p>
      <p>Half-full and full d subshells are extra stable, so <b>chromium</b> and <b>copper</b> steal an electron from 4s:</p>
      <p class="mono">Cr: [Ar] 4s<sup>1</sup> 3d<sup>5</sup> &nbsp;·&nbsp; Cu: [Ar] 4s<sup>1</sup> 3d<sup>10</sup></p>
      <p><b>Valence electrons</b> are the ones in the outermost shell (highest n). For main-group elements that's the s and p electrons of the last row.</p>` },
  ],
  gen() {
    const kind = R.pick(['write', 'write', 'which', 'valence']);
    if (kind === 'which') {
      const Z = R.int(3, 36), e = ELEMENTS[Z - 1];
      const wrongs = [Z - 1, Z + 1, Z + 2, Z - 2].filter(z => z >= 1 && z <= 54).map(z => ELEMENTS[z - 1].name);
      return mcFrom(`Which element has this configuration?<div class="cfg">${econfigShort(Z)}</div>`, e.name, wrongs,
        [`Count the electrons: ${econfigStr(Z)} adds up to <b>${Z}</b>.`, `Atomic number ${Z} is <b>${e.name} (${e.sym})</b>.`]);
    }
    if (kind === 'valence') {
      const pool = ELEMENTS.filter(e => e.Z <= 54 && (e.group <= 2 || e.group >= 13));
      const e = R.pick(pool), v = e.group <= 2 ? e.group : e.group - 10;
      return mcFrom(`How many valence electrons does <b>${e.name} (${e.sym})</b> have?`, String(v), ['1', '2', '3', '4', '5', '6', '7', '8'].filter(x => +x !== v),
        [`${e.name} is in group ${e.group}.`, e.group <= 2 ? `Groups 1–2: valence electrons = group number = <b>${v}</b>.` : `Groups 13–18: valence electrons = group number − 10 = <b>${v}</b>.`, `Check: ${econfigShort(e.Z)} — the outermost shell holds ${v}.`]);
    }
    const Z = R.pick([...Array(36).keys()].map(i => i + 1).concat([24, 29, 26, 35, 47]).filter(z => z !== 47 || true)), e = ELEMENTS[Z - 1];
    return {
      type: 'text', prompt: `Write the electron configuration of <b>${e.name} (${e.sym}, Z = ${Z})</b>. Full or noble-gas shorthand both work.`,
      placeholder: Z > 18 ? 'e.g. [Ar] 4s2 3d6' : 'e.g. 1s2 2s2 2p4',
      check: s => { const o = parseConfig(s); return !!o && sameOcc(o, econfig(Z)); },
      answerText: econfigShort(Z),
      steps: [`${e.sym} has <b>${Z}</b> electrons.`, `Fill in Aufbau order: ${econfigStr(Z)}.`, `Shorthand: <b>${econfigShort(Z)}</b>.`, ...(Z === 24 || Z === 29 || Z === 47 ? ['This is an exception: one 4s electron moves into 3d to make a half-full or full d subshell.'] : [])],
    };
  },
});

const FC_CASES = [['C', 4, 4, 0], ['C', 4, 3, 0], ['C', 4, 3, 1], ['N', 5, 3, 1], ['N', 5, 4, 0], ['N', 5, 2, 2], ['O', 6, 2, 2], ['O', 6, 3, 1], ['O', 6, 1, 3], ['B', 3, 3, 0], ['B', 3, 4, 0], ['Cl', 7, 1, 3], ['S', 6, 2, 2], ['S', 6, 3, 1]];
function drawFC(el, b, lp) {
  const ang = { 1: [180], 2: [180, 0], 3: [180, -60, 60], 4: [180, 0, -90, 90] }[b] || [];
  const free = [0, 90, -90, 180, -60, 60, 120, -120].filter(a => !ang.some(x => Math.abs(((x - a + 540) % 360) - 180) < 50));
  let s = '';
  ang.forEach(a => { const t = a * Math.PI / 180; s += `<line x1="${(16 * Math.cos(t)).toFixed(1)}" y1="${(16 * Math.sin(t)).toFixed(1)}" x2="${(52 * Math.cos(t)).toFixed(1)}" y2="${(52 * Math.sin(t)).toFixed(1)}"/><text class="lab g" x="${(66 * Math.cos(t)).toFixed(1)}" y="${(66 * Math.sin(t)).toFixed(1)}">R</text>`; });
  free.slice(0, lp).forEach(a => { const t = a * Math.PI / 180, cx = 22 * Math.cos(t), cy = 22 * Math.sin(t), px = -Math.sin(t) * 5, py = Math.cos(t) * 5; s += `<circle class="dot" cx="${(cx + px).toFixed(1)}" cy="${(cy + py).toFixed(1)}" r="3"/><circle class="dot" cx="${(cx - px).toFixed(1)}" cy="${(cy - py).toFixed(1)}" r="3"/>`; });
  return `<svg class="mol" viewBox="-90 -80 180 160">${s}<text class="lab" x="0" y="0">${el}</text></svg>`;
}
CH.push({
  id: 'formal', unit: 'gen', emoji: '✏️', title: 'Lewis structures & formal charge',
  blurb: 'Spot charges on atoms in seconds, the skill every mechanism depends on.',
  learn: [
    { h: 'The formula', body: `<p class="formula">formal charge = (valence e⁻) − (lone-pair e⁻) − (bonds)</p><p>Count every <b>bond</b> once (a double bond counts as 2) and every <b>lone-pair electron</b> individually (one pair = 2).</p>` },
    { h: 'Learn the patterns, skip the math', body: `<table class="tbl"><tr><th></th><th>−1</th><th>0</th><th>+1</th></tr>
      <tr><td><b>C</b></td><td>3 bonds + 1 pair</td><td>4 bonds</td><td>3 bonds, no pair</td></tr>
      <tr><td><b>N</b></td><td>2 bonds + 2 pairs</td><td>3 bonds + 1 pair</td><td>4 bonds</td></tr>
      <tr><td><b>O</b></td><td>1 bond + 3 pairs</td><td>2 bonds + 2 pairs</td><td>3 bonds + 1 pair</td></tr></table>
      <p>Organic chemists recognize these at a glance. Once you know them, you'll see charges on every structure without counting.</p>` },
  ],
  gen() {
    const [el, V, b, lp] = R.pick(FC_CASES), fc = V - 2 * lp - b, show = fc > 0 ? '+' + fc : String(fc);
    return mcFrom(`What is the formal charge on <b>${el}</b>?`, show, ['−1', '0', '+1', '+2', '−2'].map(x => x.replace('−', '-')).filter(x => x !== show), [
      `${el} has <b>${V}</b> valence electrons.`, `It has ${lp} lone pair${lp === 1 ? '' : 's'} (${2 * lp} electrons) and ${b} bond${b === 1 ? '' : 's'}.`, `${V} − ${2 * lp} − ${b} = <b>${show}</b>.`], { visual: drawFC(el, b, lp) });
  },
});

CH.push({
  id: 'vsepr', unit: 'gen', emoji: '🔺', title: 'VSEPR shapes & hybridization',
  blurb: 'Predict 3D shape and hybridization from a Lewis structure.', viewer: true,
  learn: [
    { h: 'Count electron groups', body: `<p><b>Steric number</b> = atoms bonded to the central atom + lone pairs on it. A double or triple bond counts as <b>one</b> group.</p><p>Electron groups push as far apart as possible. That sets the <b>electron geometry</b>; the <b>molecular shape</b> only describes where the atoms are.</p>` },
    { h: 'The table to memorize', body: `<table class="tbl"><tr><th>Groups</th><th>Lone pairs</th><th>Shape</th><th>Angle</th><th>Hybrid.</th></tr>
      <tr><td>2</td><td>0</td><td>linear</td><td>180°</td><td>sp</td></tr><tr><td>3</td><td>0 / 1</td><td>trigonal planar / bent</td><td>120°</td><td>sp²</td></tr>
      <tr><td>4</td><td>0 / 1 / 2</td><td>tetrahedral / trigonal pyramidal / bent</td><td>109.5°</td><td>sp³</td></tr>
      <tr><td>5</td><td>0–3</td><td>trig. bipyramidal / seesaw / T-shaped / linear</td><td>90°, 120°</td><td>sp³d</td></tr>
      <tr><td>6</td><td>0–2</td><td>octahedral / square pyramidal / square planar</td><td>90°</td><td>sp³d²</td></tr></table>
      <p>Shortcut: <b>hybridization = steric number</b>. 2 → sp, 3 → sp², 4 → sp³.</p>` },
  ],
  gen() {
    const v = R.pick(VSEPR), name = F(v.f), kind = R.pick(['shape', 'shape', 'hyb', 'angle']);
    const steps = [`Central atom: <b>${v.c}</b>.`, `Steric number = <b>${v.sn}</b> (${v.sn - v.lp} bonded atom${v.sn - v.lp === 1 ? '' : 's'} + ${v.lp} lone pair${v.lp === 1 ? '' : 's'}).`, `Electron geometry: ${v.eg}. Molecular shape: <b>${v.shape}</b>, angle ${v.angle}, hybridization <b>${v.hyb}</b>.`];
    const vis = { sn: v.sn, lp: v.lp, center: v.c };
    if (kind === 'shape') return mcFrom(`What is the molecular shape of <b>${name}</b>?`, v.shape, SHAPES, steps, { geo: vis });
    if (kind === 'hyb') return mcFrom(`What is the hybridization of the central atom in <b>${name}</b>?`, v.hyb, ['sp', 'sp²', 'sp³', 'sp³d', 'sp³d²'], steps, { geo: vis });
    return mcFrom(`What is the approximate bond angle in <b>${name}</b>?`, v.angle, ['180°', '120°', '109.5°', 'about 107°', 'about 104.5°', '90°', 'slightly less than 120°', '90° and 120°'], steps, { geo: vis });
  },
});

const COMPOUNDS = ['H2O', 'CO2', 'NaCl', 'C6H12O6', 'CaCO3', 'H2SO4', 'NH3', 'Ca(OH)2', 'Al2(SO4)3', 'CuSO4·5H2O', 'C2H5OH', 'KMnO4', 'Mg(NO3)2', 'NaHCO3', 'Fe2O3', 'CH4', 'C8H18', 'HCl', '(NH4)3PO4', 'C12H22O11', 'NaOH', 'K2Cr2O7'];
CH.push({
  id: 'moles', unit: 'gen', emoji: '⚖️', title: 'Moles & molar mass',
  blurb: 'Convert between grams, moles and particles without second-guessing.',
  learn: [
    { h: 'The mole is just a number', body: `<p>1 mole = <b>6.022 × 10²³</b> particles (Avogadro's number), the same way 1 dozen = 12.</p><p><b>Molar mass</b> (g/mol) is the mass of one mole. Add up the atomic masses: H₂O = 2(1.008) + 15.999 = <b>18.02 g/mol</b>.</p>` },
    { h: 'The conversion map', body: `<div class="map"><span>grams</span><em>÷ molar mass →<br>← × molar mass</em><span>moles</span><em>× 6.022×10²³ →<br>← ÷ 6.022×10²³</em><span>particles</span></div><p>Always go <b>through moles</b>. Never jump straight from grams to particles.</p>` },
  ],
  gen() {
    const f = R.pick(COMPOUNDS), M = molarMass(f), kind = R.pick(['mm', 'g2m', 'm2g', 'g2n']);
    const mmStep = `Molar mass of ${F(f)}: ${Object.entries(parseFormula(f)).map(([k, n]) => `${n > 1 ? n + '(' : ''}${EL[k].mass}${n > 1 ? ')' : ''}`).join(' + ')} = <b>${M.toFixed(2)} g/mol</b>.`;
    if (kind === 'mm') return numQ(`What is the molar mass of <b>${F(f)}</b>?`, M, 'g/mol', [mmStep], { tol: .006 });
    if (kind === 'g2m') { const g = R.real(5, 250, 1); return numQ(`How many moles are in <b>${g} g</b> of ${F(f)}?`, g / M, 'mol', [mmStep, `moles = grams ÷ molar mass = ${g} ÷ ${M.toFixed(2)} = <b>${sig(g / M)}</b> mol.`]); }
    if (kind === 'm2g') { const n = R.real(.05, 4, 2); return numQ(`What is the mass of <b>${n} mol</b> of ${F(f)}?`, n * M, 'g', [mmStep, `grams = moles × molar mass = ${n} × ${M.toFixed(2)} = <b>${sig(n * M)}</b> g.`]); }
    const g = R.real(1, 100, 1), N = g / M * 6.022e23;
    return numQ(`How many molecules (formula units) are in <b>${g} g</b> of ${F(f)}?`, N, 'particles', [mmStep, `moles = ${g} ÷ ${M.toFixed(2)} = ${sig(g / M)} mol.`, `particles = ${sig(g / M)} × 6.022 × 10²³ = <b>${sig(N)}</b>.`], { placeholder: 'e.g. 3.01e23' });
  },
});

const EQS = [
  ['H2 + O2 -> H2O', [2, 1, 2]], ['CH4 + O2 -> CO2 + H2O', [1, 2, 1, 2]], ['C3H8 + O2 -> CO2 + H2O', [1, 5, 3, 4]], ['Fe + O2 -> Fe2O3', [4, 3, 2]], ['Al + O2 -> Al2O3', [4, 3, 2]],
  ['N2 + H2 -> NH3', [1, 3, 2]], ['KClO3 -> KCl + O2', [2, 2, 3]], ['C2H6 + O2 -> CO2 + H2O', [2, 7, 4, 6]], ['Na + H2O -> NaOH + H2', [2, 2, 2, 1]], ['Fe2O3 + CO -> Fe + CO2', [1, 3, 2, 3]],
  ['C6H12O6 + O2 -> CO2 + H2O', [1, 6, 6, 6]], ['Al + HCl -> AlCl3 + H2', [2, 6, 2, 3]], ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', [3, 2, 1, 6]], ['NH3 + O2 -> NO + H2O', [4, 5, 4, 6]], ['C4H10 + O2 -> CO2 + H2O', [2, 13, 8, 10]],
  ['Mg + HCl -> MgCl2 + H2', [1, 2, 1, 1]], ['P4 + O2 -> P4O10', [1, 5, 1]], ['H2O2 -> H2O + O2', [2, 2, 1]], ['Cu + AgNO3 -> Cu(NO3)2 + Ag', [1, 2, 1, 2]], ['C2H5OH + O2 -> CO2 + H2O', [1, 3, 2, 3]],
  ['SO2 + O2 -> SO3', [2, 1, 2]], ['Pb(NO3)2 + KI -> PbI2 + KNO3', [1, 2, 1, 2]], ['Na2CO3 + HCl -> NaCl + H2O + CO2', [1, 2, 2, 1, 1]], ['Zn + HCl -> ZnCl2 + H2', [1, 2, 1, 1]],
].map(([e, c]) => { const [l, r] = e.split(' -> '); return { L: l.split(' + '), R: r.split(' + '), c }; });
function isBalanced(eq, co) {
  const tally = {}; const add = (f, k, s) => { const c = parseFormula(f); for (const x in c) tally[x] = (tally[x] || 0) + s * k * c[x]; };
  eq.L.forEach((f, i) => add(f, co[i], 1)); eq.R.forEach((f, i) => add(f, co[eq.L.length + i], -1));
  return Object.values(tally).every(v => v === 0);
}
CH.push({
  id: 'balance', unit: 'gen', emoji: '⚖', title: 'Balancing equations',
  blurb: 'Atoms are never created or destroyed. Make the equation say so.',
  learn: [
    { h: 'Only change coefficients', body: `<p>A balanced equation has the same number of each atom on both sides. You can only change the <b>coefficients</b> (the big numbers in front), never the subscripts. Changing a subscript changes the substance.</p>` },
    { h: 'A system that always works', body: `<ol><li>Balance the element that appears in the <b>fewest</b> formulas first (usually a metal or C).</li><li>Leave <b>H</b> and <b>O</b> for last, and save any element that appears alone (like O₂ or H₂) for the very end.</li><li>If you end up with a fraction, multiply everything by the denominator.</li><li>Reduce to the smallest whole numbers and recount every atom.</li></ol><p>Combustion trick: balance C, then H, then O with O₂.</p>` },
  ],
  gen() {
    const eq = R.pick(EQS);
    return { type: 'balance', eq, prompt: 'Balance this equation with the smallest whole-number coefficients.', check: co => co.every(x => x > 0 && Number.isInteger(x)) && isBalanced(eq, co) && co.reduce(gcd) === 1,
      answerText: eqHTML(eq, eq.c), steps: [`Balanced: <b>${eqHTML(eq, eq.c)}</b>`, 'Check by counting each element on both sides: they match, and the coefficients share no common factor.'] };
  },
});
function eqHTML(eq, co) { const s = (arr, off) => arr.map((f, i) => `${co && co[off + i] > 1 ? co[off + i] + ' ' : ''}${F(f)}`).join(' + '); return `${s(eq.L, 0)} → ${s(eq.R, eq.L.length)}`; }

CH.push({
  id: 'stoich', unit: 'gen', emoji: '🧮', title: 'Reaction stoichiometry',
  blurb: 'Grams of A → moles of A → moles of B → grams of B.',
  learn: [
    { h: 'The bridge is the mole ratio', body: `<p>The coefficients in a balanced equation are <b>mole ratios</b>. In 2 H₂ + O₂ → 2 H₂O, every 2 mol H₂ makes 2 mol H₂O.</p><div class="map"><span>g A</span><em>÷ M<sub>A</sub></em><span>mol A</span><em>× (b / a)</em><span>mol B</span><em>× M<sub>B</sub></em><span>g B</span></div>` },
  ],
  gen() {
    const eq = R.pick(EQS.filter(e => e.L.length + e.R.length >= 3)), all = [...eq.L, ...eq.R];
    const ia = R.int(0, eq.L.length - 1), ib = R.int(eq.L.length, all.length - 1), A = all[ia], B = all[ib], ca = eq.c[ia], cb = eq.c[ib];
    const g = R.real(5, 120, 1), MA = molarMass(A), MB = molarMass(B), ans = g / MA * cb / ca * MB;
    return numQ(`<div class="eq">${eqHTML(eq, eq.c)}</div>How many grams of <b>${F(B)}</b> form from <b>${g} g</b> of ${F(A)} (everything else in excess)?`, ans, 'g', [
      `mol ${F(A)} = ${g} ÷ ${MA.toFixed(2)} = ${sig(g / MA)} mol.`, `Mole ratio ${F(B)} : ${F(A)} = ${cb} : ${ca}, so mol ${F(B)} = ${sig(g / MA * cb / ca)} mol.`, `grams ${F(B)} = ${sig(g / MA * cb / ca)} × ${MB.toFixed(2)} = <b>${sig(ans)}</b> g.`]);
  },
});

CH.push({
  id: 'gas', unit: 'gen', emoji: '🎈', title: 'Gas laws',
  blurb: 'PV = nRT and the combined gas law, with units that never trip you up.',
  learn: [
    { h: 'One law to rule them all', body: `<p class="formula">PV = nRT</p><p>Use <b>R = 0.08206 L·atm/(mol·K)</b> with P in atm, V in liters and <b>T in kelvin</b> (K = °C + 273.15). Wrong units are the #1 lost point on gas problems.</p>` },
    { h: 'When n is constant: combined gas law', body: `<p class="formula">P₁V₁ / T₁ = P₂V₂ / T₂</p><p>Cross out whatever stays constant. Constant T gives Boyle's law (P₁V₁ = P₂V₂). Constant P gives Charles's law (V₁/T₁ = V₂/T₂).</p><p>1 atm = 760 mmHg = 760 torr = 101.325 kPa.</p>` },
  ],
  gen() {
    const Rg = 0.08206, n = R.real(.2, 3, 2), T = R.int(250, 420), V = R.real(2, 40, 1), P = n * Rg * T / V, kind = R.pick(['P', 'V', 'n', 'T', 'comb', 'C']);
    if (kind === 'C') { const C = R.int(-20, 120), Tk = C + 273.15, nn = R.real(.3, 2.5, 2), VV = R.real(5, 30, 1), PP = nn * Rg * Tk / VV;
      return numQ(`${nn} mol of gas is held in a ${VV} L tank at <b>${C} °C</b>. What is the pressure in atm?`, PP, 'atm', [`Convert temperature: ${C} + 273.15 = ${Tk.toFixed(2)} K.`, `P = nRT / V = (${nn})(0.08206)(${Tk.toFixed(2)}) / ${VV} = <b>${sig(PP)}</b> atm.`]); }
    if (kind === 'comb') { const P1 = R.real(.8, 3, 2), V1 = R.real(2, 20, 1), T1 = R.int(260, 350), P2 = R.real(.5, 4, 2), T2 = R.int(260, 420), V2 = P1 * V1 * T2 / (T1 * P2);
      return numQ(`A gas at ${P1} atm, ${V1} L and ${T1} K changes to ${P2} atm and ${T2} K. What is the new volume?`, V2, 'L', [`P₁V₁/T₁ = P₂V₂/T₂, so V₂ = P₁V₁T₂ / (T₁P₂).`, `V₂ = (${P1})(${V1})(${T2}) / ((${T1})(${P2})) = <b>${sig(V2)}</b> L.`]); }
    const q = { P: [`${n} mol of gas at ${T} K occupies ${V} L. What is the pressure?`, P, 'atm', `P = nRT / V = (${n})(0.08206)(${T}) / ${V}`],
      V: [`What volume does ${n} mol of gas occupy at ${sig(P)} atm and ${T} K?`, V, 'L', `V = nRT / P = (${n})(0.08206)(${T}) / ${sig(P)}`],
      n: [`How many moles of gas are in a ${V} L container at ${sig(P)} atm and ${T} K?`, n, 'mol', `n = PV / RT = (${sig(P)})(${V}) / ((0.08206)(${T}))`],
      T: [`${n} mol of gas in a ${V} L container has a pressure of ${sig(P)} atm. What is the temperature in kelvin?`, T, 'K', `T = PV / nR = (${sig(P)})(${V}) / ((${n})(0.08206))`] }[kind];
    return numQ(q[0], q[1], q[2], ['Use PV = nRT with R = 0.08206 L·atm/(mol·K).', `${q[3]} = <b>${sig(q[1])}</b> ${q[2]}.`]);
  },
});

const WEAK = [['acetic acid', 'CH3COOH', 1.8e-5], ['formic acid', 'HCOOH', 1.8e-4], ['hydrofluoric acid', 'HF', 6.8e-4], ['nitrous acid', 'HNO2', 4.5e-4], ['hydrocyanic acid', 'HCN', 6.2e-10], ['benzoic acid', 'C6H5COOH', 6.3e-5], ['hypochlorous acid', 'HOCl', 3.0e-8]];
CH.push({
  id: 'ph', unit: 'gen', emoji: '🧪', title: 'Acids, bases & pH',
  blurb: 'pH from concentration, weak acids with Ka, and buffers.',
  learn: [
    { h: 'pH in one line', body: `<p class="formula">pH = −log[H₃O⁺] &nbsp;·&nbsp; pOH = −log[OH⁻] &nbsp;·&nbsp; pH + pOH = 14</p><p><b>Strong acids</b> (HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄) ionize completely, so [H₃O⁺] = the acid concentration. <b>Strong bases</b> (NaOH, KOH) give [OH⁻] = their concentration.</p>` },
    { h: 'Weak acids: use Ka', body: `<p>A weak acid only partly ionizes: HA ⇌ H⁺ + A⁻, with K<sub>a</sub> = x² / (C − x). If x is small compared with C, <b>x ≈ √(K<sub>a</sub>·C)</b>. Check the 5% rule: if x/C &gt; 5%, solve the quadratic instead.</p>` },
    { h: 'Buffers: Henderson–Hasselbalch', body: `<p class="formula">pH = pK<sub>a</sub> + log([A⁻] / [HA])</p><p>When [A⁻] = [HA], pH = pK<sub>a</sub>. That's why a buffer works best within ±1 pH unit of its pK<sub>a</sub>.</p>` },
  ],
  gen() {
    const kind = R.pick(['sa', 'sb', 'wa', 'buf']);
    if (kind === 'sa') { const c = R.pick([1, 2, 5]) * 10 ** -R.int(1, 4), a = R.pick(['HCl', 'HNO3', 'HBr']); const pH = -Math.log10(c);
      return numQ(`What is the pH of <b>${sig(c, 2)} M ${F(a)}</b>?`, pH, '', [`${F(a)} is a strong acid, so [H₃O⁺] = ${sig(c, 2)} M.`, `pH = −log(${sig(c, 2)}) = <b>${pH.toFixed(2)}</b>.`], { tol: .01, abs: .02 }); }
    if (kind === 'sb') { const c = R.pick([1, 2, 5]) * 10 ** -R.int(1, 4), pOH = -Math.log10(c), pH = 14 - pOH;
      return numQ(`What is the pH of <b>${sig(c, 2)} M NaOH</b>?`, pH, '', [`NaOH is a strong base, so [OH⁻] = ${sig(c, 2)} M.`, `pOH = −log(${sig(c, 2)}) = ${pOH.toFixed(2)}.`, `pH = 14 − ${pOH.toFixed(2)} = <b>${pH.toFixed(2)}</b>.`], { tol: .01, abs: .02 }); }
    const [nm, f, Ka] = R.pick(WEAK);
    if (kind === 'wa') { const C = R.pick([.01, .05, .1, .2, .5, 1]), x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2, pH = -Math.log10(x);
      return numQ(`What is the pH of <b>${C} M ${nm}</b> (K<sub>a</sub> = ${sig(Ka, 2)})?`, pH, '', [`Set up K<sub>a</sub> = x² / (${C} − x).`, `x ≈ √(${sig(Ka, 2)} × ${C}) = ${sig(Math.sqrt(Ka * C))} (exact: ${sig(x)}).`, `pH = −log(${sig(x)}) = <b>${pH.toFixed(2)}</b>.`], { tol: .01, abs: .03 }); }
    const ha = R.real(.05, .5, 2), a = R.real(.05, .5, 2), pKa = -Math.log10(Ka), pH = pKa + Math.log10(a / ha);
    return numQ(`A buffer contains <b>${ha} M ${nm}</b> and <b>${a} M</b> of its conjugate base (K<sub>a</sub> = ${sig(Ka, 2)}). What is the pH?`, pH, '', [`pK<sub>a</sub> = −log(${sig(Ka, 2)}) = ${pKa.toFixed(2)}.`, `pH = ${pKa.toFixed(2)} + log(${a} / ${ha}) = <b>${pH.toFixed(2)}</b>.`], { tol: .01, abs: .03 });
  },
});

/* =====================================================================
   ORGANIC CHEMISTRY  (taught the "second language" way: skills first)
   ===================================================================== */
CH.push({
  id: 'bondline', unit: 'org', emoji: '〰️', title: 'Reading bond-line drawings',
  blurb: 'The alphabet of organic chemistry: see every hidden carbon and hydrogen.',
  learn: [
    { h: 'Every corner is a carbon', body: `<p>In a bond-line (skeletal) drawing, every <b>corner</b> and every <b>line end</b> is a carbon atom. Carbon labels are left off, and so are the H's attached to carbon.</p><p>Heteroatoms (O, N, Cl…) are always written, along with their H's.</p>` },
    { h: 'Finding the hidden hydrogens', body: `<p>Carbon always makes <b>4 bonds</b>. Count the lines touching a carbon (a double bond counts as 2). Whatever is missing to reach 4 is the number of H's.</p><table class="tbl"><tr><th>Lines to C</th><th>Hidden H</th></tr><tr><td>1 (line end)</td><td>3 → CH₃</td></tr><tr><td>2</td><td>2 → CH₂</td></tr><tr><td>3</td><td>1 → CH</td></tr><tr><td>4</td><td>0</td></tr></table>` },
  ],
  gen() {
    const m = randomSkeleton();
    if (Math.random() < .55) {
      const cs = m.atoms.map((a, i) => i).filter(i => m.atoms[i].el === 'C'), i = R.pick(cs), h = hCount(m, i);
      let lines = 0; for (const b of m.bonds) if (b.a === i || b.b === i) lines += b.o;
      return mcFrom('How many hydrogens are on the <b>highlighted carbon</b>?', String(h), ['0', '1', '2', '3'], [`Count the bonds to that carbon: <b>${lines}</b>${m.bonds.some(b => (b.a === i || b.b === i) && b.o === 2) ? ' (the double bond counts as 2)' : ''}.`, `Carbon needs 4, so it has 4 − ${lines} = <b>${h}</b> hidden H.`], { visual: drawMol(m, { hl: i }) });
    }
    const f = molFormula(m), c = parseFormula(f), wrong = [];
    for (const d of [-2, -1, 1, 2]) wrong.push(hillFormula({ ...c, H: c.H + d }));
    wrong.push(hillFormula({ ...c, C: c.C - 1, H: c.H - 2 }));
    return mcFrom('What is the molecular formula?', F(f), wrong.map(F), [`Count the carbons (every corner and end): <b>${c.C}</b>.`, `Add up the hidden H on each carbon, plus H's shown on heteroatoms: <b>${c.H}</b>.`, `Formula: <b>${F(f)}</b>.`], { visual: drawMol(m) });
  },
});

const FG = [['alcohol', 'CH<sub>3</sub>CH<sub>2</sub><b>OH</b>', 'ethanol'], ['ether', 'CH<sub>3</sub><b>O</b>CH<sub>3</sub>', 'dimethyl ether'], ['aldehyde', 'CH<sub>3</sub><b>CHO</b>', 'acetaldehyde'], ['ketone', 'CH<sub>3</sub><b>CO</b>CH<sub>3</sub>', 'acetone'],
  ['carboxylic acid', 'CH<sub>3</sub><b>COOH</b>', 'acetic acid'], ['ester', 'CH<sub>3</sub><b>COO</b>CH<sub>3</sub>', 'methyl acetate'], ['amide', 'CH<sub>3</sub><b>CONH<sub>2</sub></b>', 'acetamide'], ['amine', 'CH<sub>3</sub>CH<sub>2</sub><b>NH<sub>2</sub></b>', 'ethylamine'],
  ['nitrile', 'CH<sub>3</sub><b>C≡N</b>', 'acetonitrile'], ['acid chloride', 'CH<sub>3</sub><b>COCl</b>', 'acetyl chloride'], ['alkyl halide', 'CH<sub>3</sub>CH<sub>2</sub><b>Br</b>', 'bromoethane'], ['alkene', 'CH<sub>2</sub><b>=</b>CH<sub>2</sub>', 'ethylene'],
  ['alkyne', 'HC<b>≡</b>CH', 'acetylene'], ['thiol', 'CH<sub>3</sub>CH<sub>2</sub><b>SH</b>', 'ethanethiol'], ['anhydride', '(CH<sub>3</sub><b>CO</b>)<sub>2</sub><b>O</b>', 'acetic anhydride'], ['phenol', 'C<sub>6</sub>H<sub>5</sub><b>OH</b>', 'phenol']];
CH.push({
  id: 'fg', unit: 'org', emoji: '🧩', title: 'Functional groups',
  blurb: 'The reactive parts of molecules. Recognize them instantly.',
  learn: [
    { h: 'Why they matter', body: `<p>Molecules with the same functional group react the same way. Learn ~15 groups and you can predict the chemistry of millions of compounds.</p>` },
    { h: 'The carbonyl family (C=O)', body: `<table class="tbl"><tr><th>Group</th><th>Pattern</th></tr><tr><td>aldehyde</td><td>R–CHO (C=O at the end)</td></tr><tr><td>ketone</td><td>R–CO–R (C=O in the middle)</td></tr><tr><td>carboxylic acid</td><td>R–COOH</td></tr><tr><td>ester</td><td>R–COO–R</td></tr><tr><td>amide</td><td>R–CONH₂</td></tr><tr><td>acid chloride</td><td>R–COCl</td></tr></table>` },
    { h: 'The rest', body: `<p><b>Alcohol</b> R–OH · <b>ether</b> R–O–R · <b>amine</b> R–NH₂ · <b>alkyl halide</b> R–X · <b>nitrile</b> R–C≡N · <b>thiol</b> R–SH · <b>alkene</b> C=C · <b>alkyne</b> C≡C · <b>phenol</b> OH on a benzene ring.</p>` },
  ],
  gen() {
    const [g, s, nm] = R.pick(FG);
    return mcFrom(`Which functional group is in <b>${nm}</b>?<div class="cfg">${s}</div>`, g, FG.map(x => x[0]), [`The bold part, ${s.match(/<b>(.*?)<\/b>/)[1]}, is the functional group.`, `That pattern is a <b>${g}</b>.`]);
  },
});

const RES_Q = [
  ['In resonance structures, what moves?', 'Only electrons (lone pairs and π bonds)', ['Atoms and electrons', 'Only atoms', 'σ bonds'], 'Atoms never move between resonance structures. Only π electrons and lone pairs do.'],
  ['A curved arrow starts at…', 'a lone pair or a bond (electrons)', ['an atom with a positive charge', 'the atom receiving electrons', 'a hydrogen'], 'Arrows show electron flow, so they always start at electrons: a lone pair or a bond.'],
  ['Which contributor is usually the most important?', 'The one with full octets and the fewest charges', ['The one with the most charges', 'The one with a negative charge on carbon', 'The one with the most double bonds'], 'Best contributors: full octets first, then fewest formal charges, then negative charge on the more electronegative atom.'],
  ['What is the resonance hybrid?', 'The real molecule: a blend of all contributors', ['The most stable contributor', 'A structure that flips back and forth', 'The structure with the most bonds'], 'No single contributor is real. The molecule is a weighted average, the hybrid.'],
  ['Allylic carbocations are stabilized because…', 'the positive charge is delocalized over two carbons', ['carbon gains an extra bond', 'a hydrogen shifts', 'the charge disappears'], 'Resonance spreads the + charge between the two ends of the allyl system.'],
  ['Why is the C–O bond length the same for both oxygens in acetate?', 'Resonance makes both C–O bonds a hybrid of single and double', ['One O is protonated', 'Both are double bonds', 'Both are single bonds'], 'The negative charge and π bond are shared equally, so both bonds are about 1.5 bonds.'],
  ['Which can NOT be the start of a resonance arrow?', 'A C–H σ bond', ['A lone pair on oxygen', 'A C=C π bond', 'A C=O π bond'], 'Resonance only moves π electrons and lone pairs. σ bonds stay put.'],
  ['When pushing electrons, carbon can have at most…', '8 valence electrons', ['10 valence electrons', '6 valence electrons', '12 valence electrons'], 'Second-row atoms (C, N, O) can never exceed an octet.'],
];
CH.push({
  id: 'resonance', unit: 'org', emoji: '🔁', title: 'Resonance (Pushing electrons)',
  blurb: 'Curved arrows, contributors and the hybrid, with animated practice.', launch: 'resonance.html',
  learn: [
    { h: 'Resonance is a drawing problem', body: `<p>Some molecules can't be drawn with one structure. We draw several <b>contributors</b>, connected by ↔, and the real molecule is the <b>hybrid</b>.</p><p>Atoms never move. Only <b>π electrons</b> and <b>lone pairs</b> move, and you show them with <b>curved arrows</b>.</p>` },
    { h: 'The five patterns (Klein)', body: `<ol><li>Allylic lone pair</li><li>Allylic positive charge</li><li>Lone pair next to a positive charge</li><li>π bond between two atoms of different electronegativity (C=O)</li><li>Conjugated π bonds in a ring</li></ol><p>Spot the pattern and you know where the arrows go. Open the animated <b>Pushing electrons</b> lab to see all five in 65 molecules.</p>` },
  ],
  gen() { const [q, a, w, why] = R.pick(RES_Q); return mcFrom(q, a, w, [why]); },
});

const ACIDS = [['HI', -10, 'A', 'I is a huge atom, so I⁻ spreads its charge over a big volume'], ['HBr', -9, 'A', 'Br is large'], ['HCl', -7, 'A', 'Cl⁻ is a stable halide'], ['H<sub>3</sub>O<sup>+</sup>', -1.7, 'C', 'positively charged acids are very strong'],
  ['CF<sub>3</sub>COOH', 0.2, 'I', 'three fluorines pull electron density away (induction)'], ['HF', 3.2, 'A', 'F is small, so F⁻ holds its charge tightly'], ['CH<sub>3</sub>COOH', 4.75, 'R', 'the carboxylate is stabilized by resonance over two oxygens'],
  ['NH<sub>4</sub><sup>+</sup>', 9.2, 'C', 'a positively charged nitrogen acid'], ['C<sub>6</sub>H<sub>5</sub>OH (phenol)', 10, 'R', 'phenoxide is resonance-stabilized into the ring'], ['H<sub>2</sub>O', 15.7, 'A', 'hydroxide is on oxygen'],
  ['CH<sub>3</sub>CH<sub>2</sub>OH', 16, 'A', 'alkoxide on oxygen, no resonance'], ['CH<sub>3</sub>COCH<sub>3</sub> (α-H)', 19.2, 'R', 'the enolate is resonance-stabilized'], ['HC≡CH', 25, 'O', 'the sp orbital has 50% s character and holds the charge close to the nucleus'],
  ['NH<sub>3</sub>', 38, 'A', 'N is less electronegative than O'], ['CH<sub>2</sub>=CH<sub>2</sub>', 44, 'O', 'sp² carbanion (33% s character)'], ['CH<sub>3</sub>CH<sub>3</sub>', 50, 'O', 'sp³ carbanion (25% s character)']];
const ARIO = { A: 'Atom', R: 'Resonance', I: 'Induction', O: 'Orbital', C: 'Charge' };
CH.push({
  id: 'acidbase', unit: 'org', emoji: '🧲', title: 'Acid–base: ARIO',
  blurb: 'Rank acidity without a pKa table, using four factors.',
  learn: [
    { h: 'Look at the conjugate base', body: `<p>A strong acid has a <b>stable conjugate base</b>. So to compare two acids, remove the H⁺ from each, and ask: <b>which negative charge is more stable?</b></p>` },
    { h: 'ARIO, in priority order', body: `<ol><li><b>A</b>tom: what atom holds the charge? Across a row, more electronegative is better (C &lt; N &lt; O &lt; F). Down a column, <b>bigger is better</b> (F &lt; Cl &lt; Br &lt; I).</li><li><b>R</b>esonance: a charge spread out by resonance is more stable.</li><li><b>I</b>nduction: nearby electronegative atoms pull density and stabilize the charge.</li><li><b>O</b>rbital: more s character holds the charge closer: sp &gt; sp² &gt; sp³.</li></ol>` },
    { h: 'Which way does equilibrium go?', body: `<p>Acid–base equilibrium always favors the side with the <b>weaker acid</b> (higher pK<sub>a</sub>). Lower pK<sub>a</sub> = stronger acid. Each pK<sub>a</sub> unit is a factor of 10.</p>` },
  ],
  gen() {
    if (Math.random() < .65) {
      let [a, b] = R.shuffle(ACIDS).slice(0, 2); if (Math.abs(a[1] - b[1]) < 1.5) [a, b] = [ACIDS[0], ACIDS[ACIDS.length - 1]];
      const strong = a[1] < b[1] ? a : b, weak = strong === a ? b : a, opts = R.shuffle([a, b]);
      return mc('Which is the <b>stronger acid</b>?', opts.map(x => x[0]), opts.indexOf(strong), [`Compare conjugate bases. Key factor for ${strong[0]}: <b>${ARIO[strong[2]]}</b>, because ${strong[3]}.`, `pK<sub>a</sub> ${strong[0]} ≈ ${strong[1]} vs ${weak[0]} ≈ ${weak[1]}. Lower pK<sub>a</sub> = stronger acid.`]);
    }
    let [a, b] = R.shuffle(ACIDS.filter(x => !x[0].includes('<sup>+'))).slice(0, 2);
    const side = a[1] < b[1] ? 'Products (right)' : 'Reactants (left)';
    return mcFrom(`Which side is favored?<div class="eq">${a[0]} + conjugate base of ${b[0]} ⇌ conjugate base of ${a[0]} + ${b[0]}</div>`, side, ['Products (right)', 'Reactants (left)', 'Neither, they are equal'], [`Find the acid on each side: ${a[0]} (pK<sub>a</sub> ≈ ${a[1]}) on the left, ${b[0]} (pK<sub>a</sub> ≈ ${b[1]}) on the right.`, `Equilibrium favors the <b>weaker acid</b> (higher pK<sub>a</sub>): ${a[1] < b[1] ? b[0] : a[0]}. So the <b>${side.toLowerCase()}</b> side is favored.`]);
  },
});

CH.push({
  id: 'naming', unit: 'org', emoji: '🏷️', title: 'Naming alkanes (IUPAC)',
  blurb: 'Parent chain, numbering, alphabetizing: every rule, step by step.',
  learn: [
    { h: 'Step 1: find the parent chain', body: `<p>Find the <b>longest continuous chain</b> of carbons. It doesn't have to be drawn in a straight line. Its length gives the root: meth (1), eth (2), prop (3), but (4), pent (5), hex (6), hept (7), oct (8).</p>` },
    { h: 'Step 2: number from the end nearest a substituent', body: `<p>Give the substituents the <b>lowest set of locants</b>. Compare at the first point of difference: 2,3,5 beats 2,4,4. If it's a tie, give the lower number to the substituent that comes first <b>alphabetically</b>.</p>` },
    { h: 'Step 3: assemble the name', body: `<p>List substituents <b>alphabetically</b> (ignore di-, tri-, tetra- when alphabetizing). Use commas between numbers and hyphens between numbers and words:</p><p class="mono big">3-bromo-2,2-dimethylpentane</p><p>Substituent names: methyl, ethyl, fluoro, chloro, bromo, iodo.</p>` },
  ],
  gen() {
    const a = randomAlkane();
    const subs = parseName(a.name);
    return mc('What is the IUPAC name?', a.options, a.options.indexOf(a.name), [`Longest chain: <b>${a.n} carbons</b> → ${PARENT[a.n]}ane.`, `Number from the end that gives the lowest locants: ${subs.map(s => s.pos).sort((x, y) => x - y).join(',')}.`, 'List substituents alphabetically, with di/tri prefixes for repeats.', `Name: <b>${a.name}</b>.`], { visual: drawMol(a.mol) });
  },
});

CH.push({
  id: 'stereo', unit: 'org', emoji: '🔄', title: 'Stereochemistry: R and S',
  blurb: 'Assign priorities and configurations, even with H on a wedge.',
  learn: [
    { h: 'Step 1: rank by atomic number (CIP)', body: `<p>Look at the four atoms attached to the stereocenter. <b>Higher atomic number = higher priority</b>: Br &gt; Cl &gt; F &gt; O &gt; N &gt; C &gt; H.</p><p>Tie? Move out one atom and compare the sets: CH₂OH (O,H,H) beats CH₂CH₃ (C,H,H). A double bond counts its atom twice: CHO is (O,O,H).</p>` },
    { h: 'Step 2: point the lowest priority away', body: `<p>If group 4 is on a <b>dash</b> (pointing away), just trace 1 → 2 → 3:</p><p><b>clockwise = R</b> &nbsp;·&nbsp; <b>counterclockwise = S</b></p>` },
    { h: 'Step 3: the wedge trick', body: `<p>If group 4 is on a <b>wedge</b> (pointing at you), trace 1 → 2 → 3 anyway, then <b>reverse</b> your answer.</p><p>If it's on a plain line, swap it with the dashed group (each swap flips the answer), solve, then flip back.</p>` },
  ],
  gen() {
    const st = randomStereo();
    if (Math.random() < .25) {
      const top = st.sorted[0];
      return mcFrom('Which group has the <b>highest priority</b>?', top.g.h, st.slots.map(s => s.g.h), [`Compare the first atoms: ${st.sorted.map(s => s.g.h).join(' &gt; ')}.`, `${top.g.h} wins: ${top.g.why}.`], { visual: drawStereo(st) });
    }
    const pos = s => s.kind === 'wedge' ? 'a wedge (toward you)' : s.kind === 'dash' ? 'a dash (away from you)' : 'a plain line';
    const low = st.lowest;
    const steps = [`Priorities: ${st.sorted.map((s, i) => `<b>${i + 1}</b> ${s.g.h}`).join(' · ')}.`, `Lowest priority (${low.g.h}) is on ${pos(low)}.`,
      low.kind === 'dash' ? `It already points away, so trace 1 → 2 → 3 directly: <b>${st.config}</b>.` : low.kind === 'wedge' ? `It points toward you, so trace 1 → 2 → 3 and <b>reverse</b> the result: <b>${st.config}</b>.` : `Swap it with the dashed group, solve, then flip back: <b>${st.config}</b>.`];
    return mc('Is this stereocenter <b>R</b> or <b>S</b>?', ['R', 'S'], st.config === 'R' ? 0 : 1, steps, { visual: drawStereo(st), visualAfter: drawStereo(st, { showRank: true }) });
  },
});

const SUBST = [['CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>Br', 1, '1° (primary)'], ['CH<sub>3</sub>CH<sub>2</sub>I', 1, '1° (primary)'], ['(CH<sub>3</sub>)<sub>2</sub>CHBr', 2, '2° (secondary)'], ['cyclohexyl bromide', 2, '2° (secondary)'], ['(CH<sub>3</sub>)<sub>3</sub>CBr', 3, '3° (tertiary)'], ['(CH<sub>3</sub>)<sub>3</sub>CCl', 3, '3° (tertiary)']];
const REAG = [
  ['NaI', 'nuc', 'a strong nucleophile and weak base'], ['NaCN', 'nuc', 'a strong nucleophile and weak base'], ['NaSH', 'nuc', 'a strong nucleophile and weak base'], ['NaN<sub>3</sub>', 'nuc', 'a strong nucleophile and weak base'],
  ['NaOH', 'both', 'a strong nucleophile and strong base'], ['NaOCH<sub>3</sub>', 'both', 'a strong nucleophile and strong base'], ['NaOEt', 'both', 'a strong nucleophile and strong base'],
  ['t-BuOK', 'base', 'a strong, bulky base and weak nucleophile'], ['DBU', 'base', 'a strong base and weak nucleophile'],
  ['H<sub>2</sub>O, heat', 'weak', 'a weak nucleophile and weak base'], ['CH<sub>3</sub>OH, heat', 'weak', 'a weak nucleophile and weak base'], ['EtOH, heat', 'weak', 'a weak nucleophile and weak base']];
const OUTCOME = { nuc: { 1: 'SN2', 2: 'SN2', 3: 'SN1' }, base: { 1: 'E2', 2: 'E2', 3: 'E2' }, both: { 1: 'SN2 (major) + E2 (minor)', 2: 'E2 (major) + SN2 (minor)', 3: 'E2' }, weak: { 1: 'No reaction', 2: 'SN1 + E1 (slow)', 3: 'SN1 + E1' } };
CH.push({
  id: 'subelim', unit: 'org', emoji: '🔀', title: 'SN1, SN2, E1, E2',
  blurb: 'Predict the mechanism in two questions: what is the reagent, what is the substrate?',
  learn: [
    { h: 'Question 1: what does the reagent do?', body: `<table class="tbl"><tr><th>Function</th><th>Examples</th></tr><tr><td><b>Nucleophile only</b></td><td>I⁻, Br⁻, HS⁻, RS⁻, CN⁻, N₃⁻</td></tr><tr><td><b>Base only</b></td><td>t-BuOK, DBU, DBN (bulky strong bases)</td></tr><tr><td><b>Strong nuc + strong base</b></td><td>HO⁻, MeO⁻, EtO⁻</td></tr><tr><td><b>Weak nuc + weak base</b></td><td>H₂O, MeOH, EtOH</td></tr></table>` },
    { h: 'Question 2: what is the substrate?', body: `<table class="tbl"><tr><th></th><th>1°</th><th>2°</th><th>3°</th></tr><tr><td>Nuc only</td><td>SN2</td><td>SN2</td><td>SN1</td></tr><tr><td>Base only</td><td>E2</td><td>E2</td><td>E2</td></tr><tr><td>Strong nuc + base</td><td>SN2 (+E2 minor)</td><td>E2 (+SN2 minor)</td><td>E2</td></tr><tr><td>Weak nuc + base</td><td>—</td><td>SN1 + E1 (slow)</td><td>SN1 + E1</td></tr></table><p>Why: SN2 needs a backside attack, so it fails on crowded 3° carbons. SN1/E1 need a stable carbocation, so they need 2°/3°.</p>` },
    { h: 'Stereochemistry and regiochemistry', body: `<p><b>SN2</b>: inversion of configuration (backside attack). <b>SN1</b>: racemization (flat carbocation). <b>E2</b>: anti-periplanar H and leaving group; usually the more substituted (<b>Zaitsev</b>) alkene, but bulky bases like t-BuOK give the less substituted (<b>Hofmann</b>) alkene.</p>` },
  ],
  gen() {
    const s = R.pick(SUBST), r = R.pick(REAG), ans = OUTCOME[r[1]][s[1]];
    const all = [...new Set(Object.values(OUTCOME).flatMap(o => Object.values(o)))];
    return mcFrom(`Predict the major pathway:<div class="eq">${s[0]} + ${r[0]}</div>`, ans, all, [`Reagent: ${r[0]} is ${r[2]}.`, `Substrate: ${s[2]}.`, `From the table: <b>${ans}</b>.`]);
  },
});

const RXN = [
  ['HBr', 'alkene', 'Adds H and Br; Br goes on the more substituted carbon (Markovnikov)', 'carbocation, so watch for rearrangements'],
  ['HBr, ROOR (peroxides)', 'alkene', 'Adds H and Br; Br goes on the less substituted carbon (anti-Markovnikov)', 'radical mechanism'],
  ['H<sub>3</sub>O<sup>+</sup> (H<sub>2</sub>SO<sub>4</sub>, H<sub>2</sub>O)', 'alkene', 'Adds H and OH, Markovnikov (acid-catalyzed hydration)', 'carbocation, rearrangements possible'],
  ['1) Hg(OAc)<sub>2</sub>, H<sub>2</sub>O 2) NaBH<sub>4</sub>', 'alkene', 'Adds H and OH, Markovnikov, with no rearrangements (oxymercuration)', 'mercurinium ion, no carbocation'],
  ['1) BH<sub>3</sub>·THF 2) H<sub>2</sub>O<sub>2</sub>, NaOH', 'alkene', 'Adds H and OH, anti-Markovnikov, syn addition (hydroboration–oxidation)', 'concerted, no carbocation'],
  ['H<sub>2</sub>, Pt (or Pd, Ni)', 'alkene', 'Adds H and H, syn addition (hydrogenation)', 'happens on the metal surface'],
  ['Br<sub>2</sub> (CH<sub>2</sub>Cl<sub>2</sub>)', 'alkene', 'Adds Br and Br, anti addition (vicinal dibromide)', 'bromonium ion'],
  ['Br<sub>2</sub>, H<sub>2</sub>O', 'alkene', 'Adds Br and OH, anti; OH on the more substituted carbon (halohydrin)', 'water opens the bromonium ion'],
  ['mCPBA (RCO<sub>3</sub>H)', 'alkene', 'Turns C=C into an epoxide, syn (stereospecific)', 'concerted'],
  ['OsO<sub>4</sub>, NMO', 'alkene', 'Adds OH and OH, syn (syn-dihydroxylation)', 'cyclic osmate ester'],
  ['1) mCPBA 2) H<sub>3</sub>O<sup>+</sup>', 'alkene', 'Adds OH and OH, anti (trans diol)', 'epoxide opening'],
  ['1) O<sub>3</sub> 2) DMS', 'alkene', 'Cleaves the C=C into two C=O (aldehydes/ketones) (ozonolysis)', ''],
  ['H<sub>2</sub>, Lindlar catalyst', 'alkyne', 'Reduces an alkyne to a cis alkene', 'poisoned catalyst stops at the alkene'],
  ['Na, NH<sub>3</sub>(l)', 'alkyne', 'Reduces an alkyne to a trans alkene (dissolving metal)', 'radical anion'],
  ['H<sub>2</sub>SO<sub>4</sub>, H<sub>2</sub>O, HgSO<sub>4</sub>', 'alkyne', 'Hydrates a terminal alkyne to a methyl ketone (Markovnikov)', 'enol tautomerizes to ketone'],
  ['1) R<sub>2</sub>BH 2) H<sub>2</sub>O<sub>2</sub>, NaOH', 'alkyne', 'Hydrates a terminal alkyne to an aldehyde (anti-Markovnikov)', 'enol tautomerizes to aldehyde'],
  ['1) NaNH<sub>2</sub> 2) R–X', 'alkyne', 'Alkylates a terminal alkyne (makes a new C–C bond)', 'acetylide is an SN2 nucleophile'],
  ['PBr<sub>3</sub>', 'alcohol', 'Converts a 1°/2° alcohol to an alkyl bromide, with inversion', 'SN2'],
  ['SOCl<sub>2</sub>, pyridine', 'alcohol', 'Converts a 1°/2° alcohol to an alkyl chloride, with inversion', 'SN2'],
  ['TsCl, pyridine', 'alcohol', 'Turns OH into a tosylate, a great leaving group (configuration kept)', 'the C–O bond is not broken'],
  ['PCC, CH<sub>2</sub>Cl<sub>2</sub>', 'alcohol', 'Oxidizes a 1° alcohol to an aldehyde (stops there)', 'mild oxidant'],
  ['Na<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>, H<sub>2</sub>SO<sub>4</sub> (Jones)', 'alcohol', 'Oxidizes a 1° alcohol to a carboxylic acid and a 2° alcohol to a ketone', 'strong oxidant'],
  ['conc. H<sub>2</sub>SO<sub>4</sub>, heat', 'alcohol', 'Dehydrates an alcohol to the more substituted alkene (E1, Zaitsev)', 'carbocation'],
  ['NaBH<sub>4</sub>, CH<sub>3</sub>OH', 'carbonyl', 'Reduces aldehydes and ketones to alcohols (not esters)', 'hydride delivery'],
  ['1) LiAlH<sub>4</sub> 2) H<sub>2</sub>O', 'carbonyl', 'Reduces aldehydes, ketones, esters and acids to alcohols', 'strong hydride source'],
  ['1) RMgBr 2) H<sub>3</sub>O<sup>+</sup>', 'carbonyl', 'Adds an R group to a C=O to make an alcohol (Grignard)', 'new C–C bond'],
  ['NBS, hν (or heat)', 'alkane/allylic', 'Brominates the allylic (or benzylic) position', 'radical'],
  ['Br<sub>2</sub>, FeBr<sub>3</sub>', 'aromatic', 'Adds Br to a benzene ring (electrophilic aromatic substitution)', 'arenium ion'],
  ['HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub>', 'aromatic', 'Adds NO<sub>2</sub> to a benzene ring (nitration)', 'nitronium ion'],
];
CH.push({
  id: 'reactions', unit: 'org', emoji: '⚗️', title: 'Reactions & reagents',
  blurb: '29 must-know reagents: what they do, regiochemistry and stereochemistry.', cards: true,
  learn: [
    { h: 'Learn reactions like vocabulary', body: `<p>For every reagent, know three things: <b>what it adds</b>, <b>where it adds</b> (Markovnikov or anti-Markovnikov) and <b>how it adds</b> (syn or anti).</p><p>Use the <b>flashcards</b> to drill them with spaced repetition. Cards you miss come back sooner.</p>` },
    { h: 'Markovnikov in one sentence', body: `<p>When adding H–X to an alkene, the <b>H goes to the carbon that already has more H's</b> and X goes to the more substituted carbon, because that path goes through the more stable carbocation.</p><p>Exceptions to remember: <b>HBr + peroxides</b> and <b>hydroboration</b> are anti-Markovnikov.</p>` },
  ],
  gen() {
    const r = R.pick(RXN), others = RXN.filter(x => x !== r);
    if (Math.random() < .6) return mcFrom(`What does this reagent do?<div class="eq">${r[0]}</div>`, r[2], others.filter(x => x[1] === r[1]).concat(others).map(x => x[2]), [`<b>${r[0]}</b>: ${r[2]}.`, r[3] ? `Mechanism note: ${r[3]}.` : '']);
    return mcFrom(`Which reagent does this?<div class="cfg small">${r[2]}</div>`, r[0], others.filter(x => x[1] === r[1]).concat(others).map(x => x[0]), [`${r[2]}: <b>${r[0]}</b>.`, r[3] ? `Mechanism note: ${r[3]}.` : '']);
  },
});

const IR = [['O–H (alcohol)', '3200–3600 cm⁻¹, broad'], ['O–H (carboxylic acid)', '2500–3300 cm⁻¹, very broad'], ['N–H (amine)', '3300–3500 cm⁻¹ (1° amines show two peaks)'], ['C≡N (nitrile)', '~2250 cm⁻¹'], ['C≡C (alkyne)', '2100–2260 cm⁻¹'],
  ['C=O (ketone)', '~1715 cm⁻¹, strong'], ['C=O (ester)', '~1740 cm⁻¹, strong'], ['C=O (aldehyde)', '~1725 cm⁻¹, plus C–H near 2720 and 2820'], ['C=C (alkene)', '1600–1680 cm⁻¹'], ['sp³ C–H', 'just below 3000 cm⁻¹'], ['sp² C–H', 'just above 3000 cm⁻¹'], ['sp C–H (terminal alkyne)', '~3300 cm⁻¹, sharp']];
const NMR = [['R–CH<sub>3</sub> (alkyl)', '0.9–1.5 ppm'], ['H on C next to C=O', '2.0–2.5 ppm'], ['H on C next to O (alcohol/ether)', '3.3–4.0 ppm'], ['vinyl H (C=C–H)', '4.5–6.5 ppm'], ['aromatic H', '6.5–8.0 ppm'], ['aldehyde H', '9–10 ppm'], ['carboxylic acid H', '10–12 ppm'], ['benzylic H', '2.2–2.5 ppm']];
const MULTS = ['singlet', 'doublet', 'triplet', 'quartet', 'quintet', 'sextet', 'septet'];
CH.push({
  id: 'spectro', unit: 'org', emoji: '📈', title: 'IR & ¹H NMR',
  blurb: 'Read spectra like a detective: key peaks, shifts and splitting.',
  learn: [
    { h: 'IR: look at two regions first', body: `<p>Above <b>3000</b>: O–H (broad), N–H, and C–H type. Around <b>1700</b>: a strong C=O. Between them, 2100–2260: triple bonds.</p><p>No peak at 1700 = no carbonyl. A broad peak at 3300 = alcohol. Both, with a huge broad O–H = carboxylic acid.</p>` },
    { h: '¹H NMR: shift, integration, splitting', body: `<p><b>Shift</b> (ppm) tells you the neighborhood: electronegative atoms and π systems push signals left (higher ppm).</p><p><b>Integration</b> tells you how many H's. <b>Splitting</b> follows the <b>n + 1 rule</b>: n neighboring H's split a signal into n + 1 peaks.</p><p>Ethyl group signature: a 3H triplet + a 2H quartet.</p>` },
  ],
  gen() {
    const k = R.pick(['ir', 'ir', 'nmr', 'split']);
    if (k === 'ir') { const [g, v] = R.pick(IR); return mcFrom(`Where does the <b>${g}</b> stretch appear in IR?`, v, IR.map(x => x[1]), [`${g}: <b>${v}</b>.`]); }
    if (k === 'nmr') { const [g, v] = R.pick(NMR); return mcFrom(`Typical ¹H NMR shift for <b>${g}</b>?`, v, NMR.map(x => x[1]), [`${g}: <b>${v}</b>. More electronegative or π neighbors push the signal downfield (higher ppm).`]); }
    const n = R.int(0, 6);
    const desc = ['a CH<sub>3</sub> with no H on the neighboring carbon', 'an H with 1 neighboring H', 'a CH<sub>3</sub> next to a CH<sub>2</sub>', 'a CH<sub>2</sub> next to a CH<sub>3</sub>', 'a CH<sub>2</sub> between a CH<sub>3</sub> and a CH (4 neighbors)', 'an H with 5 equivalent neighbors', 'the CH of an isopropyl group (two CH<sub>3</sub>)'][n];
    return mcFrom(`What splitting pattern does ${desc} give?`, MULTS[n], MULTS, [`Count neighboring H's (on adjacent carbons): <b>${n}</b>.`, `n + 1 rule: ${n} + 1 = ${n + 1} peaks → <b>${MULTS[n]}</b>.`]);
  },
});

const UNITS = { gen: { name: 'General Chemistry', emoji: '🧪' }, org: { name: 'Organic Chemistry', emoji: '⬡' } };
if (typeof module !== 'undefined') module.exports = { CH, RXN, parseNum, isBalanced, EQS, UNITS };
