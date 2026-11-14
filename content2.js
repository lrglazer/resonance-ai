/* ChemFluent — more chapters: Gen Chem I & II, Organic I & II, Biochemistry I. */
'use strict';
const pick = R.pick, bank = (arr) => () => { const [q, a, w, why] = pick(arr); return mcFrom(q, a, w, Array.isArray(why) ? why : [why]); };
const h_ = 6.626e-34, c_ = 2.998e8;

/* ======================= CHEM 1311 ======================= */
CH.push({ id: 'quantum', course: '1311', emoji: '💡', title: 'Light & quantum theory', blurb: 'Wavelength, frequency, photon energy and hydrogen spectra.',
  learn: [
    { h: 'Light is a wave and a particle', body: `<p class="formula">c = λν &nbsp;·&nbsp; E = hν = hc/λ</p><p>c = 2.998 × 10⁸ m/s, h = 6.626 × 10⁻³⁴ J·s. Shorter wavelength = higher frequency = <b>more energy</b>. Convert nm to m (× 10⁻⁹) before you plug in.</p>` },
    { h: 'The Bohr model of hydrogen', body: `<p class="formula">Eₙ = −2.18 × 10⁻¹⁸ J / n²</p><p>When an electron drops from a high n to a lower n, it emits a photon with ΔE = 2.18 × 10⁻¹⁸ (1/n<sub>f</sub>² − 1/n<sub>i</sub>²). Drops to n = 2 are visible light (the Balmer series).</p>` },
    { h: 'Quantum numbers', body: `<table class="tbl"><tr><th>Symbol</th><th>Name</th><th>Allowed values</th></tr><tr><td>n</td><td>principal (shell)</td><td>1, 2, 3…</td></tr><tr><td>ℓ</td><td>angular (subshell)</td><td>0 to n−1 (s, p, d, f)</td></tr><tr><td>mℓ</td><td>magnetic (orbital)</td><td>−ℓ to +ℓ</td></tr><tr><td>mₛ</td><td>spin</td><td>+½ or −½</td></tr></table>` },
  ],
  gen() {
    const k = pick(['lam', 'E', 'bohr', 'qn']);
    if (k === 'lam') { const lam = R.int(380, 750), nu = c_ / (lam * 1e-9); return numQ(`What is the frequency of light with λ = <b>${lam} nm</b>?`, nu, 's⁻¹', [`Convert: ${lam} nm = ${lam} × 10⁻⁹ m.`, `ν = c/λ = 2.998 × 10⁸ / ${lam} × 10⁻⁹ = <b>${sig(nu)}</b> s⁻¹.`], { placeholder: 'e.g. 5.0e14' }); }
    if (k === 'E') { const lam = R.int(200, 900), E = h_ * c_ / (lam * 1e-9); return numQ(`What is the energy of one photon with λ = <b>${lam} nm</b>?`, E, 'J', [`E = hc/λ.`, `E = (6.626 × 10⁻³⁴)(2.998 × 10⁸) / (${lam} × 10⁻⁹) = <b>${sig(E)}</b> J.`], { placeholder: 'e.g. 3.6e-19' }); }
    if (k === 'bohr') { const nf = pick([1, 2, 2, 3]), ni = nf + R.int(1, 4), dE = 2.18e-18 * (1 / nf ** 2 - 1 / ni ** 2), lam = h_ * c_ / dE * 1e9;
      return numQ(`An electron in hydrogen falls from <b>n = ${ni}</b> to <b>n = ${nf}</b>. What is the wavelength of the emitted light in nm?`, lam, 'nm', [`ΔE = 2.18 × 10⁻¹⁸ (1/${nf}² − 1/${ni}²) = ${sig(dE)} J.`, `λ = hc/ΔE = ${sig(lam * 1e-9)} m = <b>${sig(lam)}</b> nm.`]); }
    const n = R.int(1, 4), l = R.int(0, n), ok = l < n, sub = 'spdf'[l] || 'g';
    return mcFrom(`Is the combination <b>n = ${n}, ℓ = ${l}</b> allowed?`, ok ? `Yes, it is a ${n}${sub} subshell` : 'No, ℓ must be less than n', ['Yes', 'No, ℓ must be less than n', `Yes, it is a ${n}${sub} subshell`, 'No, n must be even'].filter(x => x !== (ok ? 'No, ℓ must be less than n' : '')), [`ℓ can be 0 to n − 1, so for n = ${n}, ℓ can be 0 to ${n - 1}.`, ok ? `ℓ = ${l} is allowed: the ${n}${sub} subshell.` : `ℓ = ${l} is not allowed.`]);
  } });

const MAIN = () => ELEMENTS.filter(e => e.Z <= 56 && e.group !== 18 && (e.group <= 2 || e.group >= 13) && e.Z > 2);
CH.push({ id: 'trends', course: '1311', emoji: '📊', title: 'Periodic trends', blurb: 'Atomic radius, ionization energy and electronegativity at a glance.',
  learn: [
    { h: 'Two ideas explain every trend', body: `<p><b>Down a group</b>, electrons go into bigger shells, so atoms get <b>bigger</b> and hold electrons <b>less tightly</b>.</p><p><b>Across a period</b> (left → right), the nuclear charge grows while the shell stays the same, so atoms get <b>smaller</b> and hold electrons <b>more tightly</b>.</p>` },
    { h: 'The arrows', body: `<table class="tbl"><tr><th>Property</th><th>Across →</th><th>Down ↓</th></tr><tr><td>Atomic radius</td><td>decreases</td><td>increases</td></tr><tr><td>Ionization energy</td><td>increases</td><td>decreases</td></tr><tr><td>Electronegativity</td><td>increases</td><td>decreases</td></tr><tr><td>Metallic character</td><td>decreases</td><td>increases</td></tr></table><p>Fluorine is the most electronegative element. Francium/cesium are the biggest and least electronegative. Cations are smaller than their atoms; anions are bigger.</p>` },
  ],
  gen() {
    let a, b, rel; for (let t = 0; t < 50; t++) { [a, b] = R.shuffle(MAIN()).slice(0, 2); if (a.period === b.period && a.group !== b.group) { rel = 'row'; break; } if (a.group === b.group && a.period !== b.period) { rel = 'col'; break; } }
    const prop = pick(['radius', 'IE', 'EN']);
    let big; if (rel === 'row') big = prop === 'radius' ? (a.group < b.group ? a : b) : (a.group > b.group ? a : b); else big = prop === 'radius' ? (a.period > b.period ? a : b) : (a.period < b.period ? a : b);
    const word = { radius: 'larger atomic radius', IE: 'higher first ionization energy', EN: 'higher electronegativity' }[prop];
    const opts = R.shuffle([a, b]);
    return mc(`Which has the <b>${word}</b>?`, opts.map(e => `${e.name} (${e.sym})`), opts.indexOf(big), [rel === 'row' ? `${a.sym} and ${b.sym} are in the same period (row ${a.period}).` : `${a.sym} and ${b.sym} are in the same group (column ${a.group}).`, rel === 'row' ? `Across a period, nuclear charge rises: radius ${prop === 'radius' ? 'shrinks, so the element further left is bigger' : 'shrinks and electrons are held tighter, so the element further right wins'}.` : `Down a group, shells get bigger: ${prop === 'radius' ? 'the lower element is bigger' : 'the higher element holds its electrons tighter'}.`, `Answer: <b>${big.name}</b>.`]);
  } });

const CAT = [['sodium', 'Na', 1], ['potassium', 'K', 1], ['lithium', 'Li', 1], ['silver', 'Ag', 1], ['ammonium', 'NH4', 1, 1], ['magnesium', 'Mg', 2], ['calcium', 'Ca', 2], ['barium', 'Ba', 2], ['zinc', 'Zn', 2], ['iron(II)', 'Fe', 2], ['iron(III)', 'Fe', 3], ['copper(I)', 'Cu', 1], ['copper(II)', 'Cu', 2], ['aluminum', 'Al', 3]];
const AN = [['chloride', 'Cl', 1], ['bromide', 'Br', 1], ['iodide', 'I', 1], ['fluoride', 'F', 1], ['oxide', 'O', 2], ['sulfide', 'S', 2], ['nitride', 'N', 3], ['hydroxide', 'OH', 1, 1], ['nitrate', 'NO3', 1, 1], ['nitrite', 'NO2', 1, 1], ['sulfate', 'SO4', 2, 1], ['sulfite', 'SO3', 2, 1], ['carbonate', 'CO3', 2, 1], ['phosphate', 'PO4', 3, 1], ['acetate', 'C2H3O2', 1, 1], ['cyanide', 'CN', 1, 1], ['permanganate', 'MnO4', 1, 1], ['hydrogen carbonate', 'HCO3', 1, 1]];
function ionicFormula(ca, an) { const g = gcd(ca[2], an[2]), nc = an[2] / g, na = ca[2] / g; const part = (s, n, poly) => n === 1 ? s : poly ? `(${s})${n}` : s + n; return part(ca[1], nc, ca[3]) + part(an[1], na, an[3]); }
CH.push({ id: 'ionic', course: '1311', emoji: '🧂', title: 'Ionic compounds & naming', blurb: 'Write formulas from names, with the charges crossing over.',
  learn: [
    { h: 'Charges must cancel', body: `<p>An ionic compound is neutral, so total + charge = total − charge. Shortcut: <b>cross the charge numbers</b> to become subscripts, then reduce.</p><p class="mono big">Al³⁺ + O²⁻ → Al₂O₃ &nbsp;·&nbsp; Ca²⁺ + PO₄³⁻ → Ca₃(PO₄)₂</p><p>Use parentheses when you need more than one polyatomic ion.</p>` },
    { h: 'Naming rules', body: `<p>Cation first, anion second. Metals with more than one charge (Fe, Cu, Sn, Pb…) get a Roman numeral: FeCl₃ is <b>iron(III) chloride</b>.</p><table class="tbl"><tr><th>Must-know polyatomic ions</th></tr><tr><td>NH₄⁺ ammonium · OH⁻ hydroxide · NO₃⁻ nitrate · NO₂⁻ nitrite · SO₄²⁻ sulfate · SO₃²⁻ sulfite · CO₃²⁻ carbonate · HCO₃⁻ hydrogen carbonate · PO₄³⁻ phosphate · C₂H₃O₂⁻ acetate · CN⁻ cyanide · MnO₄⁻ permanganate</td></tr></table>` },
  ],
  gen() {
    const ca = pick(CAT), an = pick(AN), f = ionicFormula(ca, an);
    const wrongs = [ionicFormula([0, ca[1], an[2], ca[3]], [0, an[1], ca[2], an[3]]), ca[1] + an[1], ionicFormula(ca, [0, an[1], an[2] + 1, an[3]]), ionicFormula([0, ca[1], ca[2] + 1, ca[3]], an), (ca[3] ? `(${ca[1]})` : ca[1]) + (an[3] ? `(${an[1]})${ca[2]}` : an[1] + ca[2])].filter(x => x !== f);
    if (Math.random() < .5) return mcFrom(`What is the formula of <b>${ca[0]} ${an[0]}</b>?`, F(f), wrongs.map(F), [`Ions: ${ca[1]}${ca[2] > 1 ? ca[2] : ''}+ and ${an[1]}${an[2] > 1 ? an[2] : ''}−.`, `Balance the charges (cross and reduce): <b>${F(f)}</b>.`]);
    const wrongN = [`${ca[0].replace(/\(.*\)/, '')} ${an[0]}`, `${ca[0]} ${an[0].replace('ide', 'ate')}`, `${ca[0]} ${an[0].replace('ate', 'ite')}`, `${ca[0].replace('(II)', '(III)').replace('(I)', '(II)')} ${an[0]}`, `${an[0]} ${ca[0]}`];
    return mcFrom(`What is the name of <b>${F(f)}</b>?`, `${ca[0]} ${an[0]}`, wrongN, [`Cation: ${ca[0]} (charge +${ca[2]}). Anion: ${an[0]}.`, ca[0].includes('(') ? `The metal can have more than one charge, so the Roman numeral shows it: +${ca[2]}.` : 'This metal only has one common charge, so no Roman numeral.', `Name: <b>${ca[0]} ${an[0]}</b>.`]);
  } });

