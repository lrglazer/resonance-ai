/* ChemFluent — Virtual Labs: Organic I & II, Biochem, and the lab pages. */
'use strict';

/* ============================== CHEM 2123 ============================== */
const MPS = [['Naphthalene', 80], ['Benzil', 95], ['Acetanilide', 114], ['Fluorene', 115], ['Benzoic acid', 122], ['Urea', 133], ['trans-Cinnamic acid', 133], ['Salicylic acid', 159], ['Sulfanilamide', 165]];
LABS.push({
  id: 'meltpt', course: '2123', icon: '🌡️', title: 'Recrystallization & melting points', utd: 'Crystallization & Melting Points (Exp. 3A)',
  goal: 'Choose a recrystallization solvent, then identify an unknown by melting point and mixed melting point.',
  intro: `<p>A pure compound melts over a <b>narrow range</b> (1–2 °C) at its literature value. Impurities <b>lower and broaden</b> the range.</p><p>Two compounds can share a melting point (urea and <i>trans</i>-cinnamic acid both melt at 133 °C). Mix your unknown 50:50 with a known: if they are the same compound, the mixture still melts sharply; if not, it melts low and broad. That is a <b>mixed melting point</b>.</p><p><b>Good recrystallization solvent:</b> the compound is barely soluble cold but very soluble hot. Heat slowly (1–2 °C/min) near the melting point, or the thermometer lags behind the sample.</p>`,
  steps: ['Pick a recrystallization solvent and crystallize the crude unknown.', 'Load a capillary and heat in the Mel-Temp.', 'Click when the first droplet appears and when it is fully liquid.', 'Run mixed melting points against candidates.'],
  cols: ['Sample', 'Heating rate (°C/min)', 'Onset (°C)', 'Clear (°C)', 'Range'],
  sim(box, nb) {
    const unk = R.pick(MPS.slice(2)); let pure = false, raf = 0, T = 25, phase = 0, sample = null, onset = null;
    const SOLV = [['Water', 'good', 'soluble hot, insoluble cold: big recovery of clean crystals'], ['Hexane', 'bad', 'insoluble even when hot: nothing dissolves'], ['Acetone', 'bad', 'soluble even when cold: you lose most of it in the filtrate'], ['Ethanol/water', 'good', 'mixed solvent works: dissolve in hot ethanol, add water to the cloud point']];
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="meltemp" viewBox="0 0 220 230" id="mtV" aria-hidden="true"></svg></div><div class="rig-r">
      <p><b>1. Recrystallize</b> the crude unknown from:</p><div class="chips-row" id="mtS">${SOLV.map((s, i) => `<button class="chip" data-i="${i}">${s[0]}</button>`).join('')}</div><p class="tip" id="mtSM"></p>
      <p><b>2. Melt</b></p><div class="chips-row" id="mtC"><button class="chip" data-s="u">Unknown</button>${MPS.filter(m => Math.abs(m[1] - unk[1]) < 25).map(m => `<button class="chip" data-s="${m[0]}">Unknown + ${m[0]}</button>`).join('')}</div>
      <label class="sl">Heating rate <b id="mtRL"></b><input type="range" id="mtR" min="1" max="10" value="2"></label><div class="readout"><span>Thermometer</span><b id="mtT">25 °C</b></div>
      <div class="btnrow"><button class="btn" id="mtA" disabled>💧 First droplet</button><button class="btn" id="mtB" disabled>✓ Fully liquid</button></div></div></div>`;
    const rate = () => +$('#mtR').value; const u = () => $('#mtRL').textContent = rate() + ' °C/min'; $('#mtR').oninput = u; u();
    const draw = () => { const f = sample ? clamp((T - sample.lo) / (sample.hi - sample.lo), 0, 1) : 0;
      $('#mtV').innerHTML = `<rect class="box" x="20" y="30" width="180" height="180" rx="14"/><rect class="lcd" x="50" y="160" width="120" height="30" rx="5"/><text class="lcdt" x="110" y="181">${T.toFixed(1)} °C</text><circle class="view" cx="110" cy="90" r="42"/>
        <rect x="102" y="54" width="16" height="70" rx="5" class="cap"/><rect x="104" y="${100 - 0}" width="12" height="22" rx="3" fill="${f <= 0 ? '#f8f8f8' : f >= 1 ? 'rgba(255,240,180,.55)' : 'rgba(250,245,220,.8)'}" stroke="#999"/>${f > 0 && f < 1 ? `<circle cx="110" cy="${112 - f * 6}" r="${2 + f * 3}" fill="rgba(255,255,255,.95)"/>` : ''}`; $('#mtT').textContent = T.toFixed(1) + ' °C'; };
    box.querySelectorAll('#mtS .chip').forEach(b => b.onclick = () => { box.querySelectorAll('#mtS .chip').forEach(x => x.classList.toggle('on', x === b)); const s = SOLV[+b.dataset.i]; pure = s[1] === 'good'; $('#mtSM').textContent = `${s[0]}: ${s[2]}.`; });
    box.querySelectorAll('#mtC .chip').forEach(b => b.onclick = () => { cancelAnimationFrame(raf); box.querySelectorAll('#mtC .chip').forEach(x => x.classList.toggle('on', x === b));
      const mix = b.dataset.s !== 'u', same = mix && b.dataset.s === unk[0], mp = unk[1]; let lo, hi;
      if (!mix) [lo, hi] = pure ? [mp - 1.5, mp - .3] : [mp - 9, mp - 3]; else if (same) [lo, hi] = [mp - 1.5, mp - .5]; else { const other = MPS.find(m => m[0] === b.dataset.s)[1]; lo = Math.min(mp, other) - 18; hi = Math.min(mp, other) - 8; }
      sample = { lo, hi, name: mix ? b.textContent : 'Unknown' + (pure ? ' (recrystallized)' : ' (crude)') }; onset = null; T = Math.max(25, lo - 25); $('#mtA').disabled = false; $('#mtB').disabled = true;
      let last = performance.now(); const st = now => { const dt = (now - last) / 1000; last = now; const r = T < sample.lo - 15 ? 10 : rate(); T += r * dt * 6; /* 6 s of lab per real second */ draw(); if (T < sample.hi + 12) raf = requestAnimationFrame(st); }; raf = requestAnimationFrame(st); });
    const lag = () => (rate() - 1.5) * .8; // thermometer lags the sample when heating fast
    $('#mtA').onclick = () => { onset = T + lag(); $('#mtA').disabled = true; $('#mtB').disabled = false; };
    $('#mtB').onclick = () => { const cl = T + lag(); $('#mtB').disabled = true; nb.log([sample.name, rate(), onset.toFixed(1), cl.toFixed(1), (cl - onset).toFixed(1) + ' °C']); };
    draw(); this.unk = unk; return () => cancelAnimationFrame(raf);
  },
  post: [
    () => mcFrom('Your crude product melts at 108–116 °C. The literature value is 122 °C. What does this suggest?', 'It is impure', ['It is pure', 'It is a different compound for sure', 'The thermometer is broken'], ['Impurities lower and broaden the melting range.', 'Low and 8 °C wide → <b>impure</b>; recrystallize it.']),
    () => mcFrom('An unknown melts at 132–133 °C. Mixed with urea it melts at 115–122 °C; mixed with trans-cinnamic acid it melts at 132–133 °C. What is it?', 'trans-Cinnamic acid', ['Urea', 'A mixture of both', 'Cannot tell'], ['A mixture of two different compounds melts low and broad.', 'No depression with cinnamic acid → the unknown <b>is trans-cinnamic acid</b>.']),
    () => mcFrom('Which makes the best recrystallization solvent?', 'Dissolves the compound hot, not cold', ['Dissolves the compound hot and cold', 'Does not dissolve it at any temperature', 'Reacts with the impurities'], ['You need it to dissolve when hot, then crystallize on cooling.', '<b>Soluble hot, insoluble cold.</b>']),
    () => { const c = R.real(1.8, 2.4, 2), r = R.real(1.2, c - .2, 2); return numQ(`You recrystallize ${c} g of crude solid and recover ${r} g. Percent recovery?`, r / c * 100, '%', [`% recovery = ${r}/${c} × 100 = <b>${sig(r / c * 100, 3)}%</b>`]); },
  ],
});

LABS.push({
  id: 'extract', course: '2123', icon: '🫙', title: 'Acid–base extraction of Excedrin', utd: 'Acid-Base Extraction of Active Ingredients in Excedrin',
  goal: 'Separate aspirin, acetaminophen and caffeine with a separatory funnel by choosing the right aqueous washes.',
  intro: `<p>Neutral organic molecules stay in the organic layer. Turn one into a <b>salt</b> by deprotonating it, and it moves to the water layer. Then acidify that water layer to get the neutral compound back as a solid.</p>
    <ul><li><b>Aspirin</b>: carboxylic acid, pK<sub>a</sub> ≈ 3.5. NaHCO₃ (pH ~8.3) is enough to deprotonate it.</li><li><b>Acetaminophen</b>: phenol, pK<sub>a</sub> ≈ 9.5. Needs NaOH (pH ~14).</li><li><b>Caffeine</b>: neutral (very weak base). Stays in the organic layer.</li></ul><p>Rule of thumb: a reagent deprotonates an acid if the reagent's conjugate acid has a pK<sub>a</sub> at least ~2 units higher.</p>`,
  steps: ['Dissolve the tablet in an organic solvent.', 'Choose an aqueous wash, shake (vent!), and let the layers separate.', 'Drain the bottom layer and collect the aqueous extract.', 'Repeat until each drug is in its own flask, then acidify the extracts.'],
  cols: ['Wash', 'Moved to aqueous', 'Left in organic', 'Aqueous layer position'],
  sim(box, nb) {
    const D = [['Aspirin', 3.5, '#ff8a6b'], ['Acetaminophen', 9.5, '#7fa2ff'], ['Caffeine', 99, '#3ed1ac']]; let org = ['Aspirin', 'Acetaminophen', 'Caffeine'], flasks = [], solv = 'DCM', shaking = 0, raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="sepf" viewBox="0 0 200 250" id="exV" aria-hidden="true"></svg><div id="exF" class="exflasks"></div></div><div class="rig-r">
      <label class="sl">Organic solvent<select id="exS"><option value="DCM">Dichloromethane (d = 1.33, bottom)</option><option value="Ether">Diethyl ether (d = 0.71, top)</option></select></label>
      <div class="chips-row" id="exW"><button class="chip" data-w="NaHCO3">sat. NaHCO₃</button><button class="chip" data-w="NaOH">3 M NaOH</button><button class="chip" data-w="HCl">3 M HCl</button><button class="chip" data-w="H2O">water</button></div>
      <div class="btnrow"><button class="btn" id="exR">↺ Start over</button><button class="btn pri" id="exD" disabled>🧊 Acidify extracts &amp; collect</button></div><p class="tip" id="exM">Goal: three flasks, one drug each.</p></div></div>`;
    const pH = { NaHCO3: 8.3, NaOH: 14, HCl: 0, H2O: 7 };
    const dots = (list, y0, h) => list.map((n, i) => { const d = D.find(x => x[0] === n); return [...Array(5)].map((_, k) => `<circle cx="${70 + ((k * 37 + i * 19) % 60)}" cy="${y0 + 6 + ((k * 23 + i * 11) % (h - 12))}" r="4" fill="${d[2]}" stroke="#222"/>`).join(''); }).join('');
    const draw = (aq = []) => { const top = solv === 'Ether' ? org : aq, bot = solv === 'Ether' ? aq : org, s = Math.sin(shaking) * shaking * .4;
      $('#exV').innerHTML = `<g transform="rotate(${s} 100 120)"><path class="gl" d="M85 12h30v20l50 70c10 14 8 40-10 60l-45 40h-20l-45-40c-18-20-20-46-10-60l50-70z"/><path d="M60 110h80l12 18c6 14 2 24-10 36l-38 30h-8l-38-30c-12-12-16-22-10-36z" fill="${solv === 'Ether' ? 'rgba(170,210,255,.45)' : 'rgba(255,230,170,.5)'}"/><path d="M50 80h100l10 30H40z" fill="${solv === 'Ether' ? 'rgba(255,230,170,.5)' : 'rgba(170,210,255,.45)'}"/>
        ${dots(top, 82, 26)}${dots(bot, 114, 44)}<text class="tl" x="175" y="98">${solv === 'Ether' ? 'ether' : 'aq'}</text><text class="tl" x="178" y="140">${solv === 'Ether' ? 'aq' : 'DCM'}</text><rect class="cock" x="86" y="232" width="28" height="7" rx="3"/></g>`;
      $('#exF').innerHTML = flasks.map((f, i) => `<div class="col">${flaskSVG(f.solid ? 'rgba(245,245,245,.95)' : 'rgba(170,210,255,.45)', .3)}<span>${f.name}</span><small>${f.solid ? f.list.join(' + ') + ' (solid)' : f.list.length ? f.list.length + ' compound(s)' : 'empty'}</small></div>`).join('') + `<div class="col">${flaskSVG('rgba(255,230,170,.5)', .3)}<span>organic</span><small>${org.join(', ') || 'empty'}</small></div>`; };
    $('#exS').onchange = e => { solv = e.target.value; draw(); };
    box.querySelectorAll('#exW .chip').forEach(b => b.onclick = () => { const w = b.dataset.w, moved = org.filter(n => D.find(d => d[0] === n)[1] < pH[w] - 1.5); org = org.filter(n => !moved.includes(n));
      cancelAnimationFrame(raf); shaking = 10; const st = () => { shaking *= .93; draw(moved); if (shaking > .2) raf = requestAnimationFrame(st); else { shaking = 0; draw(moved); flasks.push({ name: `Extract ${flasks.length + 1} (${b.textContent})`, list: moved }); setTimeout(() => draw(), 600); $('#exD').disabled = false;
        $('#exM').textContent = moved.length ? `${moved.join(' and ')} moved to the water layer as ${moved.length > 1 ? 'salts' : 'a salt'}.` : 'Nothing was deprotonated, so nothing moved.'; nb.log([b.textContent, moved.join(', ') || 'none', org.join(', ') || 'none', solv === 'DCM' ? 'top' : 'bottom']); } }; raf = requestAnimationFrame(st); });
    $('#exR').onclick = () => { org = D.map(d => d[0]); flasks = []; draw(); $('#exM').textContent = 'Goal: three flasks, one drug each.'; };
    $('#exD').onclick = () => { flasks.forEach(f => f.solid = true); draw(); const sep = flasks.filter(f => f.list.length === 1).length + (org.length === 1 ? 1 : 0); $('#exM').innerHTML = sep === 3 ? '🎉 Clean separation: each drug is in its own flask. (Evaporate the organic layer to get caffeine.)' : 'Not fully separated. Try a weaker base first so only the stronger acid moves.'; };
    draw(); return () => cancelAnimationFrame(raf);
  },
  post: [
    () => mcFrom('Why use NaHCO₃ before NaOH?', 'NaHCO₃ removes only the carboxylic acid; NaOH would take the phenol too', ['NaHCO₃ is a stronger base', 'NaOH would react with caffeine', 'NaHCO₃ makes the layers separate faster'], ['H₂CO₃ (pK<sub>a</sub> 6.4) is stronger than phenol (9.5) but weaker than aspirin (3.5).', 'So bicarbonate pulls out <b>only aspirin</b>, leaving acetaminophen for NaOH.']),
    () => mcFrom('With dichloromethane as the organic solvent, which layer is aqueous?', 'Top', ['Bottom', 'Neither: they mix', 'It depends on the drug'], ['DCM (1.33 g/mL) is denser than water.', 'Water floats on top: <b>aqueous is the top layer</b>.']),
    () => mcFrom('After extracting aspirin into NaHCO₃(aq), how do you get solid aspirin back?', 'Add HCl until acidic, then vacuum filter', ['Add more NaHCO₃', 'Boil off the water at once', 'Add NaOH'], ['The salt is water-soluble; the neutral acid is not.', 'Acidify to re-protonate it: <b>it precipitates</b>.']),
  ],
});

const TLCC = [['Acetaminophen', .78, '#7fa2ff'], ['Caffeine', .66, '#3ed1ac'], ['Aspirin', .5, '#ff8a6b'], ['Salicylamide', .42, '#c29bff'], ['Ibuprofen', .3, '#ffc93c']];
const rfOf = (p, s) => clamp(1 / (1 + Math.exp(7 * (p - s - .12))), .02, .97);
LABS.push({
  id: 'tlc', course: '2123', icon: '🧫', title: 'TLC: analysis of analgesic drugs', utd: 'Thin Layer Chromatography: Analysis of Analgesic Drugs',
  goal: 'Spot standards and an unknown tablet, develop the plate, calculate R<sub>f</sub> values and identify what is in the tablet.',
  intro: `<p>Silica gel is very polar. Polar compounds stick to it and travel a short distance; nonpolar compounds move with the solvent.</p><p class="mono">R<sub>f</sub> = distance moved by spot / distance moved by solvent front</p><p>A more polar solvent (more ethyl acetate) moves <i>everything</i> farther. Aim for R<sub>f</sub> values between ~0.2 and 0.8, where the spots spread out best.</p>`,
  steps: ['Spot the standards and the unknown on the starting line.', 'Choose the solvent mixture and develop the plate.', 'View under UV light and mark the spots.', 'Compare R<sub>f</sub> values to identify the unknown\'s components.'],
  cols: ['Lane', 'Spot distance (cm)', 'Front (cm)', 'R<sub>f</sub>'],
  sim(box, nb) {
    const unk = R.shuffle(TLCC).slice(0, R.int(2, 3)); let lanes = ['Acetaminophen', 'Caffeine', 'Aspirin', 'Unknown'], s = .5, f = 0, raf = 0, uv = false;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="tlc" viewBox="0 0 220 260" id="tlV" aria-hidden="true"></svg></div><div class="rig-r"><p>Lanes: <span id="tlLn"></span></p><div class="chips-row" id="tlS">${TLCC.map(c => `<button class="chip" data-c="${c[0]}">${c[0]}</button>`).join('')}</div>
      <label class="sl">Solvent <b id="tlSL"></b><input type="range" id="tlR" min="0" max="1" step=".05" value=".5"></label><div class="btnrow"><button class="btn pri" id="tlGo">▶ Develop</button><button class="btn" id="tlUV">🔦 UV lamp</button><button class="btn" id="tlM" disabled>📏 Measure R<sub>f</sub></button></div><p class="tip">Tap a standard to swap it into lanes 1–3. The unknown is always lane 4.</p></div></div>`;
    const sl = () => { s = +$('#tlR').value; $('#tlSL').textContent = `${Math.round((1 - s) * 100)}:${Math.round(s * 100)} hexane:EtOAc`; }; $('#tlR').oninput = sl; sl();
    const spots = () => lanes.map((n, i) => (n === 'Unknown' ? unk : [TLCC.find(c => c[0] === n)]).map(c => ({ i, c, rf: rfOf(c[1], s) })));
    const draw = () => { const base = 230, top = 30, front = base - f * (base - top);
      $('#tlV').innerHTML = `<rect class="plate ${uv ? 'uv' : ''}" x="20" y="10" width="180" height="240" rx="4"/><line class="base" x1="28" x2="192" y1="${base}" y2="${base}"/>${f > 0 ? `<line class="front" x1="28" x2="192" y1="${front}" y2="${front}"/>` : ''}<rect class="solv" x="20" y="${base + 6}" width="180" height="${Math.max(0, 14 - f * 14)}"/>
        ${spots().flat().map(sp => { const x = 50 + sp.i * 40, y = base - sp.rf * f * (base - top); return `<ellipse cx="${x}" cy="${y}" rx="9" ry="${f > 0 ? 6 + f * 2 : 5}" class="spot" style="opacity:${uv || f === 0 ? .9 : .07};fill:${uv ? '#3b2a6b' : sp.c[2]}"/>`; }).join('')}
        ${lanes.map((n, i) => `<text class="tl" x="${50 + i * 40}" y="${base + 30 > 258 ? 258 : base + 18}">${i + 1}</text>`).join('')}`;
      $('#tlLn').innerHTML = lanes.map((n, i) => `<b>${i + 1}</b> ${n}`).join(' · '); };
    box.querySelectorAll('#tlS .chip').forEach(b => b.onclick = () => { if (f > 0) return; const n = b.dataset.c; if (lanes.includes(n)) return; lanes = [lanes[1], lanes[2], n, 'Unknown']; draw(); });
    $('#tlGo').onclick = () => { cancelAnimationFrame(raf); f = 0; uv = false; const t0 = performance.now(); const st = now => { f = Math.min(1, (now - t0) / 3500); draw(); if (f < 1) raf = requestAnimationFrame(st); else $('#tlM').disabled = false; }; raf = requestAnimationFrame(st); };
    $('#tlUV').onclick = () => { uv = !uv; draw(); };
    $('#tlM').onclick = () => { $('#tlM').disabled = true; spots().flat().forEach(sp => { const d = sp.rf * 8.0 * (1 + jit(.01)); nb.log([`${sp.i + 1}: ${lanes[sp.i]}`, d.toFixed(1), '8.0', (d / 8).toFixed(2)]); }); };
    draw(); return () => cancelAnimationFrame(raf);
  },
  post: [
    () => { const d = R.real(1.5, 6, 1), fr = R.real(7, 9, 1); return numQ(`A spot travels ${d} cm and the solvent front ${fr} cm. What is R<sub>f</sub>?`, d / fr, '', [`R<sub>f</sub> = ${d}/${fr} = <b>${(d / fr).toFixed(2)}</b>`], { abs: .011 }); },
    () => mcFrom('On silica gel, which compound has the <b>lowest</b> R<sub>f</sub>?', 'Benzoic acid', ['Naphthalene', 'Toluene', 'Hexane'], ['Silica holds on to polar, H-bonding compounds.', 'The carboxylic acid is most polar: <b>lowest R<sub>f</sub></b>.']),
    () => mcFrom('All your spots run up near the solvent front (R<sub>f</sub> ≈ 0.95). What should you change?', 'Use a less polar solvent (more hexane)', ['Use a more polar solvent', 'Spot more sample', 'Use a longer plate'], ['A very polar eluent carries everything along.', 'Switch to a <b>less polar</b> mixture to slow the spots down.']),
  ],
});

LABS.push({
  id: 'column', course: '2123', icon: '🍅', title: 'Column chromatography: lycopene from tomato paste', utd: 'Column Chromatography: Separation of Lycopene from Tomato Paste',
  goal: 'Separate β-carotene (orange) from lycopene (red) on an alumina column by choosing when to switch solvents.',
  intro: `<p>A column is TLC turned on its side and scaled up. Compounds that interact less with the polar stationary phase (alumina) come off first.</p><p>β-Carotene is slightly less retained than lycopene. Elute with hexane to bring β-carotene down first, then switch to a more polar solvent (hexane/acetone) to push lycopene off.</p>`,
  steps: ['Load the tomato-paste extract on top of the column.', 'Add solvent and collect fractions.', 'Switch to the more polar solvent at the right time.', 'Pick the fractions that contain pure lycopene.'],
  cols: ['Fraction', 'Eluent', 'Color', 'Contains'],
  sim(box, nb) {
    let pos = [0, 0], eluent = 'hexane', fr = 0; const C = [['β-carotene', '#ff9a1f', [.13, .35]], ['lycopene', '#d7263d', [.045, .3]]];
    box.innerHTML = `<div class="rig"><div class="rig-l"><div class="bench"><svg class="colsvg" viewBox="0 0 90 280" id="coV" aria-hidden="true"></svg><div id="coF" class="fracs"></div></div></div><div class="rig-r"><div class="chips-row" id="coE"><button class="chip on" data-e="hexane">Hexane</button><button class="chip" data-e="polar">90:10 hexane:acetone</button></div><div class="btnrow"><button class="btn pri" id="coGo">💧 Add solvent &amp; collect a fraction</button><button class="btn" id="coZ">↺ Repack</button></div><p class="tip" id="coM">Watch the bands. Switch solvents after the orange band is out.</p></div></div>`;
    const draw = () => { $('#coV').innerHTML = `<rect class="gl" x="30" y="10" width="30" height="230" rx="4"/><rect x="32" y="40" width="26" height="198" fill="#efe7d6"/>${C.map((c, i) => pos[i] < 1 ? `<rect x="32" y="${40 + pos[i] * 190}" width="26" height="${12 + pos[i] * 10}" fill="${c[1]}" opacity=".85"/>` : '').join('')}<path class="gl" d="M36 240l8 22h2l8-22"/>`; };
    box.querySelectorAll('#coE .chip').forEach(b => b.onclick = () => { box.querySelectorAll('#coE .chip').forEach(x => x.classList.toggle('on', x === b)); eluent = b.dataset.e; });
    $('#coGo').onclick = () => { if (fr >= 12) return; fr++; const out = []; C.forEach((c, i) => { if (pos[i] >= 1.15) return; pos[i] += c[2][eluent === 'hexane' ? 0 : 1]; if (pos[i] >= 1 && pos[i] < 1.15 + .35) out.push(c[0]); if (pos[i] >= 1) pos[i] = Math.max(pos[i], 1.2); });
      const col = out.length === 2 ? '#e85d2a' : out[0] === 'lycopene' ? '#d7263d' : out[0] ? '#ff9a1f' : 'rgba(230,240,255,.5)';
      $('#coF').insertAdjacentHTML('beforeend', `<div class="frac"><div style="background:${col}"></div><small>${fr}</small></div>`); nb.log([fr, eluent === 'hexane' ? 'hexane' : '90:10 hex:acetone', out.length ? (out.length === 2 ? 'orange-red' : out[0] === 'lycopene' ? 'red' : 'orange') : 'colorless', out.join(' + ') || '—']);
      $('#coM').textContent = out.length === 2 ? 'Both came off together: that fraction is mixed.' : out.length ? `${out[0]} is eluting.` : 'Bands moving…'; draw(); };
    $('#coZ').onclick = () => { pos = [0, 0]; fr = 0; $('#coF').innerHTML = ''; draw(); };
    draw(); return () => { };
  },
  post: [
    () => mcFrom('In normal-phase column chromatography, which compound elutes first?', 'The least polar one', ['The most polar one', 'The heaviest one', 'The most colorful one'], ['The stationary phase is polar.', 'Nonpolar compounds spend more time in the mobile phase: <b>least polar first</b>.']),
    () => mcFrom('Why switch to a more polar eluent partway through?', 'To push the more strongly held compound off faster', ['To slow everything down', 'To dry the column', 'To react with lycopene'], ['A more polar eluent competes for the alumina binding sites.', 'It moves the <b>more retained</b> compound down the column.']),
  ],
});

LABS.push({
  id: 'distill', course: '2123', icon: '⚗️', title: 'Simple vs. fractional distillation', utd: 'Synthesis of Isopentyl Acetate (Exp. 14A): simple distillation',
  goal: 'Distill a 1:1 cyclohexane/toluene mixture both ways and compare how well each separates the two liquids.',
  intro: `<p>Vapor is richer in the lower-boiling liquid (cyclohexane, bp 81 °C) than the pot. Toluene boils at 111 °C.</p><p><b>Simple distillation</b> is one vaporization–condensation cycle. A <b>fractionating column</b> gives many cycles (theoretical plates), so the first distillate is nearly pure cyclohexane and the temperature jumps sharply when it runs out.</p><p>The temperature at the still head tells you what is coming over. Change receivers when it starts to climb.</p>`,
  steps: ['Choose simple or fractional.', 'Heat and collect distillate, watching the head temperature.', 'Switch receivers when the temperature rises.', 'Compare the curves.'],
  cols: ['Setup', 'Distillate (mL)', 'Head T (°C)', 'Fraction'],
  sim(box, nb) {
    let raf = 0; const runs = {};
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="dist" viewBox="0 0 260 200" id="dsV" aria-hidden="true"></svg></div><div class="rig-r"><div class="btnrow"><button class="btn pri" data-n="1">🔥 Simple</button><button class="btn pri" data-n="4">🔥 Fractional (4 plates)</button></div><div class="readout"><span>Still head</span><b id="dsT">—</b></div><button class="btn" id="dsSw" disabled>🔁 Switch receiver</button><p class="tip">Switch receivers when the temperature leaves ~81 °C.</p><div id="dsP"></div></div></div>`;
    const a = 2.4;
    const draw = (T, vol, n) => $('#dsV').innerHTML = `<circle class="gl" cx="45" cy="150" r="32"/><path d="M15 160a32 32 0 0 0 60 0z" fill="rgba(255,230,170,.6)"/><rect class="gl" x="38" y="${n > 1 ? 40 : 80}" width="14" height="${n > 1 ? 82 : 42}"/>${n > 1 ? [...Array(6)].map((_, i) => `<circle cx="45" cy="${50 + i * 12}" r="3" class="bead"/>`).join('') : ''}<path class="gl" d="M45 ${n > 1 ? 40 : 80}V30h60l110 60"/><path class="cond" d="M110 36l100 56" /><rect class="gl" x="205" y="100" width="40" height="80" rx="4"/><rect x="207" y="${178 - vol * .7}" width="36" height="${vol * .7}" fill="rgba(255,240,200,.8)"/><text class="tl" x="45" y="20">${T ? T.toFixed(1) + ' °C' : ''}</text><path class="flame-s" d="M35 195q10-22 20 0z"/>`;
    box.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { clearTimeout(raf); const n = +b.dataset.n, key = n > 1 ? 'Fractional' : 'Simple'; runs[key] = []; let x = .5, Vp = 100, V = 0, rec = 1; $('#dsSw').disabled = false; $('#dsSw').onclick = () => rec++;
      const st = () => { const an = a ** n, y = an * x / (1 + (an - 1) * x), T = 81 + (111 - 81) * (1 - y) ** 1.6 + jit(.15); const dV = 1; x = (x * Vp - y * dV) / (Vp - dV); Vp -= dV; V += dV; x = clamp(x, 0, 1);
        if (V % 2 === 0) { runs[key].push([V, T]); if (V % 10 === 0) nb.log([key, V, T.toFixed(1), rec]); }
        draw(T, V, n); $('#dsT').textContent = T.toFixed(1) + ' °C';
        $('#dsP').innerHTML = plot({ x: [0, 95], y: [75, 115], xl: 'distillate (mL)', yl: 'head T (°C)', series: [...(runs.Simple ? [{ pts: runs.Simple, type: 'line', cls: 'c2' }] : []), ...(runs.Fractional ? [{ pts: runs.Fractional, type: 'line', cls: 'c1' }] : [])], notes: [[3, 112, `${runs.Simple ? '— simple ' : ''}${runs.Fractional ? '— fractional' : ''}`]] });
        if (V < 95) { if (!document.body.contains(box)) return; raf = setTimeout(st, 70); } else $('#dsSw').disabled = true; };
      st(); });
    draw(null, 0, 1); return () => clearTimeout(raf);
  },
  post: [
    () => mcFrom('Why does fractional distillation give a sharper temperature jump than simple distillation?', 'The column gives many vaporization–condensation cycles', ['It heats the pot faster', 'It removes water', 'It lowers the boiling points'], ['Each cycle (theoretical plate) enriches the vapor further.', '<b>More plates</b> → purer early fractions and a sharp change.']),
    () => mcFrom('The thermometer bulb sits above the side arm. What happens to the temperature reading?', 'It reads too low', ['It reads too high', 'It is unaffected', 'It reads the pot temperature'], ['The bulb must be bathed in vapor going into the condenser.', 'Above the side arm it misses the vapor: <b>reads low</b>.']),
    () => mcFrom('For Fischer esterification of isoamyl alcohol with acetic acid, why use excess acetic acid?', 'To push the equilibrium toward the ester', ['Because acetic acid is the catalyst', 'To make the ester boil lower', 'To neutralize the H₂SO₄'], ['Fischer esterification is reversible (K ≈ 4).', 'Excess reagent shifts it right (<b>Le Chatelier</b>).']),
  ],
});

/* ============================== CHEM 2125: synthesis labs (decision-driven) ============================== */
function synthLab(box, nb, L) {
  let k = 0, y = 1, flags = [];
  const render = () => {
    if (k >= L.stepsX.length) { const yl = clamp(y * L.base * (1 + jit(.04)), .02, .97), mp = L.mp - (y < .7 ? R.real(4, 9, 1) : R.real(.3, 1.5, 1));
      box.innerHTML = `<div class="synres"><h3>🎉 ${L.product}</h3><div class="rig"><div class="rig-l">${flaskSVG(L.color, .3, '<ellipse cx="60" cy="128" rx="34" ry="6" fill="#f5f5f0"/>')}</div><div class="rig-r"><div class="readout"><span>Yield</span><b>${(yl * 100).toFixed(0)}%</b></div><div class="readout"><span>Melting point</span><b>${(mp - 1.2).toFixed(1)}–${mp.toFixed(1)} °C</b></div><p>Literature mp: ${L.mp} °C. ${y < .7 ? 'Your product is low and broad: some problems along the way cost you yield and purity.' : 'Clean product. Nice technique.'}</p>${flags.length ? `<ul class="flags">${flags.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}<button class="btn" id="syAg">↺ Run it again</button></div></div></div>`;
      nb.log([L.product, (yl * 100).toFixed(0) + '%', `${(mp - 1.2).toFixed(1)}–${mp.toFixed(1)}`, flags.length ? flags.length + ' issue(s)' : 'clean']); $('#syAg').onclick = () => { k = 0; y = 1; flags = []; render(); }; return; }
    const s = L.stepsX[k];
    box.innerHTML = `<div class="synstep"><div class="pg">Step ${k + 1} of ${L.stepsX.length}</div><h3>${s.q}</h3>${s.img || ''}<div class="opts">${R.shuffle(s.c.map((c, i) => [c, i])).map(([c, i]) => `<button class="opt" data-i="${i}"><span>${c[0]}</span></button>`).join('')}</div><div class="fb" id="syF"></div></div>`;
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => { const c = s.c[+b.dataset.i]; box.querySelectorAll('.opt').forEach(x => x.disabled = true); b.classList.add(c[1] >= 1 ? 'right' : 'wrong'); y *= c[1]; if (c[1] < 1) flags.push(c[2].replace(/<[^>]+>/g, ''));
      $('#syF').innerHTML = `<div class="verdict ${c[1] >= 1 ? 'ok' : 'no'}">${c[1] >= 1 ? 'Good call ✅' : c[1] === 0 ? 'That kills the reaction ❌' : 'That costs you ❌'}</div><div class="how">${c[2]}</div><button class="btn pri" id="syN">Continue →</button>`;
      if (c[1] === 0) { $('#syN').textContent = '↺ Start over'; $('#syN').onclick = () => { k = 0; y = 1; flags = []; render(); }; } else $('#syN').onclick = () => { k++; render(); }; });
  };
  render(); return () => { };
}
const SYN = [
  { id: 'grignard', icon: '🧲', title: 'Grignard reaction: triphenylmethanol', utd: 'Exp. 33A: Grignard Reaction', product: 'Triphenylmethanol', mp: 162, base: .62, color: 'rgba(250,250,240,.8)',
    intro: `<p class="mono">PhBr + Mg → PhMgBr; &nbsp; 2 PhMgBr + methyl benzoate → Ph₃C–O⁻MgBr⁺ → (H₃O⁺) → Ph₃COH</p><p>The Grignard reagent is a very strong base and a strong nucleophile. <b>Any water or O–H destroys it</b> (PhMgBr + H₂O → benzene). An ester reacts with <b>two</b> equivalents: addition, loss of methoxide to a ketone, then a second addition.</p>`,
    stepsX: [
      { q: 'How do you prepare the glassware?', c: [['Oven-dry it and assemble with a CaCl₂ drying tube', 1, 'Grignard reagents are destroyed by water. Dry glassware and a drying tube keep moisture out.'], ['Rinse with water and use it right away', 0, 'A film of water protonates PhMgBr to benzene before it ever reaches the ester.'], ['Rinse with acetone and use it wet', .5, 'Acetone is a ketone: leftover acetone eats Grignard reagent (and it carries water).']] },
      { q: 'The reaction won\'t start (no cloudiness, no boiling). What do you do?', c: [['Crush the Mg with a dry rod / add an iodine crystal', 1, 'This breaks the MgO coating and exposes fresh metal.'], ['Add a few drops of water to "get it going"', 0, 'Water kills the reagent.'], ['Add all the methyl benzoate now', .4, 'Without PhMgBr formed, the ester just sits there, and the bromobenzene later couples to biphenyl.']] },
      { q: 'Which solvent?', c: [['Anhydrous diethyl ether', 1, 'Ether\'s lone pairs coordinate and stabilize Mg. It has no acidic H.'], ['Ethanol', 0, 'The O–H instantly protonates the Grignard.'], ['Hexane', .3, 'No coordination: the reagent forms poorly.']] },
      { q: 'How many equivalents of PhMgBr per mole of methyl benzoate?', c: [['At least 2', 1, 'Esters take two: the first addition gives benzophenone, which reacts again.'], ['Exactly 1', .5, 'You stop with a messy mix of ketone and alcohol and half the ester unreacted.'], ['0.5', .3, 'Not enough nucleophile.']] },
      { q: 'Workup?', c: [['Pour onto ice/H₂SO₄, separate, then recrystallize from isopropanol', 1, 'Acid protonates the alkoxide to the alcohol and dissolves Mg salts. Biphenyl side product stays in solution when you recrystallize.'], ['Add NaOH', .5, 'Base won\'t dissolve the magnesium salts well and leaves a gooey emulsion.'], ['Skip workup, just evaporate', .4, 'You keep the magnesium salts and biphenyl.']] }] },
  { id: 'benzocaine', icon: '💊', title: 'Preparation of benzocaine', utd: 'Exp. 42: Preparation of Benzocaine', product: 'Benzocaine (ethyl 4-aminobenzoate)', mp: 92, base: .7, color: 'rgba(250,250,245,.8)',
    intro: `<p class="mono">p-aminobenzoic acid + EtOH ⇌(H₂SO₄) benzocaine + H₂O</p><p>A <b>Fischer esterification</b>. It's an equilibrium, so you use excess ethanol. The amine grabs some of the H₂SO₄ catalyst (making a white solid ammonium salt), so you need extra acid. Neutralize with Na₂CO₃ at the end to free the amine and precipitate benzocaine.</p>`,
    stepsX: [
      { q: 'How much ethanol?', c: [['A large excess (it\'s also the solvent)', 1, 'Excess alcohol drives the equilibrium toward the ester.'], ['Exactly 1 equivalent', .5, 'With K ≈ 4, equal amounts stop near 67% conversion.']] },
      { q: 'You add H₂SO₄ and a white precipitate forms. What is it?', c: [['The ammonium hydrogen sulfate salt of PABA (it redissolves on heating)', 1, 'The basic NH₂ is protonated. That\'s why more than a catalytic amount of acid is used.'], ['Benzocaine already', .6, 'Too early. Esterification needs reflux.']] },
      { q: 'After refluxing, how do you isolate the product?', c: [['Cool, add 10% Na₂CO₃ until pH ≈ 8, and vacuum filter', 1, 'Carbonate neutralizes the acid and frees the amine; neutral benzocaine is insoluble in water.'], ['Add HCl', .3, 'That protonates the amine, so benzocaine stays dissolved as its salt.'], ['Add NaOH to pH 14 and heat', .4, 'Hot strong base hydrolyzes the ester right back (saponification).']] },
      { q: 'Lots of bubbling when you add the carbonate. Why?', c: [['CO₂ from neutralizing the acid; add slowly', 1, 'H₂SO₄ + Na₂CO₃ → CO₂. Add in portions so it doesn\'t foam over.'], ['The ester is decomposing', .6, 'No: that is CO₂ from neutralization.']] }] },
  { id: 'cannizzaro', icon: '🔀', title: 'Aldehyde disproportionation (Cannizzaro)', utd: 'Exp. 60: Aldehyde Disproportionation', product: 'Benzoic acid + benzyl alcohol', mp: 122, base: .7, color: 'rgba(250,250,245,.8)',
    intro: `<p class="mono">2 PhCHO + KOH → PhCH₂OH + PhCOO⁻K⁺</p><p>An aldehyde with <b>no α-hydrogens</b> can't form an enolate, so in concentrated base one molecule is reduced (hydride transfer) while another is oxidized. One alcohol + one carboxylate.</p>`,
    stepsX: [
      { q: 'Which aldehyde can do the Cannizzaro reaction?', c: [['Benzaldehyde (no α-H)', 1, 'No α-hydrogens means no aldol: hydride transfer happens instead.'], ['Acetaldehyde', 0, 'It has α-H, so it undergoes aldol condensation.']] },
      { q: 'What base conditions?', c: [['Concentrated KOH', 1, 'The reaction is second order in aldehyde and needs a lot of hydroxide.'], ['Dilute NaHCO₃', .2, 'Far too weak a base.']] },
      { q: 'How do you separate the two products?', c: [['Extract benzyl alcohol into ether; acidify the aqueous layer to precipitate benzoic acid', 1, 'The carboxylate salt stays in water; the neutral alcohol goes into ether.'], ['Distill everything together', .5, 'Potassium benzoate doesn\'t distill and the alcohol comes over wet.']] },
      { q: 'You acidify the aqueous layer with HCl. What do you see?', c: [['White crystals of benzoic acid', 1, 'Protonating benzoate (pK<sub>a</sub> 4.2) gives the insoluble acid.'], ['Nothing: you should add base', .5, 'Benzoate is soluble; you need acid to precipitate it.']] }] },
  { id: 'benzilic', icon: '🔄', title: 'Benzilic acid rearrangement', utd: 'Exp. 32C: Preparation of Benzilic Acid', product: 'Benzilic acid', mp: 150, base: .68, color: 'rgba(250,250,245,.8)',
    intro: `<p class="mono">PhCOCOPh (benzil) + KOH → Ph₂C(OH)COO⁻ → (H⁺) → benzilic acid</p><p>Hydroxide adds to one C=O; then a <b>phenyl group migrates</b> (a 1,2-shift) to the neighboring carbonyl carbon. The result is an α-hydroxy carboxylate.</p>`,
    stepsX: [
      { q: 'Starting material and base?', c: [['Benzil + KOH in ethanol, reflux', 1, 'A 1,2-diketone plus strong hydroxide.'], ['Benzoin + NaHCO₃', .3, 'Benzoin has only one ketone, and bicarbonate is too weak.']] },
      { q: 'What is the key step of the mechanism?', c: [['A phenyl migrates with its electron pair to the adjacent C=O', 1, 'The alkoxide reforms C=O and pushes a phenyl over: a 1,2-shift.'], ['A hydride shift', .6, 'No H is on those carbons; it\'s a phenyl that moves.']] },
      { q: 'The product is a potassium salt in solution. How do you isolate benzilic acid?', c: [['Dissolve in hot water, filter, then acidify with HCl and cool', 1, 'Acidify the carboxylate to precipitate the acid.'], ['Add more KOH', .3, 'That just keeps it dissolved.']] }] },
  { id: 'wittig', icon: '🪄', title: 'Wittig reaction: a diene', utd: 'Exp. 39B: Prep. of a diene using the Wittig Reaction', product: '1,4-Diphenyl-1,3-butadiene', mp: 153, base: .55, color: 'rgba(255,250,215,.85)',
    intro: `<p class="mono">Ph₃P⁺CH₂Ph Cl⁻ + base → ylide; ylide + cinnamaldehyde → PhCH=CH–CH=CHPh + Ph₃P=O</p><p>A phosphorus ylide attacks the aldehyde carbonyl, forms an oxaphosphetane, and collapses to an alkene plus triphenylphosphine oxide (the strong P=O bond is the driving force).</p>`,
    stepsX: [
      { q: 'How do you make the ylide?', c: [['Deprotonate the phosphonium salt with NaOEt (or 50% NaOH, phase-transfer)', 1, 'The C–H next to P⁺ is acidic enough for a strong base.'], ['Add water', .1, 'Water can\'t deprotonate the phosphonium salt.']] },
      { q: 'Which carbonyl partner gives 1,4-diphenyl-1,3-butadiene with benzyl ylide?', c: [['trans-Cinnamaldehyde (PhCH=CHCHO)', 1, 'PhCH= from the ylide + =CHCH=CHPh from cinnamaldehyde.'], ['Benzaldehyde', .3, 'That gives stilbene, not a diene.']] },
      { q: 'What is the major by-product to remove?', c: [['Triphenylphosphine oxide', 1, 'Ph₃P=O. Recrystallize to separate it.'], ['Benzoic acid', .6, 'Not formed here.']] },
      { q: 'You get a mixture of E,E and E,Z isomers. How do you enrich the E,E diene?', c: [['Recrystallize: the symmetric E,E isomer is much less soluble', 1, 'Its higher symmetry packs well, so it crystallizes out.'], ['Distill it', .5, 'The isomers have similar boiling points and the diene may polymerize.']] }] },
  { id: 'aldol', icon: '🍦', title: 'Aldol condensation: dibenzalacetone', utd: 'Exp. 37: Aldol Condensation Reaction', product: 'Dibenzalacetone', mp: 111, base: .75, color: 'rgba(255,230,120,.85)',
    intro: `<p class="mono">2 PhCHO + CH₃COCH₃ (NaOH, EtOH/H₂O) → PhCH=CHCOCH=CHPh + 2 H₂O</p><p>A <b>crossed (Claisen–Schmidt) aldol</b>. Acetone forms the enolate; benzaldehyde has no α-H so it can only be the electrophile. Each addition dehydrates to a conjugated enone, and the yellow product precipitates.</p>`,
    stepsX: [
      { q: 'What is the stoichiometry?', c: [['2 benzaldehyde : 1 acetone', 1, 'Acetone has α-H on both sides and reacts twice.'], ['1 : 1', .6, 'You get mostly benzalacetone (the mono-product).'], ['1 benzaldehyde : 2 acetone', .5, 'Excess acetone also self-condenses.']] },
      { q: 'Why is benzaldehyde a good partner for this crossed aldol?', c: [['It has no α-H, so it can\'t make an enolate', 1, 'Only acetone forms an enolate, so you avoid a messy mixture.'], ['It\'s more acidic', .6, 'It has no α-H at all.']] },
      { q: 'Why does the product dehydrate so easily?', c: [['The C=C becomes conjugated with both the ring and the C=O', 1, 'Extended conjugation (also why it\'s yellow) makes the dehydration favorable.'], ['NaOH is a dehydrating agent', .6, 'It\'s the conjugated product that drives it (E1cB).']] },
      { q: 'How do you purify it?', c: [['Wash with cold water, then recrystallize from ethanol', 1, 'Water removes NaOH; hot ethanol recrystallization gives yellow crystals.'], ['Wash with hot ethanol', .5, 'You dissolve your product.']] }] },
];
SYN.forEach(s => LABS.push({ ...s, course: '2125', goal: `Make ${s.product} by making the right call at each step. Each mistake costs yield or kills the reaction, just like at the bench.`, steps: ['Read the background and the reaction.', 'Make each procedural decision.', 'Get your yield and melting point.', 'Run it again to beat your yield.'], cols: ['Product', 'Yield', 'mp (°C)', 'Notes'], sim(box, nb) { return synthLab(box, nb, s); },
  post: [() => mcFrom(`What is the literature melting point of ${s.product.split(' (')[0]}?`, s.mp + ' °C', [s.mp + 30 + ' °C', s.mp - 40 + ' °C', s.mp + 60 + ' °C'], [`Compare your product to the literature value of <b>${s.mp} °C</b>.`, 'A low, broad range means impurities.']),
    () => { const th = R.real(1.5, 3, 2), ac = +(th * R.real(.4, .85, 2)).toFixed(2); return numQ(`Theoretical yield of ${s.product.split(' (')[0]} is ${th} g; you isolate ${ac} g. Percent yield?`, ac / th * 100, '%', [`${ac}/${th} × 100 = <b>${sig(ac / th * 100, 3)}%</b>`]); }, ...(s.id === 'grignard' ? [() => mcFrom('Which side product forms when PhMgBr couples with unreacted bromobenzene?', 'Biphenyl', ['Benzene', 'Benzophenone', 'Phenol'], ['Ph–MgBr + Ph–Br → Ph–Ph.', '<b>Biphenyl</b>, removed during recrystallization.'])] : [])] }));

/* ============================== Biochem ============================== */
LABS.push({
  id: 'bradford', course: 'bio', icon: '🔵', title: 'Bradford protein assay', utd: 'Biochem lab technique: protein quantification',
  goal: 'Make a BSA standard curve at 595 nm and find the protein concentration of an unknown.',
  intro: `<p>Coomassie Brilliant Blue G-250 binds proteins (mostly Arg, Lys and aromatic residues) and shifts from brown-red to <b>blue, absorbing at 595 nm</b>. Absorbance is proportional to protein concentration over a limited range (~0.1–1.0 mg/mL), so you use a standard curve made from bovine serum albumin (BSA).</p>`,
  steps: ['Zero the spectrophotometer with the blank.', 'Read each BSA standard at 595 nm.', 'Read the unknown.', 'Use the best-fit line to find its concentration.'],
  cols: ['Sample', 'Conc. (mg/mL)', 'λ (nm)', 'Absorbance'],
  sim(box, nb) { const cfg = { lmax: 595, width: 70, eps: .62, unit: 'mg/mL', stds: [.1, .25, .5, .75, 1.0], unk: R.real(.2, .9, 2), scan: false, color: c => `rgba(30,60,200,${.15 + c * .7})`, tip: 'Read every standard, then the unknown.' }; this.cfg = cfg; return spectroRig(box, nb, cfg); },
  chart(rows) { return spectroChart(rows, this.cfg || { stds: [1], unit: 'mg/mL' }); },
  post: [
    () => { const m = R.real(.55, .7, 3), A = R.real(.15, .55, 3); return numQ(`A Bradford standard curve gives A = ${m}·c (c in mg/mL). Your sample, diluted 1:10, reads A = ${A}. What is the concentration of the <b>original</b> sample?`, A / m * 10, 'mg/mL', [`Diluted: c = ${A}/${m} = ${sig(A / m, 3)} mg/mL`, `Undo the 1:10 dilution: × 10 = <b>${sig(A / m * 10, 3)} mg/mL</b>`]); },
    () => mcFrom('Why do you need a standard curve instead of just using ε?', 'Dye binding varies with protein and is only linear over a limited range', ['Proteins don\'t absorb light', 'BSA is the protein being measured', 'The blank absorbs at 595 nm'], ['Coomassie response depends on composition (Arg/Lys/aromatics).', 'Calibrate with a standard <b>in the linear range</b>.']),
  ],
});

const AAS = [['Glycine', [2.34, 9.60]], ['Alanine', [2.34, 9.69]], ['Histidine', [1.82, 6.00, 9.17]], ['Aspartic acid', [1.88, 3.65, 9.60]], ['Glutamic acid', [2.19, 4.25, 9.67]], ['Lysine', [2.18, 8.95, 10.53]]];
LABS.push({
  id: 'aatitr', course: 'bio', icon: '🧬', title: 'Titration of an amino acid', utd: 'Biochem lab technique: amino acid titration & pI',
  goal: 'Titrate a fully protonated unknown amino acid with NaOH, read its pK<sub>a</sub> values from the curve, and identify it.',
  intro: `<p>Start with the amino acid fully protonated (in HCl). Each ionizable group gives a flat <b>buffer region</b> centered on its pK<sub>a</sub> and a jump at each equivalence point.</p><p>Read each pK<sub>a</sub> at a half-equivalence point. The <b>isoelectric point</b> (pI) is the average of the two pK<sub>a</sub> values on either side of the neutral (zwitterion) form.</p><p>Reference: Gly 2.34/9.60 · Ala 2.34/9.69 · His 1.82/6.00/9.17 · Asp 1.88/3.65/9.60 · Glu 2.19/4.25/9.67 · Lys 2.18/8.95/10.53</p>`,
  steps: ['20.0 mL of 0.100 M amino acid (fully protonated) in the beaker.', 'Add 0.200 M NaOH, recording pH every 1 mL (smaller steps near jumps).', 'Find the equivalence points and the pK<sub>a</sub>s.', 'Identify the amino acid and calculate its pI.'],
  cols: ['NaOH (mL)', 'pH'],
  sim(box, nb) { const a = R.pick(AAS); this.a = a; return titrationRig(box, nb, { M: .2, V0: 20, mol: .002, pKas: a[1], ind: null, meter: true, cap: 30, plotV: 30, what: 'unknown amino acid', tip: 'Each equivalent of NaOH is 10.0 mL here. pK<sub>a</sub>s sit at 5, 15 and 25 mL.' }); },
  post: [
    () => { const a = R.pick(AAS.filter(x => x[1].length === 2)); return numQ(`${a[0]} has pK<sub>a</sub> values ${a[1].join(' and ')}. What is its pI?`, (a[1][0] + a[1][1]) / 2, '', [`pI = (pK<sub>a1</sub> + pK<sub>a2</sub>)/2 = <b>${((a[1][0] + a[1][1]) / 2).toFixed(2)}</b>`], { abs: .02 }); },
    () => { const a = R.pick(AAS.filter(x => x[1].length === 3)), acidic = a[0].includes('acid'), pi = acidic ? (a[1][0] + a[1][1]) / 2 : (a[1][1] + a[1][2]) / 2; return numQ(`${a[0]} has pK<sub>a</sub> values ${a[1].join(', ')}. What is its pI?`, pi, '', [acidic ? 'Acidic side chain: the neutral form sits between pK<sub>a1</sub> and pK<sub>a2</sub>.' : 'Basic side chain: the neutral form sits between the two highest pK<sub>a</sub>s.', `pI = <b>${pi.toFixed(2)}</b>`], { abs: .02 }); },
    () => mcFrom('At pH 7, what is the net charge of glutamic acid?', '−1', ['0', '+1', '−2'], ['α-COOH (2.2) and side-chain COOH (4.3) are both deprotonated: −2.', 'α-NH₃⁺ (9.7) is still protonated: +1. Net <b>−1</b>.']),
  ],
});

LABS.push({
  id: 'enzkin', course: 'bio', icon: '⚙️', title: 'Enzyme kinetics & inhibition', utd: 'Biochem lab technique: Michaelis–Menten kinetics',
  goal: 'Measure initial rates at several substrate concentrations, find K<sub>m</sub> and V<sub>max</sub>, and identify the type of inhibitor.',
  intro: `<p class="mono">v₀ = V<sub>max</sub>[S] / (K<sub>m</sub> + [S])</p><p>K<sub>m</sub> is the [S] at half of V<sub>max</sub>. The <b>Lineweaver–Burk</b> plot (1/v₀ vs 1/[S]) is a straight line: slope = K<sub>m</sub>/V<sub>max</sub>, y-intercept = 1/V<sub>max</sub>, x-intercept = −1/K<sub>m</sub>.</p><ul><li><b>Competitive</b>: K<sub>m</sub> goes up, V<sub>max</sub> unchanged (lines meet on the y-axis).</li><li><b>Noncompetitive</b>: V<sub>max</sub> goes down, K<sub>m</sub> unchanged (lines meet on the x-axis).</li><li><b>Uncompetitive</b>: both go down (parallel lines).</li></ul>`,
  steps: ['Choose a substrate concentration.', 'Run the assay: the product\'s absorbance rises with time; v₀ is the initial slope.', 'Repeat over a range of [S], without and with inhibitor.', 'Read K<sub>m</sub> and V<sub>max</sub> from the Lineweaver–Burk plot.'],
  cols: ['Inhibitor', '[S] (mM)', 'v₀ (µM/min)'],
  sim(box, nb) {
    const Vm = R.real(40, 80, 1), Km = R.real(.8, 3, 2), type = R.pick(['competitive', 'noncompetitive', 'uncompetitive']), a = 2.5; this.ans = { Vm, Km, type }; let raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="ekP0"></div></div><div class="rig-r"><label class="sl">[S]<select id="ekS">${[.25, .5, 1, 2, 4, 8, 16].map(s => `<option ${s === 1 ? 'selected' : ''}>${s}</option>`).join('')}</select> mM</label><label class="sl"><input type="checkbox" id="ekI"> Add inhibitor X</label><div class="btnrow"><button class="btn pri" id="ekGo">▶ Run assay</button></div><p class="tip">Run all seven [S] values without inhibitor, then again with it.</p></div></div>`;
    $('#ekGo').onclick = () => { cancelAnimationFrame(raf); const S = +$('#ekS').value, I = $('#ekI').checked; let V = Vm, K = Km; if (I) { if (type === 'competitive') K *= a; if (type === 'noncompetitive') V /= a; if (type === 'uncompetitive') { V /= a; K /= a; } }
      const v = V * S / (K + S) * (1 + jit(.03)), pts = []; const t0 = performance.now(); const st = now => { const t = Math.min(5, (now - t0) / 400); pts.push([t, v * t * (1 - .03 * t) / 100]); $('#ekP0').innerHTML = plot({ x: [0, 5], y: [0, Vm * 5 / 100 * 1.1], xl: 'time (min)', yl: 'A₄₁₀ (product)', series: [{ pts, type: 'line', cls: 'c1' }] }); if (t < 5) raf = requestAnimationFrame(st); else nb.log([I ? 'X' : 'none', S, v.toFixed(2)]); }; raf = requestAnimationFrame(st); };
    return () => cancelAnimationFrame(raf);
  },
  chart(rows) { const g = k => rows.filter(r => r[0] === k).map(r => [+r[1], +r[2]]), a = g('none'), b = g('X'); if (!a.length) return ''; const mm = Math.max(...rows.map(r => +r[2])) * 1.15;
    let out = plot({ x: [0, 17], y: [0, mm], xl: '[S] (mM)', yl: 'v₀ (µM/min)', series: [{ pts: a, cls: 'c1' }, { pts: b, cls: 'c2' }], notes: [[1, mm * .93, '● none   ● with X']] });
    const lb = p => p.map(([s, v]) => [1 / s, 1 / v]), fa = linfit(lb(a)), fb = b.length > 1 ? linfit(lb(b)) : null;
    if (fa) { const ym = Math.max(...[...lb(a), ...lb(b)].map(p => p[1])) * 1.1; out += `<h4>Lineweaver–Burk</h4>` + plot({ x: [-1.5, 4.2], y: [0, ym], xl: '1/[S] (mM⁻¹)', yl: '1/v₀', series: [{ pts: lb(a), cls: 'c1' }, { pts: [[-1.5, fa.b - 1.5 * fa.m], [4.2, fa.b + 4.2 * fa.m]], type: 'line', cls: 'fitl' }, ...(fb ? [{ pts: lb(b), cls: 'c2' }, { pts: [[-1.5, fb.b - 1.5 * fb.m], [4.2, fb.b + 4.2 * fb.m]], type: 'line', cls: 'fitl2' }] : [])] });
      out += `<p class="fit">No inhibitor: V<sub>max</sub> = 1/intercept = <b>${sig(1 / fa.b, 3)} µM/min</b>, K<sub>m</sub> = slope × V<sub>max</sub> = <b>${sig(fa.m / fa.b, 3)} mM</b>${fb ? `<br>With X: V<sub>max</sub> = <b>${sig(1 / fb.b, 3)}</b>, K<sub>m</sub> = <b>${sig(fb.m / fb.b, 3)} mM</b>. What kind of inhibitor does that make X?` : ''}</p>`; }
    return out; },
  post: [
    () => { const Vm = R.real(40, 90, 0), Km = R.real(.5, 4, 1), S = R.pick([.5, 1, 2, 5]); return numQ(`An enzyme has V<sub>max</sub> = ${Vm} µM/min and K<sub>m</sub> = ${Km} mM. What is v₀ at [S] = ${S} mM?`, Vm * S / (Km + S), 'µM/min', [`v₀ = V<sub>max</sub>[S]/(K<sub>m</sub> + [S]) = ${Vm}(${S})/(${Km} + ${S})`, `= <b>${sig(Vm * S / (Km + S), 3)} µM/min</b>`]); },
    () => mcFrom('An inhibitor raises the apparent K<sub>m</sub> but leaves V<sub>max</sub> unchanged. What type is it?', 'Competitive', ['Noncompetitive', 'Uncompetitive', 'Irreversible'], ['A competitive inhibitor fights substrate for the active site.', 'Enough substrate outcompetes it, so V<sub>max</sub> is the same: <b>competitive</b>.']),
    () => { const b = R.real(.012, .03, 4), m = R.real(.01, .05, 4); return numQ(`A Lineweaver–Burk line has slope ${m} min·mM/µM and y-intercept ${b} min/µM. What is K<sub>m</sub>?`, m / b, 'mM', ['V<sub>max</sub> = 1/intercept; K<sub>m</sub> = slope × V<sub>max</sub> = slope/intercept', `K<sub>m</sub> = ${m}/${b} = <b>${sig(m / b, 3)} mM</b>`]); },
  ],
});

LABS.push({
  id: 'sdspage', course: 'bio', icon: '🧱', title: 'SDS-PAGE: protein molecular weight', utd: 'Biochem lab technique: SDS-PAGE',
  goal: 'Run a ladder and protein samples on an SDS gel, then use a standard curve to estimate an unknown protein\'s molecular weight.',
  intro: `<p>SDS denatures proteins and coats them with negative charge roughly in proportion to their length. In the gel, they all run toward the + electrode, and <b>smaller proteins move farther</b>.</p><p>Relative mobility R<sub>f</sub> = band distance / dye-front distance. A plot of <b>log(MW) vs R<sub>f</sub></b> is roughly linear, so read the unknown off the ladder's line.</p>`,
  steps: ['Load the ladder and samples.', 'Run the gel at constant voltage.', 'Stain with Coomassie and measure band distances.', 'Plot log MW vs R<sub>f</sub> and estimate the unknown.'],
  cols: ['Lane / band', 'MW (kDa)', 'Distance (cm)', 'R<sub>f</sub>'],
  sim(box, nb) {
    const LAD = [250, 150, 100, 75, 50, 37, 25, 20, 15, 10], SM = [['BSA', 66.5], ['Ovalbumin', 42.7], ['Carbonic anhydrase', 29], ['Myoglobin', 17], ['Lysozyme', 14.3]], unk = R.real(22, 90, 1), rf = m => clamp(1.95 - .8 * Math.log10(m), .04, .98) + jit(.004);
    const lanes = [['Ladder', LAD], ...R.shuffle(SM).slice(0, 2).map(s => [s[0], [s[1]]]), ['Unknown', [unk]]]; let p = 0, raf = 0, stained = false;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="gel" viewBox="0 0 220 260" id="gV" aria-hidden="true"></svg></div><div class="rig-r"><div class="btnrow"><button class="btn pri" id="gGo">⚡ Run at 200 V</button><button class="btn" id="gSt" disabled>🔵 Stain</button><button class="btn" id="gM" disabled>📏 Measure bands</button></div><p class="tip">Lanes: ${lanes.map((l, i) => `<b>${i + 1}</b> ${l[0]}`).join(' · ')}</p></div></div>`;
    const draw = () => { const top = 30, len = 200, dye = top + p * len;
      $('#gV').innerHTML = `<rect class="gelbg" x="15" y="15" width="190" height="235" rx="6"/>${lanes.map((l, i) => `<rect class="wellg" x="${30 + i * 45}" y="20" width="30" height="8"/>` + l[1].map(m => { const y = top + rf(m) * p * len; return `<rect x="${31 + i * 45}" y="${y}" width="28" height="3.5" rx="1.5" class="band" style="opacity:${stained ? (l[0] === 'Ladder' ? .75 : .9) : 0}"/>`; }).join('')).join('')}<line class="dye" x1="22" x2="198" y1="${dye}" y2="${dye}"/><text class="tl" x="10" y="12">−</text><text class="tl" x="10" y="258">+</text>`; };
    $('#gGo').onclick = () => { cancelAnimationFrame(raf); p = 0; stained = false; const t0 = performance.now(); const st = now => { p = Math.min(1, (now - t0) / 3500); draw(); if (p < 1) raf = requestAnimationFrame(st); else $('#gSt').disabled = false; }; raf = requestAnimationFrame(st); };
    $('#gSt').onclick = () => { stained = true; draw(); $('#gM').disabled = false; };
    $('#gM').onclick = () => { $('#gM').disabled = true; lanes.forEach((l, i) => l[1].forEach(m => { const r = rf(m); nb.log([`${i + 1}: ${l[0]}`, l[0] === 'Unknown' ? '?' : m, (r * 8).toFixed(2), r.toFixed(3)]); })); };
    draw(); return () => cancelAnimationFrame(raf);
  },
  chart(rows) { const lad = rows.filter(r => r[0].includes('Ladder')).map(r => [+r[3], Math.log10(+r[1])]), u = rows.find(r => r[0].includes('Unknown')); if (lad.length < 3) return ''; const f = linfit(lad);
    return plot({ x: [0, 1], y: [.8, 2.6], xl: 'Rf', yl: 'log(MW, kDa)', series: [{ pts: lad, cls: 'c1' }, { pts: [[0, f.b], [1, f.m + f.b]], type: 'line', cls: 'fitl' }, ...(u ? [{ pts: [[+u[3], f.m * +u[3] + f.b]], cls: 'c2', r: 6 }] : [])] }) + fitNote(f, 'Rf', 'log MW') + (u ? `<p class="fit">Unknown: R<sub>f</sub> = ${u[3]} → log MW = ${(f.m * +u[3] + f.b).toFixed(3)} → <b>MW ≈ ${sig(10 ** (f.m * +u[3] + f.b), 3)} kDa</b></p>` : ''); },
  post: [
    () => { const m = -R.real(1.1, 1.3, 2), b = R.real(2.3, 2.5, 2), r = R.real(.3, .7, 2), mw = 10 ** (m * r + b); return numQ(`The ladder gives log(MW) = ${m}·R<sub>f</sub> + ${b}. An unknown band has R<sub>f</sub> = ${r}. Estimate its MW (kDa).`, mw, 'kDa', [`log MW = ${m}(${r}) + ${b} = ${(m * r + b).toFixed(3)}`, `MW = 10^${(m * r + b).toFixed(3)} = <b>${sig(mw, 3)} kDa</b>`], { tol: .03 }); },
    () => mcFrom('A protein runs as one 150 kDa band without reducing agent, and as 50 kDa and 25 kDa bands with β-mercaptoethanol. What does that tell you?', 'Its subunits are held together by disulfide bonds', ['It was degraded by proteases', 'SDS failed to denature it', 'It is a single 150 kDa chain'], ['β-ME reduces S–S bonds; SDS alone breaks noncovalent interactions.', 'Separate bands only after reduction → <b>disulfide-linked subunits</b> (e.g., 2×50 + 2×25 for an antibody).']),
    () => mcFrom('Why does SDS-PAGE separate proteins by size and not by charge?', 'SDS gives every protein a similar charge-to-mass ratio', ['SDS removes all charge', 'The gel only lets neutral proteins through', 'Proteins have no charge at pH 8.8'], ['~1 SDS binds per 2 amino acids, swamping the native charge.', 'Same charge/mass → mobility depends on <b>size</b> (gel sieving).']),
  ],
});

/* ============================== pages ============================== */
const labById = id => LABS.find(l => l.id === id);
const LS = {}; // notebooks this session
function viewLabs() {
  S.labs ??= {};
  main.innerHTML = `<header class="chhead"><h1>🧪 Virtual labs</h1><p class="lede">Run the experiments from your UTD lab courses: real procedures, live instruments, a notebook that records your data, and post-lab questions. Use them to prep before lab, or to redo one you missed.</p></header>
    ${LCOURSES.map(co => { const ls = LABS.filter(l => l.course === co.id); return `<section class="labgrp"><h2><span class="pill" style="background:${co.color}">${co.code}</span> ${co.name}</h2><div class="labgrid">${ls.map(l => `<a class="labcard" href="#/lab/${l.id}" style="--lc:${co.color}"><span class="li">${l.icon}</span><b>${l.title}</b><small>UTD: ${l.utd}</small>${S.labs[l.id] ? `<i class="done">✓ ${S.labs[l.id]}/3</i>` : ''}</a>`).join('')}</div></section>`; }).join('')}
    <p class="tip center">Experiment lists come from past UT Dallas CHEM 1111, 1112, 2123 and 2125 lab syllabi; your section may run them in a different order. Biochem I has a problem-solving workshop rather than a wet lab, so those are the core biochem bench techniques.</p>`;
}
function viewLab(id, tab = 'pre') {
  const l = labById(id); if (!l) return viewLabs(); const co = LCOURSES.find(c => c.id === l.course); S.labs ??= {};
  const nb = LS[id] ??= { rows: [], notes: [] };
  main.innerHTML = `<header class="chhead labhead" style="--lc:${co.color}"><a class="back" href="#/labs">← All labs</a><div class="chtitle"><span class="bigicon">${l.icon}</span><div><div class="kick">${co.code} · ${co.name}</div><h1>${l.title}</h1><p class="utdline">UTD experiment: ${l.utd}</p></div></div>
    <nav class="tabs" role="tablist">${[['pre', '📋 Pre-lab'], ['bench', '🥽 Bench'], ['post', '✍️ Post-lab']].map(([k, t]) => `<a role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" href="#/lab/${id}/${k}">${t}</a>`).join('')}</nav></header><div id="body"></div>`;
  const body = $('#body');
  if (tab === 'pre') { body.innerHTML = `<article class="page"><div class="pg">Objective</div><p class="lede">${l.goal}</p><div class="pg">Background</div>${l.intro}<div class="pg">Procedure</div><ol class="proc">${l.steps.map(s => `<li>${s}</li>`).join('')}</ol><div class="safety">🥽 Goggles on, closed-toe shoes, no food. ${l.course >= '2123' && l.course !== 'bio' ? 'Organic solvents are flammable: no open flames near them, and work in the hood.' : 'Know where the eyewash and safety shower are.'}</div><div class="pnav"><span></span><a class="btn pri" href="#/lab/${id}/bench">Go to the bench →</a></div></article>`; return; }
  if (tab === 'post') return labPost(l, body);
  body.innerHTML = `<article class="page bench"><div id="rig"></div><div id="nbnote" class="nbnote" aria-live="polite"></div></article><article class="page notebook"><div class="pg">📒 Lab notebook</div><div id="nbt"></div><div id="nbc"></div><div class="pnav"><button class="btn" id="nbClr">🗑 Clear data</button><button class="btn" id="nbCsv">⬇ Copy as CSV</button><a class="btn pri" href="#/lab/${id}/post">Post-lab questions →</a></div></article>`;
  const render = () => { $('#nbt').innerHTML = nb.rows.length ? `<table class="nbt"><tr>${l.cols.map(c => `<th>${c}</th>`).join('')}</tr>${nb.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>` : '<p class="tip">Your data will appear here as you record it.</p>'; let ch = ''; try { ch = l.chart ? l.chart.call(l, nb.rows) || '' : ''; } catch (e) { ch = ''; } $('#nbc').innerHTML = ch; };
  const api = { rows: nb.rows, log: r => { nb.rows.push(r.map(String)); render(); const t = $('#nbt tr:last-child'); t && t.classList.add('new'); }, note: t => { $('#nbnote').textContent = t; } };
  const stop = l.sim.call(l, $('#rig'), api); const prev = cleanup; cleanup = () => { typeof stop === 'function' && stop(); prev && prev(); };
  $('#nbClr').onclick = () => { nb.rows.length = 0; render(); };
  $('#nbCsv').onclick = () => { const csv = [l.cols, ...nb.rows].map(r => r.map(c => `"${String(c).replace(/<[^>]+>/g, '')}"`).join(',')).join('\n'); navigator.clipboard && navigator.clipboard.writeText(csv); pop('Copied!'); };
  render();
}
function labPost(l, body) {
  const qs = R.shuffle(l.post).slice(0, 3); let n = 0, right = 0;
  const one = async () => {
    if (n >= qs.length) { S.labs[l.id] = Math.max(S.labs[l.id] || 0, right); S.xp += right * 5; save(); renderTop(); body.innerHTML = `<article class="page result"><div class="big">${right === qs.length ? '🏆' : '🧪'}</div><h2>${right} / ${qs.length} post-lab questions</h2><div class="cta"><button class="btn pri" id="pa">New questions</button><a class="btn" href="#/lab/${l.id}/bench">Back to the bench</a><a class="btn" href="#/labs">All labs</a></div></article>`; if (right === qs.length) confetti(); $('#pa').onclick = () => labPost(l, body); return; }
    const q = qs[n]();
    body.innerHTML = `<article class="page do"><div class="prog"><div class="pg">Post-lab ${n + 1} of ${qs.length}</div><div class="pbar"><i style="width:${n / qs.length * 100}%"></i></div><div class="score">✅ ${right}</div></div>${qHTML(q)}<div class="pnav" id="after" hidden><span></span><button class="btn pri" id="nextq">Next →</button></div></article>`;
    const r = await grade(q, body); if (r.ok) { right++; pop('+5 XP'); window.fxFizz && fxFizz(body.querySelector('.q')); } showResult(q, r, body); $('#after').hidden = false; n++; $('#nextq').onclick = one;
  };
  one();
}
if (typeof module !== 'undefined') module.exports = { LABS, phSolve, linfit };
