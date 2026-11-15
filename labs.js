/* ChemFluent — Virtual Labs: engine, shared instruments, and the General Chemistry I & II labs.
   Experiments follow typical general and organic chemistry lab schedules. */
'use strict';
const LABS = [];
const LCOURSES = [
  { id: '1111', code: 'GEN CHEM 1 LAB', utd: 'CHEM 1111', name: 'Gen Chem I Lab', color: '#FF8A6B' },
  { id: '1112', code: 'GEN CHEM 2 LAB', utd: 'CHEM 1112', name: 'Gen Chem II Lab', color: '#7FA2FF' },
  { id: '2123', code: 'ORGO 1 LAB', utd: 'CHEM 2123', name: 'Organic Lab I', color: '#FFC93C' },
  { id: '2125', code: 'ORGO 2 LAB', utd: 'CHEM 2125', name: 'Organic Lab II', color: '#3ED1AC' },
  { id: 'bio', code: 'BIOCHEM', name: 'Biochem techniques', color: '#C29BFF' },
];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const jit = s => (Math.random() * 2 - 1) * s;
const fx = (x, d = 2) => Number(x).toFixed(d);
const RG = 8.314;

/* ---------- math + plotting helpers ---------- */
function linfit(p) {
  const n = p.length; if (n < 2) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  p.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; });
  const d = n * sxx - sx * sx; if (!d) return null; const m = (n * sxy - sx * sy) / d, b = (sy - m * sx) / n;
  const den = Math.sqrt(d * (n * syy - sy * sy)); return { m, b, r2: den ? ((n * sxy - sx * sy) / den) ** 2 : 1 };
}
const tk = v => { const a = Math.abs(v); if (a < 1e-12) return '0'; if (a >= 10000 || a < 0.001) return v.toExponential(1); if (a >= 100) return v.toFixed(0); if (a >= 10) return (+v.toFixed(1)) + ''; return (+v.toPrecision(2)) + ''; };
function plot(o) {
  const W = o.w || 360, H = o.h || 230, L = 50, Rm = 14, T = 12, B = 38, [x0, x1] = o.x, [y0, y1] = o.y;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - Rm), Y = v => H - B - (clamp(v, Math.min(y0, y1), Math.max(y0, y1)) - y0) / (y1 - y0) * (H - T - B);
  let s = `<rect class="pbg" x="${L}" y="${T}" width="${W - L - Rm}" height="${H - T - B}"/>`;
  for (let i = 0; i <= 4; i++) { const xv = x0 + (x1 - x0) * i / 4, yv = y0 + (y1 - y0) * i / 4;
    s += `<line class="pgr" x1="${X(xv)}" x2="${X(xv)}" y1="${T}" y2="${H - B}"/><line class="pgr" y1="${Y(yv)}" y2="${Y(yv)}" x1="${L}" x2="${W - Rm}"/><text class="ptk" x="${X(xv)}" y="${H - B + 15}">${tk(xv)}</text><text class="ptk" x="${L - 6}" y="${Y(yv) + 4}" text-anchor="end">${tk(yv)}</text>`; }
  s += `<text class="plb" x="${(L + W - Rm) / 2}" y="${H - 5}">${o.xl || ''}</text><text class="plb" transform="translate(13 ${(T + H - B) / 2}) rotate(-90)">${o.yl || ''}</text>`;
  (o.series || []).forEach(se => { const pts = se.pts.filter(p => isFinite(p[0]) && isFinite(p[1]));
    if (se.type === 'line') { if (pts.length > 1) s += `<polyline class="pln ${se.cls || ''}" points="${pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')}"/>`; }
    else pts.forEach(p => s += `<circle class="pdt ${se.cls || ''}" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${se.r || 4.5}"/>`); });
  (o.notes || []).forEach(n => s += `<text class="pnt" x="${X(n[0])}" y="${Y(n[1])}">${n[2]}</text>`);
  return `<svg class="lplot" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.yl || ''} versus ${o.xl || ''}">${s}</svg>`;
}
const fitNote = (f, xn = 'x', yn = 'y') => f ? `<p class="fit">Best-fit line: <b>${yn} = ${sig(f.m, 4)}·${xn} ${f.b < 0 ? '−' : '+'} ${sig(Math.abs(f.b), 3)}</b> &nbsp; R² = ${f.r2.toFixed(4)}</p>` : '';
/* [H+] from a charge balance: H + B = Kw/H + C·Σ i·α_i (C total acid, B net strong base, both mol/L) */
function phSolve(C, pKas, B) {
  const Ka = pKas.map(p => 10 ** -p);
  const f = lh => { const H = 10 ** lh; let t = 1, S = 1, iS = 0; Ka.forEach((k, i) => { t *= k / H; S += t; iS += (i + 1) * t; }); return H + B - 1e-14 / H - C * iS / S; };
  let a = -15, b = 1.5; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; } return -(a + b) / 2;
}

/* ---------- glassware ---------- */
const flaskSVG = (fill, lvl = .55, extra = '') => `<svg class="glass-v flask-v" viewBox="0 0 120 140" aria-hidden="true"><defs><clipPath id="fk${lvl * 100 | 0}"><path d="M48 8h24v44l38 74a8 8 0 0 1-7 12H17a8 8 0 0 1-7-12l38-74z"/></clipPath></defs>
  <rect class="liq" x="0" y="${138 - lvl * 90}" width="120" height="140" fill="${fill}" clip-path="url(#fk${lvl * 100 | 0})"/>${extra}<path class="gl" d="M48 8h24v44l38 74a8 8 0 0 1-7 12H17a8 8 0 0 1-7-12l38-74z"/><path class="gl" d="M44 8h32"/></svg>`;
const beakerSVG = (fill, lvl = .6, extra = '') => `<svg class="glass-v beaker-v" viewBox="0 0 110 130" aria-hidden="true"><rect class="liq" x="14" y="${124 - lvl * 100}" width="82" height="${lvl * 100}" fill="${fill}"/>${extra}<path class="gl" d="M8 10h6v110a6 6 0 0 0 6 6h70a6 6 0 0 0 6-6V10h6"/>${[30, 55, 80].map(y => `<line class="tick" x1="80" x2="94" y1="${y + 20}" y2="${y + 20}"/>`).join('')}</svg>`;
const tubeSVG = (fill, lbl = '', lvl = .65) => `<svg class="glass-v tube-v" viewBox="0 0 50 150" aria-hidden="true"><path d="M10 ${140 - lvl * 120}V130a15 15 0 0 0 30 0V${140 - lvl * 120}z" class="liq" fill="${fill}"/><path class="gl" d="M10 6v124a15 15 0 0 0 30 0V6"/><text class="tl" x="25" y="149">${lbl}</text></svg>`;
function buretteSVG(v, cap = 50, drip = false) {
  const top = 14, bot = 214, y = top + (v / cap) * (bot - top); let ticks = '';
  for (let m = 0; m <= cap; m += 5) { const yy = top + m / cap * (bot - top); ticks += `<line class="tick" x1="22" x2="${m % 10 ? 29 : 34}" y1="${yy}" y2="${yy}"/>${m % 10 ? '' : `<text class="bt" x="40" y="${yy + 4}">${m}</text>`}`; }
  return `<svg class="burette" viewBox="0 0 70 270" aria-hidden="true"><rect class="liq tit" x="16" y="${y}" width="14" height="${bot - y}"/><rect class="gl" x="16" y="${top}" width="14" height="${bot - top}" rx="2"/>${ticks}<path class="gl" d="M18 214l4 22h2l4-22"/><rect class="cock" x="9" y="222" width="28" height="7" rx="3"/>${drip ? '<circle class="drop" cx="23" cy="246" r="3.5"/>' : ''}</svg>`;
}

/* ---------- instrument: titration (burette + flask, optional pH meter) ---------- */
/* cfg: {M, V0, mol, pKas, cap, ind:'phth'|null, meter, base:'#hex', what} ; returns cleanup */
function titrationRig(box, nb, cfg) {
  let Vb = 0; const cap = cfg.cap || 50, pts = [];
  box.innerHTML = `<div class="rig"><div class="rig-l"><div class="stand" id="tStand"></div></div>
    <div class="rig-r"><div class="readout"><span>Burette reading</span><b id="tV">0.00 mL</b></div>${cfg.meter ? '<div class="readout ph"><span>pH meter</span><b id="tP">—</b></div>' : ''}
    <div class="btnrow"><button class="btn" data-a="1">+1.00 mL</button><button class="btn" data-a="0.1">+0.10 mL</button><button class="btn" data-a="0.05">+1 drop</button></div>
    <div class="btnrow"><button class="btn pri" id="tRec">📒 Record ${cfg.meter ? 'point' : 'endpoint'}</button><button class="btn" id="tRes">↺ New trial</button></div>
    <p class="tip">${cfg.tip || 'Go fast at first, then add single drops as the color starts to linger. Stop at the first faint pink that lasts 30 seconds.'}</p><div id="tPlot"></div></div></div>`;
  const pH = () => phSolve(cfg.mol / ((cfg.V0 + Vb) / 1000), cfg.pKas, cfg.M * Vb / 1000 / ((cfg.V0 + Vb) / 1000));
  const color = () => { if (cfg.ind !== 'phth') return cfg.base || 'rgba(170,210,255,.55)'; const a = clamp((pH() - 8.1) / 1.6, 0, 1); return a < .02 ? 'rgba(200,225,255,.45)' : `rgba(255,${120 - a * 60},${200 - a * 40},${.25 + a * .6})`; };
  const draw = (drip) => {
    const p = pH();
    $('#tStand').innerHTML = `<div class="bwrap">${buretteSVG(Vb, cap, drip)}</div><div class="fwrap">${flaskSVG(color(), .32 + Math.min(Vb, 60) / 250)}<span class="tag">${cfg.what}</span></div>`;
    $('#tV').textContent = fx(Vb) + ' mL'; if (cfg.meter) $('#tP').textContent = fx(p);
    if (cfg.meter) $('#tPlot').innerHTML = plot({ x: [0, cfg.plotV || cap], y: [0, 14], xl: 'NaOH added (mL)', yl: 'pH', series: [{ pts: pts, cls: 'c1', r: 3.5 }, { pts: [[Vb, p]], cls: 'now', r: 6 }] });
  };
  box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (Vb + +b.dataset.a > cap + 1e-9) { nb.note('The burette is out of titrant. Start a new trial.'); return; } Vb = +(Vb + +b.dataset.a).toFixed(2); draw(true); setTimeout(() => draw(false), 260); });
  $('#tRec').onclick = () => { const p = pH(); if (cfg.meter) { pts.push([Vb, p]); nb.log([fx(Vb), fx(p)]); } else nb.log([nb.rows.length + 1, '0.00', fx(Vb), fx(Vb), p > 8.1 && p < 10 ? 'faint pink ✓' : p >= 10 ? 'dark pink (overshot)' : 'colorless (not yet)']); draw(); };
  $('#tRes').onclick = () => { Vb = 0; if (cfg.meter) pts.length = 0; draw(); };
  draw(); return () => { };
}