const IMF_M = [['CH<sub>4</sub>', 'London dispersion', 'nonpolar'], ['Cl<sub>2</sub>', 'London dispersion', 'nonpolar'], ['CO<sub>2</sub>', 'London dispersion', 'linear, so the dipoles cancel'], ['I<sub>2</sub>', 'London dispersion', 'nonpolar'], ['C<sub>6</sub>H<sub>14</sub>', 'London dispersion', 'nonpolar hydrocarbon'],
  ['HCl', 'Dipole–dipole', 'polar, but H is on Cl, not N/O/F'], ['CH<sub>3</sub>Cl', 'Dipole–dipole', 'polar C–Cl bond'], ['CH<sub>3</sub>COCH<sub>3</sub> (acetone)', 'Dipole–dipole', 'polar C=O, no O–H'], ['CH<sub>3</sub>OCH<sub>3</sub>', 'Dipole–dipole', 'polar ether, no O–H'], ['H<sub>2</sub>S', 'Dipole–dipole', 'S is not N, O or F'],
  ['H<sub>2</sub>O', 'Hydrogen bonding', 'H bonded to O'], ['NH<sub>3</sub>', 'Hydrogen bonding', 'H bonded to N'], ['HF', 'Hydrogen bonding', 'H bonded to F'], ['CH<sub>3</sub>OH', 'Hydrogen bonding', 'O–H group'], ['CH<sub>3</sub>CH<sub>2</sub>OH', 'Hydrogen bonding', 'O–H group']];
const BP = [['CH<sub>3</sub>CH<sub>2</sub>OH', 'CH<sub>3</sub>OCH<sub>3</sub>', 'ethanol hydrogen bonds; the ether cannot'], ['H<sub>2</sub>O', 'H<sub>2</sub>S', 'water hydrogen bonds'], ['HF', 'HCl', 'HF hydrogen bonds'], ['I<sub>2</sub>', 'Br<sub>2</sub>', 'I₂ is bigger and more polarizable (stronger London forces)'], ['n-pentane', 'neopentane', 'the straight chain has more surface contact'], ['butane', 'propane', 'more electrons, stronger London forces'], ['CH<sub>3</sub>COOH', 'CH<sub>3</sub>CHO', 'the acid hydrogen bonds (and dimerizes)'], ['NaCl', 'HCl', 'ionic bonds are far stronger than any IMF']];
CH.push({ id: 'imf', course: '1311', emoji: '🧲', title: 'Intermolecular forces', blurb: 'Why water boils at 100 °C and methane at −162 °C.',
  learn: [
    { h: 'The three forces, weakest to strongest', body: `<ol><li><b>London dispersion</b>: every molecule has them; bigger molecules (more electrons, more surface) have stronger ones.</li><li><b>Dipole–dipole</b>: between polar molecules.</li><li><b>Hydrogen bonding</b>: H attached directly to <b>N, O or F</b>, attracted to a lone pair on another N, O or F.</li></ol><p>Ion–dipole forces (salt in water) are stronger still.</p>` },
    { h: 'What IMFs control', body: `<p>Stronger IMFs → <b>higher boiling point</b>, higher melting point, higher viscosity, higher surface tension and <b>lower vapor pressure</b>. "Like dissolves like": polar dissolves polar, nonpolar dissolves nonpolar.</p>` },
  ],
  gen() {
    if (Math.random() < .55) { const [m, f, why] = pick(IMF_M); return mcFrom(`What is the <b>strongest</b> intermolecular force in pure ${m}?`, f, ['London dispersion', 'Dipole–dipole', 'Hydrogen bonding', 'Ion–dipole'], [`${m} is ${why}.`, `Strongest IMF: <b>${f}</b>.`]); }
    const [hi, lo, why] = pick(BP), o = R.shuffle([hi, lo]);
    return mc('Which has the <b>higher boiling point</b>?', o, o.indexOf(hi), [`Compare the forces: ${why}.`, `Stronger attractions → higher boiling point: <b>${hi}</b>.`]);
  } });

const SOL = [['NaCl', true], ['AgCl', false], ['PbCl<sub>2</sub>', false], ['KNO<sub>3</sub>', true], ['BaSO<sub>4</sub>', false], ['CaCO<sub>3</sub>', false], ['Na<sub>2</sub>CO<sub>3</sub>', true], ['Fe(OH)<sub>3</sub>', false], ['NH<sub>4</sub>Cl', true], ['CuSO<sub>4</sub>', true], ['Mg(OH)<sub>2</sub>', false], ['(NH<sub>4</sub>)<sub>3</sub>PO<sub>4</sub>', true], ['Ca<sub>3</sub>(PO<sub>4</sub>)<sub>2</sub>', false], ['ZnS', false], ['K<sub>2</sub>S', true], ['Pb(NO<sub>3</sub>)<sub>2</sub>', true], ['AgNO<sub>3</sub>', true], ['AgBr', false]];
CH.push({ id: 'aqueous', course: '1311', emoji: '💧', title: 'Solutions & aqueous reactions', blurb: 'Molarity, dilution and solubility rules.',
  learn: [
    { h: 'Molarity and dilution', body: `<p class="formula">M = mol solute / L solution &nbsp;·&nbsp; M₁V₁ = M₂V₂</p><p>Dilution adds solvent, so the moles of solute don't change.</p>` },
    { h: 'Solubility rules (the short version)', body: `<ul><li><b>Always soluble</b>: group 1 (Na⁺, K⁺…), NH₄⁺, NO₃⁻, acetate.</li><li><b>Usually soluble</b>: Cl⁻, Br⁻, I⁻ (except Ag⁺, Pb²⁺, Hg₂²⁺); SO₄²⁻ (except Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺).</li><li><b>Usually insoluble</b>: CO₃²⁻, PO₄³⁻, S²⁻, OH⁻ (unless paired with group 1 or NH₄⁺).</li></ul><p>When two solutions mix and an insoluble combination forms, it <b>precipitates</b>.</p>` },
  ],
  gen() {
    const k = pick(['M', 'dil', 'sol', 'sol']);
    if (k === 'M') { const f = pick(['NaCl', 'KNO3', 'C6H12O6', 'NaOH', 'CaCl2']), g = R.real(2, 60, 1), V = R.int(100, 1000), M = g / molarMass(f) / (V / 1000);
      return numQ(`${g} g of ${F(f)} is dissolved to make <b>${V} mL</b> of solution. What is the molarity?`, M, 'M', [`mol = ${g} ÷ ${molarMass(f).toFixed(2)} = ${sig(g / molarMass(f))} mol.`, `M = mol ÷ L = ${sig(g / molarMass(f))} ÷ ${V / 1000} = <b>${sig(M)}</b> M.`]); }
    if (k === 'dil') { const M1 = R.real(1, 12, 1), V2 = R.int(100, 1000), M2 = R.real(.1, M1 / 2, 2), V1 = M2 * V2 / M1;
      return numQ(`How many mL of <b>${M1} M</b> stock do you need to make <b>${V2} mL</b> of <b>${M2} M</b> solution?`, V1, 'mL', [`M₁V₁ = M₂V₂, so V₁ = M₂V₂ / M₁.`, `V₁ = (${M2})(${V2}) / ${M1} = <b>${sig(V1)}</b> mL.`]); }
    const [s, ok] = pick(SOL); return mcFrom(`Is <b>${s}</b> soluble in water?`, ok ? 'Soluble' : 'Insoluble (precipitate)', ['Soluble', 'Insoluble (precipitate)'], [ok ? 'It contains an ion from the "always/usually soluble" list with no exception.' : 'It falls under an insoluble rule (or an exception to a soluble one).', `Answer: <b>${ok ? 'soluble' : 'insoluble'}</b>.`]);
  } });

const HF = { 'CH4': -74.8, 'C3H8': -103.8, 'C2H5OH': -277.7, 'C6H12O6': -1273.3 };
const COMB = [['CH4', 1, 2, 1, 2], ['C3H8', 1, 5, 3, 4], ['C2H5OH', 1, 3, 2, 3], ['C6H12O6', 1, 6, 6, 6]];
CH.push({ id: 'thermo', course: '1311', emoji: '🔥', title: 'Thermochemistry', blurb: 'Heat, calorimetry and enthalpy of reaction.',
  learn: [
    { h: 'Heat and temperature', body: `<p class="formula">q = m · c · ΔT</p><p>For water, c = <b>4.184 J/(g·°C)</b>. Positive q means heat flows in (endothermic); negative q means heat flows out (exothermic).</p>` },
    { h: 'Enthalpy of reaction', body: `<p class="formula">ΔH°rxn = Σ n ΔH°f(products) − Σ n ΔH°f(reactants)</p><p>Elements in their standard state (O₂, H₂, C(graphite)) have ΔH°f = 0. <b>Hess's law</b>: if you reverse a reaction, flip the sign of ΔH; if you multiply it, multiply ΔH.</p>` },
  ],
  gen() {
    if (Math.random() < .55) { const m = R.int(50, 500), T1 = R.int(15, 30), dT = R.int(5, 60), q = m * 4.184 * dT;
      if (Math.random() < .5) return numQ(`How much heat (in J) warms <b>${m} g</b> of water from ${T1} °C to ${T1 + dT} °C?`, q, 'J', [`ΔT = ${dT} °C.`, `q = (${m})(4.184)(${dT}) = <b>${sig(q)}</b> J.`]);
      return numQ(`<b>${sig(q)} J</b> of heat is added to ${m} g of water at ${T1} °C. What is the final temperature?`, T1 + dT, '°C', [`ΔT = q / (mc) = ${sig(q)} / ((${m})(4.184)) = ${dT} °C.`, `Final T = ${T1} + ${dT} = <b>${T1 + dT}</b> °C.`], { abs: .5 }); }
    const [f, a, b, c, d] = pick(COMB), H = c * -393.5 + d * -285.8 - a * HF[f];
    return numQ(`<div class="eq">${F(f)} + ${b} O₂ → ${c} CO₂ + ${d} H₂O(l)</div>Calculate ΔH°rxn in kJ. ΔH°f: ${F(f)} = ${HF[f]}, CO₂ = −393.5, H₂O(l) = −285.8 kJ/mol.`, H, 'kJ', [`Products: ${c}(−393.5) + ${d}(−285.8) = ${(c * -393.5 + d * -285.8).toFixed(1)} kJ.`, `Reactants: ${HF[f]} + ${b}(0) = ${HF[f]} kJ (O₂ is an element, so 0).`, `ΔH = products − reactants = <b>${H.toFixed(1)}</b> kJ (exothermic).`], { tol: .005 });
  } });

/* ======================= CHEM 1312 ======================= */
const SOLUTES = [['glucose', 'C6H12O6', 1], ['sucrose', 'C12H22O11', 1], ['NaCl', 'NaCl', 2], ['KBr', 'KBr', 2], ['CaCl2', 'CaCl2', 3]];
CH.push({ id: 'colligative', course: '1312', emoji: '🧊', title: 'Colligative properties', blurb: 'Why salt melts ice: freezing-point depression and boiling-point elevation.',
  learn: [
    { h: 'It only depends on how many particles', body: `<p class="formula">ΔT<sub>f</sub> = i · K<sub>f</sub> · m &nbsp;·&nbsp; ΔT<sub>b</sub> = i · K<sub>b</sub> · m</p><p><b>m</b> is molality (mol solute per <b>kg of solvent</b>). <b>i</b> is the van 't Hoff factor: particles per formula unit. Glucose i = 1, NaCl i = 2, CaCl₂ i = 3.</p><p>For water: K<sub>f</sub> = 1.86 °C/m, K<sub>b</sub> = 0.512 °C/m.</p>` },
  ],
  gen() {
    const [nm, f, i] = pick(SOLUTES), g = R.real(5, 120, 1), kg = R.real(.2, 1.5, 2), m = g / molarMass(f) / kg, fr = Math.random() < .6, K = fr ? 1.86 : .512, dT = i * K * m;
    return numQ(`${g} g of ${nm} is dissolved in ${kg} kg of water. What is the new ${fr ? 'freezing' : 'boiling'} point?`, fr ? -dT : 100 + dT, '°C', [`m = (${g} ÷ ${molarMass(f).toFixed(2)}) ÷ ${kg} = ${sig(m)} mol/kg.`, `i = ${i}. ΔT = ${i} × ${K} × ${sig(m)} = ${sig(dT)} °C.`, `${fr ? 'Freezing point = 0 − ' + sig(dT) : 'Boiling point = 100 + ' + sig(dT)} = <b>${sig(fr ? -dT : 100 + dT, 4)}</b> °C.`], { abs: .05, tol: .002 });
  } });

