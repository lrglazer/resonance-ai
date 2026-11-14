/* ChemFluent: organic chemistry illustrations. Every organic question gets a drawn structure, a reaction scheme,
   a spectrum or a chair, and most get a second "after you answer" picture that shows why. Loaded after content files. */
'use strict';
(() => {
  if (typeof SMI === 'undefined' || typeof CH === 'undefined') return;
  const plus = '<span class="rxplus">+</span>';
  const V = (s, o) => SMI.svg(s, o), RX = (l, c, r, o) => SMI.rxn(l.filter(x => x !== plus), c, r.filter(x => x !== plus), o);
  const strip = x => String(x).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const fig = (html, cap) => `<figure class="ovz">${html}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  const m = (s, lab, o) => `<span class="rxm">${V(s, o)}${lab ? `<small>${lab}</small>` : ''}</span>`;
  const row = (items, sep = '') => `<div class="rxn">${items.join(sep)}</div>`;
  const res = arr => row(arr.map(s => Array.isArray(s) ? m(s[0], s[1], s[2]) : m(s)), '<span class="rxres">⟷</span>');
  const eqArrow = (top = '', bot = '') => `<span class="rxarrow"><span class="rxc">${top}</span><svg viewBox="0 0 120 22" width="120"><line x1="4" y1="7" x2="112" y2="7"/><polygon points="118,7 106,1 106,7"/><line x1="8" y1="15" x2="116" y2="15"/><polygon points="2,15 14,21 14,15"/></svg><span class="rxc2">${bot}</span></span>`;
  const gallery = items => `<div class="ogal">${items.map(([s, lab, o]) => `<div class="ogi">${V(s, o)}<b>${lab}</b></div>`).join('')}</div>`;
  const tx = t => `<span class="rxt">${t}</span>`;
  const wrap = (id, fn) => { const c = CH.find(x => x.id === id); if (!c || !c.gen) return; const g = c.gen; c.gen = function () { const q = g.apply(this, arguments); try { if (!q.visual && q.type !== 'arrows' && !/<svg/.test(q.prompt)) fn(q, strip(q.prompt)); } catch (e) { /* keep the question even if a picture fails */ } return q; }; };
  const pickRule = (rules, p) => rules.find(r => r[0].test(p));

  /* ---------- names → SMILES ---------- */
  const NM = {
    'ethanol': 'CCO', 'dimethyl ether': 'COC', 'acetaldehyde': 'CC=O', 'acetone': 'CC(C)=O', 'acetic acid': 'CC(=O)O', 'methyl acetate': 'CC(=O)OC', 'acetamide': 'CC(N)=O',
    'ethylamine': 'CCN', 'acetonitrile': 'CC#N', 'acetyl chloride': 'CC(Cl)=O', 'bromoethane': 'CCBr', 'ethylene': 'C=C', 'acetylene': 'C#C', 'ethanethiol': 'CCS', 'acetic anhydride': 'CC(=O)OC(C)=O', 'phenol': 'Oc1ccccc1',
    '1-butene': 'C=CCC', '1-butanol': 'OCCCC', '2-butanol': 'CC(O)CC', 'propene': 'C=CC', '1-bromopropane': 'BrCCC', 'cyclohexene': 'C1=CCCCC1',
    'trans-1,2-cyclohexanediol': 'O[C@@H]1CCCC[C@H]1O', 'cis-1,2-cyclohexanediol': 'O[C@@H]1CCCC[C@@H]1O', '2-butyne': 'CC#CC', 'cis-2-butene': 'C/C=C\\C', 'trans-2-butene': 'C/C=C/C', 'propyne': 'CC#C', '2-pentyne': 'CC#CCC',
    '1-propanol': 'OCCC', 'propanal': 'O=CCC', 'propanoic acid': 'OC(=O)CC', 'cyclohexanol': 'OC1CCCCC1', '2-bromo-2-methylbutane': 'CCC(C)(C)Br', '2-methyl-1-butene': 'C=C(C)CC', '2-methyl-2-butene': 'CC=C(C)C',
    '1-bromobutane': 'BrCCCC', 'pentanenitrile': 'N#CCCCC', '(R)-2-butanol': 'C[C@@H](O)CC', '(S)-2-bromobutane': 'C[C@H](Br)CC', 'cyclohexanone': 'O=C1CCCCC1', '1-methylcyclohexanol': 'CC1(O)CCCCC1',
    '2-methylpropene': 'C=C(C)C', '2-methyl-2-propanol': 'CC(C)(C)O', '1-butyne': 'C#CCC', '2-butanone': 'CC(=O)CC', 'butanal': 'O=CCCC', 'hexanedial': 'O=CCCCCC=O',
    'benzene': 'c1ccccc1', 'nitrobenzene': 'O=[N+]([O-])c1ccccc1', 'aniline': 'Nc1ccccc1', 'acetophenone': 'CC(=O)c1ccccc1', 'propylbenzene': 'CCCc1ccccc1', 'toluene': 'Cc1ccccc1', 'benzoic acid': 'OC(=O)c1ccccc1',
    'm-bromonitrobenzene': 'O=[N+]([O-])c1cccc(Br)c1', 'p-bromonitrobenzene': 'O=[N+]([O-])c1ccc(Br)cc1', 'ethyl benzoate': 'CCOC(=O)c1ccccc1', 'benzyl alcohol': 'OCc1ccccc1', 'benzaldehyde': 'O=Cc1ccccc1',
    'benzoyl chloride': 'ClC(=O)c1ccccc1', 'N-methylbenzamide': 'CNC(=O)c1ccccc1', 'ethyl acetate': 'CC(=O)OCC', 'methylenecyclohexane': 'C=C1CCCCC1', 'cyclohexanone ethylene acetal': 'C1CCC2(CC1)OCCO2',
    'N-cyclohexylidene methylamine': 'CN=C1CCCCC1', 'N-methylcyclohexylamine': 'CNC1CCCCC1', '4-hydroxy-4-methyl-2-pentanone': 'CC(=O)CC(C)(C)O', 'diethyl malonate': 'CCOC(=O)CC(=O)OCC', 'hexanoic acid': 'OC(=O)CCCCC',
    'ethyl acetoacetate': 'CCOC(=O)CC(C)=O', '2-hexanone': 'CC(=O)CCCC', '2-methylcyclohexanone': 'CC1CCCCC1=O', '2,6-dimethylcyclohexanone': 'CC1CCCC(C)C1=O',
    '2-propanol': 'CC(C)O', 'diethyl ether': 'CCOCC', 'tert-butyl methyl ether': 'COC(C)(C)C', 'ethylbenzene': 'CCc1ccccc1', 'methyl propanoate': 'CCC(=O)OC', 'isopropylbenzene': 'CC(C)c1ccccc1',
    'cyclobutadiene': 'C1=CC=C1', 'cyclopentadienyl anion': '[CH-]1C=CC=C1', 'cyclopentadienyl cation': '[CH+]1C=CC=C1', 'tropylium': '[CH+]1C=CC=CC=C1', 'tropylium cation': '[CH+]1C=CC=CC=C1', 'cyclopropenyl cation': '[CH+]1C=C1', 'cyclooctatetraene': 'C1=CC=CC=CC=C1',
    'pyridine': 'c1ccncc1', 'pyrrole': 'c1cc[nH]c1', 'furan': 'c1ccoc1', 'naphthalene': 'c1ccc2ccccc2c1', '1,3-cyclohexadiene': 'C1=CC=CCC1', 'cyclopentadiene': 'C1=CC=CC1',
    'hexanal': 'O=CCCCCC', 'pentanoic acid': 'OC(=O)CCCC', 'butanoic acid': 'OC(=O)CCC', 'butanone': 'CC(=O)CC', 'propanoic': 'OC(=O)CC', 'hexane': 'CCCCCC', '1-hexene': 'C=CCCCC', '1-hexyne': 'C#CCCCC', 'butanenitrile': 'N#CCCC',
    '1-butylamine': 'NCCCC', 'butylamine': 'NCCCC', 'propylamine': 'NCCC', 'cyclohexane': 'C1CCCCC1', '2-pentanone': 'CC(=O)CCC', '3-pentanone': 'CCC(=O)CC', 'pentanal': 'O=CCCCC', 'ethyl propanoate': 'CCOC(=O)CC', 'methyl benzoate': 'COC(=O)c1ccccc1',
  };
  const nameSmi = n => { n = strip(n).replace(/\s*\(.*?\)\s*$/, '').trim(); return NM[n] || NM[n.toLowerCase()]; };
  window.CF_NAMES = NM;

  /* ---------- functional groups: draw it, then highlight the group ---------- */
  const FGH = { ethanol: [2], 'dimethyl ether': [1], acetaldehyde: [1, 2], acetone: [1, 3], 'acetic acid': [1, 2, 3], 'methyl acetate': [1, 2, 3], acetamide: [1, 2, 3], ethylamine: [2], acetonitrile: [1, 2], 'acetyl chloride': [1, 2, 3], bromoethane: [2], ethylene: [0, 1], acetylene: [0, 1], ethanethiol: [2], 'acetic anhydride': [1, 2, 3, 4, 6], phenol: [0] };
  wrap('fg', (q, p) => { const n = Object.keys(FGH).find(k => p.includes('in ' + k + '?')); if (!n) return; const s = NM[n], small = s.replace(/[^A-Za-z]/g, '').length <= 3;
    q.visual = fig(V(s, { allC: small, scale: 1.2 }), `${n}: skeletal (bond-line) structure`);
    q.visualAfter = fig(V(s, { allC: small, scale: 1.2, hlAtoms: FGH[n] }), `The highlighted atoms are the <b>${strip(q.options[q.answer])}</b> group. Spot the atoms, then the bonds between them.`); });

  /* ---------- resonance ---------- */
  const RES = {
    ozone: [['O=[O+][O-]', 'contributor 1'], ['[O-][O+]=O', 'contributor 2']],
    acetate: [['CC(=O)[O-]'], ['CC([O-])=O']],
    carbonate: [['O=C([O-])[O-]'], ['[O-]C(=O)[O-]'], ['[O-]C([O-])=O']],
    benzene: [['C1=CC=CC=C1'], ['C1C=CC=CC=1']],
    allyl: [['C=C[CH2+]'], ['[CH2+]C=C']],
    amide: [['CC(N)=O', 'major'], ['CC([O-])=[NH2+]', 'minor, but explains the flat N']],
    enolate: [['CC(=O)[CH2-]', 'C⁻'], ['CC([O-])=C', 'O⁻ (major: charge on O)']],
  };
  const RESR = [[/ozone|has resonance/i, 'ozone', 'Ozone: the π bond and the charge swap ends. Real O₃ has two identical O–O bonds.'],
    [/carbonate/i, 'carbonate', 'Three equivalent contributors: each C–O bond is 1⅓ bonds, each O carries −⅔.'],
    [/benzene/i, 'benzene', 'Two Kekulé structures. The hybrid has six identical 1.5-order C–C bonds (139 pm).'],
    [/allyl|C⁺|carbocation|positive/i, 'allyl', 'The π bond swings toward C⁺; the + charge spreads over both end carbons.'],
    [/amide/i, 'amide', 'The N lone pair pushes into C=O. That is why amide N is flat (sp²), not basic, and C–N rotation is slow.'],
    [/negative|electronegative|more stable because/i, 'enolate', 'Same atoms, electrons moved: the contributor with − on oxygen matters most.'],
    [/.*/, 'acetate', 'Acetate: arrows move a lone pair into C=O and C=O electrons onto the other O. Both C–O bonds end up equal (≈ 1.5 order).']];
  wrap('resonance', (q, p) => { const r = pickRule(RESR, p); q.visual = fig(res(RES[r[1]]), r[2]); });

  /* ---------- acid–base equilibria ---------- */
  const AC = { 'HI': ['I', '[I-]'], 'HBr': ['Br', '[Br-]'], 'HCl': ['Cl', '[Cl-]'], 'H3O+': ['[OH3+]', 'O'], 'CF3COOH': ['OC(=O)C(F)(F)F', '[O-]C(=O)C(F)(F)F'], 'HF': ['F', '[F-]'], 'CH3COOH': ['CC(=O)O', 'CC(=O)[O-]'],
    'NH4+': ['[NH4+]', 'N'], 'C6H5OH (phenol)': ['Oc1ccccc1', '[O-]c1ccccc1'], 'H2O': ['O', '[OH-]'], 'CH3CH2OH': ['CCO', 'CC[O-]'], 'CH3COCH3 (α-H)': ['CC(C)=O', '[CH2-]C(C)=O'], 'HC≡CH': ['C#C', 'C#[C-]'],
    'NH3': ['N', '[NH2-]'], 'CH2=CH2': ['C=C', 'C=[CH-]'], 'CH3CH3': ['CC', 'C[CH2-]'] };
  const pKa = n => { const a = (typeof ACIDS !== 'undefined' ? ACIDS : []).find(x => strip(x[0]) === n); return a ? a[1] : null; };
  const acOpt = { allC: true, scale: .9 };
  wrap('acidbase', (q, p) => {
    const mm = p.match(/favored\?\s*(.+?) \+ conjugate base of (.+?) ⇌/);
    if (mm && AC[mm[1]] && AC[mm[2]]) { const A = mm[1], B = mm[2], pa = pKa(A), pb = pKa(B);
      const sp = (s, lab) => m(s, lab, acOpt);
      q.visual = fig(row([sp(AC[A][0], 'acid'), plus, sp(AC[B][1], 'base'), eqArrow(), sp(AC[A][1], 'conj. base'), plus, sp(AC[B][0], 'conj. acid')]), 'Find the acid on each side. The equilibrium runs toward the <b>weaker</b> acid.');
      q.visualAfter = fig(row([sp(AC[A][0], `pKa ${pa}`), plus, sp(AC[B][1]), eqArrow(pa < pb ? '<b>favored →</b>' : '', pa < pb ? '' : '<b>← favored</b>'), sp(AC[A][1]), plus, sp(AC[B][0], `pKa ${pb}`)]), `Lower pKa = stronger acid. ${pa < pb ? 'Left' : 'Right'} acid (pKa ${Math.min(pa, pb)}) is stronger, so the equilibrium lies toward the weaker acid (pKa ${Math.max(pa, pb)}).`);
      return; }
    const items = q.options.map(o => [strip(o), AC[strip(o)]]).filter(x => x[1]);
    if (items.length >= 2) { q.visual = fig(gallery(items.map(([n, s]) => [s[0], n, acOpt])), 'Look at the conjugate base: where does the negative charge go, and how well is it stabilized (ARIO)?');
      q.visualAfter = fig(gallery(items.map(([n, s]) => [s[1], `${n} → base · pKa ${pKa(n)}`, acOpt])), 'The most stable conjugate base belongs to the strongest acid (lowest pKa).'); }
  });

  /* ---------- SN1 / SN2 / E1 / E2 ---------- */
  const SB = { 'CH3CH2CH2Br': ['CCC{X}', 'Br', 'CC=C'], 'CH3CH2I': ['CC{X}', 'I', 'C=C'], '(CH3)2CHBr': ['CC(C){X}', 'Br', 'C=CC'], 'cyclohexyl bromide': ['C1CCCCC1{X}', 'Br', 'C1=CCCCC1'], '(CH3)3CBr': ['CC(C)(C){X}', 'Br', 'C=C(C)C'], '(CH3)3CCl': ['CC(C)(C){X}', 'Cl', 'C=C(C)C'] };
  const NU = { 'NaI': 'I', 'NaCN': 'C#N', 'NaSH': 'S', 'NaN3': 'N=[N+]=[N-]', 'NaOH': 'O', 'NaOCH3': 'OC', 'NaOEt': 'OCC', 'H2O, heat': 'O', 'CH3OH, heat': 'OC', 'EtOH, heat': 'OCC' };
  wrap('subelim', (q, p) => { const mm = p.match(/pathway:\s*(.+?) \+ (.+)$/); if (!mm || !SB[mm[1]]) return; const [t, lg, el] = SB[mm[1]], reag = mm[2], ans = strip(q.options[q.answer]);
    const sub = t.replace('{X}', lg), nu = NU[reag], prods = [];
    if (/SN/.test(ans) && nu) prods.push(m(t.replace('{X}', nu), /SN1/.test(ans) ? 'SN1 product (racemizes)' : 'SN2 product (inversion)'));
    if (/E/.test(ans.replace(/SN/g, ''))) prods.push(m(el, /E1/.test(ans) ? 'E1 alkene (Zaitsev)' : reag === 't-BuOK' ? 'E2 (Hofmann, bulky base)' : 'E2 alkene'));
    if (!prods.length) prods.push(tx('no reaction'));
    q.visual = fig(RX([sub], tx(reag), ['?']), 'Ask two questions: what is the reagent (nucleophile? base? both?), and is the carbon 1°, 2° or 3°?');
    q.visualAfter = fig(RX([sub], tx(reag), [prods.join(plus)]), `Major pathway: <b>${ans}</b>.`); });

  /* ---------- 29 reagents: an example for each ---------- */
  const RXX = [['CC=C', ['CC(Br)C']], ['CC=C', ['CCCBr']], ['C=C(C)C', ['CC(C)(C)O']], ['C=CCC', ['CC(O)CC']], ['C=CCC', ['OCCCC']], ['CC1=CCCCC1', ['CC1CCCCC1']],
    ['C1=CCCCC1', ['Br[C@@H]1CCCC[C@H]1Br']], ['C=C(C)C', ['OC(C)(C)CBr']], ['C1=CCCCC1', ['C1CCC2OC2C1']], ['C1=CCCCC1', ['O[C@@H]1CCCC[C@@H]1O']], ['C1=CCCCC1', ['O[C@@H]1CCCC[C@H]1O']], ['CC(C)=CC', ['CC(C)=O', 'CC=O']],
    ['CC#CC', ['C/C=C\\C']], ['CC#CC', ['C/C=C/C']], ['C#CCC', ['CC(=O)CC']], ['C#CCC', ['O=CCCC']], ['CC#C', ['CC#CCC']],
    ['OCCCC', ['BrCCCC']], ['OCCCC', ['ClCCCC']], ['OCCCC', ['Cc1ccc(cc1)S(=O)(=O)OCCCC']], ['OCCC', ['O=CCC']], ['OCCC', ['OC(=O)CC']], ['OC1CCCCC1', ['C1=CCCCC1']],
    ['CC(=O)CC', ['CC(O)CC']], ['CCC(=O)OC', ['OCCC', 'CO']], ['O=C1CCCCC1', ['CC1(O)CCCCC1']], ['C1=CCCCC1', ['BrC1C=CCCC1']], ['c1ccccc1', ['Brc1ccccc1']], ['c1ccccc1', ['O=[N+]([O-])c1ccccc1']]];
  const RXNOTE = { 5: 'Both H atoms add to the same face (syn).', 6: 'Trans product: one Br on a wedge, one on a dash (anti addition through a bromonium ion).', 9: 'Cis diol: both OH on wedges (syn).', 10: 'Trans diol (anti: the epoxide is opened from the back).', 12: 'Cis alkene (syn H₂ on the metal surface).', 13: 'Trans alkene (dissolving-metal reduction).', 16: 'Shown with CH₃CH₂Br as R–X: the chain grows by two carbons.', 24: 'An ester gives two alcohols.', 25: 'Shown with CH₃MgBr.' };
  wrap('reactions', (q, p) => { const rest = p.replace(/^(What does this reagent do\?|Which reagent does this\?)\s*/, ''), first = /^What does/.test(p);
    const k = (typeof RXN !== 'undefined' ? RXN : []).findIndex(r => strip(first ? r[0] : r[2]) === rest); if (k < 0 || !RXX[k]) return;
    const [s, pr] = RXX[k], reag = tx(RXN[k][0]), note = RXNOTE[k] || RXN[k][3] || '';
    q.visual = first ? fig(RX([s], reag, ['?']), 'Example substrate: what comes out?') : fig(RX([s], '?', pr), 'Which reagent turns the left structure into the right one?');
    q.visualAfter = fig(RX([s], reag, pr), note ? note.charAt(0).toUpperCase() + note.slice(1) + (/\.$/.test(note) ? '' : '.') : ''); });

  /* ---------- synthesis puzzles ---------- */
  ['synth1', 'synth2'].forEach(id => wrap(id, (q, p) => { const d = q.prompt.match(/<span>(.*?)<\/span><em>\?<\/em><span>(.*?)<\/span>/); if (!d) return;
    const a = nameSmi(d[1]), b = nameSmi(d[2]); if (!a || !b) return; const ans = q.options[q.answer];
    q.visual = fig(RX([a], '?', [b]), `${strip(d[1])} → ${strip(d[2])}`);
    q.visualAfter = fig(RX([a], tx(ans), [b]), 'Track what changed: which bonds formed, which broke, and where (regio and stereo).'); }));

  /* ---------- IR and ¹H NMR ---------- */
  const IRX = { 'O–H (alcohol)': ['OCCCC', [[3350, .75, 140], [2950, .5, 40], [1050, .6, 25]], [0]], 'O–H (carboxylic acid)': ['OC(=O)CC', [[2950, .7, 330], [1712, .9, 22]], [0, 1, 2]], 'N–H (amine)': ['NCCCC', [[3370, .45, 28], [3290, .4, 28], [2950, .5, 40]], [0]],
    'C≡N (nitrile)': ['N#CCCC', [[2250, .65, 16], [2950, .5, 40]], [0, 1]], 'C≡C (alkyne)': ['C#CCCCC', [[3310, .7, 14], [2120, .35, 14], [2950, .5, 40]], [0, 1]], 'C=O (ketone)': ['CC(=O)CC', [[1715, .9, 20], [2970, .4, 40]], [1, 2]],
    'C=O (ester)': ['CC(=O)OCC', [[1742, .9, 20], [1240, .7, 30], [2980, .35, 40]], [1, 2]], 'C=O (aldehyde)': ['O=CCCC', [[1728, .9, 20], [2820, .35, 12], [2720, .35, 12], [2960, .4, 40]], [0, 1]], 'C=C (alkene)': ['C=CCCCC', [[1642, .4, 16], [3080, .3, 18], [2930, .55, 40]], [0, 1]],
    'sp³ C–H': ['CCCCCC', [[2960, .65, 35], [2875, .5, 25], [1465, .4, 20]], []], 'sp² C–H': ['C=CCCCC', [[3080, .35, 18], [2930, .55, 40], [1642, .35, 16]], [0, 1]], 'sp C–H (terminal alkyne)': ['C#CCCCC', [[3310, .75, 14], [2120, .3, 14], [2950, .5, 40]], [0]] };
  const NMRX = { 'R–CH3 (alkyl)': ['CCCC', [0], [[0.9, 6, 't'], [1.3, 4, 'm']]], 'H on C next to C=O': ['CC(=O)C', [0, 3], [[2.17, 6, 's']]], 'H on C next to O (alcohol/ether)': ['CCOCC', [1, 3], [[1.21, 6, 't'], [3.48, 4, 'q']]],
    'vinyl H (C=C–H)': ['C=CC', [0, 1], [[1.7, 3, 'd'], [4.95, 2, 'm'], [5.8, 1, 'm']]], 'aromatic H': ['Cc1ccccc1', [2, 3, 4, 5, 6], [[2.35, 3, 's'], [7.2, 5, 'm']]], 'aldehyde H': ['O=CCC', [1], [[1.1, 3, 't'], [2.45, 2, 'q'], [9.8, 1, 's']]],
    'carboxylic acid H': ['CCC(=O)O', [4], [[1.15, 3, 't'], [2.37, 2, 'q'], [11.6, 1, 's']]], 'benzylic H': ['Cc1ccccc1', [0], [[2.35, 3, 's'], [7.2, 5, 'm']]] };
  const ruler = (lo, hi) => { const W = 520, x = d => W - 20 - d / 12 * (W - 40); return `<svg class="spec ruler" viewBox="0 0 ${W} 64"><rect class="sbg" x="20" y="8" width="${W - 40}" height="30"/><rect class="zone" x="${x(hi)}" y="8" width="${x(lo) - x(hi)}" height="30"/>${[12, 10, 8, 6, 4, 2, 0].map(d => `<line class="tk" x1="${x(d)}" y1="38" x2="${x(d)}" y2="44"/><text class="ax" x="${x(d)}" y="56">${d}</text>`).join('')}<text class="ax" x="${(x(lo) + x(hi)) / 2}" y="28" style="fill:var(--ink)">${lo}–${hi} ppm</text></svg>`; };
  const multSVG = n => { const p = typeof PASCAL === 'function' ? PASCAL(n) : [1], mx = Math.max(...p), W = 300, gap = 26, x0 = W / 2 - (p.length - 1) * gap / 2;
    return `<svg class="spec mult" viewBox="0 0 ${W} 130">${p.map((v, i) => `<line class="pk" x1="${x0 + i * gap}" y1="104" x2="${x0 + i * gap}" y2="${104 - 80 * v / mx}" style="animation-delay:${i * .08}s"/><text class="ax" x="${x0 + i * gap}" y="122">${v}</text>`).join('')}<line class="axl" x1="20" y1="104" x2="${W - 20}" y2="104"/></svg>`; };
  wrap('spectro', (q, p) => {
    let k = Object.keys(IRX).find(k => p.includes('the ' + k + ' stretch'));
    if (k) { const [s, pk, hl] = IRX[k]; q.visual = fig(V(s, { hlAtoms: hl }), 'Find the bond in question, then think: stronger bond or lighter atoms → higher wavenumber.'); q.visualAfter = fig(V(s, { hlAtoms: hl }) + (typeof irSVG === 'function' ? irSVG(pk, 3) : ''), `The ${k} band is the one you need: <b>${strip(q.options[q.answer])}</b>.`); return; }
    k = Object.keys(NMRX).find(k => p.includes('shift for ' + k));
    if (k) { const [s, hl, sig] = NMRX[k], ans = strip(q.options[q.answer]), r = ans.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
      q.visual = fig(V(s, { hlAtoms: hl }), 'The highlighted carbons carry the H atoms in question. What is next to them?');
      q.visualAfter = fig(V(s, { hlAtoms: hl }) + (r ? ruler(+r[1], +r[2]) : '') + (typeof nmrSVG === 'function' ? nmrSVG(sig) : ''), 'Electronegative neighbors and π systems pull the signal downfield (to the left).'); return; }
    const MS = ['singlet', 'doublet', 'triplet', 'quartet', 'quintet', 'sextet', 'septet'], ans = strip(q.options[q.answer]), n = MS.indexOf(ans);
    if (n >= 0) { const mol = /isopropyl/.test(p) ? ['CC(C)Br', [1]] : /CH3 next to a CH2|CH₃ next to a CH₂/.test(p) ? ['CCBr', [0]] : /CH2 next to a CH3|CH₂ next to a CH₃/.test(p) ? ['CCBr', [1]] : /no H/.test(p) ? ['CC(=O)OC(C)(C)C', [0]] : /between/.test(p) ? ['CCCBr', [1]] : ({ 0: ['CC(=O)OC', [3]], 1: ['CC=O', [0]], 2: ['CCBr', [0]], 3: ['CCBr', [1]], 4: ['BrCCCBr', [2]], 5: ['BrCCC', [2]], 6: ['CC(C)Br', [1]] })[n] || null;
      if (mol) q.visual = fig(V(mol[0], { hlAtoms: mol[1], allC: true }), 'Count H atoms on the carbons right next to the highlighted carbon.');
      q.visualAfter = fig(multSVG(n), `n neighbors → n + 1 lines with Pascal's-triangle heights: ${n} neighbor${n === 1 ? '' : 's'} → <b>${ans}</b>.`); }
  });
  // "Reading real spectra": after you answer, the structure appears next to its spectrum
  { const c = CH.find(x => x.id === 'spectra'); if (c) { const g = c.gen; c.gen = function () { const q = g.apply(this, arguments); try { const nm = strip(q.options[q.answer]), smi = nameSmi(nm); if (smi && q.visual) q.visualAfter = q.visual + fig(V(smi), `This is <b>${nm}</b>. Match each signal to a set of H atoms.`); } catch (e) { } return q; }; } }

  /* ---------- radicals ---------- */
  const homo = (a, b) => `<svg class="mol fish" viewBox="0 0 260 120"><defs><marker id="fh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,3 z"/></marker></defs><text class="lab" x="60" y="80">${a}</text><line x1="84" y1="80" x2="176" y2="80"/><text class="lab" x="200" y="80">${b}</text><path class="fha" d="M130,74 C120,30 80,30 66,58" marker-end="url(#fh)"/><path class="fha" d="M130,74 C140,30 180,30 194,58" marker-end="url(#fh)"/></svg>`;
  const chainHTML = `<div class="ochain"><div><b>Initiation</b>${row([tx('Cl–Cl'), `<span class="rxarrow"><span class="rxc">hν</span><svg viewBox="0 0 80 16" width="80"><line x1="2" y1="8" x2="70" y2="8"/><polygon points="78,8 66,2 66,14"/></svg></span>`, tx('2 Cl•')])}</div>
    <div><b>Propagation 1</b>${row([tx('Cl•'), plus, tx('H–CH₃'), `<span class="rxarrow"><svg viewBox="0 0 80 16" width="80"><line x1="2" y1="8" x2="70" y2="8"/><polygon points="78,8 66,2 66,14"/></svg></span>`, tx('H–Cl'), plus, tx('•CH₃')])}</div>
    <div><b>Propagation 2</b>${row([tx('•CH₃'), plus, tx('Cl–Cl'), `<span class="rxarrow"><svg viewBox="0 0 80 16" width="80"><line x1="2" y1="8" x2="70" y2="8"/><polygon points="78,8 66,2 66,14"/></svg></span>`, tx('CH₃–Cl'), plus, tx('Cl•')])}</div>
    <div><b>Termination</b>${row([tx('•CH₃'), plus, tx('Cl•'), `<span class="rxarrow"><svg viewBox="0 0 80 16" width="80"><line x1="2" y1="8" x2="70" y2="8"/><polygon points="78,8 66,2 66,14"/></svg></span>`, tx('CH₃–Cl')])}</div></div>`;
  const RADR = [
    [/initiation step of Cl|Homolytic|homolysis|one electron|fishhook/i, () => fig(homo('Cl', 'Cl'), 'Homolysis: each fishhook arrow (one barb) moves <b>one</b> electron, so each Cl leaves with one: two radicals.')],
    [/Peroxides/i, () => fig(homo('RO', 'OR'), 'The weak O–O bond (~150 kJ/mol) breaks easily into two RO• radicals that start the chain.')],
    [/propagation|termination|combining|Which step forms/i, () => fig(chainHTML, 'The chain: initiation makes radicals, propagation passes one along, termination destroys two.')],
    [/most stable|Which radical/i, () => fig(gallery([['CC(C)C', '3° (most stable)', { hlAtoms: [1] }], ['CCC', '2°', { hlAtoms: [1] }], ['CC', '1°', { hlAtoms: [1] }], ['C', 'methyl (least)', { allC: true, hlAtoms: [0] }]]), 'The radical sits on the highlighted carbon. More alkyl groups = more hyperconjugation = more stable.')],
    [/Allylic radicals|allylic|NBS|benzylic/i, () => fig(RX(['C1=CCCCC1'], tx('NBS, hν'), ['BrC1C=CCCC1']), 'NBS keeps Br₂ low, so the allylic C–H (weakest, ~360 kJ/mol) is the one that reacts. The allylic radical is resonance-stabilized.')],
    [/stereocenter/i, () => fig(RX(['CCCC'], tx('Br₂, hν'), [m('C[C@H](Br)CC', '50%'), plus, m('C[C@@H](Br)CC', '50%')]), 'The radical is flat (sp²), so Br₂ adds from either face: a racemic mixture.')],
    [/methylbutane/i, () => fig(RX(['CCC(C)C'], tx('Br₂, hν'), ['CCC(C)(C)Br']), 'Bromination is picky (3° : 2° : 1° ≈ 1600 : 80 : 1), so the 3° bromide dominates.')],
    [/propane|selective|Cl• is reactive/i, () => fig(`${RX(['CCC'], tx('Cl₂, hν'), [m('ClCCC', '45%'), plus, m('CC(C)Cl', '55%')])}${RX(['CCC'], tx('Br₂, hν'), [m('BrCCC', '3%'), plus, m('CC(C)Br', '97%')])}`, 'Chlorination is fast and unselective (early transition state). Bromination is slow and selective (late, product-like transition state).')],
    [/.*/, () => fig(chainHTML, 'Radical chain mechanism')]];
  wrap('radical', (q, p) => { q.visual = pickRule(RADR, p)[1](); });

  /* ---------- mass spec ---------- */
  const msSVG = bars => { const W = 360, H = 170, mz = bars.map(b => b[0]), lo = Math.min(...mz) - 2, hi = Math.max(...mz) + 2, x = v => 30 + (v - lo) / (hi - lo) * (W - 50);
    return `<svg class="spec ms" viewBox="0 0 ${W} ${H}"><rect class="sbg" x="30" y="10" width="${W - 50}" height="${H - 40}"/>${bars.map(([v, h, l], i) => `<line class="pk" x1="${x(v)}" y1="${H - 30}" x2="${x(v)}" y2="${H - 30 - (H - 50) * h / 100}" style="stroke-width:7;animation-delay:${i * .1}s"/><text class="int" x="${x(v)}" y="${H - 34 - (H - 50) * h / 100}">${l || ''}</text><text class="ax" x="${x(v)}" y="${H - 16}">${v}</text>`).join('')}<line class="axl" x1="30" y1="${H - 30}" x2="${W - 20}" y2="${H - 30}"/><text class="ax" x="${W / 2}" y="${H - 2}">m/z</text></svg>`; };
  wrap('massspec', (q, p) => { let mm;
    if ((mm = p.match(/M\+1 peak is ([\d.]+)%/))) { const r = +mm[1], M = 12 * Math.round(r / 1.1) + 30; q.visual = fig(msSVG([[M, 100, 'M⁺'], [M + 1, r, 'M+1']]), `M+1 is ${r}% of M. Each carbon adds ≈ 1.1% (¹³C).`); q.visualAfter = fig(msSVG([[M, 100, 'M⁺'], [M + 1, r, `${r}%`]]), `${r} ÷ 1.1 ≈ <b>${Math.round(r / 1.1)}</b> carbons.`); return; }
    if ((mm = p.match(/M⁺ = (\d+)/))) { const M = +mm[1]; q.visual = fig(msSVG([[M - 15, 40, '−CH₃'], [M - 29, 70, ''], [M, 55, 'M⁺']]), `Molecular ion at m/z ${M}: ${M % 2 ? 'odd' : 'even'}.`); return; }
    if (/(\d) : (\d)/.test(p) || /no significant/.test(p)) { mm = p.match(/(\d) : (\d)/); const a = mm ? +mm[1] : 1, b = mm ? +mm[2] : 0; q.visual = fig(msSVG([[78, 100, 'M'], [79, 5, ''], [80, b ? 100 * b / a : 1, b ? 'M+2' : '']]), mm ? `M : M+2 = ${a} : ${b}` : 'Only a tiny M+2 peak');
      q.visualAfter = fig(`<div class="ogal"><div class="ogi">${msSVG([[78, 100, 'M'], [80, 33, 'M+2']])}<b>Cl: ³⁵Cl/³⁷Cl ≈ 3 : 1</b></div><div class="ogi">${msSVG([[122, 100, 'M'], [124, 98, 'M+2']])}<b>Br: ⁷⁹Br/⁸¹Br ≈ 1 : 1</b></div></div>`, 'Memorize the two shapes: tall + short (Cl), two equal towers (Br).'); } });

  /* ---------- aromaticity and EAS ---------- */
  const AROMX = { 'benzene': [6, 'aromatic'], 'cyclobutadiene': [4, 'antiaromatic'], 'cyclopentadienyl anion': [6, 'aromatic'], 'cyclopentadienyl cation': [4, 'antiaromatic'], 'tropylium': [6, 'aromatic'], 'cyclopropenyl cation': [2, 'aromatic'],
    'cyclooctatetraene': [8, 'nonaromatic: it folds into a tub so the p orbitals no longer overlap'], 'pyridine': [6, 'aromatic (N lone pair sits in the ring plane, not in the π system)'], 'pyrrole': [6, 'aromatic (N lone pair is part of the π sextet)'], 'furan': [6, 'aromatic (one O lone pair joins the π system)'],
    'naphthalene': [10, 'aromatic (4n + 2 with n = 2)'], '1,3-cyclohexadiene': [4, 'nonaromatic: the sp³ CH₂ groups break the ring of p orbitals'], 'cyclopentadiene': [4, 'nonaromatic: one sp³ CH₂ breaks the loop'] };
  const SUBF = { 'SO3H': 'OS(=O)(=O)', 'OCH3': 'CO', 'COCH3': 'CC(=O)', 'CHO': 'O=C', 'NHCOCH3': 'CC(=O)N', 'OH': 'O', 'COOH': 'OC(=O)', 'Br': 'Br', 'Cl': 'Cl', 'CF3': 'FC(F)(F)', 'CH3': 'C', 'NO2': 'O=[N+]([O-])', 'NH2': 'N', 'CN': 'N#C', 'F': 'F', 'I': 'I', 'N(CH3)2': 'CN(C)', 'CO2CH3': 'COC(=O)' };
  wrap('aromatic', (q, p) => { let mm;
    if ((mm = p.match(/^Is (.+?) aromatic/))) { const n = mm[1].replace(/ \(.*\)/, ''), s = NM[n], info = AROMX[n] || AROMX[n.replace(/ cation$/, '')]; if (!s) return; q.visual = fig(V(s, { scale: 1.2 }), 'Check: a ring? every ring atom with a p orbital? planar? Then count π electrons.');
      q.visualAfter = fig(V(s, { scale: 1.2 }), `<b>${info[0]} π electrons</b> → ${info[1]}. Hückel: 4n + 2 (2, 6, 10…) aromatic; 4n (4, 8) antiaromatic if planar.`); return; }
    if ((mm = p.match(/substituent –(\S+) affect/))) { const f = SUBF[mm[1]]; if (!f) return; const ans = strip(q.options[q.answer]), op = /Ortho/i.test(ans), base = f + 'c1ccccc1';
      q.visual = fig(V(base, { scale: 1.1 }), 'Does the group donate electrons into the ring (lone pair, alkyl) or pull them out (C=O, C≡N, NO₂, SO₃H, CF₃)?');
      q.visualAfter = fig(RX([base], tx('Br₂, FeBr₃'), op ? [m(f + 'c1ccccc1Br', 'ortho'), plus, m(f + 'c1ccc(Br)cc1', 'para (major, less crowded)')] : [m(f + 'c1cccc(Br)c1', 'meta')]), `<b>${ans}</b>. ${op ? 'The σ complex for ortho/para attack has a resonance form that puts + right next to the group, where it can be stabilized.' : 'Ortho/para attack would put + next to an electron-poor carbon, so meta wins by default.'}`); }
  });

  /* ---------- carbonyls, amines, enolates: a scheme for every card ---------- */
  const CARB = [
    [/anhydride \+ alcohol/i, ['CC(=O)OC(C)=O', 'CO'], '', ['CC(=O)OC', 'CC(=O)O']],
    [/Ketone \+ \d ROH|acetal/i, ['O=C1CCCCC1', 'OCCO'], 'H⁺, −H₂O', ['C1CCC2(CC1)OCCO2'], 'Acetals are stable to base, nucleophiles and hydrides; acid and water take them apart. That makes them protecting groups.'],
    [/Aldehyde \+ \d ROH/i, ['CC=O', 'CO'], 'H⁺ (1 equiv)', ['CC(O)OC'], 'A hemiacetal: one OR and one OH on the same carbon.'],
    [/more electrophilic/i, null, null, null, null, gallery([['CC=O', 'aldehyde: one R group, less crowded, less donation'], ['CC(C)=O', 'ketone: two R groups donate and block']])],
    [/Hydration/i, ['CC(C)=O', 'O'], '', ['CC(C)(O)O'], 'Gem-diol (hydrate). For most ketones the equilibrium favors the ketone.'],
    [/Fischer/i, ['CC(=O)O', 'CCO'], 'H⁺, heat', ['CC(=O)OCC', 'O'], 'Fischer esterification is an equilibrium: use excess alcohol or remove water.'],
    [/R₂NH|secondary amine/i, ['O=C1CCCCC1', 'C1CCNC1'], 'H⁺ (cat.)', ['C1CCN(C1)C1=CCCCC1'], 'Secondary amine → enamine (no N–H left to lose, so an α-H goes instead).'],
    [/RNH₂|primary amine/i, ['CC(C)=O', 'CN'], 'H⁺ (pH ≈ 4–5)', ['CN=C(C)C', 'O'], 'Primary amine → imine (C=N), with loss of water.'],
    [/Nitrile \+ H₃O/i, ['CCC#N'], 'H₃O⁺, heat', ['CCC(=O)O'], 'Nitrile → amide → carboxylic acid (plus NH₄⁺).'],
    [/Ph₃P=CH₂|Wittig/i, ['O=Cc1ccccc1'], 'Ph₃P=CH₂', ['C=Cc1ccccc1'], 'Wittig: C=O becomes C=C exactly where the oxygen was.'],
    [/Baeyer/i, ['CC(=O)C1CCCCC1'], 'RCO₃H', ['CC(=O)OC1CCCCC1'], 'O inserts on the side of the group that migrates best (3° > 2° ≈ aryl > 1° > methyl).'],
    [/R₂CuLi/i, ['CCC(Cl)=O'], '(CH₃)₂CuLi', ['CCC(C)=O'], 'Gilman reagents stop at the ketone; Grignards would keep going.'],
    [/DIBAL/i, ['CCCC(=O)OC'], 'DIBAL-H, −78 °C', ['O=CCCC'], 'One hydride at low temperature, then workup: an aldehyde.'],
    [/stable to/i, ['C1CCC2(CC1)OCCO2'], 'NaOH, LiAlH₄, RMgBr', [tx('no change')], 'Acetals survive base, hydrides and Grignards; only aqueous acid opens them.'],
    [/NaOH, H₂O|saponification/i, ['CC(=O)OCC'], '1) NaOH, H₂O 2) H₃O⁺', ['CC(=O)O', 'CCO'], 'Saponification is irreversible in base because the carboxylate cannot be attacked.'],
    [/RMgBr/i, ['CC(=O)OC'], '1) 2 CH₃MgBr 2) H₃O⁺', ['CC(C)(C)O'], 'First RMgBr does acyl substitution (→ ketone), the second adds: 3° alcohol with two identical groups.'],
    [/Wolff/i, ['O=C1CCCCC1'], 'H₂NNH₂, KOH, heat', ['C1CCCCC1'], 'C=O → CH₂ under basic conditions (Clemmensen does it in acid).'],
    [/SOCl₂/i, ['CC(=O)O'], 'SOCl₂', ['CC(Cl)=O'], 'Carboxylic acid → acid chloride, the most reactive derivative.'],
    [/Amide \+ LiAlH/i, ['CC(=O)N(C)C'], '1) LiAlH₄ 2) H₂O', ['CCN(C)C'], 'Amides lose the whole C=O oxygen: C=O → CH₂, giving an amine.'],
    [/most reactive acid derivative/i, null, null, null, null, gallery([['CC(Cl)=O', '1. acid chloride'], ['CC(=O)OC(C)=O', '2. anhydride'], ['CC(=O)OC', '3. ester'], ['CC(N)=O', '4. amide']])],
  ];
  const AMN = [
    [/aniline a weaker base|nitro group on aniline/i, null, null, null, null, res([['Nc1ccccc1', 'lone pair on N'], ['[NH2+]=C1C=CC=C[CH-]1', 'lone pair spread into the ring']])],
    [/excess CH₃I/i, ['N', 'CI'], 'excess', [m('CN'), plus, m('CNC'), plus, m('CN(C)C'), plus, m('C[N+](C)(C)C', 'ends here')], 'Each product is still a nucleophile (often a better one), so alkylation runs away.'],
    [/Nitrile \+ LiAlH/i, ['CCC#N'], '1) LiAlH₄ 2) H₂O', ['NCCCC'], 'Two hydrides add to C≡N: R–CH₂–NH₂ (one extra carbon kept).'],
    [/Pyridine vs pyrrole/i, null, null, null, null, gallery([['c1ccncc1', 'pyridine: lone pair in the ring plane, free to grab H⁺'], ['c1cc[nH]c1', 'pyrrole: lone pair is part of the aromatic sextet']])],
    [/NaNO₂/i, ['Nc1ccccc1'], 'NaNO₂, HCl, 0 °C', ['N#[N+]c1ccccc1'], 'The diazonium group (N₂⁺) is a superb leaving group: Sandmeyer swaps it for Cl, Br, CN, OH…'],
    [/good nucleophiles|Quaternary/i, null, null, null, null, gallery([['CN(C)C', 'amine: lone pair available'], ['C[N+](C)(C)C', 'quaternary ammonium: no lone pair']])],
    [/Hofmann elimination/i, ['CCC(C)[N+](C)(C)C'], 'Ag₂O, heat', [m('C=CCC', 'major (less substituted)'), plus, m('CC=CC', 'minor')], 'The bulky NMe₃⁺ leaving group makes the base take the most accessible H: Hofmann product.'],
    [/amides not basic/i, null, null, null, null, res([['CC(N)=O'], ['CC([O-])=[NH2+]', 'N lone pair is busy']])],
    [/clean primary amine|Gabriel/i, ['O=C1[N-]C(=O)c2ccccc12', 'CCCBr'], '1) alkylate 2) H₂NNH₂', ['NCCC'], 'Gabriel synthesis: phthalimide can be alkylated only once.'],
    [/Rank by basicity|strongest base/i, null, null, null, null, gallery([['CCN', 'alkylamine (strongest)'], ['N', 'NH₃', { allC: true }], ['Nc1ccccc1', 'aniline'], ['CC(N)=O', 'amide (not basic)']])],
    [/NaBH₃CN|reductive amination/i, ['CC(C)=O', 'N'], 'NaBH₃CN, H⁺', ['CC(C)N'], 'Imine forms, then NaBH₃CN reduces C=N faster than C=O.'],
    [/Amide \+ LiAlH/i, ['CC(=O)NC'], '1) LiAlH₄ 2) H₂O', ['CCNC'], 'C=O → CH₂.'],
  ];
  const ENO = [
    [/Thermodynamic|LDA|kinetic/i, null, null, null, null, row([m('CC1CCCCC1=O', '2-methylcyclohexanone'), `<span class="rxarrow"><span class="rxc">LDA, −78 °C</span><svg viewBox="0 0 90 16" width="90"><line x1="2" y1="8" x2="80" y2="8"/><polygon points="88,8 76,2 76,14"/></svg><span class="rxc2">kinetic</span></span>`, m('CC1CCCC=C1[O-]', 'less substituted'), '<span class="rxres">|</span>', m('CC1=C([O-])CCCC1', 'thermodynamic: more substituted (NaOEt, rt)')])],
    [/crossed aldol/i, ['O=Cc1ccccc1', 'CC(C)=O'], 'NaOH', ['O=C(C)C=Cc1ccccc1'], 'Benzaldehyde has no α-H, so it can only be the electrophile.'],
    [/haloform|α-halogenation of a methyl ketone|I₂, NaOH/i, ['CC(=O)c1ccccc1'], 'excess I₂, NaOH', [m('[O-]C(=O)c1ccccc1'), plus, tx('CHI₃ (yellow ppt)')], 'Each halogen makes the next α-H more acidic, so it runs to CX₃, which then leaves.'],
    [/most acidic/i, null, null, null, null, gallery([['CC(=O)CC(C)=O', 'between two C=O (pKa ≈ 9)', { hlAtoms: [3] }], ['CC(C)=O', 'next to one C=O (pKa ≈ 19)', { hlAtoms: [0] }], ['CCC', 'alkane (pKa ≈ 50)', { hlAtoms: [1] }]])],
    [/tautomer|which form dominates/i, null, null, null, null, row([m('CC(C)=O', 'keto (>99.9%)'), eqArrow('H⁺ or OH⁻'), m('C=C(C)O', 'enol')])],
    [/aldol addition product|Heating an aldol/i, null, null, null, 'Aldol addition, then E1cB dehydration (condensation).', row([m('CC=O'), plus, m('CC=O'), `<span class="rxarrow"><span class="rxc">NaOH</span><svg viewBox="0 0 70 16" width="70"><line x1="2" y1="8" x2="60" y2="8"/><polygon points="68,8 56,2 56,14"/></svg></span>`, m('CC(O)CC=O', 'β-hydroxy aldehyde'), `<span class="rxarrow"><span class="rxc">heat</span><svg viewBox="0 0 70 16" width="70"><line x1="2" y1="8" x2="60" y2="8"/><polygon points="68,8 56,2 56,14"/></svg><span class="rxc2">−H₂O</span></span>`, m('CC=CC=O', 'α,β-unsaturated')])],
    [/Claisen/i, ['CC(=O)OCC', 'CC(=O)OCC'], '1) NaOEt 2) H₃O⁺', ['CCOC(=O)CC(C)=O'], 'Claisen: an ester enolate attacks another ester → β-keto ester.'],
    [/Dieckmann/i, ['CCOC(=O)CCCCC(=O)OCC'], '1) NaOEt 2) H₃O⁺', ['CCOC(=O)C1CCCC1=O'], 'Intramolecular Claisen: 1,6-diester → five-membered ring.'],
    [/Michael/i, ['C=CC(C)=O', 'CCOC(=O)CC(=O)OCC'], 'NaOEt', ['CCOC(=O)C(CCC(C)=O)C(=O)OCC'], 'Soft, stabilized nucleophiles (malonate, cuprates) add to the β carbon (1,4-addition).'],
    [/Malonic/i, ['CCOC(=O)CC(=O)OCC'], '1) NaOEt, RX 2) H₃O⁺, heat', ['OC(=O)CCCCC'], 'Alkylate, hydrolyze, decarboxylate: a substituted acetic acid (R–CH₂COOH).'],
    [/Acetoacetic/i, ['CCOC(=O)CC(C)=O'], '1) NaOEt, RX 2) H₃O⁺, heat', ['CC(=O)CCCC'], 'Same trick, but you end with a methyl ketone.'],
    [/Robinson/i, ['O=C1CCCCC1', 'C=CC(C)=O'], 'NaOH', ['O=C1CCC2CCCCC2=C1'], 'Michael addition, then intramolecular aldol condensation: a new six-membered ring with C=C–C=O.'],
    [/Racemization/i, ['C[C@H]1CCCCC1=O'], 'NaOH, H₂O', [m('C[C@H]1CCCCC1=O', '50%'), plus, m('C[C@@H]1CCCCC1=O', '50%')], 'The enolate is flat at the α carbon, so protonation from either face scrambles the stereocenter.'],
    [/In acid, α-halogenation/i, ['O=C1CCCCC1'], 'Br₂, H₃O⁺', ['O=C1CCCCC1Br'], 'In acid, the halogen makes the enol harder to form, so it stops at one.'],
  ];
  const schemeRule = (rules, cap) => (q, p) => { const r = pickRule(rules, p); if (!r) { q.visual = fig(cap()); return; }
    q.visual = r[5] ? fig(r[5], r[4] || '') : fig(RX(r[1], r[2] ? tx(r[2]) : '', r[3].map(x => x)), r[4] || ''); };
  const genericAcyl = () => RX(['CC(Cl)=O', '[OH-]'], '', [m('CC([O-])(O)Cl', 'tetrahedral intermediate'), `<span class="rxarrow"><svg viewBox="0 0 60 16" width="60"><line x1="2" y1="8" x2="50" y2="8"/><polygon points="58,8 46,2 46,14"/></svg></span>`, m('CC(=O)O'), plus, m('[Cl-]')]);
  wrap('carbonyl', schemeRule(CARB, genericAcyl));
  wrap('amines', schemeRule(AMN, () => gallery([['CCN', '1°'], ['CNC', '2°'], ['CN(C)C', '3°']])));
  wrap('enolates', schemeRule(ENO, () => res([['CC(=O)[CH2-]'], ['CC([O-])=C']])));

  /* ---------- conformations: chairs and strain ---------- */
  const chairSVG = (subs = {}, cap) => { const r = 82, L = 40, P = ([x, y, z]) => [x + y * .15, -(z + y * .38)], at = [...Array(6)].map((_, k) => { const t = k * Math.PI / 3; return [r * Math.cos(t), r * Math.sin(t), (k % 2 ? -1 : 1) * 24]; });
    const o = []; for (let k = 0; k < 6; k++) { const a = P(at[k]), b = P(at[(k + 1) % 6]); o.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`); }
    for (let k = 0; k < 6; k++) { const [x, y, z] = at[k], sg = k % 2 ? -1 : 1, t = k * Math.PI / 3, ax = [x, y, z + sg * L], eq = [x + Math.cos(t) * L, y + Math.sin(t) * L, z - sg * L * .3]; const s = subs[k];
      [[ax, s && s[0] === 'ax' ? s[1] : null], [eq, s && s[0] === 'eq' ? s[1] : null]].forEach(([pt, lab]) => { const a = P(at[k]), b = P(pt); o.push(`<line class="${lab ? 'me' : 'hb'}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`); if (lab) o.push(`<circle class="meb" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="14"/><text class="lab" x="${b[0].toFixed(1)}" y="${b[1].toFixed(1)}" style="font-size:${lab.length > 3 ? 9 : 11}px">${lab}</text>`); }); }
    return `<div class="ogi"><svg class="mol chair" viewBox="-150 -100 300 200">${o.join('')}</svg>${cap ? `<b>${cap}</b>` : ''}</div>`; };
  const pair = (a, b) => `<div class="ogal">${a}<span class="rxres">⇌</span>${b}</div>`;
  const CONF = [
    [/trans-1,2/i, () => pair(chairSVG({ 0: ['eq', 'CH₃'], 1: ['eq', 'CH₃'] }, 'diequatorial ✓'), chairSVG({ 0: ['ax', 'CH₃'], 1: ['ax', 'CH₃'] }, 'diaxial')), 'Trans-1,2: one up, one down. That fits both-equatorial.'],
    [/cis-1,2/i, () => pair(chairSVG({ 0: ['ax', 'CH₃'], 1: ['eq', 'CH₃'] }, 'ax/eq'), chairSVG({ 0: ['eq', 'CH₃'], 1: ['ax', 'CH₃'] }, 'eq/ax (same energy)')), 'Cis-1,2: both up, so one is always axial.'],
    [/cis-1,3/i, () => pair(chairSVG({ 0: ['eq', 'CH₃'], 2: ['eq', 'CH₃'] }, 'diequatorial ✓'), chairSVG({ 0: ['ax', 'CH₃'], 2: ['ax', 'CH₃'] }, 'diaxial (big clash)')), 'Cis-1,3: both up. That fits both-equatorial.'],
    [/trans-1,4/i, () => pair(chairSVG({ 0: ['eq', 'CH₃'], 3: ['eq', 'CH₃'] }, 'diequatorial ✓'), chairSVG({ 0: ['ax', 'CH₃'], 3: ['ax', 'CH₃'] }, 'diaxial')), 'Trans-1,4 can put both groups equatorial.'],
    [/tert-butyl|t-Bu|equatorial preference/i, () => pair(chairSVG({ 0: ['eq', 't-Bu'] }, 't-Bu equatorial (locked)'), chairSVG({ 0: ['ax', 't-Bu'] }, 'axial t-Bu: +21 kJ/mol')), 'The t-Bu group is so big it essentially never goes axial.'],
    [/methylcyclohexane|ring flip|Each axial methyl/i, () => pair(chairSVG({ 0: ['ax', 'CH₃'] }, 'axial CH₃: 2 × 1,3-diaxial (+7.6 kJ/mol)'), chairSVG({ 0: ['eq', 'CH₃'] }, 'equatorial CH₃ (≈ 95%)')), 'A ring flip swaps every axial and equatorial position (up stays up).'],
    [/axial positions/i, () => chairSVG({ 0: ['ax', 'ax'], 1: ['ax', 'ax'], 2: ['ax', 'ax'], 3: ['ax', 'ax'], 4: ['ax', 'ax'], 5: ['ax', 'ax'] }, 'six axial bonds: up, down, up, down…'), 'Axial bonds are parallel to the ring axis and alternate up/down.'],
    [/ring strain|Angle strain/i, () => gallery([['C1CC1', 'cyclopropane: 60° (115 kJ/mol)'], ['C1CCC1', 'cyclobutane: 88° (110)'], ['C1CCCC1', 'cyclopentane: 108° (26)'], ['C1CCCCC1', 'cyclohexane chair: ~0']]), 'Total ring strain (kJ/mol). Small rings force bond angles far from 109.5°.'],
    [/boat/i, () => gallery([['C1CCCCC1', 'chair: all staggered, no strain']]) + '<p class="tip center">Boat: the two "flagpole" H atoms bump (≈ 180 pm) and four C–C bonds are eclipsed: ≈ 29 kJ/mol higher.</p>', ''],
  ];
  wrap('conform', (q, p) => { const r = pickRule(CONF, p); if (r) { q.visual = fig(r[1](), r[2]); return; }
    if (typeof newmanSVG === 'function' && /Newman|butane|ethane|gauche|anti|eclips|Torsional/i.test(p)) { q.visual = fig(`<div class="ogal"><div class="ogi">${newmanSVG(180)}<b>anti (0 kJ/mol)</b></div><div class="ogi">${newmanSVG(60)}<b>gauche (3.8)</b></div><div class="ogi">${newmanSVG(0)}<b>totally eclipsed (19)</b></div></div>`, 'Butane down the C2–C3 bond: energy rises as the big groups get closer.'); } });

  /* ---------- bond-line chapter: show the structure after you answer if the prompt has a name ---------- */

  /* ---------- NEW chapter: orbitals, hybridization, σ and π bonds (3D) ---------- */
  const HYB = [['CC=O', 1, 'sp²', 'one π bond (C=O): three groups around C'], ['CC=O', 0, 'sp³', 'four single bonds'], ['CC#N', 1, 'sp', 'a triple bond: two groups'], ['CC#N', 2, 'sp', 'N in C≡N: one σ bond + one lone pair = two groups'],
    ['C=C=C', 1, 'sp', 'the central allene carbon has two π bonds, so two groups'], ['CC(N)=O', 2, 'sp²', 'trick! The amide N lone pair is delocalized into C=O (resonance), so N is sp², not sp³'], ['c1cc[nH]c1', 3, 'sp²', 'trick! Pyrrole N puts its lone pair in a p orbital to be aromatic'],
    ['c1ccncc1', 3, 'sp²', 'pyridine N: part of the aromatic ring; lone pair in an sp² orbital'], ['CCN', 2, 'sp³', 'amine N: three σ bonds + one localized lone pair'], ['C=CC=C', 1, 'sp²', 'part of a C=C'], ['CC(C)=O', 3, 'sp²', 'carbonyl O: one π bond, two lone pairs in sp² orbitals'],
    ['COC', 1, 'sp³', 'ether O: two σ bonds + two lone pairs'], ['C=C[CH2+]', 2, 'sp²', 'carbocations are sp² with an empty p orbital'], ['C=C[CH2-]', 2, 'sp²', 'trick! An allylic anion\'s lone pair joins the π system, so the carbon is sp²'], ['O=C=O', 1, 'sp', 'two C=O π bonds, linear'], ['CC#C', 0, 'sp³', 'the CH₃ next to an alkyne is still sp³'], ['Oc1ccccc1', 1, 'sp²', 'aromatic ring carbon']];
  const ANG = { sp: '180°', 'sp²': '120°', 'sp³': '109.5°' };
  const CNT = [['ethane', 'CC', 7, 0], ['ethylene', 'C=C', 5, 1], ['acetylene', 'C#C', 3, 2], ['propene', 'C=CC', 8, 1], ['1,3-butadiene', 'C=CC=C', 9, 2], ['benzene', 'c1ccccc1', 12, 3], ['acetone', 'CC(C)=O', 9, 1], ['acetonitrile', 'CC#N', 5, 2],
    ['acetic acid', 'CC(=O)O', 7, 1], ['carbon dioxide', 'O=C=O', 2, 2], ['formaldehyde', 'C=O', 3, 1], ['propyne', 'CC#C', 6, 2], ['allene', 'C=C=C', 6, 2], ['acrylonitrile', 'C=CC#N', 6, 3], ['ethanol', 'CCO', 8, 0]];
  const twistSVG = th => { const lobe = (a, cls) => { const r = a * Math.PI / 180, dx = Math.sin(r) * 48, dy = -Math.cos(r) * 48; return `<ellipse class="${cls}" cx="${dx}" cy="${dy}" rx="17" ry="34" transform="rotate(${a} ${dx} ${dy})"/><ellipse class="${cls} b" cx="${-dx}" cy="${-dy}" rx="17" ry="34" transform="rotate(${a} ${-dx} ${-dy})"/>`; };
    return `<svg class="mol twist" viewBox="-110 -100 220 200">${lobe(0, 'pf')}${lobe(th, 'pb')}<circle r="6" class="ctr"/><text class="lab" x="0" y="92" style="font-size:13px">looking down C=C · back p orbital at ${th}°</text></svg>`; };
  const orbW = mol => box => ORB.mount(box, { mol });
  if (typeof ORB !== 'undefined') CH.push({ id: 'orbitals', course: '2323', unit: 'org', emoji: '🌀', title: 'Orbitals in 3D: hybridization, σ and π', blurb: 'Spin real molecules, watch p orbitals merge into π bonds, and twist a double bond until it breaks.',
    learn: [
      { h: 'σ bonds: head-on overlap', body: `<p>A <b>σ bond</b> forms when two orbitals point straight at each other and overlap <b>head-on</b>, along the line between the nuclei. Every single bond is one σ bond. You can spin a σ bond freely, because the overlap looks the same from every angle.</p><p>In methane, carbon mixes one 2s and three 2p orbitals into four identical <b>sp³ hybrids</b> that point to the corners of a tetrahedron (109.5°). Each one overlaps an H 1s orbital: four C–H σ bonds.</p><div class="trick"><b>Trick:</b> count the "groups" around an atom (bonded atoms + lone pairs): 4 → sp³, 3 → sp², 2 → sp. That is the steric number from VSEPR, and it is the fastest way to get hybridization.</div>`, widget: orbW('methane') },
      { h: 'π bonds: side-by-side overlap', body: `<p>An sp² carbon keeps one <b>unhybridized p orbital</b> sticking straight up and down. When two of them sit side by side, they overlap <b>above and below</b> the bond axis: that is a <b>π bond</b>. A double bond = 1 σ + 1 π.</p><p>Press <b>▶ watch the π bond form</b>. Then drag the <b>twist</b> slider: as the p orbitals rotate away from parallel, overlap falls as cos²θ. At 90° there is zero overlap and the π bond is broken. That costs ~270 kJ/mol, which is why cis and trans alkenes don't interconvert at room temperature.</p><div class="trick"><b>Trick:</b> π electrons sit above and below the plane, far from the nuclei. They are the most reactive electrons in an alkene: electrophiles attack them.</div>`, widget: orbW('ethylene') },
      { h: 'Triple bonds: two π bonds at right angles', body: `<p>An sp carbon has <b>two</b> leftover p orbitals, at 90° to each other. A triple bond = 1 σ + 2 π. The two π clouds merge into a cylinder around the C–C axis. sp carbons are linear (180°).</p><p>Because sp orbitals are 50% s character, they hold electrons close to the nucleus. That is why a terminal alkyne C–H (pKa 25) is far more acidic than an alkene (44) or alkane (50) C–H.</p>`, widget: orbW('acetylene') },
      { h: 'C=O: a polar π bond', body: `<p>Formaldehyde's C and O are both sp². The π bond is lopsided: oxygen pulls the electrons toward itself, so carbon is δ+ (electrophilic) and oxygen is δ−. The two O lone pairs sit in sp² orbitals in the molecular plane.</p><div class="trick"><b>Trick:</b> nucleophiles attack the carbonyl carbon at ~107° (the Bürgi–Dunitz angle), into the empty π* orbital, not straight down the C=O axis.</div>`, widget: orbW('formaldehyde') },
      { h: 'Conjugation and delocalization', body: `<p>When p orbitals line up on three or more neighboring atoms, π electrons spread over all of them. That is <b>conjugation</b>. Resonance structures are just our way of drawing it with ordinary lines.</p><p>1,3-Butadiene: four p orbitals in a row, four π electrons. The allyl cation: three p orbitals, two π electrons spread over the ends (that is the "+ on both ends" in its resonance structures).</p>`, widget: orbW('butadiene') },
      { h: 'Benzene: a continuous ring of p orbitals', body: `<p>Benzene has six sp² carbons, each with one p orbital. They overlap all the way around the ring, so the six π electrons form a donut above and below the plane. All six C–C bonds are identical (139 pm, between single 154 and double 134).</p><div class="trick"><b>Trick (Hückel):</b> a ring that is cyclic, planar and fully conjugated with <b>4n + 2</b> π electrons (2, 6, 10…) is aromatic and extra stable. <b>4n</b> (4, 8) is antiaromatic.</div>`, widget: orbW('benzene') },
    ],
    gen() {
      const r = Math.random();
      if (r < .4) { const [s, i, h, why] = R.pick(HYB); return mc('What is the hybridization of the <b>highlighted</b> atom?', ['sp', 'sp²', 'sp³'], ['sp', 'sp²', 'sp³'].indexOf(h), [`Count groups (bonded atoms + lone pairs) around the atom: ${why}.`, `So it is <b>${h}</b>, with ${ANG[h]} bond angles.`], { visual: fig(V(s, { hlAtoms: [i], showC: [i], scale: 1.2 })) }); }
      if (r < .55) { const [s, i, h, why] = R.pick(HYB); return mcFrom('About what bond angle surrounds the <b>highlighted</b> atom?', ANG[h], Object.values(ANG).concat(['90°']), [`${why}: ${h}.`, `${h} → <b>${ANG[h]}</b>.`], { visual: fig(V(s, { hlAtoms: [i], showC: [i], scale: 1.2 })) }); }
      if (r < .85) { const [n, s, sg, pi] = R.pick(CNT), askPi = Math.random() < .5; return numQ(`How many <b>${askPi ? 'π' : 'σ'}</b> bonds are in ${n}? (Count C–H bonds too.)`, askPi ? pi : sg, '', [`Every single bond is 1 σ. A double bond is 1 σ + 1 π; a triple is 1 σ + 2 π.`, `Draw every H: ${n} has <b>${sg} σ</b> and <b>${pi} π</b> bonds.`], { abs: 0, visual: fig(V(s, { allC: true, scale: 1.1 })) }); }
      const th = R.pick([0, 15, 30, 45, 60, 75, 90]), ov = Math.round(Math.cos(th * Math.PI / 180) ** 2 * 100);
      return numQ(`Twist the C=C of ethylene by ${th}°. What percent of the original π overlap is left? (overlap ∝ cos²θ)`, ov, '%', [`Overlap ∝ cos²θ = cos²(${th}°).`, `= ${(ov / 100).toFixed(2)} → <b>${ov}%</b>.${th === 90 ? ' At 90° the π bond is broken.' : ''}`], { abs: 2, visual: fig(twistSVG(th), 'Front p orbital (orange) vs back p orbital (blue). Only the parallel component overlaps.') }); },
  });
})();
