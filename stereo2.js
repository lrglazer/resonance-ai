/* ChemFluent — interactive Newman projections, chair flips and Fischer projections. */
'use strict';
const CHF = id => CH.find(c => c.id === id);

/* ---------- Newman projection (butane C2–C3) ---------- */
const NEWMAN_E = [[0, 19], [60, 3.8], [120, 16], [180, 0], [240, 16], [300, 3.8], [360, 19]];
function butaneE(phi) { phi = ((phi % 360) + 360) % 360; for (let i = 0; i < 6; i++) { const [a, ea] = NEWMAN_E[i], [b, eb] = NEWMAN_E[i + 1]; if (phi >= a && phi <= b) { const t = (phi - a) / 60, s = (1 - Math.cos(t * Math.PI)) / 2; return ea + (eb - ea) * s; } } return 0; }
function confName(phi) { phi = Math.round((((phi % 360) + 360) % 360)); const near = x => Math.abs(phi - x) <= 8 || Math.abs(phi - x - 360) <= 8;
  if (near(0)) return 'Totally eclipsed (CH₃/CH₃ eclipsed)'; if (near(180)) return 'Anti (staggered)'; if (near(60) || near(300)) return 'Gauche (staggered)'; if (near(120) || near(240)) return 'Eclipsed (CH₃/H)'; return 'In between'; }
function newmanSVG(phi, opts = {}) {
  const R = 52, L = 92, out = [], front = [[90, 'CH₃', 'me'], [210, 'H'], [330, 'H']], back = [[90 + phi, 'CH₃', 'me'], [210 + phi, 'H'], [330 + phi, 'H']];
  const pt = (ang, r) => [r * Math.cos(ang * Math.PI / 180), -r * Math.sin(ang * Math.PI / 180)];
  back.forEach(([a, lab, cls]) => { const [x1, y1] = pt(a, R), [x2, y2] = pt(a, L); out.push(`<line class="nb" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`); const [tx, ty] = pt(a, L + 16); out.push(`<text class="lab ${cls || ''}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${lab}</text>`); });
  out.push(`<circle class="nc" cx="0" cy="0" r="${R}"/>`);
  front.forEach(([a, lab, cls]) => { const [x2, y2] = pt(a, L); out.push(`<line class="nf" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`); const [tx, ty] = pt(a, L + 16); out.push(`<text class="lab ${cls || ''}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${lab}</text>`); });
  return `<svg class="mol newman" viewBox="-140 -135 280 270" role="img" aria-label="Newman projection, dihedral ${Math.round(phi)} degrees">${out.join('')}<circle cx="0" cy="0" r="4" class="ctr"/></svg>`;
}
function newmanWidget(box) {
  let phi = 60;
  box.innerHTML = `<div class="nw"><div class="nwl"><div id="nwSvg"></div><input type="range" id="nwR" min="0" max="360" step="1" value="60" aria-label="Rotate the back carbon"><p class="tip center">Drag the slider (or the back carbon) to rotate the C2–C3 bond of butane.</p></div>
    <div class="nwr"><div class="nwname" id="nwN"></div><svg class="spec energy" viewBox="0 0 320 190" id="nwE"></svg></div></div>`;
  const plot = () => { const pts = []; for (let a = 0; a <= 360; a += 4) pts.push(`${(20 + a / 360 * 280).toFixed(1)},${(160 - butaneE(a) / 20 * 130).toFixed(1)}`);
    const lbl = [[0, 'tot. ecl.'], [60, 'gauche'], [120, 'ecl.'], [180, 'anti'], [240, 'ecl.'], [300, 'gauche']].map(([a, t]) => `<text class="ax" x="${20 + a / 360 * 280}" y="178">${t}</text>`).join('');
    return `<rect class="sbg" x="20" y="20" width="280" height="140"/><polyline class="trace solid" points="${pts.join(' ')}"/>${lbl}<text class="ax" x="8" y="90" transform="rotate(-90 8 90)">energy</text>`; };
  const draw = () => { box.querySelector('#nwSvg').innerHTML = newmanSVG(phi); const E = butaneE(phi);
    box.querySelector('#nwN').innerHTML = `<b>${confName(phi)}</b><span>dihedral ${Math.round(phi)}° · ${E.toFixed(1)} kJ/mol above anti</span>`;
    box.querySelector('#nwE').innerHTML = plot() + `<circle class="dotm" cx="${20 + phi / 360 * 280}" cy="${160 - E / 20 * 130}" r="7"/>`; };
  const r = box.querySelector('#nwR'); r.oninput = () => { phi = +r.value; draw(); };
  let drag = null; const svgBox = box.querySelector('#nwSvg');
  svgBox.onpointerdown = e => { drag = e.clientX; svgBox.setPointerCapture(e.pointerId); };
  svgBox.onpointermove = e => { if (drag == null) return; phi = (phi + (e.clientX - drag) * .9 + 360) % 360; drag = e.clientX; r.value = Math.round(phi); draw(); };
  svgBox.onpointerup = () => { drag = null; };
  draw(); return () => { };
}