CH.push({ id: 'kinetics', course: '1312', emoji: '⏱️', title: 'Chemical kinetics', blurb: 'Rate laws from data, half-lives and integrated rate laws.',
  learn: [
    { h: 'Rate laws come from experiments', body: `<p class="formula">rate = k[A]<sup>m</sup>[B]<sup>n</sup></p><p>Find each order by comparing two experiments where only one concentration changes. If doubling [A] doubles the rate, m = 1. If it quadruples, m = 2. If nothing happens, m = 0. Overall order = m + n.</p>` },
    { h: 'First-order reactions', body: `<p class="formula">ln[A] = ln[A]₀ − kt &nbsp;·&nbsp; t<sub>½</sub> = 0.693 / k</p><p>A first-order half-life doesn't depend on concentration, which is why radioactive decay is first order.</p>` },
  ],
  gen() {
    if (Math.random() < .55) { const m = R.int(0, 2), n = R.int(0, 2), k = R.pick([.012, .25, 1.4, 3.2]), A = .1, B = .1, rt = (a, b) => k * a ** m * b ** n;
      const rows = [[A, B], [2 * A, B], [A, 2 * B]], which = pick(['A', 'B', 'overall']);
      const tbl = `<table class="tbl"><tr><th>Exp</th><th>[A] (M)</th><th>[B] (M)</th><th>Rate (M/s)</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${sig(rt(...r))}</td></tr>`).join('')}</table>`;
      const ans = which === 'A' ? m : which === 'B' ? n : m + n;
      return mcFrom(`${tbl}What is the reaction order ${which === 'overall' ? '<b>overall</b>' : `in <b>${which}</b>`}?`, String(ans), ['0', '1', '2', '3', '4'], [`Exp 1 → 2: [A] doubles, rate × ${2 ** m}, so order in A = <b>${m}</b>.`, `Exp 1 → 3: [B] doubles, rate × ${2 ** n}, so order in B = <b>${n}</b>.`, `rate = k[A]<sup>${m}</sup>[B]<sup>${n}</sup>; overall order ${m + n}.`]); }
    const k = R.real(.01, .4, 3), t = R.int(2, 30), A0 = R.real(.5, 2, 2), A = A0 * Math.exp(-k * t);
    if (Math.random() < .5) return numQ(`A first-order reaction has k = <b>${k} s⁻¹</b>. What is its half-life?`, .693 / k, 's', [`t½ = 0.693 / k = 0.693 / ${k} = <b>${sig(.693 / k)}</b> s.`]);
    return numQ(`A first-order reaction has k = ${k} s⁻¹ and [A]₀ = ${A0} M. What is [A] after <b>${t} s</b>?`, A, 'M', [`[A] = [A]₀ e<sup>−kt</sup> = ${A0} × e<sup>−(${k})(${t})</sup>.`, `[A] = <b>${sig(A)}</b> M.`]);
  } });

const LECH = [['Add N<sub>2</sub>', 'Shifts right (toward NH₃)', 'Adding a reactant pushes the reaction forward to use it up.'], ['Remove NH<sub>3</sub>', 'Shifts right (toward NH₃)', 'Removing a product pulls the reaction forward to replace it.'], ['Increase the pressure (smaller volume)', 'Shifts right (toward NH₃)', 'The right side has fewer gas moles (2 vs 4).'], ['Raise the temperature', 'Shifts left (toward N₂ + H₂)', 'The forward reaction is exothermic, so heat acts like a product.'], ['Add a catalyst', 'No shift', 'A catalyst speeds up both directions equally; K does not change.'], ['Add argon at constant volume', 'No shift', 'An inert gas does not change any partial pressure.'], ['Lower the temperature', 'Shifts right (toward NH₃)', 'Removing heat favors the exothermic direction.']];
CH.push({ id: 'equilibrium', course: '1312', emoji: '⚖️', title: 'Chemical equilibrium', blurb: 'K, Q and Le Châtelier\'s principle.',
  learn: [
    { h: 'The equilibrium constant', body: `<p>For aA + bB ⇌ cC + dD:</p><p class="formula">K = [C]<sup>c</sup>[D]<sup>d</sup> / ([A]<sup>a</sup>[B]<sup>b</sup>)</p><p>Leave out pure solids and liquids. A big K (&gt; 10³) means products are favored.</p>` },
    { h: 'Q tells you which way to go', body: `<p>Q has the same form as K but uses the <i>current</i> concentrations.</p><ul><li>Q &lt; K → too few products → shifts <b>right</b>.</li><li>Q &gt; K → too many products → shifts <b>left</b>.</li><li>Q = K → at equilibrium.</li></ul>` },
    { h: 'Le Châtelier', body: `<p>When you disturb an equilibrium, it shifts to partly undo the change: add something and it gets used up; increase pressure and it shifts toward fewer gas moles; add heat and it shifts in the endothermic direction.</p><p class="eq">N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) &nbsp; ΔH = −92 kJ</p>` },
  ],
  gen() {
    const k = pick(['lech', 'Q', 'K']);
    if (k === 'lech') { const [d, a, why] = pick(LECH); return mcFrom(`<div class="eq">N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) &nbsp; ΔH = −92 kJ</div><b>${d}.</b> Which way does the equilibrium shift?`, a, ['Shifts right (toward NH₃)', 'Shifts left (toward N₂ + H₂)', 'No shift'], [why]); }
    const a = R.real(.1, 1, 2), b = R.real(.1, 1, 2), c = R.real(.05, 2, 2), Q = c ** 2 / (a * b ** 3);
    if (k === 'K') return numQ(`At equilibrium, [N₂] = ${a} M, [H₂] = ${b} M and [NH₃] = ${c} M. What is K<sub>c</sub>?`, Q, '', [`K = [NH₃]² / ([N₂][H₂]³).`, `K = (${c})² / ((${a})(${b})³) = <b>${sig(Q)}</b>.`]);
    const K = Q * pick([.1, .3, 3, 10]), dir = Q < K ? 'Shifts right' : 'Shifts left';
    return mcFrom(`For N₂ + 3H₂ ⇌ 2NH₃, K<sub>c</sub> = ${sig(K)}. A mixture has [N₂] = ${a}, [H₂] = ${b}, [NH₃] = ${c} M. Which way does it go?`, dir, ['Shifts right', 'Shifts left', 'Already at equilibrium'], [`Q = (${c})² / ((${a})(${b})³) = ${sig(Q)}.`, `Q ${Q < K ? '<' : '>'} K, so it <b>${dir.toLowerCase()}</b>.`]);
  } });

const KSP = [['AgCl', 1.8e-10, 1, 1], ['BaSO<sub>4</sub>', 1.1e-10, 1, 1], ['CaF<sub>2</sub>', 3.9e-11, 1, 2], ['Mg(OH)<sub>2</sub>', 1.8e-11, 1, 2], ['PbI<sub>2</sub>', 7.1e-9, 1, 2], ['Ag<sub>2</sub>CrO<sub>4</sub>', 1.1e-12, 2, 1], ['Fe(OH)<sub>3</sub>', 2.8e-39, 1, 3]];
CH.push({ id: 'ksp', course: '1312', emoji: '🪨', title: 'Solubility equilibria (Ksp)', blurb: 'Molar solubility from Ksp and back.',
  learn: [
    { h: 'Set up s', body: `<p>For a salt AₓBᵧ dissolving: AₓBᵧ(s) ⇌ x A + y B. If s mol/L dissolves, [A] = xs and [B] = ys.</p><p class="formula">K<sub>sp</sub> = (xs)<sup>x</sup>(ys)<sup>y</sup></p><table class="tbl"><tr><th>Type</th><th>Ksp in terms of s</th></tr><tr><td>AB (AgCl)</td><td>s²</td></tr><tr><td>AB₂ or A₂B (CaF₂, Ag₂CrO₄)</td><td>4s³</td></tr><tr><td>AB₃ (Fe(OH)₃)</td><td>27s⁴</td></tr></table>` },
    { h: 'Common-ion effect', body: `<p>Adding an ion that's already in the equilibrium (like Cl⁻ to AgCl) shifts it left and <b>lowers</b> the solubility.</p>` },
  ],
  gen() {
    const [f, K, x, y] = pick(KSP), coef = x ** x * y ** y, n = x + y, s = (K / coef) ** (1 / n);
    if (Math.random() < .6) return numQ(`K<sub>sp</sub> of ${f} is ${sig(K, 2)}. What is its molar solubility?`, s, 'M', [`${f} → ${x} cation + ${y} anion, so K<sub>sp</sub> = ${coef === 1 ? '' : coef}s<sup>${n}</sup>.`, `s = (${sig(K, 2)} / ${coef})<sup>1/${n}</sup> = <b>${sig(s)}</b> M.`], { placeholder: 'e.g. 1.3e-5' });
    return numQ(`The molar solubility of ${f} is ${sig(s)} M. What is K<sub>sp</sub>?`, coef * s ** n, '', [`K<sub>sp</sub> = ${coef === 1 ? '' : coef}s<sup>${n}</sup>.`, `= ${coef}(${sig(s)})<sup>${n}</sup> = <b>${sig(coef * s ** n)}</b>.`], { placeholder: 'e.g. 1.8e-10' });
  } });

CH.push({ id: 'gibbs', course: '1312', emoji: '🌡️', title: 'Entropy & free energy', blurb: 'ΔG = ΔH − TΔS and when reactions are spontaneous.',
  learn: [
    { h: 'Spontaneous means ΔG < 0', body: `<p class="formula">ΔG = ΔH − TΔS</p><p>Watch units: ΔH is usually in kJ, ΔS in J/K. Divide ΔS by 1000 first.</p><table class="tbl"><tr><th>ΔH</th><th>ΔS</th><th>Spontaneous?</th></tr><tr><td>−</td><td>+</td><td>always</td></tr><tr><td>+</td><td>−</td><td>never</td></tr><tr><td>−</td><td>−</td><td>at low T</td></tr><tr><td>+</td><td>+</td><td>at high T</td></tr></table>` },
    { h: 'Free energy and K', body: `<p class="formula">ΔG° = −RT ln K</p><p>ΔG° &lt; 0 ↔ K &gt; 1. The crossover temperature where ΔG = 0 is T = ΔH/ΔS.</p>` },
  ],
  gen() {
    const sH = pick([-1, 1]), sS = pick([-1, 1]), H = sH * R.int(20, 200), S = sS * R.int(40, 300), T = R.int(250, 1200), G = H - T * S / 1000;
    const k = pick(['G', 'G', 'case', 'K']);
    if (k === 'G') return numQ(`ΔH = ${H} kJ and ΔS = ${S} J/K. What is ΔG at <b>${T} K</b>?`, G, 'kJ', [`Convert ΔS: ${S} J/K = ${S / 1000} kJ/K.`, `ΔG = ${H} − (${T})(${S / 1000}) = <b>${sig(G)}</b> kJ ${G < 0 ? '(spontaneous)' : '(not spontaneous)'}.`], { abs: .2 });
    if (k === 'K') { const dG = R.int(-40, 40) || 5, K = Math.exp(-dG * 1000 / (8.314 * 298)); return numQ(`ΔG° = ${dG} kJ/mol at 298 K. What is K?`, K, '', [`K = e<sup>−ΔG°/RT</sup> = e<sup>−(${dG * 1000})/((8.314)(298))</sup>.`, `K = <b>${sig(K)}</b> (${K > 1 ? 'products favored' : 'reactants favored'}).`]); }
    const ans = sH < 0 && sS > 0 ? 'Spontaneous at all temperatures' : sH > 0 && sS < 0 ? 'Never spontaneous' : sH < 0 ? 'Spontaneous only at low temperature' : 'Spontaneous only at high temperature';
    return mcFrom(`A reaction has ΔH ${sH < 0 ? '< 0' : '> 0'} and ΔS ${sS < 0 ? '< 0' : '> 0'}. When is it spontaneous?`, ans, ['Spontaneous at all temperatures', 'Never spontaneous', 'Spontaneous only at low temperature', 'Spontaneous only at high temperature'], [`ΔG = ΔH − TΔS.`, `With these signs: <b>${ans.toLowerCase()}</b>.`]);
  } });