/* ---------- instrument: spectrophotometer ---------- */
/* cfg: {lmax, width, eps, color(c), stds:[c...], unk, unit, scan, solute} */
function spectroRig(box, nb, cfg) {
  let lam = cfg.scan ? 450 : cfg.lmax, cur = { name: 'Blank', c: 0 };
  const samples = [{ name: 'Blank', c: 0 }, ...cfg.stds.map((c, i) => ({ name: `Std ${i + 1}`, c })), { name: 'Unknown', c: cfg.unk }];
  box.innerHTML = `<div class="rig"><div class="rig-l"><div id="spV"></div></div><div class="rig-r">
    <div class="chips-row" id="spS">${samples.map((s, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${s.name}${s.name.startsWith('Std') ? ` <small>${s.c} ${cfg.unit}</small>` : ''}</button>`).join('')}</div>
    ${cfg.scan ? `<label class="sl">Wavelength <b id="spL"></b><input type="range" id="spR" min="400" max="700" step="5" value="${lam}"></label>` : ''}
    <div class="readout"><span>Absorbance</span><b id="spA">0.000</b></div>
    <div class="btnrow"><button class="btn pri" id="spM">📒 Record reading</button></div><p class="tip">${cfg.tip || ''}</p></div></div>`;
  const A = () => cur.c === 0 ? 0 : Math.max(0, cfg.eps * cur.c * Math.exp(-(((lam - cfg.lmax) / cfg.width) ** 2)) + jit(.002));
  const draw = () => { const a = A();
    $('#spV').innerHTML = `<svg class="spectro" viewBox="0 0 300 150" aria-hidden="true"><rect class="box" x="4" y="30" width="292" height="90" rx="12"/><circle class="lamp" cx="40" cy="75" r="14"/>
      <path class="beam" d="M54 75H122" style="stroke:${wl2rgb(lam)}"/><rect class="cuv" x="128" y="44" width="40" height="62" rx="4" style="fill:${cur.c ? cfg.color(cur.c) : 'rgba(220,235,255,.5)'}"/>
      <path class="beam" d="M172 75H238" style="stroke:${wl2rgb(lam)};opacity:${clamp(10 ** -a, .08, 1)}"/><rect class="det" x="240" y="58" width="34" height="34" rx="6"/><text class="tl" x="148" y="140">${cur.name}</text><text class="tl" x="40" y="22">${lam} nm</text></svg>`;
    $('#spA').textContent = a.toFixed(3); if (cfg.scan) $('#spL').textContent = lam + ' nm'; return a; };
  box.querySelectorAll('#spS .chip').forEach(b => b.onclick = () => { box.querySelectorAll('#spS .chip').forEach(x => x.classList.toggle('on', x === b)); cur = samples[+b.dataset.i]; draw(); });
  if (cfg.scan) $('#spR').oninput = e => { lam = +e.target.value; draw(); };
  $('#spM').onclick = () => { const a = draw(); nb.log([cur.name, cur.name === 'Unknown' ? '?' : cur.c, lam, a.toFixed(3)]); };
  draw(); return () => { };
}
function wl2rgb(l) { let r = 0, g = 0, b = 0;
  if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else r = 1;
  return `rgb(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0})`; }
const spectroChart = (rows, cfg) => {
  const scan = rows.filter(r => r[0] !== 'Blank'), lams = new Set(scan.map(r => +r[2]));
  let out = '';
  if (cfg.scan && lams.size > 2) { const one = scan.filter(r => r[0] === scan[0][0]).map(r => [+r[2], +r[3]]).sort((a, b) => a[0] - b[0]); out += `<h4>Spectrum of ${scan[0][0]}</h4>` + plot({ x: [400, 700], y: [0, Math.max(.2, ...one.map(p => p[1])) * 1.15], xl: 'wavelength (nm)', yl: 'absorbance', series: [{ pts: one, type: 'line', cls: 'c1' }, { pts: one, cls: 'c1', r: 3 }] }); }
  const lm = [...lams].sort((a, b) => scan.filter(r => +r[2] === b).length - scan.filter(r => +r[2] === a).length)[0];
  const std = rows.filter(r => r[0].startsWith('Std') && +r[2] === lm).map(r => [+r[1], +r[3]]), u = rows.filter(r => r[0] === 'Unknown' && +r[2] === lm).map(r => +r[3]);
  if (std.length) { const f = linfit([[0, 0], ...std]), xm = Math.max(...cfg.stds) * 1.15, ym = Math.max(.3, ...std.map(p => p[1]), ...u) * 1.15;
    out += `<h4>Calibration curve at ${lm} nm</h4>` + plot({ x: [0, xm], y: [0, ym], xl: `concentration (${cfg.unit})`, yl: 'absorbance', series: [{ pts: std, cls: 'c1' }, ...(f ? [{ pts: [[0, f.b], [xm, f.m * xm + f.b]], type: 'line', cls: 'fitl' }] : []), ...(f ? u.map(a => ({ pts: [[(a - f.b) / f.m, a]], cls: 'c2', r: 6 })) : [])] }) + fitNote(f, 'c', 'A') + (f && u.length ? `<p class="fit">Unknown: A = ${u[0].toFixed(3)} → c = (A − b)/m = <b>${sig((u[0] - f.b) / f.m, 3)} ${cfg.unit}</b></p>` : ''); }
  return out;
};

/* ---------- instrument: coffee-cup calorimeter ---------- */
function calorimeterRig(box, nb, cfg) {
  let raf = 0, t = 0, run = null; const pts = [];
  const opts = cfg.options;
  box.innerHTML = `<div class="rig"><div class="rig-l"><div id="caV"></div></div><div class="rig-r">
    <label class="sl">${cfg.pickLabel}<select id="caS">${opts.map((o, i) => `<option value="${i}">${o.name}</option>`).join('')}</select></label>
    ${cfg.mass ? '<label class="sl">Mass of metal <b id="caML"></b><input type="range" id="caM" min="20" max="80" step="0.01" value="45.00"></label>' : ''}
    <div class="readout"><span>Thermometer</span><b id="caT">—</b></div>
    <div class="btnrow"><button class="btn pri" id="caGo">${cfg.go}</button></div><p class="tip">${cfg.tip}</p><div id="caP"></div></div></div>`;
  const Ti0 = R.real(20.5, 23.5, 1);
  const draw = (T) => {
    $('#caV').innerHTML = `<svg class="calor" viewBox="0 0 220 200" aria-hidden="true"><path class="cup" d="M40 40h140l-14 140H54z"/><path class="cupin" d="M52 70h116l-10 100H62z" style="fill:${run && run.o.color ? run.o.color : 'rgba(170,210,255,.55)'}"/>
      <rect class="therm" x="128" y="8" width="10" height="150" rx="5"/><rect class="merc" x="130.5" y="${150 - clamp((T - 10) / 40, 0, 1) * 130}" width="5" height="${8 + clamp((T - 10) / 40, 0, 1) * 130}" rx="2.5"/><circle class="bulb" cx="133" cy="158" r="8"/>
      ${run && cfg.mass ? `<rect class="metal" x="78" y="${t < 1 ? 20 : 120}" width="30" height="22" rx="4"/>` : ''}<path class="lid" d="M34 40h152"/></svg>`;
    $('#caT').textContent = T == null ? '—' : fx(T, 1) + ' °C';
  };
  const ms = () => cfg.mass ? +$('#caM').value : 0; if (cfg.mass) { const u = () => $('#caML').textContent = ms().toFixed(2) + ' g'; $('#caM').oninput = u; u(); }
  $('#caGo').onclick = () => { cancelAnimationFrame(raf); const o = opts[+$('#caS').value]; const r = cfg.model(o, ms(), Ti0); run = { o, r }; pts.length = 0; t = 0;
    const t0 = performance.now(); const step = now => { t = (now - t0) / 1000 * 30; // 30 s of experiment per real second
      const T = t < 10 ? r.Ti : r.Tf - (r.Tf - r.Ti) * Math.exp(-(t - 10) / 14) - (t > 60 ? (t - 60) * .004 * Math.sign(r.Tf - 21) : 0);
      if (!pts.length || t - pts[pts.length - 1][0] >= 5) pts.push([t, T + jit(.03)]);
      draw(T); $('#caP').innerHTML = plot({ x: [0, 180], y: [Math.min(r.Ti, r.Tf) - 3, Math.max(r.Ti, r.Tf) + 3], xl: 'time (s)', yl: 'temperature (°C)', series: [{ pts, type: 'line', cls: 'c1' }] });
      if (t < 180) raf = requestAnimationFrame(step); else { nb.log(cfg.row(o, ms(), r)); nb.note(cfg.done(o, r)); } };
    raf = requestAnimationFrame(step); };
  draw(Ti0); return () => cancelAnimationFrame(raf);
}

/* ============================== CHEM 1111 ============================== */
LABS.push({
  id: 'glassware', course: '1111', icon: '📏', title: 'Glassware & measurement', utd: 'Chemistry Glassware and Measurement',
  goal: 'Read glassware to the correct number of significant figures and compare the precision of a beaker, a graduated cylinder and a volumetric pipet.',
  intro: `<p>Every measurement has uncertainty. With marked glassware, you read <b>one digit past the smallest marking</b>. A cylinder marked every 1 mL reads to 0.1 mL; a buret marked every 0.1 mL reads to 0.01 mL.</p><p>To find how <b>accurate</b> a piece of glassware is, measure out water, weigh it, and convert mass to volume with the density of water (0.9982 g/mL at 20 °C).</p>`,
  steps: ['Pick a piece of glassware.', 'Deliver "10 mL" of water into a tared beaker.', 'Record the mass, then repeat for three trials.', 'Compare the average and the spread for each piece of glassware.'],
  cols: ['Glassware', 'Trial', 'Mass of water (g)', 'Volume (mL)'],
  sim(box, nb) {
    const G = [{ n: 'Beaker (±5%)', sd: .35, bias: .4 }, { n: 'Graduated cylinder (±0.1 mL)', sd: .07, bias: .05 }, { n: 'Volumetric pipet (±0.02 mL)', sd: .012, bias: 0 }];
    let g = 0; const tr = [0, 0, 0];
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="glV"></div></div><div class="rig-r"><div class="chips-row" id="glS">${G.map((x, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${x.n}</button>`).join('')}</div>
      <div class="readout"><span>Balance</span><b id="glB">0.000 g</b></div><div class="btnrow"><button class="btn pri" id="glGo">💧 Deliver 10 mL &amp; weigh</button></div><p class="tip">Do three trials with each. Precise glassware gives masses that agree closely.</p></div></div>`;
    const draw = m => { $('#glV').innerHTML = `<div class="bench">${beakerSVG('rgba(160,205,255,.6)', m ? .35 : .02)}<svg class="balance" viewBox="0 0 200 60" aria-hidden="true"><rect class="box" x="10" y="14" width="180" height="40" rx="8"/><rect class="lcd" x="40" y="22" width="120" height="24" rx="4"/><text class="lcdt" x="100" y="40">${(m || 0).toFixed(3)} g</text></svg></div>`; $('#glB').textContent = (m || 0).toFixed(3) + ' g'; };
    box.querySelectorAll('#glS .chip').forEach(b => b.onclick = () => { box.querySelectorAll('#glS .chip').forEach(x => x.classList.toggle('on', x === b)); g = +b.dataset.i; draw(0); });
    $('#glGo').onclick = () => { const v = 10 + G[g].bias + jit(G[g].sd), m = v * .9982; draw(m); tr[g]++; nb.log([G[g].n.split(' (')[0], tr[g], m.toFixed(3), (m / .9982).toFixed(g === 0 ? 1 : 2)]); };
    draw(0);
  },
  chart(rows) { const by = {}; rows.forEach(r => (by[r[0]] ??= []).push(+r[3])); return `<table class="nbt sum"><tr><th>Glassware</th><th>Average (mL)</th><th>Std. dev.</th></tr>${Object.entries(by).map(([k, v]) => { const a = v.reduce((s, x) => s + x, 0) / v.length, sd = Math.sqrt(v.reduce((s, x) => s + (x - a) ** 2, 0) / Math.max(1, v.length - 1)); return `<tr><td>${k}</td><td>${a.toFixed(2)}</td><td>${v.length > 1 ? sd.toFixed(3) : '—'}</td></tr>`; }).join('')}</table>`; },
  post: [
    () => { const m = R.real(9.80, 10.05, 3); return numQ(`A pipet delivers water with a mass of <b>${m.toFixed(3)} g</b> at 20 °C (density 0.9982 g/mL). What volume did it deliver?`, m / .9982, 'mL', [`V = m / d = ${m.toFixed(3)} / 0.9982`, `= <b>${(m / .9982).toFixed(3)} mL</b>`], { tol: .002 }); },
    () => mcFrom('A graduated cylinder is marked every 1 mL. Which reading is written correctly?', '23.4 mL', ['23 mL', '23.40 mL', '23.400 mL'], ['Read one digit past the smallest marking.', 'Markings every 1 mL → read to the tenths place: <b>23.4 mL</b>.']),
    () => mcFrom('Three trials give 10.21, 9.62 and 10.44 mL for a target of 10.00 mL. How would you describe this glassware?', 'Low precision', ['High precision', 'Perfect accuracy', 'High precision and high accuracy'], ['Precision = how close the trials are to each other.', 'They spread over 0.8 mL, so precision is <b>low</b>.']),
  ],
});

LABS.push({
  id: 'beer', course: '1111', icon: '🌈', title: 'Visible spectra & Beer–Lambert law', utd: 'Visible Spectra and the Nature of Light and Color · Beer Lambert\'s Law',
  goal: 'Scan a blue dye to find its λmax, build a calibration curve, and find the concentration of an unknown.',
  intro: `<p>A solution looks blue because it <b>absorbs</b> the complementary color (orange, ~630 nm) and lets the rest through. The wavelength it absorbs most strongly is <b>λmax</b>.</p><p><b>Beer–Lambert law:</b> A = εbc. At a fixed wavelength and path length, absorbance is directly proportional to concentration, so a plot of A vs. c is a straight line through the origin. Read the unknown's concentration off that line.</p>`,
  steps: ['Select Std 3 and sweep the wavelength from 400 to 700 nm, recording a reading every 20–30 nm.', 'Find λmax, the wavelength with the highest absorbance.', 'At λmax, record each standard and the unknown.', 'Use the best-fit line to find the unknown concentration.'],
  cols: ['Sample', 'Conc. (µM)', 'λ (nm)', 'Absorbance'],
  sim(box, nb) { const cfg = this.cfg = { lmax: 630, width: 55, eps: .0805, unit: 'µM', stds: [2, 4, 6, 8, 10], unk: R.real(3, 9, 2), scan: true, color: c => `rgba(20,80,225,${.12 + c / 12})`, tip: 'Scan first, then do every standard at λmax.' }; this.cfg = cfg; return spectroRig(box, nb, cfg); },
  chart(rows) { return spectroChart(rows, this.cfg || { stds: [10], unit: 'µM', scan: true }); },
  post: [
    () => { const m = R.real(.07, .12, 4), b = R.real(-.005, .005, 4), A = R.real(.25, .8, 3), c = (A - b) / m; return numQ(`A calibration line is A = ${m}·c ${b < 0 ? '−' : '+'} ${Math.abs(b)} (c in µM). An unknown reads A = ${A}. What is its concentration?`, c, 'µM', [`c = (A − b)/m = (${A} − (${b}))/${m}`, `= <b>${sig(c, 3)} µM</b>`]); },
    () => mcFrom('A dye solution looks <b>red</b>. Around what wavelength is its λmax?', '~500 nm (green)', ['~700 nm (red)', '~450 nm (violet)', '~600 nm (orange)'], ['A solution shows the color it does NOT absorb.', 'Red is complementary to <b>green</b>, so it absorbs near 500 nm.']),
    () => { const A = R.real(.3, .9, 3); return mcFrom(`A sample reads A = ${A}. You dilute it to half the concentration. What will it read?`, (A / 2).toFixed(3), [(A * 2).toFixed(3), A.toFixed(3), (A / 4).toFixed(3)], ['A = εbc, so A is proportional to c.', `Half the concentration → half the absorbance: <b>${(A / 2).toFixed(3)}</b>.`]); },
    () => { const A = R.real(.2, 1.2, 2), T = 10 ** -A * 100; return numQ(`What percent of the light is <b>transmitted</b> by a sample with A = ${A}?`, T, '%', ['A = −log T, so T = 10<sup>−A</sup>.', `T = 10<sup>−${A}</sup> = <b>${sig(T, 3)}%</b>`]); },
  ],
});

