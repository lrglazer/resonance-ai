/* ChemFluent — curved-arrow mechanisms, synthesis puzzles, and simulated IR / 1H NMR spectra. */
'use strict';

/* =====================================================================
   1) CURVED-ARROW MECHANISMS
   A scene: atoms {id:[x,y,label,charge]}, bonds [[a,b,order]], lps {atomId:[angles]},
   arrows: required set of "from>to" where from = lp:ATOM | b:A-B and to = a:ATOM | b:A-B
   ===================================================================== */
const bk = (a, b) => 'b:' + [a, b].sort().join('-');
const MECH = [
  { name: 'SN2: hydroxide + bromomethane', course: '2323', intro: 'Hydroxide attacks carbon from the back while bromide leaves, all in one step.',
    atoms: { O: [70, 110, 'HO', -1], C: [200, 110, 'C'], H1: [200, 50, 'H'], H2: [160, 165, 'H'], H3: [240, 165, 'H'], Br: [330, 110, 'Br'] },
    bonds: [['C', 'H1', 1], ['C', 'H2', 1], ['C', 'H3', 1], ['C', 'Br', 1]], lps: { O: [90, 0, -90], Br: [90, -90, 0] },
    arrows: ['lp:O>a:C', bk('C', 'Br') + '>a:Br'],
    steps: ['Arrow 1: a lone pair on O⁻ attacks the carbon (backside attack).', 'Arrow 2: the C–Br bond breaks and the electrons go to Br, which leaves as Br⁻.'], product: 'CH₃OH + Br⁻ (with inversion of configuration)' },
  { name: 'E2: ethoxide + 2-bromopropane', course: '2323', intro: 'The base pulls off a β-hydrogen as the C=C forms and bromide leaves.',
    atoms: { O: [50, 60, 'EtO', -1], H: [140, 80, 'H'], Cb: [200, 130, 'C'], Ca: [300, 130, 'C'], Br: [340, 215, 'Br'], M1: [180, 205, 'H₃C'], M2: [370, 80, 'CH₃'] },
    bonds: [['H', 'Cb', 1], ['Cb', 'Ca', 1], ['Ca', 'Br', 1], ['Ca', 'M2', 1], ['Cb', 'M1', 1]], lps: { O: [90, 0, -90], Br: [0, -90, 180] },
    arrows: ['lp:O>a:H', bk('Cb', 'H') + '>' + bk('Ca', 'Cb'), bk('Ca', 'Br') + '>a:Br'],
    steps: ['Arrow 1: the ethoxide lone pair grabs the β-hydrogen.', 'Arrow 2: the C–H bond electrons swing in to make the new C=C π bond.', 'Arrow 3: the C–Br bond breaks and Br leaves. All three happen at once (concerted).'], product: 'propene + EtOH + Br⁻' },
  { name: 'SN1 step 1: ionization', course: '2323', intro: 'The leaving group departs on its own, leaving a carbocation.',
    atoms: { C: [180, 120, 'C'], M1: [110, 70, 'H₃C'], M2: [110, 175, 'H₃C'], M3: [180, 40, 'CH₃'], Br: [300, 120, 'Br'] },
    bonds: [['C', 'M1', 1], ['C', 'M2', 1], ['C', 'M3', 1], ['C', 'Br', 1]], lps: { Br: [90, -90, 0] },
    arrows: [bk('Br', 'C') + '>a:Br'],
    steps: ['One arrow: the C–Br bond breaks heterolytically and both electrons go to Br.', 'This slow, rate-determining step makes a 3° carbocation.'], product: '(CH₃)₃C⁺ + Br⁻' },
  { name: 'SN1 step 2: water attacks the carbocation', course: '2323', intro: 'A nucleophile adds to the flat carbocation.',
    atoms: { O: [70, 120, 'H₂O'], C: [220, 120, 'C', 1], M1: [290, 60, 'CH₃'], M2: [290, 180, 'CH₃'], M3: [220, 40, 'CH₃'] },
    bonds: [['C', 'M1', 1], ['C', 'M2', 1], ['C', 'M3', 1]], lps: { O: [0, 90] },
    arrows: ['lp:O>a:C'],
    steps: ['A lone pair on water attacks the positive carbon, forming the C–O bond.', 'Then a second water removes H⁺ to give the neutral alcohol.'], product: '(CH₃)₃C–OH₂⁺ → (CH₃)₃COH' },
  { name: 'Acid–base: hydroxide + HCl', course: '2323', intro: 'Proton transfer is always two arrows.',
    atoms: { O: [70, 110, 'HO', -1], H: [200, 110, 'H'], Cl: [310, 110, 'Cl'] },
    bonds: [['H', 'Cl', 1]], lps: { O: [90, 0, -90], Cl: [90, -90, 0] },
    arrows: ['lp:O>a:H', bk('H', 'Cl') + '>a:Cl'],
    steps: ['Arrow 1: a lone pair on the base attacks the proton.', 'Arrow 2: the H–Cl bond breaks and its electrons go to Cl.'], product: 'H₂O + Cl⁻' },
  { name: 'HBr addition step 1: protonating the alkene', course: '2323', intro: 'The π bond grabs the proton, putting H on the less substituted carbon (Markovnikov).',
    atoms: { C1: [110, 150, 'CH₂'], C2: [210, 150, 'C'], M1: [270, 210, 'CH₃'], M2: [270, 90, 'CH₃'], H: [160, 50, 'H'], Br: [70, 30, 'Br'] },
    bonds: [['C1', 'C2', 2], ['C2', 'M1', 1], ['C2', 'M2', 1], ['H', 'Br', 1]], lps: { Br: [180, 90, -90] },
    arrows: [bk('C1', 'C2') + '>a:H', bk('H', 'Br') + '>a:Br'],
    steps: ['Arrow 1: the C=C π electrons attack H, forming a C–H bond on the CH₂ end.', 'Arrow 2: the H–Br bond breaks; Br leaves as Br⁻.', 'The more stable 3° carbocation forms on the other carbon.'], product: '(CH₃)₃C⁺ + Br⁻' },
  { name: 'HBr addition step 2: bromide traps the cation', course: '2323', intro: 'The nucleophile adds to the carbocation.',
    atoms: { Br: [70, 120, 'Br', -1], C: [220, 120, 'C', 1], M1: [290, 60, 'CH₃'], M2: [290, 180, 'CH₃'], M3: [220, 40, 'CH₃'] },
    bonds: [['C', 'M1', 1], ['C', 'M2', 1], ['C', 'M3', 1]], lps: { Br: [0, 90, -90, 180] },
    arrows: ['lp:Br>a:C'],
    steps: ['One arrow: a bromide lone pair attacks the carbocation.'], product: '2-bromo-2-methylpropane (Markovnikov product)' },
  { name: 'Nucleophilic addition: cyanide + ketone', course: '2325', intro: 'The nucleophile adds to the carbonyl carbon and the π electrons move up to oxygen.',
    atoms: { N: [40, 200, 'N'], Cn: [110, 200, 'C', -1], C: [220, 150, 'C'], O: [220, 50, 'O'], M1: [150, 90, 'H₃C'], M2: [300, 190, 'CH₃'] },
    bonds: [['N', 'Cn', 3], ['C', 'O', 2], ['C', 'M1', 1], ['C', 'M2', 1]], lps: { Cn: [0], O: [45, 135], N: [180] },
    arrows: ['lp:Cn>a:C', bk('C', 'O') + '>a:O'],
    steps: ['Arrow 1: the carbon lone pair of cyanide attacks the electrophilic carbonyl carbon.', 'Arrow 2: the C=O π bond breaks and the electrons move onto oxygen (alkoxide).'], product: 'tetrahedral alkoxide → cyanohydrin after protonation' },
  { name: 'Acyl substitution: the tetrahedral intermediate collapses', course: '2325', intro: 'The C=O re-forms and kicks out the best leaving group.',
    atoms: { O: [200, 40, 'O', -1], C: [200, 130, 'C'], Cl: [320, 150, 'Cl'], OMe: [90, 160, 'OCH₃'], M: [210, 230, 'CH₃'] },
    bonds: [['O', 'C', 1], ['C', 'Cl', 1], ['C', 'OMe', 1], ['C', 'M', 1]], lps: { O: [0, 180, 90], Cl: [0, 90, -90] },
    arrows: ['lp:O>' + bk('C', 'O'), bk('C', 'Cl') + '>a:Cl'],
    steps: ['Arrow 1: an O⁻ lone pair comes down to re-form the C=O π bond.', 'Arrow 2: the C–Cl bond breaks and chloride (the best leaving group) leaves.'], product: 'methyl ester + Cl⁻' },
  { name: '1,2-hydride shift', course: '2323', intro: 'A carbocation rearranges to become more stable.',
    atoms: { C1: [130, 140, 'C', 1], C2: [250, 140, 'C'], H: [250, 50, 'H'], M1: [70, 80, 'H₃C'], M3: [310, 200, 'CH₃'], M4: [320, 110, 'CH₃'], H1: [80, 195, 'H'] },
    bonds: [['C1', 'C2', 1], ['C2', 'H', 1], ['C1', 'M1', 1], ['C2', 'M3', 1], ['C2', 'M4', 1], ['C1', 'H1', 1]], lps: {},
    arrows: [bk('C2', 'H') + '>a:C1'],
    steps: ['One arrow: the C–H bond (a hydride) shifts to the neighboring positive carbon.', 'This turns a 2° carbocation into a more stable 3° carbocation.'], product: '3° carbocation' },
  { name: 'Enolate formation with LDA', course: '2325', intro: 'A strong base removes an α-hydrogen; the charge spreads onto oxygen.',
    atoms: { N: [50, 210, 'R₂N', -1], H: [130, 160, 'H'], Ca: [200, 120, 'C'], C: [300, 120, 'C'], O: [340, 40, 'O'], M: [370, 190, 'CH₃'], H2: [160, 60, 'H₂'] },
    bonds: [['H', 'Ca', 1], ['Ca', 'C', 1], ['C', 'O', 2], ['C', 'M', 1]], lps: { N: [90, 0], O: [90, 0] },
    arrows: ['lp:N>a:H', bk('Ca', 'H') + '>' + bk('C', 'Ca'), bk('C', 'O') + '>a:O'],
    steps: ['Arrow 1: the amide base takes the α-proton.', 'Arrow 2: the C–H electrons form a C=C π bond.', 'Arrow 3: the C=O π electrons move onto oxygen, giving the enolate.'], product: 'enolate (resonance-stabilized) + R₂NH' },
  { name: 'Protonating an alcohol', course: '2323', intro: 'Acid turns a bad leaving group (OH) into a great one (H₂O).',
    atoms: { O: [90, 120, 'O'], R: [40, 60, 'R'], Hx: [40, 185, 'H'], H: [210, 120, 'H'], Ow: [320, 120, 'O', 1], W1: [360, 60, 'H'], W2: [360, 180, 'H'] },
    bonds: [['O', 'R', 1], ['O', 'Hx', 1], ['H', 'Ow', 1], ['Ow', 'W1', 1], ['Ow', 'W2', 1]], lps: { O: [0, 180], Ow: [0] },
    arrows: ['lp:O>a:H', bk('H', 'Ow') + '>a:Ow'],
    steps: ['Arrow 1: an oxygen lone pair grabs a proton from H₃O⁺.', 'Arrow 2: the H–O bond of hydronium breaks, releasing water.'], product: 'R–OH₂⁺ (alkyloxonium ion) + H₂O' },
];
function mechScene(m) {
  const A = m.atoms, out = [], hit = [];
  const P = id => A[id];
  for (const [a, b, o] of m.bonds) {
    const [x1, y1] = P(a), [x2, y2] = P(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, s = 20;
    const X1 = x1 + ux * s, Y1 = y1 + uy * s, X2 = x2 - ux * s, Y2 = y2 - uy * s, nx = -uy, ny = ux;
    const offs = o === 1 ? [0] : o === 2 ? [-4, 4] : [-6, 0, 6];
    offs.forEach(k => out.push(`<line x1="${(X1 + nx * k).toFixed(1)}" y1="${(Y1 + ny * k).toFixed(1)}" x2="${(X2 + nx * k).toFixed(1)}" y2="${(Y2 + ny * k).toFixed(1)}"/>`));
    hit.push(`<line class="hit src tgt" data-id="${bk(a, b)}" x1="${X1.toFixed(1)}" y1="${Y1.toFixed(1)}" x2="${X2.toFixed(1)}" y2="${Y2.toFixed(1)}"/>`);
  }
  for (const id in A) {
    const [x, y, lab, q] = A[id];
    out.push(`<text class="lab" x="${x}" y="${y}">${lab}</text>`);
    if (q) out.push(`<g class="chg"><circle cx="${x + 18}" cy="${y - 18}" r="8"/><text x="${x + 18}" y="${y - 17.5}">${q > 0 ? '+' : '−'}</text></g>`);
    hit.push(`<circle class="hit tgt atom" data-id="a:${id}" cx="${x}" cy="${y}" r="17"/>`);
    const lp = (m.lps || {})[id] || [];
    const rx = 14 + String(lab).replace(/[₀-₉]/g, '').length * 5.5; lp.forEach(ang => { const t = ang * Math.PI / 180, cx = x + Math.cos(t) * rx, cy = y - Math.sin(t) * 20, px = Math.sin(t) * 4.5, py = Math.cos(t) * 4.5;
      out.push(`<circle class="lp" cx="${(cx - px).toFixed(1)}" cy="${(cy - py).toFixed(1)}" r="3.2"/><circle class="lp" cx="${(cx + px).toFixed(1)}" cy="${(cy + py).toFixed(1)}" r="3.2"/>`);
      hit.push(`<circle class="hit src lpz" data-id="lp:${id}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="11"/>`); });
  }
  return `<svg class="mol mech" viewBox="0 0 420 250" role="img" aria-label="Mechanism: tap electrons, then where they go"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ahd"/></marker><marker id="ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#14A37F"/></marker></defs>${out.join('')}<g class="arrows"></g>${hit.join('')}</svg>`;
}
function pointOf(m, id, toward) {
  const A = m.atoms;
  if (id.startsWith('a:')) { const [x, y] = A[id.slice(2)]; if (toward) { const dx = toward[0] - x, dy = toward[1] - y, L = Math.hypot(dx, dy) || 1; return [x + dx / L * 20, y + dy / L * 20]; } return [x, y]; }
  if (id.startsWith('b:')) { const [a, b] = id.slice(2).split('-'); return [(A[a][0] + A[b][0]) / 2, (A[a][1] + A[b][1]) / 2]; }
  const at = id.slice(3), [x, y, lab] = A[at]; const angs = m.lps[at] || [0]; const rx = 14 + String(lab).replace(/[₀-₉]/g, '').length * 5.5;
  let best = angs[0]; if (toward) { let bd = 1e9; for (const g of angs) { const t = g * Math.PI / 180, px = x + Math.cos(t) * rx, py = y - Math.sin(t) * 20, d = Math.hypot(toward[0] - px, toward[1] - py); if (d < bd) { bd = d; best = g; } } }
  const t = best * Math.PI / 180; return [x + Math.cos(t) * rx, y - Math.sin(t) * 20];
}
function arrowPath(m, from, to, k = 0) {
  const tgtC = pointOf(m, to); const p1 = pointOf(m, from, tgtC); const p2 = pointOf(m, to, p1);
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1, bend = Math.min(60, L * .45) * (k % 2 ? -1 : 1);
  return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q${(mx - dy / L * bend).toFixed(1)} ${(my + dx / L * bend).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
}
/* interactive mount used by practice and exams; calls onCheck({ok, given}) when the student presses Check */
function mountArrows(q, root, onCheck) {
  const m = q.mech, svg = root.querySelector('svg.mech'), g = svg.querySelector('.arrows'), msg = root.querySelector('.amsg');
  let src = null; const drawn = [];
  const say = (t, cls = '') => { msg.textContent = t; msg.className = 'amsg ' + cls; };
  const redraw = () => { g.innerHTML = drawn.map((a, i) => `<path class="arw" marker-end="url(#ah)" d="${arrowPath(m, a.split('>')[0], a.split('>')[1], i)}"/>`).join(''); root.querySelector('.acount').textContent = `${drawn.length} arrow${drawn.length === 1 ? '' : 's'} drawn`; };
  svg.querySelectorAll('.hit').forEach(h => h.addEventListener('click', () => {
    if (root.dataset.locked) return;
    const id = h.dataset.id;
    svg.querySelectorAll('.hit.sel').forEach(x => x.classList.remove('sel'));
    if (!src) {
      if (id.startsWith('a:')) { say('Arrows start at electrons: tap a lone pair or a bond, not an atom.', 'warn'); return; }
      src = id; h.classList.add('sel'); say('Now tap where those electrons go: an atom or a bond.'); return;
    }
    if (id === src) { src = null; say('Cancelled. Tap a lone pair or bond to start an arrow.'); return; }
    if (id.startsWith('lp:')) { say('Arrows end at an atom or a bond, not a lone pair.', 'warn'); src = null; return; }
    drawn.push(src + '>' + id); src = null; redraw(); say('Arrow drawn. Add more, or press Check.');
  }));
  root.querySelector('.aundo').onclick = () => { drawn.pop(); redraw(); };
  root.querySelector('.aclear').onclick = () => { drawn.length = 0; redraw(); };
  root.querySelector('.acheck').onclick = () => {
    const want = new Set(q.mech.arrows), got = new Set(drawn);
    const ok = want.size === got.size && [...want].every(x => got.has(x));
    root.dataset.locked = 1; root.querySelectorAll('.atools button').forEach(b => b.disabled = true);
    g.innerHTML += [...want].filter(a => !got.has(a)).map((a, i) => `<path class="arw good" marker-end="url(#ahg)" d="${arrowPath(m, a.split('>')[0], a.split('>')[1], i + 1)}"/>`).join('');
    g.querySelectorAll('.arw:not(.good)').forEach((p, i) => p.classList.add(want.has(drawn[i]) ? 'right' : 'wrong'));
    onCheck({ ok, given: drawn.slice() });
  };
  redraw();
}
CH.push({ id: 'mechanisms', course: '2323', emoji: '↪️', title: 'Curved-arrow mechanisms', blurb: 'Draw the arrows yourself: SN2, SN1, E2, additions, carbonyls and more.',
  learn: [
    { h: 'Arrows show electrons, not atoms', body: `<p>Every curved arrow starts at <b>electrons</b> (a lone pair or a bond) and points to where they end up: an <b>atom</b> (forming a new bond or a lone pair) or a <b>bond</b> (making it a double bond).</p><p>In this chapter you draw them: <b>tap a lone pair or bond</b>, then <b>tap where it goes</b>. Draw every arrow in the step, then press Check.</p>` },
    { h: 'The four moves you\'ll see over and over', body: `<ol><li><b>Nucleophilic attack</b>: lone pair → electrophilic atom.</li><li><b>Loss of a leaving group</b>: bond → the leaving atom.</li><li><b>Proton transfer</b>: lone pair → H, and H–X bond → X (two arrows).</li><li><b>Rearrangement</b>: a C–H or C–C bond shifts to a carbocation.</li></ol><p>Every mechanism in organic chemistry is a combination of these four.</p>` },
  ],
  gen() { const m = R.pick(MECH); return { type: 'arrows', mech: m, prompt: `<b>${m.name}.</b> ${m.intro} Draw all the curved arrows for this step.`, answerText: m.product, steps: [...m.steps, `Result: <b>${m.product}</b>.`] }; } });

/* =====================================================================
   2) SYNTHESIS PUZZLES
   ===================================================================== */
const SYN1 = [
  ['1-butene', '1-butanol (anti-Markovnikov OH)', '1) BH<sub>3</sub>·THF 2) H<sub>2</sub>O<sub>2</sub>, NaOH', ['H<sub>3</sub>O<sup>+</sup>', '1) Hg(OAc)<sub>2</sub>, H<sub>2</sub>O 2) NaBH<sub>4</sub>', 'HBr, then NaOH'], 'Anti-Markovnikov OH with no rearrangement = hydroboration–oxidation.'],
  ['1-butene', '2-butanol (Markovnikov OH, no rearrangement)', '1) Hg(OAc)<sub>2</sub>, H<sub>2</sub>O 2) NaBH<sub>4</sub>', ['1) BH<sub>3</sub>·THF 2) H<sub>2</sub>O<sub>2</sub>, NaOH', 'HBr, ROOR', 'OsO<sub>4</sub>, NMO'], 'Markovnikov hydration without carbocation rearrangement = oxymercuration–demercuration.'],
  ['propene', '1-bromopropane', 'HBr, ROOR', ['HBr', 'Br<sub>2</sub>, CH<sub>2</sub>Cl<sub>2</sub>', 'NBS, hν'], 'Peroxides flip HBr addition to anti-Markovnikov.'],
  ['cyclohexene', 'trans-1,2-cyclohexanediol', '1) mCPBA 2) H<sub>3</sub>O<sup>+</sup>', ['OsO<sub>4</sub>, NMO', 'KMnO<sub>4</sub>, cold NaOH', 'H<sub>3</sub>O<sup>+</sup>'], 'Epoxide then acid opening gives anti (trans) diol; OsO₄ gives cis.'],
  ['cyclohexene', 'cis-1,2-cyclohexanediol', 'OsO<sub>4</sub>, NMO', ['1) mCPBA 2) H<sub>3</sub>O<sup>+</sup>', 'Br<sub>2</sub>, H<sub>2</sub>O', 'H<sub>2</sub>, Pt'], 'OsO₄ adds both OH groups to the same face (syn).'],
  ['2-butyne', 'cis-2-butene', 'H<sub>2</sub>, Lindlar catalyst', ['Na, NH<sub>3</sub>(l)', 'H<sub>2</sub>, Pt (excess)', 'HBr (2 equiv)'], 'Lindlar stops at the cis alkene.'],
  ['2-butyne', 'trans-2-butene', 'Na, NH<sub>3</sub>(l)', ['H<sub>2</sub>, Lindlar catalyst', 'H<sub>2</sub>, Pd/C', 'BH<sub>3</sub>·THF'], 'Dissolving-metal reduction gives the trans alkene.'],
  ['propyne', '2-pentyne', '1) NaNH<sub>2</sub> 2) CH<sub>3</sub>CH<sub>2</sub>Br', ['1) NaNH<sub>2</sub> 2) (CH<sub>3</sub>)<sub>3</sub>CBr', 'CH<sub>3</sub>CH<sub>2</sub>Br alone', '1) BH<sub>3</sub> 2) H<sub>2</sub>O<sub>2</sub>, NaOH'], 'Deprotonate the terminal alkyne, then SN2 on a 1° halide (3° halides give elimination).'],
  ['1-propanol', 'propanal', 'PCC, CH<sub>2</sub>Cl<sub>2</sub>', ['Na<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>, H<sub>2</sub>SO<sub>4</sub>', 'NaBH<sub>4</sub>', 'H<sub>2</sub>SO<sub>4</sub>, heat'], 'PCC stops a 1° alcohol at the aldehyde.'],
  ['1-propanol', 'propanoic acid', 'Na<sub>2</sub>Cr<sub>2</sub>O<sub>7</sub>, H<sub>2</sub>SO<sub>4</sub> (Jones)', ['PCC, CH<sub>2</sub>Cl<sub>2</sub>', 'LiAlH<sub>4</sub>', 'SOCl<sub>2</sub>'], 'Strong chromic acid oxidizes a 1° alcohol all the way to the acid.'],
  ['cyclohexanol', 'cyclohexene', 'conc. H<sub>2</sub>SO<sub>4</sub>, heat', ['NaOH', 'PBr<sub>3</sub>', 'PCC'], 'Acid-catalyzed dehydration (E1).'],
  ['2-bromo-2-methylbutane', '2-methyl-1-butene (less substituted)', 't-BuOK', ['NaOEt, heat', 'H<sub>2</sub>O, heat', 'NaI, acetone'], 'A bulky base gives the Hofmann (less substituted) alkene.'],
  ['2-bromo-2-methylbutane', '2-methyl-2-butene (more substituted)', 'NaOEt, EtOH, heat', ['t-BuOK', 'NaCN', 'NaI, acetone'], 'An unhindered strong base gives the Zaitsev product.'],
  ['1-bromobutane', 'pentanenitrile', 'NaCN, DMSO', ['HCN', 'NaOH', 't-BuOK'], 'SN2 with cyanide adds one carbon.'],
  ['(R)-2-butanol', '(S)-2-bromobutane', 'PBr<sub>3</sub>', ['HBr, heat (SN1)', 'TsCl, pyridine', 'NaBr'], 'PBr₃ is SN2: inversion of configuration.'],
  ['cyclohexanone', '1-methylcyclohexanol', '1) CH<sub>3</sub>MgBr 2) H<sub>3</sub>O<sup>+</sup>', ['NaBH<sub>4</sub>', '1) LiAlH<sub>4</sub> 2) H<sub>2</sub>O', 'CH<sub>3</sub>OH, H<sup>+</sup>'], 'A Grignard adds a new C–C bond to make a 3° alcohol.'],
  ['2-methylpropene', '2-methyl-2-propanol', 'H<sub>3</sub>O<sup>+</sup> (H<sub>2</sub>SO<sub>4</sub>, H<sub>2</sub>O)', ['1) BH<sub>3</sub>·THF 2) H<sub>2</sub>O<sub>2</sub>, NaOH', 'OsO<sub>4</sub>, NMO', 'HBr, ROOR'], 'Markovnikov hydration; the 3° carbocation forms directly (no rearrangement issue).'],
  ['1-butyne', '2-butanone', 'H<sub>2</sub>SO<sub>4</sub>, H<sub>2</sub>O, HgSO<sub>4</sub>', ['1) R<sub>2</sub>BH 2) H<sub>2</sub>O<sub>2</sub>, NaOH', 'H<sub>2</sub>, Lindlar', 'NaNH<sub>2</sub>'], 'Markovnikov hydration of a terminal alkyne gives a methyl ketone.'],
  ['1-butyne', 'butanal', '1) disiamylborane (R<sub>2</sub>BH) 2) H<sub>2</sub>O<sub>2</sub>, NaOH', ['H<sub>2</sub>SO<sub>4</sub>, H<sub>2</sub>O, HgSO<sub>4</sub>', 'O<sub>3</sub> then DMS', 'Na, NH<sub>3</sub>'], 'Anti-Markovnikov hydration of a terminal alkyne gives an aldehyde.'],
  ['cyclohexene', 'hexanedial (ring opened)', '1) O<sub>3</sub> 2) DMS', ['KMnO<sub>4</sub>, cold', 'mCPBA', 'Br<sub>2</sub>'], 'Ozonolysis cleaves the C=C into two C=O groups.'],
];
const SYN2 = [
  ['benzene', 'nitrobenzene', 'HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub>', ['Br<sub>2</sub>, FeBr<sub>3</sub>', 'SO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub>', 'CH<sub>3</sub>Cl, AlCl<sub>3</sub>'], 'Nitration with the nitronium ion NO₂⁺.'],
  ['benzene', 'aniline', '1) HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub> 2) Fe, HCl (or H<sub>2</sub>, Pd)', ['NH<sub>3</sub>, heat', 'NaNH<sub>2</sub>', '1) Br<sub>2</sub>, FeBr<sub>3</sub> 2) NH<sub>3</sub>'], 'Nitrate, then reduce the nitro group to NH₂.'],
  ['benzene', 'acetophenone', 'CH<sub>3</sub>COCl, AlCl<sub>3</sub>', ['CH<sub>3</sub>Cl, AlCl<sub>3</sub>', 'CH<sub>3</sub>CHO, H<sup>+</sup>', 'HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub>'], 'Friedel–Crafts acylation; no rearrangement and no polyacylation.'],
  ['benzene', 'propylbenzene (no rearrangement)', '1) CH<sub>3</sub>CH<sub>2</sub>COCl, AlCl<sub>3</sub> 2) Zn(Hg), HCl', ['CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>Cl, AlCl<sub>3</sub>', 'propene, H<sub>2</sub>SO<sub>4</sub>', '1) Br<sub>2</sub>, FeBr<sub>3</sub> 2) propane'], 'Direct alkylation rearranges to isopropyl; acylate then reduce (Clemmensen) instead.'],
  ['toluene', 'benzoic acid', 'KMnO<sub>4</sub>, heat (then H<sub>3</sub>O<sup>+</sup>)', ['PCC', 'NaBH<sub>4</sub>', 'Br<sub>2</sub>, FeBr<sub>3</sub>'], 'Strong oxidation turns any benzylic carbon with an H into –COOH.'],
  ['benzene', 'm-bromonitrobenzene', '1) HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub> 2) Br<sub>2</sub>, FeBr<sub>3</sub>', ['1) Br<sub>2</sub>, FeBr<sub>3</sub> 2) HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub>', 'NO<sub>2</sub>Br', 'Br<sub>2</sub>, hν'], 'Order matters: NO₂ is a meta director, so put it on first.'],
  ['benzene', 'p-bromonitrobenzene', '1) Br<sub>2</sub>, FeBr<sub>3</sub> 2) HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub> (separate para)', ['1) HNO<sub>3</sub>, H<sub>2</sub>SO<sub>4</sub> 2) Br<sub>2</sub>, FeBr<sub>3</sub>', 'Br<sub>2</sub> only', 'HNO<sub>3</sub> only'], 'Br is an ortho/para director, so brominate first.'],
  ['ethyl benzoate', 'benzyl alcohol', '1) LiAlH<sub>4</sub> 2) H<sub>2</sub>O', ['NaBH<sub>4</sub>, CH<sub>3</sub>OH', 'DIBAL-H, −78 °C', 'H<sub>2</sub>, Lindlar'], 'LiAlH₄ reduces esters all the way to 1° alcohols; NaBH₄ is too weak.'],
  ['ethyl benzoate', 'benzaldehyde', 'DIBAL-H, −78 °C, then H<sub>2</sub>O', ['LiAlH<sub>4</sub>', 'NaBH<sub>4</sub>', 'PCC'], 'Cold DIBAL-H stops at the aldehyde.'],
  ['benzoic acid', 'benzoyl chloride', 'SOCl<sub>2</sub>', ['HCl', 'Cl<sub>2</sub>, FeCl<sub>3</sub>', 'NaCl'], 'Thionyl chloride makes acid chlorides.'],
  ['benzoyl chloride', 'N-methylbenzamide', 'CH<sub>3</sub>NH<sub>2</sub> (2 equiv)', ['CH<sub>3</sub>OH', 'H<sub>2</sub>O', 'NaBH<sub>4</sub>'], 'Acid chloride + amine = amide (downhill on the reactivity ladder).'],
  ['acetic acid', 'ethyl acetate', 'EtOH, H<sub>2</sub>SO<sub>4</sub> (Fischer)', ['EtOH, NaOH', 'Et<sub>2</sub>O', 'EtBr'], 'Fischer esterification: acid + alcohol with an acid catalyst.'],
  ['cyclohexanone', 'methylenecyclohexane (C=CH₂)', 'Ph<sub>3</sub>P=CH<sub>2</sub>', ['CH<sub>3</sub>MgBr then H<sub>3</sub>O<sup>+</sup>', 'CH<sub>2</sub>N<sub>2</sub>', 'H<sub>2</sub>, Pt'], 'The Wittig reaction converts C=O into C=CH₂.'],
  ['cyclohexanone', 'cyclohexanone ethylene acetal (protected)', 'HOCH<sub>2</sub>CH<sub>2</sub>OH, TsOH (remove H<sub>2</sub>O)', ['NaBH<sub>4</sub>', 'H<sub>3</sub>O<sup>+</sup>', 'CH<sub>3</sub>NH<sub>2</sub>'], 'A diol + acid makes a cyclic acetal, the classic ketone protecting group.'],
  ['cyclohexanone', 'N-cyclohexylidene methylamine (imine)', 'CH<sub>3</sub>NH<sub>2</sub>, mild acid', ['(CH<sub>3</sub>)<sub>2</sub>NH', 'NaBH<sub>3</sub>CN alone', 'CH<sub>3</sub>OH, H<sup>+</sup>'], 'Primary amines condense with ketones to give imines.'],
  ['cyclohexanone', 'N-methylcyclohexylamine', 'CH<sub>3</sub>NH<sub>2</sub>, NaBH<sub>3</sub>CN', ['CH<sub>3</sub>NH<sub>2</sub> only', 'NaBH<sub>4</sub> only', 'LiAlH<sub>4</sub> then CH<sub>3</sub>Br'], 'Reductive amination: form the imine, reduce it in place.'],
  ['acetone', '4-hydroxy-4-methyl-2-pentanone', 'NaOH (cat.), cold', ['NaOH, heat', 'LDA then H<sub>2</sub>O', 'H<sub>2</sub>SO<sub>4</sub>, heat'], 'Aldol addition, kept cold so it does not dehydrate.'],
  ['diethyl malonate', 'hexanoic acid', '1) NaOEt 2) CH<sub>3</sub>(CH<sub>2</sub>)<sub>3</sub>Br 3) H<sub>3</sub>O<sup>+</sup>, heat', ['1) LiAlH<sub>4</sub> 2) H<sub>2</sub>O', 'NaOH, then H<sub>3</sub>O<sup>+</sup> only', '1) NaOEt 2) CH<sub>3</sub>Br 3) H<sub>3</sub>O<sup>+</sup>, heat'], 'Malonic ester synthesis: alkylate with the butyl group, hydrolyze, decarboxylate → CH₃(CH₂)₄COOH.'],
  ['ethyl acetoacetate', '2-hexanone', '1) NaOEt 2) CH<sub>3</sub>CH<sub>2</sub>CH<sub>2</sub>Br 3) H<sub>3</sub>O<sup>+</sup>, heat', ['1) NaOEt 2) CH<sub>3</sub>Br 3) H<sub>3</sub>O<sup>+</sup>, heat', '1) LiAlH<sub>4</sub> 2) H<sub>2</sub>O', 'H<sub>2</sub>, Pt'], 'Acetoacetic ester synthesis: the new alkyl group ends up on the methyl ketone.'],
  ['2-methylcyclohexanone', '2,6-dimethylcyclohexanone (alkylate the less substituted side)', '1) LDA, −78 °C 2) CH<sub>3</sub>I', ['1) NaOEt, heat 2) CH<sub>3</sub>I', 'CH<sub>3</sub>I alone', 'CH<sub>3</sub>MgBr'], 'LDA at −78 °C gives the kinetic enolate on the less substituted α-carbon.'],
];
function synGen(bankArr) { return () => { const [s, t, ans, wr, why] = R.pick(bankArr); return mcFrom(`<div class="syn"><span>${s}</span><em>?</em><span>${t}</span></div>Which reagent(s) make this conversion?`, ans, wr, [why, `Answer: <b>${ans}</b>.`]); }; }
CH.push({ id: 'synth1', course: '2323', emoji: '🧭', title: 'Synthesis puzzles I', blurb: 'Pick the reagents: alkenes, alkynes, alcohols and alkyl halides.',
  learn: [{ h: 'Think backwards', body: `<p>Look at what changed between the start and the target: <b>which bonds formed, which broke</b>? Then ask three questions:</p><ol><li><b>What</b> got added (H/OH, X/X, H/H…)?</li><li><b>Where</b>: Markovnikov or anti-Markovnikov?</li><li><b>How</b>: syn or anti, and was there a rearrangement?</li></ol><p>That narrows it to one reagent almost every time.</p>` },
    { h: 'Order of operations', body: `<p>In multi-step problems, some steps must come first: make the nucleophile before the SN2 step, protect a ketone before a Grignard, and use a bulky base when you want the less substituted alkene.</p>` }],
  gen: synGen(SYN1) });
CH.push({ id: 'synth2', course: '2325', emoji: '🗺️', title: 'Synthesis puzzles II', blurb: 'Aromatics, carbonyls and enolates: choose the right sequence.',
  learn: [{ h: 'Aromatic synthesis: directors decide order', body: `<p>Install groups in the order that puts the next one where you want it. Ortho/para directors (–Br, –CH₃, –OH) first for o/p products; meta directors (–NO₂, –COR) first for meta products. Friedel–Crafts fails on strongly deactivated rings.</p>` },
    { h: 'Carbonyl synthesis: the reactivity ladder', body: `<p>Go downhill freely (acid chloride → anhydride → ester → amide). To go uphill, make the acid chloride first with SOCl₂. Choose your reducing agent by how far you want to go: DIBAL-H (aldehyde), NaBH₄ (aldehydes/ketones), LiAlH₄ (everything).</p>` }],
  gen: synGen(SYN2) });

/* =====================================================================
   7) SIMULATED SPECTRA
   ===================================================================== */
const IRC = [
  ['2-butanone', 'ketone', [[2960, .5, 40], [1715, .9, 18], [1365, .35, 12]]],
  ['1-butanol', 'alcohol', [[3330, .8, 170], [2950, .55, 40], [1050, .6, 20]]],
  ['butanoic acid', 'carboxylic acid', [[2950, .7, 420], [1712, .9, 20], [1280, .4, 20]]],
  ['1-hexyne', 'terminal alkyne', [[3310, .75, 14], [2950, .5, 40], [2120, .35, 10]]],
  ['butanal', 'aldehyde', [[2960, .5, 40], [2820, .3, 10], [2720, .3, 10], [1728, .9, 18]]],
  ['ethyl acetate', 'ester', [[2980, .4, 40], [1742, .92, 18], [1240, .75, 20], [1050, .4, 15]]],
  ['hexane', 'alkane only', [[2955, .7, 45], [1465, .3, 12], [1378, .2, 10]]],
  ['1-hexene', 'alkene', [[3080, .3, 14], [2950, .6, 40], [1642, .4, 12], [910, .5, 12]]],
  ['propylamine (1° amine)', 'primary amine', [[3370, .4, 25], [3290, .4, 25], [2950, .55, 40], [1600, .3, 15]]],
  ['butanenitrile', 'nitrile', [[2960, .55, 40], [2250, .55, 10]]],
  ['toluene', 'aromatic ring', [[3030, .35, 18], [2920, .3, 25], [1605, .35, 10], [1495, .45, 10], [730, .7, 14]]],
  ['diethyl ether', 'ether', [[2975, .6, 40], [1120, .85, 22]]],
];
function irSVG(peaks, seed = 1) {
  const W = 560, H = 230, x = w => 40 + (4000 - w) / 3600 * (W - 60), y = t => 20 + (1 - t) * (H - 50);
  let rnd = seed; const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  const fp = Array.from({ length: 10 }, () => [600 + rand() * 800, .1 + rand() * .25, 6 + rand() * 10]);
  const all = peaks.concat(fp), pts = [];
  for (let w = 4000; w >= 400; w -= 6) { let T = .96; for (const [c, d, s] of all) T *= 1 - d * Math.exp(-((w - c) ** 2) / (2 * s * s)); pts.push(`${x(w).toFixed(1)},${y(T).toFixed(1)}`); }
  const ticks = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map(w => `<line class="tk" x1="${x(w)}" y1="${H - 30}" x2="${x(w)}" y2="${H - 25}"/><text class="ax" x="${x(w)}" y="${H - 12}">${w}</text>`).join('');
  return `<svg class="spec" viewBox="0 0 ${W} ${H}" role="img" aria-label="IR spectrum"><rect class="sbg" x="40" y="20" width="${W - 60}" height="${H - 50}"/><polyline class="trace" points="${pts.join(' ')}"/><line class="axl" x1="40" y1="${H - 30}" x2="${W - 20}" y2="${H - 30}"/>${ticks}<text class="ax" x="${W / 2}" y="${H}">wavenumber (cm⁻¹)</text><text class="ax" x="16" y="${H / 2}" transform="rotate(-90 16 ${H / 2})">% T</text></svg>`;
}
const PASCAL = n => { let r = [1]; for (let i = 0; i < n; i++) r = r.map((v, k) => v + (r[k - 1] || 0)).concat(1); return r; };
const NMULT = { s: 0, d: 1, t: 2, q: 3, quint: 4, sext: 5, sept: 6, m: -1 };
const NMRC = [
  ['ethanol', [[1.22, 3, 't'], [3.69, 2, 'q'], [2.6, 1, 's']]],
  ['ethyl acetate', [[1.26, 3, 't'], [2.04, 3, 's'], [4.12, 2, 'q']]],
  ['2-butanone', [[1.06, 3, 't'], [2.14, 3, 's'], [2.44, 2, 'q']]],
  ['toluene', [[2.35, 3, 's'], [7.2, 5, 'm']]],
  ['2-propanol', [[1.2, 6, 'd'], [4.02, 1, 'sept'], [2.1, 1, 's']]],
  ['acetic acid', [[2.1, 3, 's'], [11.5, 1, 's']]],
  ['diethyl ether', [[1.21, 6, 't'], [3.48, 4, 'q']]],
  ['tert-butyl methyl ether', [[1.19, 9, 's'], [3.21, 3, 's']]],
  ['1-bromopropane', [[1.03, 3, 't'], [1.89, 2, 'sext'], [3.4, 2, 't']]],
  ['acetone', [[2.17, 6, 's']]],
  ['ethylbenzene', [[1.23, 3, 't'], [2.65, 2, 'q'], [7.2, 5, 'm']]],
  ['methyl propanoate', [[1.14, 3, 't'], [2.33, 2, 'q'], [3.67, 3, 's']]],
  ['benzaldehyde', [[7.5, 2, 'm'], [7.62, 1, 'm'], [7.87, 2, 'm'], [10.0, 1, 's']]],
  ['isopropylbenzene', [[1.25, 6, 'd'], [2.9, 1, 'sept'], [7.2, 5, 'm']]],
];
function nmrSVG(sig) {
  const W = 560, H = 230, x = d => W - 30 - d / 12.5 * (W - 70), base = H - 34, J = .07;
  const out = []; const maxN = Math.max(...sig.map(s => s[1]));
  sig.forEach(([d, n, m]) => {
    const k = NMULT[m]; let lines;
    if (k === -1) lines = [-.08, -.04, 0, .03, .07].map((o, i) => [d + o, [.6, .9, 1, .85, .55][i]]);
    else { const p = PASCAL(k), mx = Math.max(...p); lines = p.map((v, i) => [d + (i - k / 2) * J, v / mx]); }
    const hgt = (H - 80) * (.35 + .65 * n / maxN), sum = lines.reduce((s, l) => s + l[1], 0);
    lines.forEach(([dd, a]) => out.push(`<line class="pk" x1="${x(dd).toFixed(1)}" y1="${base}" x2="${x(dd).toFixed(1)}" y2="${(base - hgt * a).toFixed(1)}"/>`));
    out.push(`<text class="int" x="${x(d).toFixed(1)}" y="${(base - hgt - 8).toFixed(1)}">${n}H</text>`); void sum;
  });
  const ticks = [12, 10, 8, 6, 4, 2, 0].map(d => `<line class="tk" x1="${x(d)}" y1="${base}" x2="${x(d)}" y2="${base + 5}"/><text class="ax" x="${x(d)}" y="${base + 18}">${d}</text>`).join('');
  return `<svg class="spec" viewBox="0 0 ${W} ${H}" role="img" aria-label="1H NMR spectrum"><rect class="sbg" x="30" y="10" width="${W - 50}" height="${base - 10}"/>${out.join('')}<line class="axl" x1="30" y1="${base}" x2="${W - 20}" y2="${base}"/>${ticks}<text class="ax" x="${W / 2}" y="${H - 2}">chemical shift δ (ppm)</text></svg>`;
}
const MN = { s: 'singlet', d: 'doublet', t: 'triplet', q: 'quartet', quint: 'quintet', sext: 'sextet', sept: 'septet', m: 'multiplet' };
CH.push({ id: 'spectra', course: '2325', emoji: '📉', title: 'Reading real spectra', blurb: 'Identify compounds from simulated IR and ¹H NMR spectra.',
  learn: [
    { h: 'IR: a 10-second scan', body: `<ol><li>Look for a strong peak near <b>1700</b> (C=O).</li><li>Look above <b>3000</b>: broad O–H (3200–3550), very broad acid O–H (2500–3300), sharp ≡C–H (3300), two N–H spikes (1° amine).</li><li>Check <b>2100–2260</b> for C≡C or C≡N.</li><li>Ignore the fingerprint region (below 1500) at first.</li></ol>` },
    { h: '¹H NMR: four questions', body: `<ol><li><b>How many signals?</b> = sets of equivalent H.</li><li><b>Where?</b> Shift tells the neighborhood (alkyl 1, next to C=O 2–2.5, next to O 3.3–4.1, aromatic 7, aldehyde 10, acid 11–12).</li><li><b>How big?</b> Integration = number of H.</li><li><b>Split how?</b> n neighbors → n + 1 peaks.</li></ol><p>Classic fingerprints: <b>ethyl</b> = 3H triplet + 2H quartet; <b>isopropyl</b> = 6H doublet + 1H septet; <b>tert-butyl</b> = 9H singlet.</p>` },
  ],
  gen() {
    if (Math.random() < .5) { const c = R.pick(IRC), g = R.pick([1, 2, 3, 4, 5]);
      if (Math.random() < .5) return mcFrom('Which compound matches this IR spectrum?', c[0], IRC.map(x => x[0]), [`Key peaks: ${c[2].filter(p => p[1] > .3).map(p => `${p[0]} cm⁻¹`).join(', ')}.`, `Those point to a <b>${c[1]}</b>: <b>${c[0]}</b>.`], { visual: irSVG(c[2], g) });
      return mcFrom('Which functional group does this IR spectrum show?', c[1], IRC.map(x => x[1]), [`Key peaks: ${c[2].filter(p => p[1] > .3).map(p => `${p[0]} cm⁻¹`).join(', ')}.`, `That pattern means <b>${c[1]}</b> (this one is ${c[0]}).`], { visual: irSVG(c[2], g) }); }
    const c = R.pick(NMRC);
    return mcFrom('Which compound gives this ¹H NMR spectrum?', c[0], NMRC.map(x => x[0]), [`Signals: ${c[1].map(([d, n, m]) => `δ ${d} (${n}H, ${MN[m]})`).join('; ')}.`, `Match the integrations and splitting: <b>${c[0]}</b>.`], { visual: nmrSVG(c[1]) });
  } });

if (typeof module !== 'undefined') module.exports = { MECH, SYN1, SYN2, IRC, NMRC };