const E0 = [['Au³⁺/Au', 'Au', 1.50, 3], ['Ag⁺/Ag', 'Ag', 0.80, 1], ['Cu²⁺/Cu', 'Cu', 0.34, 2], ['Pb²⁺/Pb', 'Pb', -0.13, 2], ['Ni²⁺/Ni', 'Ni', -0.25, 2], ['Fe²⁺/Fe', 'Fe', -0.44, 2], ['Zn²⁺/Zn', 'Zn', -0.76, 2], ['Al³⁺/Al', 'Al', -1.66, 3], ['Mg²⁺/Mg', 'Mg', -2.37, 2]];
CH.push({ id: 'electro', course: '1312', emoji: '🔋', title: 'Electrochemistry', blurb: 'Cell potentials, anodes, cathodes and ΔG = −nFE.',
  learn: [
    { h: 'Red cat, an ox', body: `<p><b>Red</b>uction happens at the <b>cat</b>hode; <b>ox</b>idation at the <b>an</b>ode. In a galvanic cell, the half-reaction with the <b>higher</b> (more positive) E° is the cathode.</p><p class="formula">E°cell = E°cathode − E°anode</p><p>Use the reduction potentials straight from the table. Don't flip signs or multiply E° by coefficients.</p>` },
    { h: 'Linking to free energy', body: `<p class="formula">ΔG° = −nFE°cell</p><p>F = 96,485 C/mol e⁻. n is the electrons transferred in the balanced reaction. A positive E°cell means ΔG° &lt; 0, a spontaneous (galvanic) cell.</p>` },
  ],
  gen() {
    const [a, b] = R.shuffle(E0).slice(0, 2), cat = a[2] > b[2] ? a : b, an = cat === a ? b : a, E = cat[2] - an[2], n = cat[3] * an[3] / gcd(cat[3], an[3]);
    const k = pick(['E', 'anode', 'G']);
    const tbl = `Standard reduction potentials: ${a[0]} = ${a[2]} V, ${b[0]} = ${b[2]} V.`;
    if (k === 'E') return numQ(`${tbl} What is E°cell for the galvanic cell?`, E, 'V', [`Cathode = higher E°: ${cat[0]} (${cat[2]} V). Anode: ${an[0]} (${an[2]} V).`, `E°cell = ${cat[2]} − (${an[2]}) = <b>${E.toFixed(2)}</b> V.`], { abs: .011 });
    if (k === 'anode') return mcFrom(`${tbl} Which metal is <b>oxidized</b> (the anode)?`, an[1], E0.map(x => x[1]).filter(x => x === a[1] || x === b[1] || Math.random() < .3), [`The lower E° half-reaction runs backward as oxidation.`, `${an[0]} has the lower E° (${an[2]} V), so <b>${an[1]}</b> is oxidized at the anode.`]);
    const G = -n * 96485 * E / 1000;
    return numQ(`${tbl} With n = ${n} electrons transferred, what is ΔG° in kJ?`, G, 'kJ', [`E°cell = ${E.toFixed(2)} V.`, `ΔG° = −nFE° = −(${n})(96,485)(${E.toFixed(2)}) J = <b>${sig(G)}</b> kJ.`]);
  } });

CH.push({ id: 'nuclear', course: '1312', emoji: '☢️', title: 'Nuclear chemistry', blurb: 'Decay types, balancing nuclear equations and half-lives.',
  learn: [
    { h: 'Decay types', body: `<table class="tbl"><tr><th>Decay</th><th>Particle</th><th>Effect on A, Z</th></tr><tr><td>Alpha</td><td>⁴₂He</td><td>A − 4, Z − 2</td></tr><tr><td>Beta (β⁻)</td><td>⁰₋₁e</td><td>A same, Z + 1</td></tr><tr><td>Positron (β⁺)</td><td>⁰₊₁e</td><td>A same, Z − 1</td></tr><tr><td>Gamma</td><td>γ</td><td>no change</td></tr></table><p>Mass numbers (A) and atomic numbers (Z) must balance on both sides.</p>` },
    { h: 'Half-life', body: `<p class="formula">N = N₀ (½)<sup>t / t½</sup></p><p>After 1 half-life, 50% remains; after 2, 25%; after 3, 12.5%.</p>` },
  ],
  gen() {
    if (Math.random() < .5) { const N0 = R.int(20, 500), th = R.int(2, 30), n = pick([1, 2, 3, 4, 1.5, 2.5]), t = th * n, N = N0 * .5 ** n;
      return numQ(`An isotope has a half-life of ${th} days. How much of a <b>${N0} g</b> sample is left after <b>${t} days</b>?`, N, 'g', [`Number of half-lives: ${t} ÷ ${th} = ${n}.`, `N = ${N0} × (½)<sup>${n}</sup> = <b>${sig(N)}</b> g.`]); }
    const type = pick(['alpha', 'beta', 'positron']);
    const Z = type === 'alpha' ? R.int(84, 94) : R.int(6, 50), A = type === 'alpha' ? Math.round(Z * 2.52) : Math.round(Z * 2.1) + R.int(0, 3), e = ELEMENTS[Z - 1];
    const Z2 = type === 'alpha' ? Z - 2 : type === 'beta' ? Z + 1 : Z - 1, A2 = type === 'alpha' ? A - 4 : A, p = ELEMENTS[Z2 - 1];
    const fmt = (a, z, s) => `<sup>${a}</sup><sub>${z}</sub>${s}`;
    return mcFrom(`What is the product when ${fmt(A, Z, e.sym)} undergoes <b>${type === 'positron' ? 'positron emission' : type + ' decay'}</b>?`, fmt(A2, Z2, p.sym), [fmt(A - 4, Z - 2, ELEMENTS[Z - 3].sym), fmt(A, Z + 1, ELEMENTS[Z].sym), fmt(A, Z - 1, ELEMENTS[Z - 2].sym), fmt(A - 2, Z - 2, ELEMENTS[Z - 3].sym), fmt(A + 4, Z + 2, ELEMENTS[Z + 1].sym)], [`${type === 'alpha' ? 'Alpha removes ⁴₂He: A − 4, Z − 2' : type === 'beta' ? 'Beta turns a neutron into a proton: Z + 1, A unchanged' : 'Positron emission turns a proton into a neutron: Z − 1, A unchanged'}.`, `Z = ${Z2} is ${p.name}: <b>${p.sym}-${A2}</b>.`]);
  } });

/* ======================= CHEM 2323 ======================= */
CH.push({ id: 'conform', course: '2323', emoji: '🪑', title: 'Conformations & cyclohexane chairs', blurb: 'Newman projections, ring strain, axial vs equatorial.',
  learn: [
    { h: 'Newman projections', body: `<p>Look straight down a C–C bond. <b>Staggered</b> (bonds 60° apart) is lowest in energy; <b>eclipsed</b> is highest. For butane, <b>anti</b> (CH₃ groups 180° apart) beats <b>gauche</b> (60°).</p>` },
    { h: 'The chair', body: `<p>Cyclohexane's chair has no angle or torsional strain. Each carbon has one <b>axial</b> (straight up/down) and one <b>equatorial</b> (out to the side) position. A ring flip swaps them.</p><p><b>Big groups prefer equatorial</b> to avoid 1,3-diaxial interactions. A tert-butyl group basically locks the ring.</p>` },
  ],
  gen: bank([
    ['Which Newman conformation of ethane is lowest in energy?', 'Staggered', ['Eclipsed', 'Gauche', 'All are equal'], 'Staggered bonds are 60° apart, minimizing torsional strain.'],
    ['For butane (C2–C3 bond), which conformation is most stable?', 'Anti (CH₃ groups 180° apart)', ['Gauche', 'Eclipsed with CH₃ groups together', 'Totally eclipsed is most stable'], 'Anti keeps the two methyls as far apart as possible: no steric strain.'],
    ['In methylcyclohexane, the methyl group prefers…', 'the equatorial position', ['the axial position', 'neither, 50:50', 'to be in the boat form'], 'Axial methyl suffers two 1,3-diaxial interactions with axial H\'s.'],
    ['A ring flip converts an axial substituent to…', 'equatorial', ['axial on the other face', 'a boat conformation', 'the opposite configuration'], 'Ring flips swap axial and equatorial, but up stays up.'],
    ['In the most stable chair of cis-1,4-di-tert-butylcyclohexane…', 'one t-Bu is axial; the ring may twist to a boat to avoid it', ['both t-Bu are equatorial', 'both are axial', 'the molecule is planar'], 'Cis-1,4 forces one up/one down group to be axial; a huge t-Bu prefers a twist-boat.'],
    ['trans-1,2-dimethylcyclohexane: most stable chair?', 'Both methyls equatorial', ['Both axial', 'One axial, one equatorial', 'It cannot form a chair'], 'For trans-1,2 the groups can be diequatorial in one chair.'],
    ['cis-1,3-dimethylcyclohexane: most stable chair?', 'Both methyls equatorial', ['Both axial', 'One axial, one equatorial', 'Neither, it is planar'], 'Cis-1,3 groups are both up; one chair puts both equatorial.'],
    ['Which cycloalkane has the most ring strain per CH₂?', 'Cyclopropane', ['Cyclohexane', 'Cyclopentane', 'Cycloheptane'], '60° bond angles in cyclopropane are far from 109.5°.'],
    ['Torsional strain comes from…', 'eclipsing bonds on adjacent carbons', ['bond angles away from 109.5°', 'atoms bumping across a ring', 'hydrogen bonding'], 'Eclipsed bonds repel each other: torsional strain.'],
  
    ['In a Newman projection of ethane, eclipsed vs staggered differ by about…', '12 kJ/mol (3 × 4 kJ/mol H/H eclipsing)', ['50 kJ/mol', '0 kJ/mol', '1 kJ/mol'], 'Each eclipsing H/H interaction costs about 4 kJ/mol.'],
    ['Gauche butane is less stable than anti by about…', '3.8 kJ/mol', ['19 kJ/mol', '0 kJ/mol', '12 kJ/mol'], 'One gauche CH₃/CH₃ interaction costs about 3.8 kJ/mol.'],
    ['The highest-energy conformation of butane is…', 'totally eclipsed (CH₃ eclipsing CH₃, 0°)', ['anti', 'gauche', 'staggered'], 'CH₃/CH₃ eclipsing adds steric strain on top of torsional strain (~19 kJ/mol).'],
    ['Each axial methyl in cyclohexane costs about…', '7.6 kJ/mol (two 1,3-diaxial interactions)', ['0.5 kJ/mol', '30 kJ/mol', '4 kJ/mol per H'], 'Each CH₃/H 1,3-diaxial interaction ≈ 3.8 kJ/mol, and there are two.'],
    ['Which group has the strongest equatorial preference?', 'tert-butyl', ['methyl', 'ethyl', 'hydroxyl'], 'A t-Bu group is so bulky it essentially locks the ring with t-Bu equatorial.'],
    ['cis-1,2-dimethylcyclohexane: what are the two chair forms like?', 'Both have one axial and one equatorial methyl (equal energy)', ['One is diequatorial, one diaxial', 'Both are diequatorial', 'Both are diaxial'], 'Cis-1,2 is always one up-axial and one up-equatorial; flipping just swaps them.'],
    ['trans-1,4-dimethylcyclohexane: most stable chair?', 'Both methyls equatorial', ['Both axial', 'One axial, one equatorial', 'Twist-boat'], 'Trans-1,4 can be diequatorial.'],
    ['Cyclohexane\'s boat conformation is higher in energy mainly because of…', 'flagpole interactions and eclipsing bonds', ['angle strain', 'hydrogen bonding', 'resonance'], 'Boat has eclipsed C–C bonds and the flagpole H/H clash.'],
    ['Angle strain is caused by…', 'bond angles forced away from 109.5°', ['eclipsed bonds', 'bulky groups near each other', 'lone pair repulsion only'], 'This is Baeyer strain; small rings have the most.'],
    ['How many axial positions are on a cyclohexane chair?', '6 (3 up, 3 down, alternating)', ['12', '3', '2'], 'One axial and one equatorial position on each of the 6 carbons.'],
    ['In a Newman projection, the front carbon is drawn as…', 'a point where three bonds meet', ['a large circle', 'a wedge', 'a dashed line'], 'The back carbon is the circle; its bonds come out from behind it.'],
  ]) });