LABS.push({
  id: 'flame', course: '1111', icon: '🔥', title: 'Flame tests & atomic emission', utd: 'Visible Spectra and the Nature of Light and Color',
  goal: 'Identify metal ions by flame color and calculate the energy of the emitted photons.',
  intro: `<p>Heat excites an electron to a higher energy level. When it falls back down, it emits a photon whose energy equals the gap: <b>E = hν = hc/λ</b>. Each element has its own set of gaps, so each glows its own color.</p><p class="mono">h = 6.626×10⁻³⁴ J·s &nbsp; c = 2.998×10⁸ m/s</p>`,
  steps: ['Dip the wire loop in a salt solution and hold it in the flame.', 'Record the color and the brightest line in the spectroscope.', 'Calculate the frequency and photon energy.', 'Identify the unknown.'],
  cols: ['Salt', 'Flame color', 'λ (nm)', 'E per photon (J)'],
  sim(box, nb) {
    const M = [['LiCl', 'crimson red', 671], ['NaCl', 'bright yellow-orange', 589], ['KCl', 'lilac', 404], ['CaCl₂', 'orange-red', 622], ['SrCl₂', 'scarlet red', 641], ['BaCl₂', 'pale green', 554], ['CuCl₂', 'blue-green', 515]];
    const unk = R.pick(M); let cur = null, raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="flamesvg" viewBox="0 0 200 240" id="flV" aria-hidden="true"></svg><div id="flSp"></div></div><div class="rig-r"><div class="chips-row" id="flS">${[...M, ['Unknown', '', 0]].map((m, i) => `<button class="chip" data-i="${i}">${m[0]}</button>`).join('')}</div>
      <div class="btnrow"><button class="btn pri" id="flR" disabled>📒 Record</button></div><p class="tip">Na contaminates everything, so a weak yellow flicker is normal. K's lilac line is at the violet end.</p></div></div>`;
    const draw = tm => { const col = cur ? wl2rgb(cur[2]) : '#7fb6ff'; const w = 1 + .08 * Math.sin(tm / 90);
      $('#flV').innerHTML = `<rect class="burner" x="85" y="180" width="30" height="50" rx="4"/><path class="fl-o" style="fill:${col}" d="M100 ${30 - 8 * Math.sin(tm / 130)} C${130 * w} 90 ${125 * w} 150 100 180 C${75 / w} 150 ${70 / w} 90 100 ${30 - 8 * Math.sin(tm / 130)}z"/><path class="fl-i" d="M100 110 C112 140 110 165 100 180 C90 165 88 140 100 110z"/>${cur ? '<path class="loop" d="M150 120 L110 140"/><circle class="loop" cx="106" cy="142" r="5"/>' : ''}`; raf = requestAnimationFrame(draw); };
    box.querySelectorAll('#flS .chip').forEach(b => b.onclick = () => { box.querySelectorAll('#flS .chip').forEach(x => x.classList.toggle('on', x === b)); const i = +b.dataset.i; cur = i < M.length ? M[i] : ['Unknown', unk[1], unk[2]]; $('#flR').disabled = false;
      $('#flSp').innerHTML = `<div class="spline"><div class="rainbow"></div><i style="left:${(cur[2] - 400) / 3}%"></i><span>${cur[2]} nm</span></div>`; });
    $('#flR').onclick = () => { const E = 6.626e-34 * 2.998e8 / (cur[2] * 1e-9); nb.log([cur[0], cur[1], cur[2], E.toExponential(3)]); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  },
  post: [
    () => { const l = R.pick([589, 671, 554, 515, 622]), E = 6.626e-34 * 2.998e8 / (l * 1e-9); return numQ(`An atom emits light at ${l} nm. What is the energy of one photon? (J)`, E, 'J', [`Convert: λ = ${l}×10⁻⁹ m.`, `E = hc/λ = (6.626×10⁻³⁴)(2.998×10⁸)/(${l}×10⁻⁹) = <b>${E.toExponential(3)} J</b>`]); },
    () => { const l = R.pick([589, 671, 404, 641]), nu = 2.998e8 / (l * 1e-9); return numQ(`What is the frequency of ${l} nm light? (s⁻¹)`, nu, 's⁻¹', ['ν = c/λ', `= 2.998×10⁸ / ${l}×10⁻⁹ = <b>${nu.toExponential(3)} s⁻¹</b>`]); },
    () => mcFrom('Which flame color corresponds to the <b>highest-energy</b> photons?', 'lilac (K, 404 nm)', ['crimson (Li, 671 nm)', 'yellow (Na, 589 nm)', 'orange-red (Ca, 622 nm)'], ['E = hc/λ, so shorter wavelength means higher energy.', '404 nm is the shortest: <b>potassium</b>.']),
  ],
});

LABS.push({
  id: 'limiting', course: '1111', icon: '⚖️', title: 'Limiting reactant', utd: 'Limiting reactant',
  goal: 'Mix two salts, filter the precipitate, and figure out which reactant ran out.',
  intro: `<p class="mono">Na₃PO₄·12H₂O + BaCl₂·2H₂O → Ba₃(PO₄)₂(s) + NaCl</p><p>Balanced: <b>2 Na₃PO₄ + 3 BaCl₂ → Ba₃(PO₄)₂ + 6 NaCl</b>. The reactant that makes the <i>least</i> product is limiting.</p><p>After filtering, test the filtrate. If adding more BaCl₂ makes more precipitate, phosphate was in excess (Ba²⁺ was limiting). If adding Na₃PO₄ makes more, Ba²⁺ was in excess.</p>`,
  steps: ['Weigh out a mixture of the two salts.', 'Dissolve, let the precipitate form, filter and dry.', 'Test the filtrate with each reagent to find the excess.', 'Calculate the theoretical and percent yield.'],
  cols: ['Na₃PO₄·12H₂O (g)', 'BaCl₂·2H₂O (g)', 'Ba₃(PO₄)₂ (g)', 'Filtrate test'],
  sim(box, nb) {
    const MP = 380.12, MB = 244.26, MPr = 601.93; let st = 0, mp = R.real(.30, .70, 3), mb = .50, made = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="lrV" class="bench"></div></div><div class="rig-r"><p>Your mixture contains <b>${mp.toFixed(3)} g</b> Na₃PO₄·12H₂O.</p><label class="sl">BaCl₂·2H₂O to add <b id="lrBL"></b><input type="range" id="lrB" min="0.200" max="1.200" step="0.001" value="0.500"></label>
      <div class="btnrow"><button class="btn pri" id="lrMix">1. Mix &amp; filter</button><button class="btn" id="lrT1" disabled>2a. Add BaCl₂ to filtrate</button><button class="btn" id="lrT2" disabled>2b. Add Na₃PO₄ to filtrate</button></div><p class="tip" id="lrMsg">Choose an amount, then mix.</p></div></div>`;
    const draw = (ppt = 0, test = '') => $('#lrV').innerHTML = `${beakerSVG('rgba(200,225,255,.5)', .55, ppt ? `<rect x="16" y="${122 - ppt * 22}" width="78" height="${ppt * 22}" fill="#f4f4f4" stroke="#999"/>` : '')}${test ? tubeSVG(test === 'ppt' ? 'rgba(240,240,240,.95)' : 'rgba(200,225,255,.5)', 'filtrate') : ''}`;
    const u = () => { mb = +$('#lrB').value; $('#lrBL').textContent = mb.toFixed(3) + ' g'; }; $('#lrB').oninput = u; u();
    $('#lrMix').onclick = () => { const nP = mp / MP, nB = mb / MB, prod = Math.min(nP / 2, nB / 3); made = prod * MPr * R.real(.9, .99, 3); st = 1; draw(.6); $('#lrT1').disabled = $('#lrT2').disabled = false; $('#lrMsg').textContent = 'Precipitate collected. Now test the filtrate.'; this.lim = nP / 2 < nB / 3 ? 'phosphate' : 'barium'; this.tmp = [mp.toFixed(3), mb.toFixed(3), made.toFixed(3)]; };
    const test = which => { const ppt = (which === 'Ba' && this.lim === 'barium') || (which === 'P' && this.lim === 'phosphate'); draw(.6, ppt ? 'ppt' : 'clear');
      const msg = ppt ? `Cloudy! The filtrate still had ${which === 'Ba' ? 'PO₄³⁻' : 'Ba²⁺'}, so ${which === 'Ba' ? 'BaCl₂' : 'Na₃PO₄'} was the limiting reactant.` : 'Stays clear: no reaction.'; $('#lrMsg').textContent = msg;
      if (ppt) { nb.log([...this.tmp, `${which === 'Ba' ? 'Ba²⁺ test cloudy → BaCl₂ limiting' : 'PO₄³⁻ test cloudy → Na₃PO₄ limiting'}`]); } };
    $('#lrT1').onclick = () => test('Ba'); $('#lrT2').onclick = () => test('P'); draw();
  },
  post: [
    () => { const mp = R.real(.4, .6, 3), mb = R.real(.4, .8, 3), nP = mp / 380.12, nB = mb / 244.26, lim = nP / 2 < nB / 3 ? 'Na₃PO₄·12H₂O' : 'BaCl₂·2H₂O', th = Math.min(nP / 2, nB / 3) * 601.93;
      return mcFrom(`You mix ${mp} g Na₃PO₄·12H₂O (380.12 g/mol) with ${mb} g BaCl₂·2H₂O (244.26 g/mol). Which is limiting?`, lim, ['Na₃PO₄·12H₂O', 'BaCl₂·2H₂O', 'Neither: exactly stoichiometric'], [`mol phosphate = ${sig(nP, 3)}; product possible = ÷2 = ${sig(nP / 2, 3)} mol`, `mol barium = ${sig(nB, 3)}; product possible = ÷3 = ${sig(nB / 3, 3)} mol`, `Smaller product → limiting: <b>${lim}</b> (theoretical yield ${sig(th, 3)} g).`]); },
    () => { const th = R.real(.4, .8, 3), ac = +(th * R.real(.7, .97, 3)).toFixed(3); return numQ(`Theoretical yield is ${th} g and you collect ${ac} g. What is the percent yield?`, ac / th * 100, '%', [`% yield = actual/theoretical × 100`, `= ${ac}/${th} × 100 = <b>${sig(ac / th * 100, 3)}%</b>`]); },
  ],
});

LABS.push({
  id: 'copper', course: '1111', icon: '🟤', title: 'Chemistry of copper & percent yield', utd: 'Chemistry of Copper and Percent Yield',
  goal: 'Take copper through a cycle of five reactions and get it back as copper metal.',
  intro: `<p>Copper atoms are conserved, so ideally you recover every gram you started with. The cycle:</p><ol><li>Cu + HNO₃ → Cu(NO₃)₂ (blue solution + brown NO₂ gas)</li><li>+ NaOH → Cu(OH)₂ (blue precipitate)</li><li>heat → CuO (black solid)</li><li>+ H₂SO₄ → CuSO₄ (blue solution)</li><li>+ Zn → Cu (red-brown metal); excess Zn is removed with HCl</li></ol>`,
  steps: ['Pick the right reagent for each step in order.', 'Watch the color change at each step.', 'Wash, dry and weigh the copper you recover.', 'Calculate the percent recovery.'],
  cols: ['Start Cu (g)', 'Recovered Cu (g)', '% recovery', 'Notes'],
  sim(box, nb) {
    const SEQ = [['HNO₃', 'rgba(30,120,230,.65)', 'Cu(NO₃)₂: blue solution, brown NO₂ gas (fume hood!)'], ['NaOH', 'rgba(70,140,230,.85)', 'Cu(OH)₂: pale blue precipitate'], ['🔥 heat', 'rgba(25,25,25,.9)', 'CuO: black solid'], ['H₂SO₄', 'rgba(40,130,230,.7)', 'CuSO₄: clear blue solution'], ['Zn', 'rgba(160,80,40,.9)', 'Cu: red-brown metal forms; solution turns colorless'], ['HCl', 'rgba(170,85,45,.95)', 'Excess Zn dissolves (H₂ bubbles). Only Cu is left.']];
    const start = R.real(.4800, .5200, 4); let k = 0; const BAD = { 'HNO₃': 'nitric acid oxidizes Cu metal; it is not used after step 1.', 'NaOH': 'NaOH precipitates Cu²⁺ as the hydroxide.', '🔥 heat': 'heating dehydrates Cu(OH)₂ to CuO.', 'H₂SO₄': 'H₂SO₄ dissolves the oxide.', 'Zn': 'Zn reduces Cu²⁺ (it is more active).', 'HCl': 'HCl only removes leftover zinc at the very end.' };
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="cuV" class="bench"></div><ol class="cuSteps" id="cuL"></ol></div><div class="rig-r"><p>Starting copper wire: <b>${start.toFixed(4)} g</b></p><div class="chips-row">${R.shuffle(SEQ.map(s => s[0])).map(r => `<button class="chip" data-r="${r}">${r}</button>`).join('')}</div><p class="tip" id="cuM">Step 1: which reagent oxidizes copper metal to Cu²⁺?</p><div class="btnrow"><button class="btn pri" id="cuW" disabled>⚖️ Dry &amp; weigh</button></div></div></div>`;
    const draw = col => $('#cuV').innerHTML = beakerSVG(col || 'rgba(220,235,255,.4)', .5, k === 0 ? '<path d="M40 110 q15 -20 30 0" stroke="#c96a33" stroke-width="5" fill="none"/>' : k >= 2 && k !== 4 ? `<ellipse cx="55" cy="118" rx="30" ry="6" fill="${k === 3 ? '#222' : k >= 5 ? '#a0522d' : '#4a8fe0'}"/>` : '');
    box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { if (k >= SEQ.length) return; if (b.dataset.r === SEQ[k][0]) { k++; draw(SEQ[k - 1][1]); $('#cuL').insertAdjacentHTML('beforeend', `<li><b>${SEQ[k - 1][0]}</b>: ${SEQ[k - 1][2]}</li>`); $('#cuM').textContent = k < SEQ.length ? `Step ${k + 1}: what's next?` : 'Cycle complete! Dry and weigh your copper.'; if (k >= SEQ.length) $('#cuW').disabled = false; }
      else $('#cuM').innerHTML = `Not that one yet: ${BAD[b.dataset.r]}`; });
    $('#cuW').onclick = () => { const rec = start * R.real(.82, 1.06, 3); nb.log([start.toFixed(4), rec.toFixed(4), (rec / start * 100).toFixed(1), rec > start ? 'over 100%: sample still wet or Zn left' : 'some Cu lost in transfers/decanting']); $('#cuW').disabled = true; };
    draw();
  },
  post: [
    () => { const s = R.real(.48, .52, 4), r = +(s * R.real(.8, .98, 3)).toFixed(4); return numQ(`You start with ${s} g Cu and recover ${r} g. Percent recovery?`, r / s * 100, '%', [`% = recovered/start × 100 = ${r}/${s} × 100`, `= <b>${sig(r / s * 100, 3)}%</b>`]); },
    () => mcFrom('A student reports 108% recovery. What is the most likely cause?', 'The copper was not fully dry', ['Copper was lost when decanting', 'Too little zinc was added', 'The HNO₃ was too dilute'], ['Recovering more than you started with means extra mass.', 'Water (or leftover Zn) adds mass: the product <b>was not dry</b>.']),
    () => mcFrom('In Cu²⁺ + Zn → Cu + Zn²⁺, what is oxidized?', 'Zn', ['Cu²⁺', 'Cu', 'Zn²⁺'], ['Oxidation is loss of electrons.', 'Zn (0) → Zn²⁺ (+2): <b>Zn is oxidized</b>.']),
  ],
});