/* ---------- chair flip ---------- */
function chairWidget(box) {
  let t = 0, target = 0, raf = 0;
  box.innerHTML = `<div class="cw"><svg class="mol chair" viewBox="-170 -120 340 240" id="cwS"></svg><div class="cwi"><div class="nwname" id="cwN"></div><button class="btn pri" id="cwB">🔄 Flip the ring</button><p class="tip">Watch the methyl swap between axial and equatorial. Red dashes show the 1,3-diaxial clashes.</p></div></div>`;
  const svg = box.querySelector('#cwS'), r = 90, L = 46;
  const proj = ([x, y, z]) => [x + y * .15, -(z * 1.0 + y * .38)];
  function frame() {
    const s = Math.cos(t * Math.PI); // +1 chair A, -1 chair B
    const at = [...Array(6)].map((_, k) => { const th = k * Math.PI / 3; return [r * Math.cos(th), r * Math.sin(th), (k % 2 ? -1 : 1) * 26 * s]; });
    const out = [];
    for (let k = 0; k < 6; k++) { const a = proj(at[k]), b = proj(at[(k + 1) % 6]); out.push(`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`); }
    const subs = [];
    for (let k = 0; k < 6; k++) {
      const [x, y, z] = at[k], sg = k % 2 ? -1 : 1, th = k * Math.PI / 3;
      const ax = [x, y, z + sg * L * s], eq = [x + Math.cos(th) * L * .95, y + Math.sin(th) * L * .95, z - sg * L * .3 * s];
      // C1 (k=0) carries the methyl on the "up" face: axial-up in chair A, equatorial-up in chair B
      const up = k === 0;
      const meVec = up ? [ax, eq].map((v, i) => v) : null;
      const isAxUp = sg * s > 0; // axial bond points up?
      const upPos = isAxUp ? ax : eq, downPos = isAxUp ? eq : ax;
      [[upPos, up], [downPos, false]].forEach(([p, me]) => { const a = proj(at[k]), b = proj(p); out.push(`<line class="${me ? 'me' : 'hb'}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`); subs.push([b, me, k, p === ax]); });
      void meVec;
    }
    const meAxial = Math.cos(t * Math.PI) > 0;
    subs.forEach(([b, me, k, isAx]) => { if (me) out.push(`<circle class="meb" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="13"/><text class="lab" x="${b[0].toFixed(1)}" y="${b[1].toFixed(1)}" style="font-size:11px">CH₃</text>`); else out.push(`<circle class="hd ${meAxial && isAx && (k === 2 || k === 4) && Math.abs(Math.cos(t * Math.PI)) > .9 ? 'clash' : ''}" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="5"/>`); });
    if (meAxial && Math.abs(Math.cos(t * Math.PI)) > .9) { const me = subs.find(s => s[1])[0]; subs.filter(s => !s[1] && s[3] && (s[2] === 2 || s[2] === 4)).forEach(([b]) => out.push(`<line class="clashl" x1="${me[0].toFixed(1)}" y1="${me[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`)); }
    svg.innerHTML = out.join('');
    box.querySelector('#cwN').innerHTML = meAxial ? '<b>CH₃ axial</b><span>2 × 1,3-diaxial clashes ≈ +7.6 kJ/mol (minor, ~5%)</span>' : '<b>CH₃ equatorial</b><span>no 1,3-diaxial clashes: more stable (~95%)</span>';
  }
  function anim() { const d = target - t; if (Math.abs(d) < .01) { t = target; frame(); return; } t += d * .08; frame(); raf = requestAnimationFrame(anim); }
  box.querySelector('#cwB').onclick = () => { target = target ? 0 : 1; cancelAnimationFrame(raf); anim(); };
  frame(); return () => cancelAnimationFrame(raf);
}