CH.push({ id: 'radical', course: '2323', emoji: '☀️', title: 'Radical halogenation', blurb: 'Initiation, propagation, termination, and why bromination is picky.',
  learn: [
    { h: 'Three stages', body: `<ol><li><b>Initiation</b>: light or heat splits X₂ into two radicals (X•).</li><li><b>Propagation</b>: X• takes an H, making a carbon radical; the carbon radical takes X from X₂, regenerating X•.</li><li><b>Termination</b>: two radicals combine.</li></ol><p>Radical stability: <b>3° &gt; 2° &gt; 1° &gt; methyl</b> (and allylic/benzylic are best).</p>` },
    { h: 'Selectivity', body: `<p><b>Bromination is very selective</b>: it almost always replaces the H on the most substituted carbon. <b>Chlorination is less selective</b> and gives mixtures. (Hammond postulate: bromination's late, product-like transition state feels the radical's stability.)</p>` },
  ],
  gen: bank([
    ['Which step forms the radicals in the first place?', 'Initiation', ['Propagation', 'Termination', 'Rearrangement'], 'Initiation uses light or heat to split X₂ homolytically.'],
    ['Br₂, hν with 2-methylbutane gives mainly…', '2-bromo-2-methylbutane', ['1-bromo-2-methylbutane', '1-bromo-3-methylbutane', 'an equal mixture'], 'Bromination is selective for the 3° hydrogen (the most stable radical).'],
    ['Which radical is most stable?', 'Tertiary (3°)', ['Primary (1°)', 'Secondary (2°)', 'Methyl'], 'More alkyl groups donate electron density by hyperconjugation.'],
    ['Why is bromination more selective than chlorination?', 'Its transition state is later and more product-like', ['Br is smaller than Cl', 'Br₂ is a stronger acid', 'Chlorination is reversible'], 'Hammond postulate: an endothermic step has a late TS that reflects radical stability.'],
    ['Two radicals combining is called…', 'Termination', ['Initiation', 'Propagation', 'Hydrogen abstraction'], 'Termination removes radicals from the chain.'],
    ['NBS with light brominates which position?', 'Allylic or benzylic', ['Vinylic', 'Any 1° carbon', 'The carbonyl carbon'], 'NBS keeps [Br₂] low, so allylic radical substitution beats addition.'],
    ['Radical halogenation of a stereocenter-forming carbon gives…', 'a racemic mixture', ['only R', 'only S', 'a meso compound'], 'The carbon radical is planar, so X can add from either face.'],
  
    ['Which bond breaks in the initiation step of Cl₂ chlorination?', 'Cl–Cl (homolysis)', ['C–H', 'C–Cl', 'H–Cl'], 'Light or heat splits the weak Cl–Cl bond into two Cl•.'],
    ['Homolytic bond cleavage gives…', 'two radicals (one electron each)', ['a cation and an anion', 'two anions', 'a carbocation only'], 'Each atom takes one electron; single-barbed fishhook arrows show it.'],
    ['Which arrow shows one electron moving?', 'A single-barbed fishhook arrow', ['A double-barbed arrow', 'A resonance arrow ↔', 'An equilibrium arrow ⇌'], 'Radical mechanisms use fishhook arrows.'],
    ['Allylic radicals are especially stable because…', 'the unpaired electron is delocalized by resonance', ['they have no hydrogens', 'they are sp³', 'they are charged'], 'Resonance spreads the radical over two carbons.'],
    ['Which hydrogen is easiest to abstract?', 'a benzylic or allylic C–H', ['a vinylic C–H', 'a methyl C–H', 'an aryl C–H'], 'It has the weakest bond because the radical formed is resonance-stabilized.'],
    ['Chlorination of propane gives a mixture mainly because…', 'Cl• is reactive and not very selective', ['propane is symmetric', 'Cl₂ is a nucleophile', 'there are no 2° hydrogens'], 'Chlorination barely distinguishes 1° from 2° H (about 3.5 : 1 per H).'],
    ['Peroxides (ROOR) are used in radical reactions as…', 'radical initiators', ['nucleophiles', 'Lewis acids', 'protecting groups'], 'The weak O–O bond homolyzes easily.'],
    ['A propagation step…', 'consumes one radical and makes another', ['makes two radicals from none', 'destroys two radicals', 'only happens in light'], 'That is why chain reactions keep going.'],
  ]) });

/* ======================= CHEM 2325 ======================= */
CH.push({ id: 'massspec', course: '2325', emoji: '⚡', title: 'Mass spectrometry', blurb: 'Molecular ions, M+2 patterns and the nitrogen rule.',
  learn: [
    { h: 'Reading a mass spectrum', body: `<p>The <b>molecular ion (M⁺)</b> gives the molecular mass. The tallest peak is the <b>base peak</b> (set to 100%), usually the most stable fragment.</p>` },
    { h: 'Isotope fingerprints', body: `<ul><li><b>Cl</b>: M and M+2 in a <b>3 : 1</b> ratio.</li><li><b>Br</b>: M and M+2 in a <b>1 : 1</b> ratio.</li><li><b>Nitrogen rule</b>: an <b>odd</b> molecular mass means an odd number of nitrogens.</li><li>M+1 height ≈ 1.1% × number of carbons.</li></ul>` },
  ],
  gen() {
    const k = pick(['iso', 'iso', 'N', 'C']);
    if (k === 'iso') { const [r, a] = pick([['3 : 1', 'Chlorine'], ['1 : 1', 'Bromine'], ['no significant M+2', 'Neither Cl nor Br']]); return mcFrom(`A spectrum shows M and M+2 peaks in a <b>${r}</b> ratio. Which halogen is present?`, a, ['Chlorine', 'Bromine', 'Fluorine', 'Iodine', 'Neither Cl nor Br'], [`³⁵Cl : ³⁷Cl ≈ 3 : 1. ⁷⁹Br : ⁸¹Br ≈ 1 : 1. F and I have one isotope.`, `So: <b>${a}</b>.`]); }
    if (k === 'N') { const M = R.int(40, 180), odd = M % 2 === 1; return mcFrom(`A compound (C, H, N, O only) has M⁺ = <b>${M}</b>. What does the nitrogen rule say?`, odd ? 'An odd number of N atoms' : 'Zero or an even number of N atoms', ['An odd number of N atoms', 'Zero or an even number of N atoms', 'It must contain oxygen', 'It must contain a halogen'], [`${M} is ${odd ? 'odd' : 'even'}.`, `Odd mass ↔ odd number of nitrogens: <b>${odd ? 'odd N' : 'zero or even N'}</b>.`]); }
    const nC = R.int(3, 14), p = +(nC * 1.1).toFixed(1); return mcFrom(`The M+1 peak is <b>${p}%</b> of M. About how many carbons are there?`, String(nC), [nC - 2, nC - 1, nC + 1, nC + 2, nC * 2].map(String), [`Each carbon adds ~1.1% (¹³C).`, `${p} ÷ 1.1 ≈ <b>${nC}</b> carbons.`]);
  } });

const AROM = [['benzene', 'Aromatic', '6 π electrons (n = 1), planar, fully conjugated ring'], ['cyclobutadiene', 'Antiaromatic', '4 π electrons (4n), planar and conjugated'], ['cyclopentadienyl anion', 'Aromatic', 'the lone pair makes 6 π electrons'], ['cyclopentadienyl cation', 'Antiaromatic', 'only 4 π electrons'], ['tropylium (cycloheptatrienyl) cation', 'Aromatic', '6 π electrons over 7 carbons'], ['cyclopropenyl cation', 'Aromatic', '2 π electrons (n = 0)'], ['cyclooctatetraene', 'Nonaromatic', '8 π electrons, but it puckers into a tub to avoid antiaromaticity'], ['pyridine', 'Aromatic', 'N lone pair is in the plane, not counted; 6 π electrons'], ['pyrrole', 'Aromatic', 'the N lone pair is part of the 6 π system'], ['furan', 'Aromatic', 'one O lone pair joins the π system: 6 π electrons'], ['naphthalene', 'Aromatic', '10 π electrons (n = 2)'], ['1,3-cyclohexadiene', 'Nonaromatic', 'two sp³ carbons break the conjugation'], ['cyclopentadiene', 'Nonaromatic', 'the CH₂ is sp³, so the ring is not fully conjugated']];
const EAS = [['–OH', 'Ortho/para, strongly activating'], ['–NH<sub>2</sub>', 'Ortho/para, strongly activating'], ['–OCH<sub>3</sub>', 'Ortho/para, strongly activating'], ['–NHCOCH<sub>3</sub>', 'Ortho/para, moderately activating'], ['–CH<sub>3</sub>', 'Ortho/para, weakly activating'], ['–Cl', 'Ortho/para, weakly deactivating'], ['–Br', 'Ortho/para, weakly deactivating'], ['–CHO', 'Meta, deactivating'], ['–COCH<sub>3</sub>', 'Meta, deactivating'], ['–COOH', 'Meta, deactivating'], ['–CN', 'Meta, deactivating'], ['–SO<sub>3</sub>H', 'Meta, deactivating'], ['–NO<sub>2</sub>', 'Meta, strongly deactivating'], ['–CF<sub>3</sub>', 'Meta, strongly deactivating']];
CH.push({ id: 'aromatic', course: '2325', emoji: '⬡', title: 'Aromaticity & EAS', blurb: 'Hückel\'s rule and directing effects on benzene rings.',
  learn: [
    { h: 'Four checks for aromaticity', body: `<ol><li>Cyclic</li><li>Planar</li><li>Fully conjugated (every ring atom has a p orbital)</li><li><b>4n + 2 π electrons</b> (2, 6, 10, 14…) → aromatic. <b>4n</b> (4, 8) → antiaromatic.</li></ol><p>If it fails 1–3, it's <b>nonaromatic</b>.</p>` },
    { h: 'Electrophilic aromatic substitution', body: `<p>The ring attacks an electrophile (Br⁺, NO₂⁺, R⁺, RCO⁺), then loses H⁺ to restore aromaticity.</p><p><b>Activators</b> (donate electrons: –OH, –NH₂, –OR, alkyl) direct <b>ortho/para</b>. <b>Deactivators</b> (withdraw: –NO₂, –CN, C=O, –SO₃H, –CF₃) direct <b>meta</b>. <b>Halogens</b> are the odd ones: deactivating but ortho/para.</p>` },
  ],
  gen() {
    if (Math.random() < .5) { const [s, a, why] = pick(AROM); return mcFrom(`Is <b>${s}</b> aromatic, antiaromatic or nonaromatic?`, a, ['Aromatic', 'Antiaromatic', 'Nonaromatic'], [`${s}: ${why}.`, `Answer: <b>${a}</b>.`]); }
    const [g, a] = pick(EAS); return mcFrom(`How does the substituent <b>${g}</b> affect electrophilic aromatic substitution?`, a, EAS.map(x => x[1]), [a.startsWith('Meta') ? 'It withdraws electron density from the ring, destabilizing the ortho/para arenium ions most.' : g.includes('Cl') || g.includes('Br') ? 'Halogens withdraw by induction (deactivate) but donate a lone pair by resonance (ortho/para).' : 'It donates electron density, stabilizing the ortho/para arenium ions.', `<b>${a}</b>.`]);
  } });

CH.push({ id: 'carbonyl', course: '2325', emoji: '🔺', title: 'Aldehydes, ketones & acid derivatives', blurb: 'Nucleophilic addition, acyl substitution and reactivity order.',
  learn: [
    { h: 'Two big reaction types', body: `<p><b>Aldehydes and ketones</b> undergo <b>nucleophilic addition</b>: the nucleophile adds to C=O and stays.</p><p><b>Acid derivatives</b> undergo <b>nucleophilic acyl substitution</b>: the nucleophile adds, then a leaving group is kicked out and C=O comes back.</p>` },
    { h: 'Reactivity ladder', body: `<p class="formula">acid chloride &gt; anhydride &gt; ester ≈ carboxylic acid &gt; amide</p><p>You can always go <b>downhill</b> (acid chloride → ester → amide) but not uphill directly. Better leaving group = more reactive.</p>` },
  ],
  gen: bank([
    ['Ketone + 2 ROH, H⁺ (remove water) gives…', 'an acetal', ['a hemiacetal only', 'an ester', 'an enol'], 'Two alcohols add with acid; removing water drives acetal formation.'],
    ['Ketone + RNH₂ (primary amine), mild acid gives…', 'an imine', ['an enamine', 'an amide', 'an amine'], 'Primary amines condense to C=N (imine).'],
    ['Ketone + R₂NH (secondary amine), mild acid gives…', 'an enamine', ['an imine', 'an amide', 'a nitrile'], 'Secondary amines can\'t form C=N–H, so they make enamines.'],
    ['Aldehyde + Ph₃P=CH₂ gives…', 'an alkene (Wittig)', ['an alcohol', 'an epoxide', 'a carboxylic acid'], 'The Wittig reaction swaps C=O for C=CH₂.'],
    ['Which is the most reactive acid derivative?', 'Acid chloride', ['Ester', 'Amide', 'Anhydride'], 'Cl⁻ is the best leaving group.'],
    ['Ester + NaOH, H₂O (then H₃O⁺) gives…', 'carboxylic acid + alcohol (saponification)', ['amide', 'aldehyde', 'acid chloride'], 'Hydroxide does acyl substitution; the carboxylate is protonated in workup.'],
    ['Carboxylic acid + SOCl₂ gives…', 'an acid chloride', ['an alkyl chloride', 'an ester', 'an anhydride only'], 'SOCl₂ converts –COOH to –COCl.'],
    ['Ester + 2 RMgBr, then H₃O⁺ gives…', 'a tertiary alcohol', ['a ketone', 'a primary alcohol', 'an aldehyde'], 'The first Grignard makes a ketone that reacts again with the second.'],
    ['Ester + DIBAL-H at −78 °C gives…', 'an aldehyde', ['a primary alcohol', 'a ketone', 'an ether'], 'DIBAL-H delivers one hydride and stops at the aldehyde when cold.'],
    ['Amide + LiAlH₄, then H₂O gives…', 'an amine', ['an alcohol', 'an aldehyde', 'a nitrile'], 'LiAlH₄ removes the C=O oxygen entirely from amides.'],
    ['Nitrile + H₃O⁺, heat gives…', 'a carboxylic acid', ['an amine', 'an aldehyde', 'an alkane'], 'Hydrolysis goes nitrile → amide → acid.'],
    ['Carboxylic acid + ROH, H⁺ (heat) is called…', 'Fischer esterification', ['Saponification', 'Wittig reaction', 'Claisen condensation'], 'Acid-catalyzed equilibrium; use excess alcohol.'],
    ['Acid chloride + R₂CuLi gives…', 'a ketone', ['a tertiary alcohol', 'an ester', 'an alkane'], 'Gilman reagents add once and stop at the ketone.'],
  
    ['Which is more electrophilic?', 'An aldehyde', ['A ketone', 'An ester', 'An amide'], 'Aldehydes have less steric crowding and one fewer donating alkyl group.'],
    ['Hydration of a ketone (adding water across C=O) gives…', 'a gem-diol (hydrate)', ['an epoxide', 'an ester', 'an enol'], 'Usually the equilibrium lies on the ketone side, except for formaldehyde.'],
    ['Aldehyde + 1 ROH, acid (stopping early) gives…', 'a hemiacetal', ['an acetal', 'an ester', 'an ether'], 'One OH and one OR on the same carbon.'],
    ['Acetals are stable to…', 'base and nucleophiles (but hydrolyze in aqueous acid)', ['aqueous acid', 'nothing', 'water only'], 'That makes them great protecting groups during Grignard reactions.'],
    ['Wolff–Kishner (H₂NNH₂, KOH, heat) converts a ketone to…', 'a CH₂ (alkane)', ['an alcohol', 'an amine', 'an alkene'], 'It removes the C=O oxygen completely under basic conditions.'],
    ['Acid anhydride + alcohol gives…', 'an ester + a carboxylic acid', ['an amide', 'an acid chloride', 'a ketone'], 'One acyl group goes to the alcohol; the other leaves as a carboxylate.'],
    ['Baeyer–Villiger oxidation (RCO₃H) turns a ketone into…', 'an ester', ['an aldehyde', 'an alcohol', 'an epoxide'], 'An O is inserted next to the C=O, on the more substituted side.'],
  ]) });