LABS.push({
  id: 'titrate', course: '1111', icon: '🧪', title: 'Volumetric analysis: acid–base titration', utd: 'Volumetric Analysis',
  goal: 'Titrate an unknown HCl solution with standardized NaOH and find its molarity.',
  intro: `<p>At the <b>equivalence point</b>, moles of OH⁻ added = moles of H⁺ present. Phenolphthalein is colorless in acid and turns pink above pH ~8.2, so the first lasting faint pink marks the <b>endpoint</b>.</p><p class="mono">M<sub>acid</sub> = (M<sub>NaOH</sub> × V<sub>NaOH</sub>) / V<sub>acid</sub></p>`,
  steps: ['Pipet 25.00 mL of unknown HCl into the flask with 2 drops of phenolphthalein.', 'Add 0.1000 M NaOH quickly at first.', 'Near the endpoint, add one drop at a time.', 'Record the volume at the first faint pink, then repeat until two trials agree within 0.10 mL.'],
  cols: ['Trial', 'Initial (mL)', 'Final (mL)', 'Volume NaOH (mL)', 'Color'],
  sim(box, nb) { const M = R.real(.070, .140, 4); this.M = M; return titrationRig(box, nb, { M: .1, V0: 25, mol: M * .025, pKas: [-8], ind: 'phth', what: '25.00 mL HCl + phenolphthalein' }); },
  chart(rows) { const g = rows.filter(r => r[4].includes('✓')).map(r => +r[3]); if (!g.length) return ''; const v = g.reduce((s, x) => s + x, 0) / g.length; return `<p class="fit">Average good trial: <b>${v.toFixed(2)} mL</b> → M<sub>HCl</sub> = (0.1000)(${v.toFixed(2)})/25.00 = <b>${(.1 * v / 25).toFixed(4)} M</b></p>`; },
  post: [
    () => { const V = R.real(18, 32, 2), Mb = .1, Ma = Mb * V / 25; return numQ(`25.00 mL of HCl needs ${V} mL of 0.1000 M NaOH. What is [HCl]?`, Ma, 'M', [`mol NaOH = 0.1000 × ${V}/1000 = ${sig(Mb * V / 1000, 4)} mol = mol HCl`, `M = ${sig(Mb * V / 1000, 4)} / 0.02500 L = <b>${sig(Ma, 4)} M</b>`], { tol: .005 }); },
    () => { const V = R.real(15, 30, 2), Ma = R.real(.08, .12, 4), Vh = 25; return numQ(`25.00 mL of ${Ma} M H₂SO₄ is titrated with NaOH; endpoint at ${V} mL. What is [NaOH]? (H₂SO₄ gives 2 H⁺)`, 2 * Ma * Vh / V, 'M', [`mol H⁺ = 2 × ${Ma} × 0.02500 = ${sig(2 * Ma * .025, 4)}`, `M<sub>NaOH</sub> = ${sig(2 * Ma * .025, 4)} / ${V / 1000} L = <b>${sig(2 * Ma * Vh / V, 4)} M</b>`]); },
    () => mcFrom('You overshoot and the flask turns dark magenta. How does this affect your calculated [HCl]?', 'Too high', ['Too low', 'No effect', 'Cannot tell'], ['Overshooting means you recorded more NaOH than needed.', 'M<sub>acid</sub> ∝ V<sub>NaOH</sub>, so the result comes out <b>too high</b>.']),
  ],
});

