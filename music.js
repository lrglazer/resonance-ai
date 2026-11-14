/* Study music: original procedurally generated lo-fi, ambient, rain and brown noise (Web Audio, no files, no copyright). */
(() => {
  'use strict';
  const MODES = [['lofi', '☕ lo-fi beats'], ['ambient', '🌌 ambient pads'], ['rain', '🌧 rain'], ['brown', '🟤 brown noise'], ['piano', '🎹 soft piano']];
  let ctx, master, nodes = [], timers = [], playing = false, mode = localStorage.getItem('study-music-mode') || 'lofi', vol = +(localStorage.getItem('study-music-vol') || .5);
  const css = document.createElement('style');
  css.textContent = `.mbtn{border:1px solid var(--line);background:var(--panel);color:var(--ink);height:34px;min-width:34px;padding:0 10px;border-radius:10px;cursor:pointer;font-size:15px;display:inline-flex;align-items:center;gap:6px}.mbtn.on{border-color:var(--acc);color:var(--acc);box-shadow:0 0 14px -4px var(--acc)}.mbtn .eqz{display:inline-flex;gap:2px;align-items:flex-end;height:12px}.mbtn .eqz i{width:3px;background:currentColor;border-radius:2px;animation:eqz 1s ease-in-out infinite}.mbtn .eqz i:nth-child(2){animation-delay:-.3s}.mbtn .eqz i:nth-child(3){animation-delay:-.6s}@keyframes eqz{0%,100%{height:3px}50%{height:12px}}
  .mpop{position:fixed;top:60px;right:14px;z-index:60;width:250px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px;box-shadow:0 20px 50px -20px rgba(0,0,0,.6);font-family:inherit}.mpop[hidden]{display:none}.mpop h4{margin:0 0 8px;font-size:13px;letter-spacing:.5px;text-transform:uppercase;opacity:.75}.mpop .mm{display:grid;gap:6px}.mpop .mm button{text-align:left;border:1px solid var(--line);background:var(--panel2,transparent);color:var(--ink);padding:8px 10px;border-radius:10px;cursor:pointer;font:inherit;font-size:14px}.mpop .mm button.on{border-color:var(--acc);color:var(--acc)}.mpop .mr{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px}.mpop input{flex:1;accent-color:var(--acc)}.mpop .pp{width:100%;margin-top:10px;border:0;border-radius:10px;padding:9px;font-weight:700;cursor:pointer;background:var(--acc);color:#111}.mpop small{display:block;margin-top:8px;opacity:.6;font-size:11px}`;
  document.head.appendChild(css);
  const bar = document.querySelector('.meta') || document.querySelector('.top') || document.body;
  const btn = document.createElement('button'); btn.className = 'mbtn'; btn.setAttribute('aria-label', 'Study music'); btn.title = 'Study music';
  const pop = document.createElement('div'); pop.className = 'mpop'; pop.hidden = true;
  const setBtn = () => { btn.classList.toggle('on', playing); btn.innerHTML = playing ? '<span class="eqz"><i></i><i></i><i></i></span>' : '♫'; };
  const draw = () => { pop.innerHTML = `<h4>Study music</h4><div class="mm">${MODES.map(([k, l]) => `<button data-m="${k}" class="${k === mode ? 'on' : ''}">${l}</button>`).join('')}</div><div class="mr">🔈<input type="range" min="0" max="1" step=".01" value="${vol}" aria-label="Volume">🔊</div><button class="pp">${playing ? '⏸ Pause' : '▶ Play'}</button><small>Original music generated live in your browser.</small>`;
    pop.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; localStorage.setItem('study-music-mode', mode); if (playing) { stop(); start(); } draw(); });
    pop.querySelector('input').oninput = e => { vol = +e.target.value; localStorage.setItem('study-music-vol', vol); if (master) master.gain.setTargetAtTime(vol * .6, ctx.currentTime, .05); };
    pop.querySelector('.pp').onclick = () => { playing ? stop() : start(); draw(); }; };
  btn.onclick = e => { e.stopPropagation(); pop.hidden = !pop.hidden; draw(); };
  document.addEventListener('click', e => { if (!pop.contains(e.target) && e.target !== btn) pop.hidden = true; });
  bar.insertBefore(btn, bar.firstChild); document.body.appendChild(pop); setBtn();

  const noiseBuf = (type) => { const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (type === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; };
  const loopNoise = (type, gain, filt) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(type); s.loop = true; const g = ctx.createGain(); g.gain.value = gain; let out = g; if (filt) { const f = ctx.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || .7; s.connect(f); f.connect(g); } else s.connect(g); g.connect(master); s.start(); nodes.push(s, g); return g; };
  const note = (freq, t, dur, type = 'triangle', gain = .06, cutoff = 1800) => { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(.4, dur * .3)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05); };
  const mtof = m => 440 * 2 ** ((m - 69) / 12);
  const drum = (t, kind) => { if (kind === 'k') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + .3); }
    else { const s = ctx.createBufferSource(); s.buffer = noiseBuf('white'); const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000; g.gain.setValueAtTime(kind === 's' ? .18 : .05, t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 's' ? .18 : .05)); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .25); } };
  const PROG = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 Em7 Dm7 Cmaj7
  const scheduler = (stepFn, spb) => { let next = ctx.currentTime + .1, i = 0; const tick = () => { while (next < ctx.currentTime + .6) { stepFn(i++, next); next += spb; } }; tick(); timers.push(setInterval(tick, 150)); };
  function start() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); master.gain.setTargetAtTime(vol * .6, ctx.currentTime, .4); nodes.push(master);
    if (mode === 'brown') loopNoise('brown', .9, ['lowpass', 900]);
    if (mode === 'rain') { loopNoise('white', .25, ['lowpass', 1400]); loopNoise('white', .08, ['highpass', 5000]); timers.push(setInterval(() => { for (let k = 0; k < 4; k++) { const t = ctx.currentTime + Math.random() * .25; note(1800 + Math.random() * 2600, t, .05, 'sine', .015 * Math.random(), 6000); } }, 250)); }
    if (mode === 'lofi') { loopNoise('white', .012, ['bandpass', 3000, .4]); const spb = 60 / 74 / 2; // eighth notes at 74 bpm
      scheduler((i, t) => { const bar = Math.floor(i / 8) % 4, s = i % 8, ch = PROG[bar]; const sw = s % 2 ? spb * .16 : 0; t += sw;
        if (s === 0) ch.forEach(m => note(mtof(m), t, spb * 8.2, 'triangle', .045, 900));
        if (s === 0 || s === 5) drum(t, 'k'); if (s === 4) drum(t, 's'); drum(t, 'h');
        if (s === 0) note(mtof(ch[0] - 12), t, spb * 3.5, 'sine', .14, 400); if (s === 6) note(mtof(ch[2] - 12), t, spb * 1.8, 'sine', .1, 400);
        if (Math.random() < .28) note(mtof(ch[Math.floor(Math.random() * 4)] + 12), t, spb * 1.4, 'sine', .035, 2400); }, spb); }
    if (mode === 'ambient') { const spb = 4; scheduler((i, t) => { const ch = PROG[i % 4]; ch.forEach((m, j) => { note(mtof(m), t + j * .25, 9, 'sine', .05, 1200); note(mtof(m + 12) * 1.003, t + j * .25, 9, 'triangle', .015, 2000); }); note(mtof(ch[0] - 24), t, 8, 'sine', .08, 300); }, spb); }
    if (mode === 'piano') { const spb = 60 / 66; scheduler((i, t) => { const ch = PROG[Math.floor(i / 4) % 4], s = i % 4; if (s === 0) note(mtof(ch[0] - 12), t, 3, 'sine', .09, 900); const m = ch[[0, 2, 1, 3][s]] + 12; note(mtof(m), t, 2.4, 'triangle', .05, 1600); note(mtof(m) * 2, t, 1.2, 'sine', .012, 3000); if (Math.random() < .3) note(mtof(ch[3] + 24), t + spb / 2, 1.5, 'sine', .02, 3000); }, spb); }
    playing = true; setBtn();
  }
  function stop() { timers.forEach(clearInterval); timers = []; const old = nodes; nodes = []; if (master) { master.gain.setTargetAtTime(0, ctx.currentTime, .15); } setTimeout(() => old.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch (e) { } }), 600); playing = false; setBtn(); }
})();