CH.push({ id: 'amines', course: '2325', emoji: '🐟', title: 'Amines', blurb: 'Basicity, synthesis and Hofmann elimination.',
  learn: [
    { h: 'Basicity', body: `<p>Amines are bases because of the N lone pair. Anything that ties up that lone pair makes the amine <b>weaker</b>: resonance into a ring (aniline) or a C=O (amides are <b>not</b> basic).</p><p>Alkyl amines (pK<sub>aH</sub> ≈ 10.6) ≫ aniline (≈ 4.6) ≫ amides.</p>` },
    { h: 'Key reactions', body: `<ul><li><b>Gabriel synthesis</b>: clean route to 1° amines.</li><li><b>Reductive amination</b>: C=O + amine + NaBH₃CN → amine.</li><li><b>Hofmann elimination</b>: gives the <b>less</b> substituted alkene.</li></ul>` },
  ],
  gen: bank([
    ['Which is the strongest base?', 'Ethylamine (CH₃CH₂NH₂)', ['Aniline', 'Acetamide', 'Pyrrole'], 'Its lone pair is localized; the others delocalize it.'],
    ['Why is aniline a weaker base than cyclohexylamine?', 'Its lone pair is delocalized into the ring', ['It has more hydrogens', 'It is a gas', 'N is sp³ in aniline'], 'Resonance spreads the lone pair, making it less available.'],
    ['Why are amides not basic?', 'The N lone pair is delocalized into C=O', ['Amides have no lone pair', 'Amides are acids', 'N is positively charged'], 'Amide resonance gives the C–N bond partial double-bond character.'],
    ['Hofmann elimination gives…', 'the less substituted alkene', ['the more substituted alkene', 'an alcohol', 'an amide'], 'The bulky leaving group favors removing the most accessible H.'],
    ['Best way to make a clean primary amine?', 'Gabriel synthesis', ['NH₃ + excess alkyl halide', 'Hofmann elimination', 'Fischer esterification'], 'Direct alkylation over-alkylates; Gabriel stops at 1°.'],
    ['Ketone + NH₃ + NaBH₃CN gives…', 'a primary amine (reductive amination)', ['an imine only', 'an alcohol', 'an amide'], 'The imine forms, then NaBH₃CN reduces it.'],
  
    ['Rank by basicity (strongest first):', 'CH₃NH₂ > NH₃ > aniline', ['aniline > NH₃ > CH₃NH₂', 'NH₃ > CH₃NH₂ > aniline', 'all are equal'], 'Alkyl groups donate electron density; aniline delocalizes its lone pair.'],
    ['Pyridine vs pyrrole: which is the stronger base?', 'Pyridine', ['Pyrrole', 'They are equal', 'Neither is basic at all'], "Pyrrole's lone pair is part of the aromatic sextet; pyridine's is not."],
    ['A nitro group on aniline makes it…', 'a weaker base', ['a stronger base', 'unchanged', 'an acid stronger than HCl'], 'Electron-withdrawing groups pull density from the nitrogen.'],
    ['Amines are good nucleophiles because…', 'nitrogen has an available lone pair', ['nitrogen is very electronegative', 'they are positively charged', 'they have no hydrogens'], 'N is less electronegative than O, so its lone pair is more available.'],
    ['Primary aryl amine + NaNO₂, HCl (0 °C) gives…', 'an aryl diazonium salt', ['a nitro compound', 'an amide', 'an imine'], 'Diazonium salts can be replaced by Cl, Br, CN, OH, F or H (Sandmeyer and related).'],
    ['Amide + LiAlH₄ gives…', 'an amine', ['an alcohol', 'a nitrile', 'an aldehyde'], 'Amide reduction is a great way to make amines.'],
    ['Nitrile + LiAlH₄ (then H₂O) gives…', 'a primary amine (R–CH₂NH₂)', ['a carboxylic acid', 'an aldehyde', 'a ketone'], 'C≡N is reduced all the way to CH₂–NH₂.'],
    ['Why does NH₃ + excess CH₃I give a mixture?', 'Each alkylated amine is still nucleophilic and reacts again', ['CH₃I is not reactive', 'NH₃ is not a nucleophile', 'It gives only one product'], 'Overalkylation all the way to the quaternary ammonium salt.'],
    ['Quaternary ammonium salts are…', 'not basic (no lone pair)', ['strong bases', 'weak acids', 'radicals'], 'R₄N⁺ has four bonds and no lone pair.'],
  ]) });

CH.push({ id: 'enolates', course: '2325', emoji: '🔗', title: 'Enols & enolates', blurb: 'Alpha carbon chemistry: aldol, Claisen, Michael and friends.',
  learn: [
    { h: 'The alpha carbon is acidic', body: `<p>H's on the carbon next to C=O are acidic because the enolate is <b>resonance-stabilized</b>. Ketone α-H pK<sub>a</sub> ≈ 19–20; ester ≈ 25; between two C=O (β-dicarbonyl) ≈ 9–11.</p><p><b>LDA at −78 °C</b> makes the <b>kinetic</b> (less substituted) enolate. Weaker bases with heat give the <b>thermodynamic</b> (more substituted) one.</p>` },
    { h: 'The C–C bond-forming family', body: `<ul><li><b>Aldol</b>: enolate + aldehyde/ketone → β-hydroxy carbonyl; heat → α,β-unsaturated (condensation).</li><li><b>Claisen</b>: ester enolate + ester → β-keto ester.</li><li><b>Michael</b>: enolate adds 1,4 to an α,β-unsaturated carbonyl.</li><li><b>Robinson annulation</b> = Michael + intramolecular aldol.</li><li><b>Malonic ester</b> → substituted acetic acid; <b>acetoacetic ester</b> → methyl ketone.</li></ul>` },
  ],
  gen: bank([
    ['LDA, THF, −78 °C on 2-methylcyclohexanone forms…', 'the kinetic (less substituted) enolate', ['the thermodynamic (more substituted) enolate', 'an enamine', 'an alkene'], 'Bulky LDA removes the most accessible H fast and irreversibly.'],
    ['An aldol addition product is…', 'a β-hydroxy aldehyde or ketone', ['a β-keto ester', 'an α-halo ketone', 'a 1,5-diketone'], 'Enolate adds to C=O; protonation gives OH on the β carbon.'],
    ['Heating an aldol product with base gives…', 'an α,β-unsaturated carbonyl', ['an ester', 'a diol', 'an acetal'], 'Dehydration (E1cB) makes the conjugated enone.'],
    ['A Claisen condensation produces…', 'a β-keto ester', ['a β-hydroxy ester', 'an α,β-unsaturated ester', 'an amide'], 'An ester enolate attacks another ester and kicks out alkoxide.'],
    ['A Michael addition adds a nucleophile to…', 'the β carbon of an α,β-unsaturated carbonyl (1,4)', ['the carbonyl carbon (1,2)', 'the α carbon', 'the oxygen'], 'Soft, stabilized enolates prefer conjugate addition.'],
    ['Methyl ketone + excess I₂, NaOH gives…', 'a carboxylate + CHI₃ (haloform)', ['an α-iodo ketone only', 'an alkene', 'an aldehyde'], 'All three α-H\'s are replaced, then CI₃⁻ leaves.'],
    ['Robinson annulation is…', 'Michael addition then intramolecular aldol', ['two Claisen condensations', 'Diels–Alder then hydrolysis', 'Wittig then hydroboration'], 'It builds a new six-membered ring.'],
    ['Malonic ester synthesis makes…', 'a substituted acetic acid', ['a methyl ketone', 'an amine', 'an aldehyde'], 'Alkylate, hydrolyze, then heat to decarboxylate.'],
    ['Acetoacetic ester synthesis makes…', 'a substituted methyl ketone', ['a carboxylic acid', 'an alcohol', 'an ether'], 'Alkylation then hydrolysis/decarboxylation leaves a methyl ketone.'],
    ['Which α-H is most acidic?', 'Between two C=O groups (pKa ≈ 9–11)', ['Next to a ketone C=O (≈ 19)', 'Next to an ester (≈ 25)', 'On an alkane (≈ 50)'], 'Two carbonyls share the negative charge by resonance.'],
  
    ['Keto–enol tautomers differ in…', 'the position of an H and a double bond', ['their molecular formula', 'their carbon skeleton', 'their stereocenters only'], 'Tautomers are constitutional isomers that rapidly interconvert.'],
    ['For simple ketones at equilibrium, which form dominates?', 'the keto form', ['the enol form', '50:50', 'the enolate'], 'C=O is much stronger than C=C, so the keto form wins.'],
    ['A crossed aldol works cleanly when…', 'one partner has no α-H (like benzaldehyde)', ['both have α-H', 'both are esters', 'no base is used'], 'Then only one enolate can form and only one electrophile is good.'],
    ['A Dieckmann condensation is…', 'an intramolecular Claisen that makes a ring', ['an aldol with a ketone', 'a Michael addition', 'an ester hydrolysis'], 'A diester cyclizes to a cyclic β-keto ester (5- or 6-membered).'],
    ['Racemization at an α-stereocenter in base happens because…', 'the planar enolate can be protonated on either face', ['the C=O breaks', 'the molecule rotates', 'a radical forms'], 'Forming the enolate destroys the stereocenter temporarily.'],
    ['In acid, α-halogenation of a ketone usually…', 'stops after one halogen', ['adds three halogens', 'does not happen', 'cleaves the ketone'], 'In acid, the first halogen makes enol formation slower.'],
    ['In base, α-halogenation of a methyl ketone…', 'continues to the haloform reaction', ['stops after one halogen', 'needs light', 'gives an alkene'], 'Each halogen makes the next α-H more acidic.'],
    ['The best Michael donor is…', 'a stabilized enolate (like a malonate)', ['an alkyllithium', 'a Grignard reagent', 'LiAlH₄'], 'Soft, stabilized nucleophiles prefer 1,4-addition; hard ones add 1,2.'],
    ['Thermodynamic enolate conditions are…', 'a weaker base, room temperature or heat (equilibrating)', ['LDA at −78 °C', 'no base', 'a radical initiator'], 'Equilibration favors the more substituted, more stable enolate.'],
  ]) });

/* ======================= BIOCHEMISTRY (BIOL/CHEM 3361) ======================= */
const AA = [['Glycine', 'Gly', 'G', 'nonpolar', 2.34, 9.60], ['Alanine', 'Ala', 'A', 'nonpolar', 2.34, 9.69], ['Valine', 'Val', 'V', 'nonpolar', 2.32, 9.62], ['Leucine', 'Leu', 'L', 'nonpolar', 2.36, 9.60], ['Isoleucine', 'Ile', 'I', 'nonpolar', 2.36, 9.68], ['Methionine', 'Met', 'M', 'nonpolar', 2.28, 9.21], ['Proline', 'Pro', 'P', 'nonpolar', 1.99, 10.96], ['Phenylalanine', 'Phe', 'F', 'nonpolar (aromatic)', 1.83, 9.13], ['Tryptophan', 'Trp', 'W', 'nonpolar (aromatic)', 2.38, 9.39],
  ['Serine', 'Ser', 'S', 'polar uncharged', 2.21, 9.15], ['Threonine', 'Thr', 'T', 'polar uncharged', 2.11, 9.62], ['Cysteine', 'Cys', 'C', 'polar uncharged', 1.96, 10.28], ['Asparagine', 'Asn', 'N', 'polar uncharged', 2.02, 8.80], ['Glutamine', 'Gln', 'Q', 'polar uncharged', 2.17, 9.13], ['Tyrosine', 'Tyr', 'Y', 'polar uncharged (aromatic)', 2.20, 9.11],
  ['Aspartate', 'Asp', 'D', 'acidic (negative)', 1.88, 9.60, 3.65], ['Glutamate', 'Glu', 'E', 'acidic (negative)', 2.19, 9.67, 4.25], ['Lysine', 'Lys', 'K', 'basic (positive)', 2.18, 8.95, 10.53], ['Arginine', 'Arg', 'R', 'basic (positive)', 2.17, 9.04, 12.48], ['Histidine', 'His', 'H', 'basic (positive)', 1.82, 9.17, 6.00]];