LABS.push({
  id: 'solubility', course: '1111', icon: '🧂', title: 'Soluble & insoluble salts', utd: 'Soluble and Insoluble Salts',
  goal: 'Mix pairs of ions in a spot plate, record which form precipitates, and write net ionic equations.',
  intro: `<p><b>Always soluble:</b> Group 1 ions, NH₄⁺, NO₃⁻, CH₃COO⁻. <b>Usually soluble:</b> Cl⁻, Br⁻, I⁻ (except with Ag⁺, Pb²⁺, Hg₂²⁺) and SO₄²⁻ (except Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺). <b>Usually insoluble:</b> OH⁻, CO₃²⁻, PO₄³⁻, S²⁻ (except with Group 1/NH₄⁺; Ba(OH)₂ and Ca(OH)₂ are somewhat soluble).</p>`,
  steps: ['Pick a cation and an anion.', 'Add a drop of each to a well.', 'Record precipitate or no reaction, and the color.', 'Write the net ionic equation for each precipitate.'],
  cols: ['Cation', 'Anion', 'Result', 'Net ionic'],
  sim(box, nb) {
    const C = [['Ag⁺', 1], ['Pb²⁺', 2], ['Ba²⁺', 2], ['Cu²⁺', 2], ['Fe³⁺', 3], ['Na⁺', 1]], A = [['Cl⁻', 1], ['SO₄²⁻', 2], ['OH⁻', 1], ['CO₃²⁻', 2], ['NO₃⁻', 1], ['I⁻', 1]];
    const ppt = (c, a) => { if (c === 'Na⁺' || a === 'NO₃⁻') return null; const t = { 'Ag⁺': { 'Cl⁻': 'white', 'SO₄²⁻': null, 'OH⁻': 'brown (Ag₂O)', 'CO₃²⁻': 'pale yellow', 'I⁻': 'yellow' }, 'Pb²⁺': { 'Cl⁻': 'white', 'SO₄²⁻': 'white', 'OH⁻': 'white', 'CO₃²⁻': 'white', 'I⁻': 'bright yellow' }, 'Ba²⁺': { 'Cl⁻': null, 'SO₄²⁻': 'white', 'OH⁻': null, 'CO₃²⁻': 'white', 'I⁻': null }, 'Cu²⁺': { 'Cl⁻': null, 'SO₄²⁻': null, 'OH⁻': 'pale blue', 'CO₃²⁻': 'blue-green', 'I⁻': 'tan (CuI + I₂)' }, 'Fe³⁺': { 'Cl⁻': null, 'SO₄²⁻': null, 'OH⁻': 'rust brown', 'CO₃²⁻': 'rust brown', 'I⁻': null } }; return t[c][a]; };
    const COL = { white: '#f3f3f3', yellow: '#f4dc4a', 'bright yellow': '#ffd400', 'pale blue': '#8ec5ff', 'blue-green': '#45b39d', 'rust brown': '#a0522d', 'brown (Ag₂O)': '#6b4a2b', 'pale yellow': '#f5eaa0', 'tan (CuI + I₂)': '#c8a26b' };
    const form = (c, a) => { const [cs, cz] = C.find(x => x[0] === c), [as, az] = A.find(x => x[0] === a), g = gcd(cz, az), nc = az / g, na = cz / g; const cb = cs.replace(/[⁺²³⁻]/g, ''), ab = as.replace(/[⁺²³⁻]/g, ''); return `${nc > 1 ? nc : ''}${cs} + ${na > 1 ? na : ''}${as} → ${cb}${nc > 1 ? SUB(nc) : ''}${na > 1 && ab.length > 2 ? `(${ab})${SUB(na)}` : ab + (na > 1 ? SUB(na) : '')}(s)`; };
    let ci = 0, ai = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="spP" class="spotplate"></div></div><div class="rig-r"><p><b>Cation</b></p><div class="chips-row" id="sC">${C.map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${c[0]}</button>`).join('')}</div><p><b>Anion</b></p><div class="chips-row" id="sA">${A.map((c, i) => `<button class="chip ${i ? '' : 'on'}" data-i="${i}">${c[0]}</button>`).join('')}</div><div class="btnrow"><button class="btn pri" id="sGo">💧 Mix in next well</button></div><p class="tip" id="sM"></p></div></div>`;
    const wells = []; const draw = () => $('#spP').innerHTML = `<svg viewBox="0 0 300 200" aria-hidden="true"><rect class="plate" x="4" y="4" width="292" height="192" rx="18"/>${[...Array(12)].map((_, i) => { const w = wells[i], x = 45 + (i % 4) * 70, y = 45 + (i / 4 | 0) * 55; return `<circle class="well" cx="${x}" cy="${y}" r="22"/>${w ? `<circle cx="${x}" cy="${y}" r="17" fill="${w.p ? COL[w.p] : 'rgba(190,220,255,.5)'}" class="${w.p ? 'cloud' : ''}"/><text class="tl" x="${x}" y="${y + 36}">${w.c}+${w.a}</text>` : ''}`; }).join('')}</svg>`;
    ['sC', 'sA'].forEach(id => box.querySelectorAll(`#${id} .chip`).forEach(b => b.onclick = () => { box.querySelectorAll(`#${id} .chip`).forEach(x => x.classList.toggle('on', x === b)); if (id === 'sC') ci = +b.dataset.i; else ai = +b.dataset.i; }));
    $('#sGo').onclick = () => { const c = C[ci][0], a = A[ai][0], p = ppt(c, a); if (wells.length >= 12) wells.length = 0; wells.push({ c, a, p }); draw(); $('#sM').textContent = p ? `Precipitate: ${p}!` : 'No visible reaction (all ions stay dissolved).'; nb.log([c, a, p ? `ppt, ${p}` : 'NR', p ? form(c, a) : '—']); };
    draw();
  },
  post: [
    () => mcFrom('Which pair forms a precipitate?', 'Pb(NO₃)₂ + KI', ['NaCl + KNO₃', 'BaCl₂ + NaNO₃', 'CuSO₄ + NH₄Cl'], ['Look for an insoluble combination.', 'Pb²⁺ with I⁻ makes yellow <b>PbI₂</b>.']),
    () => mcFrom('What is the net ionic equation for AgNO₃(aq) + NaCl(aq)?', 'Ag⁺ + Cl⁻ → AgCl(s)', ['Na⁺ + NO₃⁻ → NaNO₃(s)', 'AgNO₃ + NaCl → AgCl + NaNO₃', 'Ag⁺ + NO₃⁻ → AgNO₃(s)'], ['Na⁺ and NO₃⁻ are spectator ions.', 'Only the precipitate-forming ions remain: <b>Ag⁺ + Cl⁻ → AgCl(s)</b>.']),
    () => mcFrom('Which is insoluble in water?', 'BaSO₄', ['Na₂SO₄', 'NH₄NO₃', 'KOH'], ['Sulfates are soluble except with Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺.', '<b>BaSO₄</b> is insoluble.']),
  ],
});

LABS.push({
  id: 'specheat', course: '1111', icon: '♨️', title: 'Energy & specific heat', utd: 'Energy and Specific Heat',
  goal: 'Drop a hot metal into water, measure the final temperature, and identify the metal by its specific heat.',
  intro: `<p>Heat lost by the metal = heat gained by the water:</p><p class="mono">−m<sub>metal</sub>c<sub>metal</sub>ΔT<sub>metal</sub> = m<sub>water</sub>(4.184 J/g·°C)ΔT<sub>water</sub></p><p>Reference values (J/g·°C): Al 0.897 · Fe 0.449 · Cu 0.385 · Zn 0.388 · Pb 0.129.</p>`,
  steps: ['Heat the metal in boiling water (100.0 °C).', 'Pour 50.00 g of water into the calorimeter and read the starting temperature.', 'Transfer the metal quickly and watch the temperature.', 'Use the highest temperature as T<sub>final</sub>, and solve for c<sub>metal</sub>.'],
  cols: ['Metal', 'Mass (g)', 'T water initial (°C)', 'T final (°C)'],
  sim(box, nb) { const M = [['Aluminum', .897], ['Iron', .449], ['Copper', .385], ['Lead', .129]], u = R.pick(M);
    return calorimeterRig(box, nb, { pickLabel: 'Metal sample', mass: true, go: '🔥 Heat to 100 °C & drop in', tip: 'The water is 50.00 g. Record the maximum temperature.', options: [...M.map(m => ({ name: m[0], c: m[1] })), { name: 'Unknown metal', c: u[1] }],
      model: (o, m, Ti) => ({ Ti, Tf: (m * o.c * 100 + 50 * 4.184 * Ti) / (m * o.c + 50 * 4.184) }), row: (o, m, r) => [o.name, m.toFixed(2), fx(r.Ti, 1), fx(r.Tf + jit(.05), 1)], done: (o, r) => `Max temperature ${fx(r.Tf, 1)} °C.` }); },
  post: [
    () => { const m = R.real(30, 60, 2), c = R.pick([.897, .449, .385, .129]), Ti = R.real(21, 23, 1), Tf = +((m * c * 100 + 50 * 4.184 * Ti) / (m * c + 50 * 4.184)).toFixed(1), cc = 50 * 4.184 * (Tf - Ti) / (m * (100 - Tf));
      return numQ(`A ${m} g metal at 100.0 °C is dropped into 50.00 g water at ${Ti} °C. Final temperature: ${Tf} °C. Specific heat of the metal? (J/g·°C)`, cc, 'J/g·°C', [`q<sub>water</sub> = 50.00 × 4.184 × (${Tf} − ${Ti}) = ${sig(50 * 4.184 * (Tf - Ti), 4)} J`, `c = q / (m ΔT) = ${sig(50 * 4.184 * (Tf - Ti), 4)} / (${m} × ${sig(100 - Tf, 3)})`, `= <b>${sig(cc, 3)} J/g·°C</b>`], { tol: .04 }); },
    () => mcFrom('Equal masses of Al (c = 0.897) and Pb (c = 0.129), both at 100 °C, go into identical cups of water. Which cup ends up warmer?', 'The aluminum cup', ['The lead cup', 'They end up the same', 'Depends on the starting water temperature'], ['Higher specific heat stores more heat per gram per degree.', 'Al releases more heat as it cools, so <b>the Al cup is warmer</b>.']),
  ],
});

/* ============================== CHEM 1112 ============================== */
LABS.push({
  id: 'calor', course: '1112', icon: '☕', title: 'Constant-pressure calorimetry', utd: 'Constant Pressure Calorimetry',
  goal: 'Measure ΔH for neutralization and for dissolving a salt in a coffee-cup calorimeter.',
  intro: `<p>At constant pressure, the heat of reaction is <b>ΔH</b>. The solution absorbs what the reaction releases: q<sub>rxn</sub> = −q<sub>soln</sub> = −m·c·ΔT.</p><p>Then ΔH = q<sub>rxn</sub> / mol of limiting reactant. Assume solutions are 1.00 g/mL with c = 4.184 J/g·°C.</p>`,
  steps: ['Choose a reaction.', 'Record the starting temperature, then mix.', 'Track temperature vs. time and take the max (or min) value.', 'Calculate q and ΔH per mole.'],
  cols: ['Reaction', 'Mass of solution (g)', 'T initial (°C)', 'T final (°C)'],
  sim(box, nb) {
    return calorimeterRig(box, nb, { pickLabel: 'Reaction', mass: false, go: '🥄 Mix & start timer', tip: 'Exothermic reactions warm the solution; endothermic ones cool it.', options: [
      { name: '50.0 mL 1.00 M HCl + 50.0 mL 1.00 M NaOH', dH: -57.3, n: .05, m: 100 }, { name: '50.0 mL 1.00 M CH₃COOH + 50.0 mL 1.00 M NaOH', dH: -56.1, n: .05, m: 100 },
      { name: '4.00 g NH₄NO₃ dissolved in 50.0 g water', dH: 25.7, n: 4 / 80.04, m: 54, color: 'rgba(225,240,255,.6)' }, { name: '2.00 g NaOH(s) dissolved in 50.0 g water', dH: -44.5, n: 2 / 40, m: 52 }],
      model: (o, m, Ti) => ({ Ti, Tf: Ti - o.dH * 1000 * o.n / (o.m * 4.184) }), row: (o, m, r) => [o.name.split(' + ')[0].replace(/^[\d.]+ (mL|g) /, '') + (o.name.includes('+') ? ' + ' + o.name.split(' + ')[1].replace(/^[\d.]+ mL [\d.]+ M /, '') : ''), o.m, fx(r.Ti, 1), fx(r.Tf + jit(.05), 1)], done: (o, r) => `ΔT = ${fx(r.Tf - r.Ti, 1)} °C (${r.Tf > r.Ti ? 'exothermic' : 'endothermic'}).` }); },
  post: [
    () => { const dT = R.real(6.2, 7.0, 1), q = 100 * 4.184 * dT, dH = -q / .05 / 1000; return numQ(`50.0 mL of 1.00 M HCl and 50.0 mL of 1.00 M NaOH warm by ${dT} °C. What is ΔH<sub>neut</sub>? (kJ/mol)`, dH, 'kJ/mol', [`q<sub>soln</sub> = (100 g)(4.184)(${dT}) = ${sig(q, 4)} J`, 'mol H₂O formed = 0.0500 mol', `ΔH = −${sig(q, 4)} J / 0.0500 mol = <b>${sig(dH, 3)} kJ/mol</b>`]); },
    () => mcFrom('Dissolving NH₄NO₃ makes the cup feel cold. What is the sign of ΔH?', 'Positive (endothermic)', ['Negative (exothermic)', 'Zero', 'Cannot tell without ΔS'], ['The solution cooled, so it lost heat to the reaction.', 'The system absorbed heat: <b>ΔH > 0</b>.']),
    () => mcFrom('Heat escapes through the cup during the neutralization. Your measured ΔH will be…', 'less negative than the true value', ['more negative than the true value', 'unchanged', 'positive'], ['Lost heat makes ΔT smaller than it should be.', 'Smaller q → |ΔH| too small: <b>less negative</b>.']),
  ],
});

LABS.push({
  id: 'viscosity', course: '1112', icon: '🍯', title: 'Intermolecular forces via viscosity', utd: 'Exploring Intermolecular Attractions via Viscosity',
  goal: 'Time a steel ball falling through different liquids and relate viscosity to intermolecular forces.',
  intro: `<p>Stronger intermolecular forces make molecules harder to slide past one another, so the liquid is more <b>viscous</b>. More hydrogen-bonding groups per molecule (and bigger molecules) usually mean higher viscosity.</p>`,
  steps: ['Choose a liquid.', 'Drop the ball and time its fall between the two marks.', 'Rank the liquids.', 'Explain the ranking with IMFs.'],
  cols: ['Liquid', 'Strongest IMF', 'Fall time (s)'],
  sim(box, nb) {
    const L = [['Hexane', 'dispersion', .30], ['Water', 'H-bonding (2 H, 2 lone pairs)', .89], ['Ethanol', 'H-bonding (1 OH)', 1.07], ['1-Butanol', 'H-bonding + more dispersion', 2.54], ['Ethylene glycol', 'H-bonding (2 OH)', 16.1], ['Glycerol', 'H-bonding (3 OH)', 1412]];
    let raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="visc" viewBox="0 0 120 260" id="vV" aria-hidden="true"></svg></div><div class="rig-r"><div class="chips-row" id="vS">${L.map((l, i) => `<button class="chip" data-i="${i}">${l[0]}</button>`).join('')}</div><div class="readout"><span>Stopwatch</span><b id="vT">0.00 s</b></div><p class="tip">Glycerol takes a long time, so the clock runs fast for it.</p></div></div>`;
    const draw = (y, col) => $('#vV').innerHTML = `<rect class="liq" x="35" y="20" width="50" height="225" fill="${col}"/><rect class="gl" x="35" y="10" width="50" height="235" rx="6"/><line class="mark" x1="28" x2="92" y1="50" y2="50"/><line class="mark" x1="28" x2="92" y1="220" y2="220"/><circle class="ball" cx="60" cy="${y}" r="7"/>`;
    box.querySelectorAll('#vS .chip').forEach(b => b.onclick = () => { cancelAnimationFrame(raf); box.querySelectorAll('#vS .chip').forEach(x => x.classList.toggle('on', x === b)); const l = L[+b.dataset.i], tt = l[2] * 2.1 * (1 + jit(.02)), real = clamp(Math.log10(l[2] * 20 + 1) * 1.2, .6, 4.5), col = `rgba(${200 + l[2] % 50},${210},${120 + Math.min(120, l[2])},.45)`;
      const t0 = performance.now(); const st = now => { const f = Math.min(1, (now - t0) / 1000 / real); draw(30 + f * 205, col); $('#vT').textContent = (f * tt).toFixed(2) + ' s'; if (f < 1) raf = requestAnimationFrame(st); else nb.log([l[0], l[1], tt.toFixed(2)]); }; raf = requestAnimationFrame(st); });
    draw(30, 'rgba(200,220,255,.4)'); return () => cancelAnimationFrame(raf);
  },
  post: [
    () => mcFrom('Which liquid is most viscous?', 'Glycerol, HOCH₂CH(OH)CH₂OH', ['Ethanol, CH₃CH₂OH', 'Hexane, C₆H₁₄', 'Acetone, (CH₃)₂C=O'], ['More H-bonding sites → stronger IMFs → higher viscosity.', '<b>Glycerol</b> has three OH groups.']),
    () => mcFrom('Viscosity of a liquid usually ___ as temperature increases.', 'decreases', ['increases', 'stays the same', 'first rises, then falls'], ['Hotter molecules have more kinetic energy to overcome IMFs.', 'So viscosity <b>decreases</b>.']),
  ],
});

LABS.push({
  id: 'fpd', course: '1112', icon: '🧊', title: 'Molar mass by freezing-point depression', utd: 'Molar Mass Determination through Freezing Point Depression',
  goal: 'Record cooling curves for pure lauric acid and for a solution of an unknown, then calculate the unknown\'s molar mass.',
  intro: `<p>A solute lowers the freezing point: <b>ΔT<sub>f</sub> = K<sub>f</sub>·m</b> (m = molality = mol solute / kg solvent). For lauric acid, T<sub>f</sub> = 43.8 °C and K<sub>f</sub> = 3.9 °C·kg/mol.</p><p>A pure solvent's cooling curve has a flat plateau while it freezes. A solution's curve slopes, because the remaining liquid gets more concentrated as solvent freezes out. Read its freezing point where the slope changes.</p>`,
  steps: ['Melt 8.00 g of lauric acid and record its cooling curve.', 'Add the weighed unknown, melt, and record a second curve.', 'Read both freezing points.', 'ΔT<sub>f</sub> → molality → moles → molar mass.'],
  cols: ['Sample', 'Solute mass (g)', 'Freezing point (°C)'],
  sim(box, nb) {
    const unk = R.pick([122.12, 128.17, 154.21, 180.16]), ms = R.real(.9, 1.3, 3), Tfs = 43.8 - 3.9 * (ms / unk) / .008; let raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="fpV"></div></div><div class="rig-r"><div class="chips-row"><button class="chip" id="fpA">Pure lauric acid (8.00 g)</button><button class="chip" id="fpB">+ ${ms} g unknown</button></div><div class="readout"><span>Thermometer</span><b id="fpT">—</b></div><p class="tip">Freezing point: the plateau (pure) or the break where the slope changes (solution).</p><div id="fpP"></div></div></div>`;
    const run = (Tf, pure) => { cancelAnimationFrame(raf); const pts = []; const t0 = performance.now();
      const T = t => { const tf = Math.log((60 - 20) / (Tf - .4 - 20)) / .012; if (t < tf) return 20 + 40 * Math.exp(-.012 * t); const sup = t - tf; if (sup < 12) return Tf - .4 * Math.sin(sup / 12 * Math.PI) + (sup > 6 ? 0 : 0); const pl = sup - 12; if (pl < 140) return pure ? Tf : Tf - pl * .018; const e = pure ? Tf : Tf - 140 * .018; return 20 + (e - 20) * Math.exp(-.02 * (pl - 140)); };
      const st = now => { const t = (now - t0) / 1000 * 60; const v = T(t) + jit(.02); pts.push([t, v]); $('#fpT').textContent = v.toFixed(1) + ' °C';
        $('#fpV').innerHTML = `<div class="bench">${tubeSVG(t > 200 ? 'rgba(250,250,245,.95)' : 'rgba(250,245,215,.6)', pure ? 'pure' : 'soln', .6)}</div>`;
        $('#fpP').innerHTML = plot({ x: [0, 480], y: [30, 62], xl: 'time (s)', yl: 'T (°C)', series: [{ pts, type: 'line', cls: 'c1' }] });
        if (t < 480) raf = requestAnimationFrame(st); else nb.log([pure ? 'Lauric acid' : 'Lauric acid + unknown', pure ? '0' : ms.toFixed(3), fx(Tf + jit(.05), 1)]); };
      raf = requestAnimationFrame(st); };
    $('#fpA').onclick = () => run(43.8, true); $('#fpB').onclick = () => run(Tfs, false); $('#fpV').innerHTML = `<div class="bench">${tubeSVG('rgba(250,245,215,.6)', 'pure', .6)}</div>`; return () => cancelAnimationFrame(raf);
  },
  post: [
    () => { const g = R.real(.9, 1.3, 3), dT = R.real(3.0, 5.0, 2), mm = g / (dT / 3.9 * .008); return numQ(`${g} g of unknown in 8.00 g lauric acid (K<sub>f</sub> = 3.9) lowers the freezing point by ${dT} °C. Molar mass?`, mm, 'g/mol', [`m = ΔT/K<sub>f</sub> = ${dT}/3.9 = ${sig(dT / 3.9, 3)} mol/kg`, `mol = ${sig(dT / 3.9, 3)} × 0.00800 kg = ${sig(dT / 3.9 * .008, 3)} mol`, `MM = ${g} / ${sig(dT / 3.9 * .008, 3)} = <b>${sig(mm, 3)} g/mol</b>`]); },
    () => mcFrom('Some of your unknown sticks to the tube wall and never dissolves. Your calculated molar mass will be…', 'too high', ['too low', 'unchanged', 'negative'], ['Less solute dissolved → smaller ΔT<sub>f</sub> → fewer calculated moles.', 'You divide the full mass by too few moles: <b>too high</b>.']),
    () => mcFrom('Which 0.10 m solute gives the largest freezing-point depression in water?', 'CaCl₂', ['NaCl', 'glucose', 'CH₃OH'], ['ΔT<sub>f</sub> = i·K<sub>f</sub>·m.', 'CaCl₂ gives 3 ions (i = 3): <b>largest</b>.']),
  ],
});

LABS.push({
  id: 'clock', course: '1112', icon: '⏱️', title: 'Kinetics of the iodine clock', utd: 'Kinetics of Iodine Clock Reaction',
  goal: 'Vary concentrations and temperature, time the color change, and work out the rate law and activation energy.',
  intro: `<p class="mono">2 I⁻ + S₂O₈²⁻ → I₂ + 2 SO₄²⁻</p><p>A small fixed amount of thiosulfate eats the I₂ as fast as it forms. When the thiosulfate runs out, I₂ builds up and turns the starch <b>blue-black</b> suddenly. The time to that flash tells you the rate: rate = Δ[S₂O₈²⁻]/t, where Δ[S₂O₈²⁻] = ½[S₂O₃²⁻] = 0.0010 M.</p><p>Rate law: rate = k[I⁻]<sup>x</sup>[S₂O₈²⁻]<sup>y</sup>. Double one concentration, hold the other fixed, and see how the rate changes.</p>`,
  steps: ['Run a baseline: 0.10 M I⁻, 0.10 M S₂O₈²⁻, 25 °C.', 'Double [I⁻] only. Then double [S₂O₈²⁻] only.', 'Find x and y from the rate ratios.', 'Repeat the baseline at other temperatures for an Arrhenius plot.'],
  cols: ['Trial', '[I⁻] (M)', '[S₂O₈²⁻] (M)', 'T (°C)', 'Time (s)', 'Rate (M/s)'],
  sim(box, nb) {
    let raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="ckV" class="bench"></div></div><div class="rig-r">
      <label class="sl">[I⁻]<select id="ckI"><option>0.050</option><option selected>0.100</option><option>0.200</option></select></label><label class="sl">[S₂O₈²⁻]<select id="ckS"><option>0.050</option><option selected>0.100</option><option>0.200</option></select></label>
      <label class="sl">Temperature <b id="ckTL"></b><input type="range" id="ckT" min="5" max="45" step="5" value="25"></label><div class="readout"><span>Stopwatch</span><b id="ckW">0.0 s</b></div><div class="btnrow"><button class="btn pri" id="ckGo">⚗️ Mix &amp; start</button></div></div></div>`;
    const draw = (blue) => $('#ckV').innerHTML = beakerSVG(blue ? 'rgba(20,20,70,.92)' : 'rgba(215,235,255,.5)', .55);
    const u = () => $('#ckTL').textContent = $('#ckT').value + ' °C'; $('#ckT').oninput = u; u();
    $('#ckGo').onclick = () => { cancelAnimationFrame(raf); const I = +$('#ckI').value, S2 = +$('#ckS').value, T = +$('#ckT').value + 273.15, k = .004 * Math.exp(-52000 / RG * (1 / T - 1 / 298.15)), rate = k * I * S2, tt = .001 / rate * (1 + jit(.02)); draw(false);
      const t0 = performance.now(), sp = Math.max(1, tt / 4); const st = now => { const t = (now - t0) / 1000 * sp; $('#ckW').textContent = Math.min(t, tt).toFixed(1) + ' s'; if (t < tt) raf = requestAnimationFrame(st); else { draw(true); nb.log([nb.rows.length + 1, I.toFixed(3), S2.toFixed(3), $('#ckT').value, tt.toFixed(1), (.001 / tt).toExponential(2)]); } }; raf = requestAnimationFrame(st); };
    draw(false); return () => cancelAnimationFrame(raf);
  },
  chart(rows) { const base = rows.filter(r => r[1] === '0.100' && r[2] === '0.100'); if (base.length < 2) return ''; const p = base.map(r => [1 / (+r[3] + 273.15), Math.log(+r[5])]), f = linfit(p); if (!f || new Set(base.map(r => r[3])).size < 2) return '';
    const xs = p.map(q => q[0]); return `<h4>Arrhenius plot (baseline trials)</h4>` + plot({ x: [Math.min(...xs) * .998, Math.max(...xs) * 1.002], y: [Math.min(...p.map(q => q[1])) - .3, Math.max(...p.map(q => q[1])) + .3], xl: '1/T (K⁻¹)', yl: 'ln(rate)', series: [{ pts: p, cls: 'c1' }, { pts: [[Math.min(...xs), f.m * Math.min(...xs) + f.b], [Math.max(...xs), f.m * Math.max(...xs) + f.b]], type: 'line', cls: 'fitl' }] }) + `<p class="fit">slope = −E<sub>a</sub>/R = ${sig(f.m, 4)} K → <b>E<sub>a</sub> ≈ ${sig(-f.m * RG / 1000, 3)} kJ/mol</b></p>`; },
  post: [
    () => { const t1 = R.real(20, 40, 1), r = R.pick([1, 2]), t2 = +(t1 / 2 ** r).toFixed(1); return mcFrom(`Doubling [I⁻] (all else fixed) changes the clock time from ${t1} s to ${t2} s. What is the order in I⁻?`, String(r), ['0', '1', '2', '3'], [`Rate ∝ 1/time, so the rate went up by ${t1}/${t2} = ${2 ** r}×.`, `2<sup>x</sup> = ${2 ** r} → <b>x = ${r}</b>`]); },
    () => { const T1 = 298, T2 = R.pick([308, 313, 318]), ratio = R.real(1.9, 3.5, 2), Ea = RG * Math.log(ratio) / (1 / T1 - 1 / T2) / 1000; return numQ(`The rate increases ${ratio}× when you warm from ${T1} K to ${T2} K. What is E<sub>a</sub>? (kJ/mol)`, Ea, 'kJ/mol', ['ln(k₂/k₁) = (E<sub>a</sub>/R)(1/T₁ − 1/T₂)', `E<sub>a</sub> = 8.314 × ln(${ratio}) / (1/${T1} − 1/${T2})`, `= <b>${sig(Ea, 3)} kJ/mol</b>`]); },
    () => mcFrom('Why does the solution turn blue so suddenly instead of gradually?', 'Thiosulfate consumes I₂ until it runs out', ['Starch only reacts above a certain temperature', 'The reaction is zero order', 'Persulfate is the limiting reactant'], ['S₂O₃²⁻ instantly turns I₂ back into I⁻.', 'Only after <b>all the thiosulfate is used up</b> can I₂ meet the starch.']),
  ],
});

LABS.push({
  id: 'lechat', course: '1112', icon: '⚖️', title: 'Le Chatelier\'s principle', utd: 'Le Chatelier\'s Principle',
  goal: 'Stress the Fe³⁺/SCN⁻ equilibrium and watch which way it shifts.',
  intro: `<p class="mono">Fe³⁺(aq, pale yellow) + SCN⁻(aq) ⇌ FeSCN²⁺(aq, blood red) &nbsp; ΔH &lt; 0</p><p>When you stress an equilibrium, it shifts to <b>relieve the stress</b>. Compare Q to K: Q &lt; K shifts right (more red); Q &gt; K shifts left (paler).</p><p>Ag⁺ removes SCN⁻ as AgSCN(s). HPO₄²⁻ ties up Fe³⁺. Heating an exothermic reaction is like adding a product.</p>`,
  steps: ['Compare each tube to the control.', 'Apply a stress.', 'Predict the shift, then check the color and the Q vs. K bar.', 'Record the direction of the shift.'],
  cols: ['Stress', 'Q vs K right after', 'Shift', 'Color vs control'],
  sim(box, nb) {
    let F = .0020, Sc = .0020, X, T = 25; const K0 = 138; const Kof = T => K0 * Math.exp(30000 / RG * (1 / (T + 273.15) - 1 / 298.15));
    const solve = () => { const K = Kof(T), tf = F + X, ts = Sc + X; /* totals */ const a = K, b = -(K * (tf + ts) + 1), c = K * tf * ts; const x = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a); F = tf - x; Sc = ts - x; X = x; };
    X = 0; solve(); const ctrl = X;
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="lcV" class="bench tubes"></div><div id="lcB"></div></div><div class="rig-r"><div class="chips-row">${[['Fe', '+ Fe(NO₃)₃'], ['SCN', '+ KSCN'], ['Ag', '+ AgNO₃'], ['P', '+ Na₂HPO₄'], ['hot', '🔥 Heat to 60 °C'], ['cold', '🧊 Ice bath (5 °C)'], ['w', '+ water (dilute)']].map(([k, t]) => `<button class="chip" data-k="${k}">${t}</button>`).join('')}</div><p class="tip" id="lcM">Each button stresses a fresh copy of the equilibrium mixture.</p></div></div>`;
    const col = x => `rgba(${170 + 60 * clamp(x / .003, 0, 1)},${60 - 40 * clamp(x / .003, 0, 1)},20,${.18 + .78 * clamp(x / .0028, 0, 1)})`;
    const draw = (q, k) => { $('#lcV').innerHTML = tubeSVG(col(ctrl), 'control') + tubeSVG(col(X), 'test');
      $('#lcB').innerHTML = q == null ? '' : `<div class="qk"><div><span>Q</span><i style="width:${clamp(Math.log10(q / k) * 30 + 50, 3, 97)}%"></i></div><p>${q < k * .98 ? 'Q &lt; K → shifts right →' : q > k * 1.02 ? '← Q &gt; K → shifts left' : 'Q ≈ K'}</p></div>`; };
    box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { F = .0020; Sc = .0020; X = 0; T = 25; solve(); let lab = b.textContent, q, k;
      const vol = s => { F *= s; Sc *= s; X *= s; };
      if (b.dataset.k === 'Fe') F += .002; if (b.dataset.k === 'SCN') Sc += .002; if (b.dataset.k === 'Ag') Sc = Math.max(1e-6, Sc - .0018); if (b.dataset.k === 'P') F = Math.max(1e-6, F - .0018); if (b.dataset.k === 'w') vol(.5);
      if (b.dataset.k === 'hot') T = 60; if (b.dataset.k === 'cold') T = 5; k = Kof(T); q = X / (F * Sc);
      const before = X; solve(); const sh = X > before * 1.001 ? 'right (more FeSCN²⁺)' : X < before * .999 ? 'left (less FeSCN²⁺)' : 'none';
      draw(q, k); $('#lcM').textContent = `${lab}: shifts ${sh}.`; nb.log([lab, q < k ? 'Q < K' : 'Q > K', sh.split(' ')[0], X > ctrl * 1.05 ? 'darker red' : X < ctrl * .95 ? 'paler' : 'about the same']); });
    draw(); return () => { };
  },
  post: [
    () => mcFrom('Adding AgNO₃ to the Fe³⁺/SCN⁻ equilibrium makes the solution paler. Why?', 'Ag⁺ removes SCN⁻, so the equilibrium shifts left', ['Ag⁺ adds a product, so it shifts left', 'Ag⁺ raises K', 'Ag⁺ is a catalyst'], ['AgSCN precipitates, lowering [SCN⁻].', 'Removing a reactant makes Q &gt; K: <b>shifts left</b>.']),
    () => mcFrom('The solution gets lighter when heated. What does that tell you about the forward reaction?', 'It is exothermic', ['It is endothermic', 'It has ΔH = 0', 'It is not at equilibrium'], ['Heating favors the endothermic direction.', 'It shifted left, so the forward direction is <b>exothermic</b>.']),
    () => mcFrom('For N₂ + 3H₂ ⇌ 2NH₃, what happens if you decrease the volume?', 'Shifts right (fewer moles of gas)', ['Shifts left', 'No change', 'K increases'], ['Higher pressure favors the side with fewer gas molecules.', '4 → 2 moles: <b>shifts right</b>.']),
  ],
});