/* ---------- Fischer projections ---------- */
/* horizontal groups point toward you, vertical groups point away */
function fischerStereo() {
  const groups = R.shuffle(CIP.slice(1)).slice(0, 3).concat([CIP[0]]);
  const g = R.shuffle(groups), slots = [['top', 0, 1, -1], ['bottom', 0, -1, -1], ['left', -1, 0, 1], ['right', 1, 0, 1]].map(([pos, x, y, z], i) => ({ pos, v: [x, y, z * .9], g: g[i] }));
  const sorted = slots.slice().sort((a, b) => b.g.rank - a.g.rank), [v1, v2, v3, v4] = sorted.map(s => s.v);
  const d = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], a = d(v1, v4), b = d(v2, v4), c = d(v3, v4);
  const cr = [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]], T = a[0] * cr[0] + a[1] * cr[1] + a[2] * cr[2];
  return { slots, sorted, config: T < 0 ? 'R' : 'S', low: sorted[3] };
}
function fischerSVG(f, showRank) {
  const P = { top: [0, -62], bottom: [0, 62], left: [-70, 0], right: [70, 0] }, out = ['<line x1="0" y1="-48" x2="0" y2="48"/><line x1="-56" y1="0" x2="56" y2="0"/>'];
  f.slots.forEach(s => { const [x, y] = P[s.pos], anchor = s.pos === 'left' ? 'end' : s.pos === 'right' ? 'start' : 'middle', rk = showRank ? `<tspan class="rk" dx="3">${f.sorted.indexOf(s) + 1}</tspan>` : '';
    out.push(`<text class="lab g" x="${x + (s.pos === 'left' ? 10 : s.pos === 'right' ? -10 : 0)}" y="${y}" text-anchor="${anchor}">${s.g.t}${rk}</text>`); });
  return `<svg class="mol fischer" viewBox="-150 -90 300 180" role="img" aria-label="Fischer projection">${out.join('')}</svg>`;
}
function sugarFischer() {
  const n = R.int(1, 4), ohs = [...Array(n)].map(() => R.pick(['L', 'R'])), names = { 1: 'glyceraldehyde', 2: 'a tetrose', 3: 'a pentose', 4: 'a hexose' };
  const rows = ['CHO', ...ohs.map(o => o), 'CH₂OH'], out = [], top = -((rows.length - 1) * 34) / 2;
  rows.forEach((r, i) => { const y = top + i * 34;
    if (i === 0 || i === rows.length - 1) out.push(`<text class="lab g" x="0" y="${y}">${r}</text>`);
    else out.push(`<line x1="-40" y1="${y}" x2="40" y2="${y}"/><text class="lab g" x="${r === 'L' ? -48 : 48}" y="${y}" text-anchor="${r === 'L' ? 'end' : 'start'}">${r === 'L' ? 'HO' : 'OH'}</text><text class="lab g" x="${r === 'L' ? 48 : -48}" y="${y}" text-anchor="${r === 'L' ? 'start' : 'end'}">H</text>`);
    if (i < rows.length - 1) out.push(`<line x1="0" y1="${y + 10}" x2="0" y2="${y + 24}"/>`); });
  const h = rows.length * 34 + 40;
  return { svg: `<svg class="mol fischer" viewBox="-150 ${-h / 2} 300 ${h}" role="img" aria-label="Fischer projection of a sugar">${out.join('')}</svg>`, dl: ohs[n - 1] === 'R' ? 'D' : 'L', name: names[n] };
}