function pI(a) { if (a[3].startsWith('acidic')) return (a[4] + a[6]) / 2; if (a[3].startsWith('basic')) return (a[5] + a[6]) / 2; return (a[4] + a[5]) / 2; }
CH.push({ id: 'aminoacids', course: '3361', emoji: '🧬', title: 'Amino acids', blurb: 'All 20: names, codes, side-chain classes, pI and charge.',
  learn: [
    { h: 'Every amino acid has the same backbone', body: `<p>A central α-carbon holds an <b>amino group</b> (–NH₃⁺), a <b>carboxyl group</b> (–COO⁻), an H and a <b>side chain (R)</b>. At pH 7 the backbone is a <b>zwitterion</b>. The side chain decides everything else.</p>` },
    { h: 'The four families', body: `<table class="tbl"><tr><th>Class</th><th>Amino acids</th></tr><tr><td>Nonpolar</td><td>G A V L I M P F W</td></tr><tr><td>Polar uncharged</td><td>S T C N Q Y</td></tr><tr><td>Acidic (−)</td><td>D E</td></tr><tr><td>Basic (+)</td><td>K R H</td></tr></table>` },
    { h: 'Isoelectric point (pI)', body: `<p>pI is the pH where the net charge is zero. Average the two pK<sub>a</sub> values on either side of the neutral form:</p><ul><li>Neutral side chain: pI = (pK<sub>a1</sub> + pK<sub>a2</sub>) / 2</li><li>Acidic (D, E): average the two <b>acidic</b> pK<sub>a</sub>'s</li><li>Basic (K, R, H): average the two <b>basic</b> pK<sub>a</sub>'s</li></ul><p>pH below pI → net <b>positive</b>; above pI → net <b>negative</b>.</p>` },
  ],
  gen() {
    const a = pick(AA), k = pick(['code', 'code', 'class', 'pI', 'charge']);
    if (k === 'code') { if (Math.random() < .5) return mcFrom(`What is the one-letter code for <b>${a[0]}</b>?`, a[2], AA.map(x => x[2]), [`${a[0]} = ${a[1]} = <b>${a[2]}</b>.`]); return mcFrom(`Which amino acid has the one-letter code <b>${a[2]}</b>?`, a[0], AA.map(x => x[0]), [`<b>${a[2]}</b> = ${a[1]} = <b>${a[0]}</b>.`]); }
    if (k === 'class') return mcFrom(`Which class is <b>${a[0]} (${a[1]})</b>?`, a[3].replace(/ \(aromatic\)/, ''), ['nonpolar', 'polar uncharged', 'acidic (negative)', 'basic (positive)'], [`${a[0]} is <b>${a[3]}</b>.`]);
    const p = pI(a);
    if (k === 'pI') return numQ(`What is the pI of <b>${a[0]}</b>? (pK<sub>a</sub>'s: α-COOH ${a[4]}, α-NH₃⁺ ${a[5]}${a[6] ? `, side chain ${a[6]}` : ''})`, p, '', [a[3].startsWith('acidic') ? 'Acidic side chain: average the two acidic pKa values.' : a[3].startsWith('basic') ? 'Basic side chain: average the two basic pKa values.' : 'No ionizable side chain: average the two backbone pKa values.', `pI = <b>${p.toFixed(2)}</b>.`], { abs: .03 });
    const pH = pick([1, 7, 13]), all = [a[4], a[5], a[6]].filter(Boolean);
    let q = 0; q += pH < a[5] ? 1 : 0; q -= pH > a[4] ? 1 : 0; if (a[6]) { if (a[3].startsWith('acidic')) q -= pH > a[6] ? 1 : 0; else q += pH < a[6] ? 1 : 0; }
    if (all.some(v => Math.abs(v - pH) < 1)) return mcFrom(`What is the one-letter code for <b>${a[0]}</b>?`, a[2], AA.map(x => x[2]), [`${a[0]} = ${a[1]} = <b>${a[2]}</b>.`]);
    const s = q > 0 ? '+' + q : String(q);
    return mcFrom(`What is the approximate net charge of <b>${a[0]}</b> at <b>pH ${pH}</b>?`, s, ['+2', '+1', '0', '-1', '-2'], [`Groups with pK<sub>a</sub> above pH ${pH} stay protonated; groups below it lose H⁺.`, `pKa's: ${all.join(', ')}. Net charge ≈ <b>${s}</b>.`]);
  } });

CH.push({ id: 'proteins', course: '3361', emoji: '🌀', title: 'Protein structure & folding', blurb: 'Primary to quaternary, and the forces that hold proteins together.',
  learn: [
    { h: 'Four levels', body: `<ol><li><b>Primary</b>: amino acid sequence (peptide bonds).</li><li><b>Secondary</b>: α-helices and β-sheets, held by <b>backbone H-bonds</b>.</li><li><b>Tertiary</b>: the full 3D fold, held by side-chain interactions (hydrophobic effect, H-bonds, ionic bonds, disulfides).</li><li><b>Quaternary</b>: multiple subunits (e.g., hemoglobin's 4 chains).</li></ol>` },
    { h: 'What drives folding', body: `<p>The <b>hydrophobic effect</b> is the biggest driving force: nonpolar side chains bury in the core, freeing ordered water (entropy goes up). The peptide bond is planar and rigid because of resonance.</p>` },
  ],
  gen: bank([
    ['Which level is held together mainly by backbone hydrogen bonds?', 'Secondary', ['Primary', 'Tertiary', 'Quaternary'], 'α-helices and β-sheets come from C=O···H–N backbone H-bonds.'],
    ['The main driving force for protein folding is…', 'the hydrophobic effect', ['disulfide bonds', 'peptide bonds', 'van der Waals repulsion'], 'Burying nonpolar groups releases ordered water, raising entropy.'],
    ['Why is the peptide bond planar?', 'Resonance gives C–N partial double-bond character', ['It is a triple bond', 'Steric hindrance from side chains', 'Hydrogen bonding to water'], 'Delocalization between C=O and N locks rotation.'],
    ['Disulfide bonds form between two…', 'cysteine residues', ['methionine residues', 'serine residues', 'tyrosine residues'], 'Two –SH groups oxidize to –S–S–.'],
    ['Hemoglobin\'s four subunits are an example of…', 'quaternary structure', ['tertiary structure', 'secondary structure', 'primary structure'], 'Quaternary = arrangement of multiple chains.'],
    ['An α-helix has about how many residues per turn?', '3.6', ['2.0', '5.4', '10'], '3.6 residues per turn, 5.4 Å pitch, right-handed.'],
    ['Which amino acid breaks α-helices?', 'Proline', ['Alanine', 'Leucine', 'Glutamate'], 'Proline\'s ring locks φ and has no N–H to H-bond.'],
    ['Denaturation destroys…', 'secondary, tertiary and quaternary structure, but not the sequence', ['the primary sequence', 'only disulfide bonds', 'only the N-terminus'], 'Peptide bonds survive; the fold does not.'],
  
    ['β-sheets are held together by H-bonds between…', 'backbone C=O and N–H of neighboring strands', ['side chains only', 'disulfides', 'water molecules only'], 'Strands can run parallel or antiparallel.'],
    ['Which amino acid is best known for forming disulfide bridges?', 'Cysteine', ['Serine', 'Methionine', 'Glycine'], 'Its thiol (–SH) can oxidize to –S–S–.'],
    ['Where are nonpolar side chains usually found in a water-soluble protein?', 'Buried in the core', ['On the surface', 'Only at the N-terminus', 'Randomly'], 'The hydrophobic effect drives them inward.'],
    ['Which amino acid is most flexible in loops and turns?', 'Glycine', ['Proline', 'Tryptophan', 'Valine'], 'Glycine has only H as its side chain.'],
    ['Peptide bonds form between…', 'the α-carboxyl of one amino acid and the α-amino of the next', ['two side chains', 'two amino groups', 'a sugar and a base'], 'A condensation reaction releases water.'],
    ['Peptide sequences are written…', 'from the N-terminus to the C-terminus', ['C to N', 'alphabetically', 'by molecular weight'], 'Convention: free –NH₃⁺ end first.'],
    ['Chaperone proteins…', 'help other proteins fold correctly', ['break peptide bonds', 'store oxygen', 'make DNA'], 'Many use ATP to give misfolded proteins another try.'],
    ['Myoglobin vs hemoglobin oxygen binding curves:', 'myoglobin is hyperbolic; hemoglobin is sigmoidal (cooperative)', ['both are sigmoidal', 'both are linear', 'hemoglobin is hyperbolic'], 'Hemoglobin\'s four subunits bind O₂ cooperatively.'],
    ['Which technique separates proteins by size?', 'Size-exclusion (gel filtration) chromatography', ['Ion-exchange chromatography', 'Affinity chromatography', 'Isoelectric focusing'], 'Big proteins come out first because they skip the bead pores.'],
    ['SDS-PAGE separates proteins mainly by…', 'mass', ['charge', 'pI', 'shape'], 'SDS coats proteins with negative charge proportional to length.'],
  ]) });

CH.push({ id: 'enzymes', course: '3361', emoji: '⚙️', title: 'Enzyme kinetics & inhibition', blurb: 'Michaelis–Menten, Lineweaver–Burk and inhibitor types.',
  learn: [
    { h: 'Michaelis–Menten', body: `<p class="formula">v = V<sub>max</sub>[S] / (K<sub>m</sub> + [S])</p><p><b>K<sub>m</sub></b> is the [S] that gives half of V<sub>max</sub>. A low K<sub>m</sub> means high affinity. k<sub>cat</sub> = V<sub>max</sub>/[E]<sub>T</sub> (turnover number); k<sub>cat</sub>/K<sub>m</sub> measures efficiency.</p>` },
    { h: 'Lineweaver–Burk', body: `<p class="formula">1/v = (K<sub>m</sub>/V<sub>max</sub>)(1/[S]) + 1/V<sub>max</sub></p><p>y-intercept = 1/V<sub>max</sub>; x-intercept = −1/K<sub>m</sub>; slope = K<sub>m</sub>/V<sub>max</sub>.</p>` },
    { h: 'Inhibitors', body: `<table class="tbl"><tr><th>Type</th><th>Binds</th><th>K<sub>m</sub> (apparent)</th><th>V<sub>max</sub></th></tr><tr><td>Competitive</td><td>free E (active site)</td><td>↑</td><td>same</td></tr><tr><td>Uncompetitive</td><td>ES only</td><td>↓</td><td>↓</td></tr><tr><td>Noncompetitive (pure)</td><td>E and ES equally</td><td>same</td><td>↓</td></tr></table><p>Competitive inhibition can be overcome with lots of substrate.</p>` },
  ],
  gen() {
    const k = pick(['v', 'v', 'inh', 'lb']);
    if (k === 'v') { const Vm = R.int(20, 200), Km = R.real(.5, 20, 1), S = R.real(.2, 50, 1), v = Vm * S / (Km + S); return numQ(`An enzyme has V<sub>max</sub> = ${Vm} μM/s and K<sub>m</sub> = ${Km} mM. What is v at [S] = <b>${S} mM</b>?`, v, 'μM/s', [`v = V<sub>max</sub>[S] / (K<sub>m</sub> + [S]).`, `v = (${Vm})(${S}) / (${Km} + ${S}) = <b>${sig(v)}</b> μM/s.`]); }
    if (k === 'lb') { const Vm = R.int(10, 100), Km = R.real(1, 10, 1), w = pick(['y', 'x']); return numQ(`On a Lineweaver–Burk plot, V<sub>max</sub> = ${Vm} and K<sub>m</sub> = ${Km}. What is the <b>${w}-intercept</b>?`, w === 'y' ? 1 / Vm : -1 / Km, '', [w === 'y' ? `y-intercept = 1/V<sub>max</sub> = 1/${Vm} = <b>${sig(1 / Vm)}</b>.` : `x-intercept = −1/K<sub>m</sub> = −1/${Km} = <b>${sig(-1 / Km)}</b>.`]); }
    const [t, eff] = pick([['competitive', 'Km increases, Vmax unchanged'], ['uncompetitive', 'Km and Vmax both decrease'], ['pure noncompetitive', 'Km unchanged, Vmax decreases']]);
    return mcFrom(`How does a <b>${t}</b> inhibitor change K<sub>m</sub> and V<sub>max</sub>?`, eff, ['Km increases, Vmax unchanged', 'Km and Vmax both decrease', 'Km unchanged, Vmax decreases', 'Km decreases, Vmax unchanged'], [{ competitive: 'It competes for the active site; enough substrate outcompetes it, so V<sub>max</sub> is reachable but you need more [S].', uncompetitive: 'It binds only ES, pulling the equilibrium toward ES (lower apparent K<sub>m</sub>) and trapping it (lower V<sub>max</sub>).', 'pure noncompetitive': 'It binds E and ES equally away from the active site: affinity unchanged, fewer working enzymes.' }[t], `<b>${eff}</b>.`]);
  } });