LABS.push({
  id: 'buffer', course: '1112', icon: '🛡️', title: 'Buffer solutions', utd: 'Buffer Solutions',
  goal: 'Add strong acid and base to water and to an acetate buffer, and compare the pH changes.',
  intro: `<p>A buffer is a weak acid plus its conjugate base. Added H⁺ is absorbed by A⁻; added OH⁻ is absorbed by HA. <b>Henderson–Hasselbalch:</b> pH = pK<sub>a</sub> + log([A⁻]/[HA]). For acetic acid, pK<sub>a</sub> = 4.76.</p>`,
  steps: ['Pick a buffer recipe.', 'Add 1.0 mL portions of 0.10 M HCl (or NaOH) to both beakers.', 'Record the pH of each after every addition.', 'Compare how much the pH moves.'],
  cols: ['Added (mL)', 'Reagent', 'pH water', 'pH buffer'],
  sim(box, nb) {
    const recipes = { '1:1 (0.10 M each)': [.1, .1], '3:1 OAc⁻:HOAc': [.15, .05], '1:3 OAc⁻:HOAc': [.05, .15], 'dilute 1:1 (0.010 M)': [.01, .01] };
    let rc = Object.keys(recipes)[0], add = 0; const pw = [], pb = [];
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="buV" class="bench"></div></div><div class="rig-r"><label class="sl">Buffer (50.0 mL)<select id="buR">${Object.keys(recipes).map(k => `<option>${k}</option>`).join('')}</select></label><div class="btnrow"><button class="btn" id="buA">+1.0 mL HCl</button><button class="btn" id="buB">+1.0 mL NaOH</button><button class="btn" id="buZ">↺ Fresh beakers</button></div><div id="buP"></div></div></div>`;
    const calc = () => { const V = (50 + Math.abs(add)) / 1000, [a, h] = recipes[rc], nA = a * .05, nH = h * .05, nb_ = add * .1 / 1000; return [phSolve(0, [], nb_ / V), phSolve((nA + nH) / V, [4.76], (nA + nb_) / V)]; };
    const draw = () => { const [w, b] = calc(); const ind = p => `hsl(${clamp((p - 2) * 22, 0, 280)},75%,55%)`;
      $('#buV').innerHTML = `<div class="col">${beakerSVG(ind(w), .5)}<b>${w.toFixed(2)}</b><span>water</span></div><div class="col">${beakerSVG(ind(b), .5)}<b>${b.toFixed(2)}</b><span>buffer</span></div>`;
      $('#buP').innerHTML = plot({ x: [-10, 10], y: [0, 14], xl: 'mL added (− = HCl, + = NaOH)', yl: 'pH', series: [{ pts: pw.slice().sort((p, q) => p[0] - q[0]), type: 'line', cls: 'c2' }, { pts: pw, cls: 'c2', r: 3.5 }, { pts: pb.slice().sort((p, q) => p[0] - q[0]), type: 'line', cls: 'c1' }, { pts: pb, cls: 'c1', r: 3.5 }], notes: [[-9.5, 13, 'water'], [-9.5, 6.5, 'buffer']] }); return [w, b]; };
    const go = d => { if (Math.abs(add + d) > 10) return; add += d; const [w, b] = draw(); pw.push([add, w]); pb.push([add, b]); nb.log([Math.abs(add).toFixed(1), add < 0 ? 'HCl' : 'NaOH', w.toFixed(2), b.toFixed(2)]); draw(); };
    $('#buA').onclick = () => go(-1); $('#buB').onclick = () => go(1); $('#buZ').onclick = () => { add = 0; pw.length = pb.length = 0; const [w, b] = draw(); pw.push([0, w]); pb.push([0, b]); draw(); };
    $('#buR').onchange = e => { rc = e.target.value; $('#buZ').onclick(); }; $('#buZ').onclick(); return () => { };
  },
  post: [
    () => { const a = R.real(.05, .2, 2), h = R.real(.05, .2, 2), p = 4.76 + Math.log10(a / h); return numQ(`What is the pH of a buffer with ${a} M CH₃COO⁻ and ${h} M CH₃COOH? (pK<sub>a</sub> = 4.76)`, p, '', [`pH = pK<sub>a</sub> + log([A⁻]/[HA])`, `= 4.76 + log(${a}/${h}) = <b>${p.toFixed(2)}</b>`], { abs: .02 }); },
    () => { const nA = .005, nH = .005, add = R.pick([.0005, .001, .0015]), p = 4.76 + Math.log10((nA - add) / (nH + add)); return numQ(`A buffer has 0.0050 mol HOAc and 0.0050 mol OAc⁻. You add ${add} mol HCl. New pH? (pK<sub>a</sub> 4.76)`, p, '', [`H⁺ converts OAc⁻ to HOAc: OAc⁻ = ${sig(nA - add, 2)} mol, HOAc = ${sig(nH + add, 2)} mol`, `pH = 4.76 + log(${sig(nA - add, 2)}/${sig(nH + add, 2)}) = <b>${p.toFixed(2)}</b>`], { abs: .02 }); },
    () => mcFrom('Which buffer resists pH change best?', '0.50 M HA / 0.50 M A⁻', ['0.050 M HA / 0.050 M A⁻', '0.50 M HA / 0.050 M A⁻', '0.010 M HA / 0.50 M A⁻'], ['Capacity is highest when concentrations are high and the ratio is near 1:1.', '<b>0.50 M / 0.50 M</b>.']),
  ],
});

const DIACIDS = [['Oxalic acid', 90.03, [1.25, 4.27]], ['Malonic acid', 104.06, [2.85, 5.70]], ['Maleic acid', 116.07, [1.92, 6.23]], ['Succinic acid', 118.09, [4.21, 5.64]], ['Tartaric acid', 150.09, [2.98, 4.34]]];
LABS.push({
  id: 'diprotic', course: '1112', icon: '📈', title: 'Identify a diprotic acid by titration', utd: 'Determination of Molar Mass and Identity of a Diprotic Acid',
  goal: 'Titrate a weighed unknown diprotic acid with a pH meter, find both equivalence points, and identify the acid from its molar mass and pK<sub>a</sub> values.',
  intro: `<p>A diprotic acid H₂A gives up two protons, so the curve has <b>two equivalence points</b>. At the second one, mol NaOH = 2 × mol H₂A.</p><p>At the halfway points (½V<sub>eq1</sub> and halfway between eq1 and eq2), pH = pK<sub>a1</sub> and pH = pK<sub>a2</sub>.</p><p>Molar mass = grams of acid / (mol NaOH at eq2 ÷ 2).</p>`,
  steps: ['Dissolve the weighed acid in 50 mL of water.', 'Add 0.1000 M NaOH in 1 mL steps, using smaller steps where the pH changes fast.', 'Record pH after every addition.', 'Find V<sub>eq2</sub>, calculate molar mass, and read the pK<sub>a</sub>s.'],
  cols: ['NaOH (mL)', 'pH'],
  sim(box, nb) { const a = R.pick(DIACIDS), g = R.real(.11, .18, 4); this.a = a; box.insertAdjacentHTML('beforebegin', `<p class="given">Unknown diprotic acid: <b>${g.toFixed(4)} g</b> in 50.0 mL water</p>`);
    return titrationRig(box, nb, { M: .1, V0: 50, mol: g / a[1], pKas: a[2], ind: null, meter: true, cap: 50, what: 'unknown H₂A', tip: 'Record a point after every addition. Use 0.10 mL steps where the pH jumps.' }); },
  chart(rows) { const p = rows.map(r => [+r[0], +r[1]]).sort((a, b) => a[0] - b[0]); if (p.length < 4) return ''; let best = [0, 0]; for (let i = 1; i < p.length; i++) { const d = (p[i][1] - p[i - 1][1]) / (p[i][0] - p[i - 1][0] || 1); if (p[i][1] > 7 && d > best[0]) best = [d, (p[i][0] + p[i - 1][0]) / 2]; }
    return `<p class="fit">Steepest jump above pH 7 near <b>${best[1].toFixed(2)} mL</b> (V<sub>eq2</sub>). Molar mass = g / (0.1000 × V<sub>eq2</sub>/1000 ÷ 2). Compare to: ${DIACIDS.map(d => `${d[0]} ${d[1]}`).join(' · ')}</p>`; },
  post: [
    () => { const a = R.pick(DIACIDS), g = R.real(.11, .18, 4), V = g / a[1] * 2 / .1 * 1000; return mcFrom(`${g} g of a diprotic acid reaches its second equivalence point at ${V.toFixed(2)} mL of 0.1000 M NaOH. Which acid is it?`, a[0], DIACIDS.map(d => d[0]), [`mol NaOH = 0.1000 × ${(V / 1000).toFixed(5)} = ${sig(V / 1e4, 4)} mol`, `mol H₂A = ÷ 2 = ${sig(V / 2e4, 4)} mol`, `MM = ${g} / ${sig(V / 2e4, 4)} = ${sig(a[1], 4)} g/mol → <b>${a[0]}</b>`]); },
    () => { const v1 = R.real(10, 16, 2); return mcFrom(`The first equivalence point is at ${v1} mL. At what volume does pH = pK<sub>a2</sub>?`, (v1 * 1.5).toFixed(2) + ' mL', [(v1 / 2).toFixed(2) + ' mL', (v1 * 2).toFixed(2) + ' mL', v1.toFixed(2) + ' mL'], ['pH = pK<sub>a2</sub> halfway between eq1 and eq2.', `eq2 = 2 × ${v1}; halfway = 1.5 × ${v1} = <b>${(v1 * 1.5).toFixed(2)} mL</b>`]); },
  ],
});

LABS.push({
  id: 'ksp', course: '1112', icon: '🍷', title: 'Solubility product constant', utd: 'Determination of Solubility Product Constant',
  goal: 'Titrate saturated potassium hydrogen tartrate (KHT) with NaOH to find its solubility and K<sub>sp</sub>.',
  intro: `<p class="mono">KHC₄H₄O₆(s) ⇌ K⁺ + HC₄H₄O₆⁻ &nbsp; K<sub>sp</sub> = [K⁺][HT⁻] = s²</p><p>The hydrogen tartrate ion is a weak acid, so titrating the filtered saturated solution with NaOH measures [HT⁻] = s.</p>`,
  steps: ['Filter 25.00 mL of saturated KHT solution into the flask and add phenolphthalein.', 'Titrate with 0.0500 M NaOH to the first faint pink.', 'mol NaOH = mol HT⁻ → s = mol / 0.02500 L.', 'K<sub>sp</sub> = s².'],
  cols: ['Trial', 'Initial (mL)', 'Final (mL)', 'Volume NaOH (mL)', 'Color'],
  sim(box, nb) { const s = R.real(.028, .034, 4); return titrationRig(box, nb, { M: .05, V0: 25, mol: s * .025, pKas: [4.34], ind: 'phth', what: '25.00 mL sat. KHT' }); },
  chart(rows) { const g = rows.filter(r => r[4].includes('✓')).map(r => +r[3]); if (!g.length) return ''; const v = g.reduce((a, b) => a + b, 0) / g.length, s = .05 * v / 25; return `<p class="fit">s = (0.0500)(${v.toFixed(2)})/25.00 = ${sig(s, 3)} M → <b>K<sub>sp</sub> = s² = ${sig(s * s, 3)}</b></p>`; },
  post: [
    () => { const V = R.real(14, 17, 2), s = .05 * V / 25; return numQ(`25.00 mL of saturated KHT needs ${V} mL of 0.0500 M NaOH. What is K<sub>sp</sub>?`, s * s, '', [`s = (0.0500)(${V})/25.00 = ${sig(s, 3)} M`, `K<sub>sp</sub> = s² = <b>${sig(s * s, 3)}</b>`]); },
    () => mcFrom('You add some solid KCl to the saturated KHT solution. What happens to the solubility of KHT?', 'It decreases (common-ion effect)', ['It increases', 'It stays the same', 'K<sub>sp</sub> decreases'], ['Extra K⁺ pushes KHT ⇌ K⁺ + HT⁻ to the left.', 'Less dissolves: <b>common-ion effect</b>. K<sub>sp</sub> itself does not change.']),
    () => { const s = R.real(1e-4, 9e-4, 6); return numQ(`The molar solubility of PbI₂ is ${s.toExponential(2)} M. What is K<sub>sp</sub>?`, 4 * s ** 3, '', ['PbI₂ → Pb²⁺ + 2I⁻: [Pb²⁺] = s, [I⁻] = 2s', `K<sub>sp</sub> = s(2s)² = 4s³ = <b>${(4 * s ** 3).toExponential(2)}</b>`]); },
  ],
});

LABS.push({
  id: 'borax', course: '1112', icon: '📉', title: 'Entropy of borax dissolution', utd: 'Entropy of Borax Dissolution',
  goal: 'Measure K<sub>sp</sub> of borax at several temperatures and use a van \'t Hoff plot to find ΔH° and ΔS°.',
  intro: `<p class="mono">Na₂B₄O₅(OH)₄·8H₂O(s) ⇌ 2Na⁺ + B₄O₅(OH)₄²⁻ + 8H₂O &nbsp; K<sub>sp</sub> = 4s³</p><p>Titrate the borate with HCl (2 H⁺ per borate) to find s. Then:</p><p class="mono">ln K = −(ΔH°/R)(1/T) + ΔS°/R</p><p>Plot ln K vs. 1/T: slope = −ΔH°/R, intercept = ΔS°/R.</p>`,
  steps: ['Hold the saturated solution at a set temperature.', 'Pipet 5.00 mL and titrate with 0.100 M HCl (bromocresol green).', 'Repeat at 4–5 temperatures.', 'Make the van \'t Hoff plot.'],
  cols: ['T (°C)', 'HCl (mL)', 's (M)', 'K<sub>sp</sub>', 'ln K'],
  sim(box, nb) {
    box.innerHTML = `<div class="rig"><div class="rig-l"><div id="bxV" class="bench"></div></div><div class="rig-r"><label class="sl">Water bath <b id="bxL"></b><input type="range" id="bxT" min="20" max="55" step="5" value="25"></label><div class="btnrow"><button class="btn pri" id="bxGo">🧪 Pipet 5.00 mL &amp; titrate</button></div><p class="tip">Warmer → more borax dissolves → more HCl needed.</p></div></div>`;
    const u = () => { $('#bxL').textContent = $('#bxT').value + ' °C'; $('#bxV').innerHTML = beakerSVG(`rgba(240,240,250,.7)`, .55, `<rect x="16" y="112" width="78" height="12" fill="#fff" stroke="#bbb"/>`) + `<div class="therm-mini">${$('#bxT').value} °C</div>`; }; $('#bxT').oninput = u; u();
    $('#bxGo').onclick = () => { const T = +$('#bxT').value + 273.15, K = Math.exp(-110000 / (RG * T) + 300 / RG), s = Math.cbrt(K / 4) * (1 + jit(.015)), V = s * .005 * 2 / .1 * 1000, ss = V / 1000 * .1 / 2 / .005, Kk = 4 * ss ** 3; nb.log([$('#bxT').value, V.toFixed(2), ss.toFixed(4), Kk.toExponential(2), Math.log(Kk).toFixed(3)]); };
  },
  chart(rows) { const p = rows.map(r => [1 / (+r[0] + 273.15), +r[4]]); if (new Set(rows.map(r => r[0])).size < 2) return ''; const f = linfit(p), xs = p.map(q => q[0]);
    return plot({ x: [Math.min(...xs) * .997, Math.max(...xs) * 1.003], y: [Math.min(...p.map(q => q[1])) - .5, Math.max(...p.map(q => q[1])) + .5], xl: '1/T (K⁻¹)', yl: 'ln Ksp', series: [{ pts: p, cls: 'c1' }, { pts: [[Math.min(...xs), f.m * Math.min(...xs) + f.b], [Math.max(...xs), f.m * Math.max(...xs) + f.b]], type: 'line', cls: 'fitl' }] }) + fitNote(f, '(1/T)', 'ln K') + `<p class="fit">ΔH° = −slope × R = <b>${sig(-f.m * RG / 1000, 3)} kJ/mol</b> · ΔS° = intercept × R = <b>${sig(f.b * RG, 3)} J/mol·K</b></p>`; },
  post: [
    () => { const m = -R.real(12500, 13800, 0); return numQ(`A van 't Hoff plot has slope ${m} K. What is ΔH°? (kJ/mol)`, -m * RG / 1000, 'kJ/mol', ['slope = −ΔH°/R', `ΔH° = −(${m})(8.314) = <b>${sig(-m * RG / 1000, 3)} kJ/mol</b>`]); },
    () => { const V = R.real(3, 12, 2), s = V / 1000 * .1 / 2 / .005; return numQ(`5.00 mL of saturated borax needs ${V} mL of 0.100 M HCl. What is K<sub>sp</sub>? (2 HCl per borate)`, 4 * s ** 3, '', [`mol borate = (0.100)(${V / 1000}) / 2 = ${sig(V / 1000 * .05, 3)} mol`, `s = ÷ 0.00500 L = ${sig(s, 3)} M`, `K<sub>sp</sub> = 4s³ = <b>${sig(4 * s ** 3, 3)}</b>`]); },
    () => mcFrom('Borax dissolves more at higher temperature. What are the signs of ΔH° and ΔS°?', 'ΔH° > 0, ΔS° > 0', ['ΔH° < 0, ΔS° > 0', 'ΔH° > 0, ΔS° < 0', 'ΔH° < 0, ΔS° < 0'], ['K increases with T → endothermic (ΔH° > 0).', 'It is spontaneous only at higher T, so TΔS must win: <b>ΔS° > 0</b>.']),
  ],
});