/* ---------- wire into chapters ---------- */
(() => {
  const conf = CHF('conform'); if (conf) {
    conf.learn.unshift({ h: 'Spin a Newman projection', body: `<p>Looking down the C2–C3 bond of butane, the front carbon is the dot and the back carbon is the circle. Rotate the back carbon and watch the energy change: <b>anti</b> is lowest, <b>gauche</b> costs about 3.8 kJ/mol, and <b>totally eclipsed</b> is highest (~19 kJ/mol).</p>`, widget: newmanWidget });
    conf.learn.push({ h: 'Flip a chair', body: `<p>A ring flip turns every axial bond equatorial and every equatorial bond axial, but a group that points <b>up</b> still points up. Flip methylcyclohexane and see why the equatorial chair wins.</p>`, widget: chairWidget });
    const old = conf.gen;
    conf.gen = () => { if (Math.random() < .5) return old();
      const phi = R.pick([0, 60, 120, 180, 240, 300]), nm = confName(phi).replace(/ \(.*\)/, '');
      const ans = { 0: 'Totally eclipsed', 60: 'Gauche', 300: 'Gauche', 120: 'Eclipsed', 240: 'Eclipsed', 180: 'Anti' }[phi];
      if (Math.random() < .6) return mcFrom('This Newman projection looks down C2–C3 of butane. What is this conformation?', ans, ['Anti', 'Gauche', 'Eclipsed', 'Totally eclipsed'], [`The two CH₃ groups are ${phi > 180 ? 360 - phi : phi}° apart.`, `${ans}: about ${butaneE(phi).toFixed(1)} kJ/mol above anti.`], { visual: newmanSVG(phi) });
      const p2 = R.pick([0, 60, 120, 180, 240, 300].filter(x => x !== phi && butaneE(x) !== butaneE(phi))), hi = butaneE(phi) > butaneE(p2) ? 'Left' : 'Right';
      return mcFrom(`Which Newman projection of butane is <b>higher in energy</b>?<div class="pair">${newmanSVG(phi)}${newmanSVG(p2)}</div>`, hi, ['Left', 'Right'], [`Left: ${confName(phi)} (${butaneE(phi).toFixed(1)} kJ/mol). Right: ${confName(p2)} (${butaneE(p2).toFixed(1)} kJ/mol).`, `Higher: <b>${hi}</b>. Eclipsed &gt; staggered, and CH₃/CH₃ interactions cost the most.`]);
    };
  }
  const st = CHF('stereo'); if (st) {
    st.learn.push({ h: 'Fischer projections', body: `<p>A Fischer projection is a flattened stereocenter: <b>horizontal bonds point toward you</b> (wedges) and <b>vertical bonds point away</b> (dashes).</p><p>To assign R/S: rank the groups, trace 1 → 2 → 3. If the lowest priority is on a <b>vertical</b> bond, that's your answer. If it's on a <b>horizontal</b> bond, <b>reverse</b> it.</p><p>Allowed moves: rotate the whole drawing 180° (same molecule). Rotating 90° or swapping two groups gives the enantiomer.</p>` });
    const old = st.gen;
    st.gen = () => { if (Math.random() < .6) return old();
      const f = fischerStereo(), vert = f.low.pos === 'top' || f.low.pos === 'bottom';
      return mc('Is this <b>Fischer projection</b> R or S?', ['R', 'S'], f.config === 'R' ? 0 : 1, [`Priorities: ${f.sorted.map((s, i) => `<b>${i + 1}</b> ${s.g.h}`).join(' · ')}.`, `Lowest priority (${f.low.g.h}) is on a <b>${vert ? 'vertical' : 'horizontal'}</b> bond, pointing ${vert ? 'away from you' : 'toward you'}.`, vert ? `Trace 1 → 2 → 3 directly: <b>${f.config}</b>.` : `Trace 1 → 2 → 3, then reverse it: <b>${f.config}</b>.`], { visual: fischerSVG(f), visualAfter: fischerSVG(f, true) }); };
  }
  const cb = CHF('carbs'); if (cb) {
    cb.learn.push({ h: 'D or L from a Fischer projection', body: `<p>Draw the sugar with the C=O at the top. Look at the <b>stereocenter farthest from the C=O</b> (the one just above the bottom CH₂OH). OH on the <b>right</b> = <b>D</b>; OH on the <b>left</b> = <b>L</b>. Almost all natural sugars are D.</p>` });
    const old = cb.gen;
    cb.gen = () => { if (Math.random() < .55) return old(); const s = sugarFischer();
      return mcFrom(`Is this ${s.name} <b>D</b> or <b>L</b>?`, s.dl + '-sugar', ['D-sugar', 'L-sugar'], ['Find the stereocenter farthest from the CHO (just above CH₂OH).', `Its OH is on the ${s.dl === 'D' ? 'right' : 'left'}, so it is <b>${s.dl}</b>.`], { visual: s.svg }); };
  }
})();
if (typeof module !== 'undefined') module.exports = { butaneE, fischerStereo, sugarFischer };