CH.push({ id: 'carbs', course: '3361', emoji: '🍬', title: 'Carbohydrates', blurb: 'Aldoses, ketoses, anomers and glycosidic bonds.',
  learn: [
    { h: 'Sugar vocabulary', body: `<p><b>Aldose</b>: C=O at C1 (glucose). <b>Ketose</b>: C=O at C2 (fructose). <b>D/L</b> is set by the OH on the stereocenter farthest from the C=O (right in a Fischer projection = D).</p><p>In solution, sugars cyclize. The new stereocenter (the <b>anomeric carbon</b>) is <b>α</b> when its OH is trans to CH₂OH (down in a Haworth for D-sugars) and <b>β</b> when cis (up).</p>` },
    { h: 'Glycosidic bonds to know', body: `<table class="tbl"><tr><th>Sugar</th><th>Made of</th><th>Bond</th></tr><tr><td>Maltose</td><td>Glc–Glc</td><td>α(1→4)</td></tr><tr><td>Lactose</td><td>Gal–Glc</td><td>β(1→4)</td></tr><tr><td>Sucrose</td><td>Glc–Fru</td><td>α1→β2 (non-reducing)</td></tr><tr><td>Cellulose</td><td>Glc polymer</td><td>β(1→4)</td></tr><tr><td>Amylose / glycogen</td><td>Glc polymer</td><td>α(1→4), branches α(1→6)</td></tr></table>` },
  ],
  gen: bank([
    ['Glucose is an…', 'aldohexose', ['ketohexose', 'aldopentose', 'ketopentose'], 'Six carbons with an aldehyde at C1.'],
    ['Fructose is a…', 'ketohexose', ['aldohexose', 'aldopentose', 'disaccharide'], 'Six carbons with a ketone at C2.'],
    ['Which disaccharide is non-reducing?', 'Sucrose', ['Lactose', 'Maltose', 'Cellobiose'], 'Both anomeric carbons are tied up in the α1→β2 bond.'],
    ['Cellulose is built with which linkage?', 'β(1→4)', ['α(1→4)', 'α(1→6)', 'α1→β2'], 'β(1→4) gives straight chains that H-bond into fibers.'],
    ['Glycogen branches through…', 'α(1→6) bonds', ['β(1→4) bonds', 'α(1→4) bonds only', 'disulfide bonds'], 'Branch points are α(1→6), about every 8–12 residues.'],
    ['Lactose is…', 'galactose β(1→4) glucose', ['glucose α(1→4) glucose', 'glucose α1→β2 fructose', 'galactose α(1→6) glucose'], 'Milk sugar; lactase cleaves it.'],
    ['α and β forms of glucose are called…', 'anomers', ['enantiomers', 'epimers at C4', 'structural isomers'], 'They differ only at the anomeric carbon (C1).'],
    ['D vs L is determined by the OH on…', 'the stereocenter farthest from the C=O', ['C1', 'C2', 'the anomeric carbon'], 'For glucose that is C5.'],
  
    ['How many stereocenters does open-chain D-glucose have?', '4', ['3', '5', '6'], 'C2, C3, C4 and C5.'],
    ['Glucose and galactose are epimers at…', 'C4', ['C2', 'C1', 'C5'], 'They differ only in the OH configuration at C4.'],
    ['Glucose and mannose are epimers at…', 'C2', ['C4', 'C3', 'C6'], 'They differ only at C2.'],
    ['Mutarotation is…', 'interconversion of α and β anomers in solution', ['oxidation of glucose', 'formation of a glycosidic bond', 'conversion to fructose'], 'The ring opens and recloses through the open-chain form.'],
    ['A reducing sugar has…', 'a free anomeric carbon (hemiacetal) that can open', ['no OH groups', 'only β bonds', 'a phosphate'], 'The open aldehyde reduces Cu²⁺ or Ag⁺.'],
    ['Glucose in its six-membered ring form is called a…', 'pyranose', ['furanose', 'ketose', 'glycoside'], 'Six-membered ring = pyranose; five = furanose.'],
    ['In β-D-glucopyranose (chair), all bulky groups are…', 'equatorial', ['axial', 'alternating', 'in the plane'], 'That is why β-glucose is the most abundant anomer.'],
    ['Humans can\'t digest cellulose because…', 'we lack enzymes for β(1→4) bonds', ['it has no glucose', 'it is a protein', 'it is too small'], 'Amylases only cleave α bonds.'],
    ['A glycosidic bond is a…', 'an acetal linkage between sugars', ['a peptide bond', 'an ester', 'a hydrogen bond'], 'The anomeric OH reacts with another alcohol.'],
  ]) });

CH.push({ id: 'metabolism', course: '3361', emoji: '🔋', title: 'Metabolism & bioenergetics', blurb: 'Glycolysis, the citric acid cycle, oxidative phosphorylation and ΔG.',
  learn: [
    { h: 'Glycolysis (cytosol)', body: `<p>Glucose → 2 pyruvate. Net per glucose: <b>2 ATP, 2 NADH</b>. Three irreversible, regulated steps: <b>hexokinase</b>, <b>PFK-1</b> (the committed step) and <b>pyruvate kinase</b>.</p>` },
    { h: 'PDH and the citric acid cycle (mitochondria)', body: `<p>Pyruvate dehydrogenase: pyruvate → acetyl-CoA + CO₂ + NADH.</p><p>Each acetyl-CoA through the cycle gives <b>3 NADH, 1 FADH₂, 1 GTP (ATP), 2 CO₂</b>.</p>` },
    { h: 'Oxidative phosphorylation and energy', body: `<p>The electron transport chain passes electrons to <b>O₂</b> (the final acceptor) and pumps protons; ATP synthase uses the gradient. Roughly <b>2.5 ATP per NADH</b> and <b>1.5 per FADH₂</b>, ~30–32 ATP per glucose.</p><p class="formula">ΔG = ΔG°′ + RT ln Q</p><p>Unfavorable steps run by <b>coupling</b> to ATP hydrolysis (ΔG°′ ≈ −30.5 kJ/mol): add the ΔG°′ values.</p>` },
  ],
  gen() {
    const k = pick(['mc', 'mc', 'atp', 'dg', 'couple']);
    if (k === 'atp') { const n = R.int(1, 10), f = R.int(0, 4), atp = n * 2.5 + f * 1.5; return numQ(`How many ATP can oxidative phosphorylation make from <b>${n} NADH</b> and <b>${f} FADH₂</b>?`, atp, 'ATP', [`NADH ≈ 2.5 ATP, FADH₂ ≈ 1.5 ATP.`, `${n}(2.5) + ${f}(1.5) = <b>${atp}</b> ATP.`], { abs: .01 }); }
    if (k === 'dg') { const g0 = R.real(-30, 30, 1), Q = pick([.001, .01, .1, 10, 100]), G = g0 + 8.314e-3 * 310 * Math.log(Q); return numQ(`A reaction has ΔG°′ = ${g0} kJ/mol. At 37 °C (310 K) the ratio [products]/[reactants] is <b>${Q}</b>. What is ΔG?`, G, 'kJ/mol', [`ΔG = ΔG°′ + RT ln Q with R = 8.314 × 10⁻³ kJ/(mol·K).`, `ΔG = ${g0} + (0.008314)(310) ln(${Q}) = <b>${sig(G)}</b> kJ/mol.`], { abs: .2 }); }
    if (k === 'couple') { const [rx, g] = pick([['glucose + Pi → glucose-6-phosphate', 13.8], ['glutamate + NH₄⁺ → glutamine', 14.2], ['fructose-6-P + Pi → fructose-1,6-bisP', 16.3]]); return numQ(`<div class="eq">${rx}: ΔG°′ = +${g} kJ/mol</div>If this is coupled to ATP hydrolysis (ΔG°′ = −30.5 kJ/mol), what is the overall ΔG°′?`, g - 30.5, 'kJ/mol', [`Coupled reactions add: ${g} + (−30.5).`, `Overall ΔG°′ = <b>${(g - 30.5).toFixed(1)}</b> kJ/mol (favorable).`], { abs: .05 }); }
    return bank([
      ['Net ATP from glycolysis per glucose?', '2', ['4', '36', '1'], '4 ATP made − 2 ATP invested = 2 net.'],
      ['The committed step of glycolysis is catalyzed by…', 'phosphofructokinase-1 (PFK-1)', ['hexokinase', 'pyruvate kinase', 'aldolase'], 'F6P → F1,6BP commits the sugar to glycolysis.'],
      ['Per acetyl-CoA, the citric acid cycle makes…', '3 NADH, 1 FADH₂, 1 GTP, 2 CO₂', ['2 NADH, 2 FADH₂, 2 ATP', '1 NADH, 1 ATP', '6 NADH, 2 FADH₂, 2 GTP'], 'Know this tally cold; multiply by 2 per glucose.'],
      ['The final electron acceptor in the ETC is…', 'O₂', ['NAD⁺', 'FAD', 'Cytochrome c'], 'O₂ is reduced to water at complex IV.'],
      ['ATP synthase is powered by…', 'the proton gradient across the inner membrane', ['direct transfer from NADH', 'GTP hydrolysis', 'glucose binding'], 'Chemiosmotic theory: H⁺ flows back through F₀.'],
      ['Which enzyme converts pyruvate to acetyl-CoA?', 'Pyruvate dehydrogenase', ['Pyruvate kinase', 'Pyruvate carboxylase', 'Citrate synthase'], 'PDH links glycolysis to the citric acid cycle (makes CO₂ + NADH).'],
      ['Gluconeogenesis bypasses pyruvate kinase using…', 'pyruvate carboxylase and PEPCK', ['hexokinase', 'PFK-1', 'lactate dehydrogenase'], 'Pyruvate → oxaloacetate → PEP.'],
      ['Under anaerobic conditions, muscle regenerates NAD⁺ by…', 'reducing pyruvate to lactate', ['running the citric acid cycle', 'oxidizing fatty acids', 'making ethanol'], 'Lactate dehydrogenase uses NADH to reduce pyruvate.'],
    
      ['Which complex of the ETC does NOT pump protons?', 'Complex II (succinate dehydrogenase)', ['Complex I', 'Complex III', 'Complex IV'], 'That is why FADH₂ from succinate makes less ATP.'],
      ['Which enzyme is shared by the citric acid cycle and the ETC?', 'Succinate dehydrogenase', ['Citrate synthase', 'Pyruvate kinase', 'ATP synthase'], 'It is Complex II.'],
      ['Glycogen is broken down by…', 'glycogen phosphorylase', ['glycogen synthase', 'hexokinase', 'PFK-1'], 'It releases glucose-1-phosphate.'],
      ['Insulin generally…', 'promotes glycolysis and glycogen synthesis', ['promotes gluconeogenesis', 'promotes glycogen breakdown', 'blocks glucose uptake'], 'Insulin is the fed-state signal; glucagon is the fasting signal.'],
      ['The pentose phosphate pathway mainly produces…', 'NADPH and ribose-5-phosphate', ['ATP and NADH', 'acetyl-CoA', 'lactate'], 'NADPH powers biosynthesis; ribose is for nucleotides.'],
      ['Fatty acid β-oxidation produces…', 'acetyl-CoA, NADH and FADH₂', ['glucose', 'pyruvate only', 'lactate'], 'Each round removes a 2-carbon acetyl-CoA unit.'],
      ['An uncoupler (like DNP) causes…', 'oxygen use without ATP synthesis; energy lost as heat', ['more ATP synthesis', 'no oxygen use', 'faster glycolysis only'], 'It lets protons leak back across the membrane, bypassing ATP synthase.'],
      ['Cyanide stops respiration by blocking…', 'Complex IV (cytochrome c oxidase)', ['Complex I', 'ATP synthase', 'hexokinase'], 'Electrons cannot reach O₂.'],
    ])();
  } });