LABS.push({
  id: 'voltaic', course: '1112', icon: '🔋', title: 'Voltaic cells', utd: 'Voltaic Cell',
  goal: 'Build galvanic cells from pairs of metals, measure the voltage, and test the Nernst equation.',
  intro: `<p>The metal with the more negative E° is oxidized at the <b>anode</b>; electrons flow through the wire to the <b>cathode</b>. E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub>.</p><p><b>Nernst:</b> E = E° − (0.0592/n) log Q at 25 °C.</p>`,
  steps: ['Choose the left and right electrodes.', 'Connect the voltmeter (red lead on the right).', 'A positive reading means the right side is the cathode.', 'Change concentrations and compare to the Nernst equation.'],
  cols: ['Left | Right', '[left ion] (M)', '[right ion] (M)', 'E measured (V)', 'E° (V)'],
  sim(box, nb) {
    const M = [['Mg', 2, -2.37, '#ccc'], ['Zn', 2, -.76, '#bfc6cc'], ['Fe', 2, -.44, '#8a8f94'], ['Ni', 2, -.25, '#a9a28c'], ['Pb', 2, -.13, '#6f7378'], ['Cu', 2, .34, '#c87533'], ['Ag', 1, .80, '#e5e5e5']];
    let L = 1, Rr = 5, raf = 0;
    box.innerHTML = `<div class="rig"><div class="rig-l"><svg class="cell" viewBox="0 0 320 210" id="vcV" aria-hidden="true"></svg></div><div class="rig-r"><label class="sl">Left electrode<select id="vcL">${M.map((m, i) => `<option value="${i}" ${i === L ? 'selected' : ''}>${m[0]} | ${m[0]}${m[1] === 1 ? '⁺' : '²⁺'}</option>`).join('')}</select></label><label class="sl">Right electrode<select id="vcR">${M.map((m, i) => `<option value="${i}" ${i === Rr ? 'selected' : ''}>${m[0]} | ${m[0]}${m[1] === 1 ? '⁺' : '²⁺'}</option>`).join('')}</select></label>
      <label class="sl">[left ion] <b id="vcCL"></b><input type="range" id="vcA" min="-3" max="0" step="1" value="0"></label><label class="sl">[right ion] <b id="vcCR"></b><input type="range" id="vcB" min="-3" max="0" step="1" value="0"></label><div class="readout"><span>Voltmeter</span><b id="vcE"></b></div><div class="btnrow"><button class="btn pri" id="vcRec">📒 Record</button></div></div></div>`;
    const E = () => { const a = M[L], c = M[Rr], ca = 10 ** +$('#vcA').value, cc = 10 ** +$('#vcB').value, n = a[1] * c[1] / gcd(a[1], c[1]), E0 = c[2] - a[2], Q = ca ** (n / a[1]) / cc ** (n / c[1]); return { E0, E: E0 - .0592 / n * Math.log10(Q), ca, cc }; };
    let ph = 0; const draw = () => { const r = E(), a = M[L], c = M[Rr], dir = r.E > 0 ? 1 : -1; ph += .015 * dir;
      $('#vcCL').textContent = r.ca + ' M'; $('#vcCR').textContent = r.cc + ' M'; $('#vcE').textContent = (r.E + jit(.0015)).toFixed(3) + ' V';
      const e = [...Array(5)].map((_, i) => { const t = ((i / 5 + ph) % 1 + 1) % 1; const x = 70 + t * 180; return `<circle class="eflow" cx="${x}" cy="22" r="4"/>`; }).join('');
      $('#vcV').innerHTML = `<path class="wire" d="M70 80V22H250V80"/><rect class="vm" x="130" y="6" width="60" height="32" rx="6"/><text class="vmt" x="160" y="27">${r.E.toFixed(2)} V</text>${e}
        <path class="gl" d="M20 100v90h100v-90"/><rect class="liq" x="22" y="125" width="96" height="63" fill="rgba(140,190,255,.35)"/><rect x="62" y="70" width="16" height="100" fill="${a[3]}" stroke="#333"/>
        <path class="gl" d="M200 100v90h100v-90"/><rect class="liq" x="202" y="125" width="96" height="63" fill="${c[0] === 'Cu' ? 'rgba(40,120,230,.45)' : 'rgba(140,190,255,.35)'}"/><rect x="242" y="70" width="16" height="100" fill="${c[3]}" stroke="#333"/>
        <path class="bridge" d="M95 140V110q0-14 14-14h102q14 0 14 14v30"/><text class="tl" x="70" y="205">${r.E > 0 ? 'anode (−)' : 'cathode (+)'}</text><text class="tl" x="250" y="205">${r.E > 0 ? 'cathode (+)' : 'anode (−)'}</text><text class="tl" x="160" y="90">salt bridge</text>`;
      raf = requestAnimationFrame(draw); };
    $('#vcL').onchange = e => L = +e.target.value; $('#vcR').onchange = e => Rr = +e.target.value;
    $('#vcRec').onclick = () => { const r = E(); nb.log([`${M[L][0]} | ${M[Rr][0]}`, r.ca, r.cc, (r.E + jit(.0015)).toFixed(3), r.E0.toFixed(2)]); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  },
  post: [
    () => { const P = [['Zn', -.76], ['Cu', .34], ['Ag', .80], ['Ni', -.25], ['Pb', -.13], ['Fe', -.44]], [a, c] = R.shuffle(P).slice(0, 2).sort((x, y) => x[1] - y[1]); return numQ(`What is E°<sub>cell</sub> for a ${a[0]}/${c[0]} cell? (E°: ${a[0]} ${a[1]} V, ${c[0]} ${c[1]} V)`, c[1] - a[1], 'V', [`The more negative E° is the anode: ${a[0]}.`, `E° = E°<sub>cathode</sub> − E°<sub>anode</sub> = ${c[1]} − (${a[1]}) = <b>${(c[1] - a[1]).toFixed(2)} V</b>`], { abs: .011 }); },
    () => { const z = R.pick([.01, .1, 1]), cu = R.pick([.001, .01, .1]), E = 1.10 - .0296 * Math.log10(z / cu); return numQ(`Zn | Zn²⁺ (${z} M) || Cu²⁺ (${cu} M) | Cu, E° = 1.10 V. What is E?`, E, 'V', ['Zn + Cu²⁺ → Zn²⁺ + Cu, n = 2, Q = [Zn²⁺]/[Cu²⁺]', `E = 1.10 − (0.0592/2) log(${z}/${cu})`, `= <b>${E.toFixed(3)} V</b>`], { abs: .004 }); },
    () => mcFrom('In a working voltaic cell, which way do electrons flow?', 'Anode → cathode through the wire', ['Cathode → anode through the wire', 'Through the salt bridge', 'Anode → cathode through the solution'], ['Oxidation at the anode releases electrons.', 'They travel <b>through the external wire to the cathode</b>; ions move in the salt bridge.']),
  ],
});
