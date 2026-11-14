/* Study Board: a Monopoly-style progress board for every course. Chapters are properties: master a chapter (80%+) to own it,
   each 20% of mastery builds a house. Roll the dice, hop around the board, and land on a chapter to practice it.
   Colors and fonts come from the host site, so it looks native everywhere. Config: window.QUEST = { key, route(id), exam(course), label(c) }. */
(() => {
  const Q = window.QUEST || {}; if (typeof CH === 'undefined' || typeof COURSES === 'undefined') return;
  const KEY = 'board:' + (Q.key || location.pathname), LS = { get(d) { try { return JSON.parse(localStorage.getItem(KEY)) || d; } catch (e) { return d; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };
  const S = LS.get({ pos: {}, coins: 200, rolls: 0, lastDay: '', streak: 0, course: '' });
  const M = id => { try { return typeof mastery === 'function' ? mastery(id) : 0; } catch (e) { return 0; } };
  const label = c => (Q.label ? Q.label(c) : c.title).replace(/^Ch\s*[\d–\-, ]+\s*·\s*/, '');
  const CARDS = [['Pop quiz!', 'Go to your weakest chapter and get one right.', 'weak'], ['Scholarship', 'Collect 50 coins.', 50], ['Lab fee', 'Pay 20 coins.', -20], ['Office hours', 'Advance to GO. Collect 100.', 'go'], ['Study group', 'Collect 30 coins for every chapter you own.', 'own'], ['All-nighter', 'Move back 3 spaces.', -3], ['Curve!', 'Collect 75 coins.', 75], ['Mistake review', 'Clear one missed question.', 'review']];
  const css = `#qbtn{position:fixed;left:18px;bottom:18px;z-index:60;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:2px solid currentColor;box-shadow:3px 3px 0 currentColor}
  #qbtn:hover{transform:translate(-1px,-1px)}#qdlg{position:fixed;inset:0;z-index:80;display:none;place-items:center;background:rgba(0,0,0,.55);padding:12px}#qdlg.on{display:grid}
  .qwrap{width:min(940px,100%);max-height:96vh;overflow:auto;border-radius:18px;border:2px solid currentColor;padding:18px;box-shadow:6px 6px 0 rgba(0,0,0,.35)}
  .qtop{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.qtop h2{margin:0;font-size:22px}.qtop select{font:inherit;padding:6px 10px;border-radius:10px;border:1.5px solid currentColor;background:transparent;color:inherit}
  .qtop .sp{flex:1}.qpill{padding:4px 10px;border-radius:999px;border:1.5px solid currentColor;font-weight:700;font-size:13px}.qx{background:none;border:0;color:inherit;font-size:24px;cursor:pointer}
  .qboard{display:grid;gap:4px;aspect-ratio:1;width:100%;max-width:720px;margin:0 auto}
  .qt{position:relative;border:1.5px solid color-mix(in srgb,currentColor 35%,transparent);border-radius:8px;padding:4px 5px;font-size:10.5px;line-height:1.15;display:flex;flex-direction:column;gap:2px;overflow:hidden;cursor:pointer;background:color-mix(in srgb,currentColor 4%,transparent)}
  .qt .bar{height:7px;margin:-4px -5px 2px;background:var(--qc)}.qt b{font-size:10.5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .qt .h{margin-top:auto;letter-spacing:1px;font-size:10px}.qt.own{border-color:var(--qc);box-shadow:inset 0 0 0 2px var(--qc)}.qt.own::after{content:"OWNED";position:absolute;right:3px;bottom:2px;font-size:8px;font-weight:800;color:var(--qc)}
  .qt.corner{place-items:center;justify-content:center;text-align:center;font-weight:800;font-size:12px}.qt.corner span{font-size:22px}.qt.chance{justify-content:center;text-align:center}.qt.chance span{font-size:20px}
  .qt.here{outline:3px solid currentColor;outline-offset:1px}.qtok{position:absolute;top:10px;right:4px;font-size:18px;animation:qhop .3s ease}@keyframes qhop{40%{transform:translateY(-8px) scale(1.15)}}
  .qmid{grid-area:2/2/-2/-2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:8px}
  .qdice{display:flex;gap:10px}.qdie{width:52px;height:52px;border-radius:12px;border:2px solid currentColor;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:6px;background:color-mix(in srgb,currentColor 6%,transparent)}.qdie i{width:9px;height:9px;border-radius:50%;background:currentColor;place-self:center;visibility:hidden}.qdie i.v{visibility:visible}.qdie.roll{animation:qroll .45s linear}
  @keyframes qroll{50%{transform:rotate(180deg) scale(.85)}100%{transform:rotate(360deg)}}
  .qgo{font:inherit;font-weight:800;padding:10px 22px;border-radius:999px;border:2px solid currentColor;cursor:pointer;box-shadow:3px 3px 0 currentColor;background:var(--qacc,#FDDB25);color:#111}.qgo:disabled{opacity:.5}
  .qmsg{max-width:36ch;min-height:3.2em;font-size:14px}.qmsg a{font-weight:800;color:inherit;text-decoration:underline;text-decoration-thickness:2px}.qcard{border:2px dashed currentColor;border-radius:12px;padding:8px 12px;animation:qflip .5s ease}@keyframes qflip{from{transform:rotateY(90deg)}}
  .qstats{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:12px;opacity:.85}
  @media (max-width:640px){.qt{font-size:8.5px;padding:3px}.qt b{font-size:8.5px}.qdie{width:40px;height:40px}#qbtn{bottom:74px}}
  @media (prefers-reduced-motion:reduce){.qdie.roll,.qtok,.qcard{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'qbtn'; btn.innerHTML = '🎲 Study Board'; document.body.appendChild(btn);
  const dlg = document.createElement('div'); dlg.id = 'qdlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-label', 'Study board'); document.body.appendChild(dlg);
  const paint = () => { const cs = getComputedStyle(document.body); let bg = cs.backgroundColor; if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) bg = getComputedStyle(document.documentElement).backgroundColor; if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) bg = '#fff'; btn.style.background = bg; btn.style.color = cs.color; return { bg, ink: cs.color }; };
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const die = n => `<div class="qdie">${[...Array(9)].map((_, i) => `<i class="${PIPS[n].includes(i) ? 'v' : ''}"></i>`).join('')}</div>`;
  const courses = () => COURSES.filter(co => CH.some(c => c.course === co.id));
  function tiles(co) {
    const chs = CH.filter(c => c.course === co.id); let T = Math.max(12, Math.ceil((chs.length + 4 + Math.ceil(chs.length / 4)) / 4) * 4); const side = T / 4;
    const list = Array(T).fill(null); list[0] = { k: 'go' }; list[side] = { k: 'exam' }; list[2 * side] = { k: 'park' }; list[3 * side] = { k: 'review' };
    const free = list.map((x, i) => x ? -1 : i).filter(i => i >= 0); const nCh = Math.min(chs.length, free.length - 1);
    const step = free.length / Math.max(1, free.length - nCh); const chanceAt = new Set(); for (let j = 0; j < free.length - nCh; j++) chanceAt.add(free[Math.min(free.length - 1, Math.floor(j * step + step / 2))]);
    let ci = 0; free.forEach(i => { if (chanceAt.has(i) || ci >= nCh) list[i] = { k: 'chance' }; else list[i] = { k: 'ch', c: chs[ci++] }; });
    return { list, side, T };
  }
  const gridPos = (i, side) => { const n = side + 1; if (i <= side) return [n, n - i]; if (i <= 2 * side) return [n - (i - side), 1]; if (i <= 3 * side) return [1, 1 + (i - 2 * side)]; return [1 + (i - 3 * side), n]; };
  let busy = false;
  function render(msg) {
    const { bg, ink } = paint(); const cos = courses(); if (!cos.length) return; if (!cos.some(c => c.id === S.course)) S.course = cos[0].id;
    const co = cos.find(c => c.id === S.course), { list, side } = tiles(co), pos = S.pos[co.id] || 0, color = co.color || '#FDDB25';
    const owned = list.filter(t => t.k === 'ch' && M(t.c.id) >= 80).length, chN = list.filter(t => t.k === 'ch').length;
    const tileHTML = (t, i) => { const [r, c] = gridPos(i, side), here = i === pos ? '<span class="qtok">♟</span>' : '', sty = `grid-area:${r}/${c};--qc:${color}`;
      if (t.k === 'go') return `<div class="qt corner ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}"><span>➜</span>GO<small>+100</small>${here}</div>`;
      if (t.k === 'exam') return `<div class="qt corner ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}"><span>📝</span>EXAM${here}</div>`;
      if (t.k === 'park') return `<div class="qt corner ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}"><span>☕</span>BREAK${here}</div>`;
      if (t.k === 'review') return `<div class="qt corner ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}"><span>↺</span>REVIEW${here}</div>`;
      if (t.k === 'chance') return `<div class="qt chance ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}"><span>?</span>CHANCE${here}</div>`;
      const m = M(t.c.id), houses = Math.min(4, Math.floor(m / 20)); return `<div class="qt ${m >= 80 ? 'own' : ''} ${i === pos ? 'here' : ''}" style="${sty}" data-i="${i}" title="${label(t.c)} · ${m}% mastered"><div class="bar"></div><b>${label(t.c)}</b><span class="h">${m >= 80 ? '🏨' : '🏠'.repeat(houses) || '·'} ${m}%</span>${here}</div>`; };
    dlg.innerHTML = `<div class="qwrap" style="background:${bg};color:${ink}"><div class="qtop"><h2>🎲 Study Board</h2><select id="qco" aria-label="Course">${cos.map(c => `<option value="${c.id}" ${c.id === co.id ? 'selected' : ''}>${c.code || c.id} · ${c.name}</option>`).join('')}</select><span class="sp"></span><span class="qpill">🪙 ${S.coins}</span><span class="qpill">🏠 ${owned}/${chN} owned</span><span class="qpill">🔥 ${S.streak} day${S.streak === 1 ? '' : 's'}</span><button class="qx" id="qclose" aria-label="Close">×</button></div>
      <div class="qboard" style="grid-template-columns:repeat(${side + 1},1fr);grid-template-rows:repeat(${side + 1},1fr)">${list.map(tileHTML).join('')}
      <div class="qmid"><div class="qdice" id="qd">${die(S.d1 || 3)}${die(S.d2 || 4)}</div><button class="qgo" id="qroll" style="--qacc:${color}">Roll the dice</button><div class="qmsg" id="qmsg">${msg || 'Land on a chapter to practice it. Master it (80%) to <b>own</b> it; every 20% builds a house. Own the whole board to win the course.'}</div>
      <div class="qstats"><span>${S.rolls} rolls</span><span>·</span><span>pass GO: +100</span><span>·</span><span>owned chapter: +25</span></div></div></div></div>`;
    dlg.querySelector('#qclose').onclick = close; dlg.querySelector('#qco').onchange = e => { S.course = e.target.value; LS.set(S); render(); };
    dlg.querySelector('#qroll').onclick = () => roll(co, list);
    dlg.querySelectorAll('.qt[data-i]').forEach(el => el.onclick = () => { const t = list[+el.dataset.i]; if (t.k === 'ch') { location.hash = Q.route(t.c.id); close(); } });
  }
  function land(co, list, i, passedGo) {
    const t = list[i]; let msg = passedGo ? '<b>Passed GO: +100 🪙.</b> ' : '';
    if (t.k === 'ch') { const m = M(t.c.id); if (m >= 80) { S.coins += 25; msg += `You own <b>${label(t.c)}</b>. Collect 25 🪙 rent. <a href="${Q.route(t.c.id)}">Keep it sharp →</a>`; } else msg += `<b>${label(t.c)}</b> is for sale. Pay with practice: get it to 80% to own it. <a href="${Q.route(t.c.id)}" data-close>Practice now →</a>`; }
    else if (t.k === 'go') { S.coins += 100; msg += 'Landed on GO: +100 🪙.'; }
    else if (t.k === 'exam') msg += `Exam time! <a href="${Q.exam(co.id)}" data-close>Take a timed practice exam →</a>`;
    else if (t.k === 'park') msg += 'Study break. Stretch, drink water, then roll again. ☕';
    else if (t.k === 'review') msg += `Go back over what you missed. <a href="${Q.review || '#/review'}" data-close>Open mistake review →</a>`;
    else { const c = CARDS[Math.floor(Math.random() * CARDS.length)]; let extra = '';
      if (typeof c[2] === 'number' && Math.abs(c[2]) > 5) S.coins = Math.max(0, S.coins + c[2]);
      else if (c[2] === 'go') { S.pos[co.id] = 0; S.coins += 100; }
      else if (c[2] === -3) S.pos[co.id] = (i - 3 + list.length) % list.length;
      else if (c[2] === 'own') S.coins += 30 * list.filter(x => x.k === 'ch' && M(x.c.id) >= 80).length;
      else if (c[2] === 'weak') { const w = list.filter(x => x.k === 'ch').sort((a, b) => M(a.c.id) - M(b.c.id))[0]; if (w) extra = ` <a href="${Q.route(w.c.id)}" data-close>${label(w.c)} →</a>`; }
      else if (c[2] === 'review') extra = ` <a href="${Q.review || '#/review'}" data-close>Review →</a>`;
      msg += `<div class="qcard"><b>${c[0]}</b><br>${c[1]}${extra}</div>`; }
    LS.set(S); render(msg); dlg.querySelectorAll('[data-close]').forEach(a => a.addEventListener('click', close));
  }
  function roll(co, list) {
    if (busy) return; busy = true; const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6); S.d1 = d1; S.d2 = d2; S.rolls++;
    const today = new Date().toDateString(); if (S.lastDay !== today) { const y = new Date(Date.now() - 864e5).toDateString(); S.streak = S.lastDay === y ? S.streak + 1 : 1; S.lastDay = today; }
    const dd = dlg.querySelector('#qd'); dd.innerHTML = die(d1) + die(d2); dd.querySelectorAll('.qdie').forEach(x => x.classList.add('roll')); dlg.querySelector('#qroll').disabled = true;
    let p = S.pos[co.id] || 0, k = 0, passed = false; const steps = d1 + d2;
    setTimeout(function hop() { p = (p + 1) % list.length; if (p === 0 && k < steps - 1) { passed = true; S.coins += 100; } S.pos[co.id] = p; k++;
      dlg.querySelectorAll('.qtok').forEach(x => x.remove()); dlg.querySelectorAll('.qt.here').forEach(x => x.classList.remove('here')); const el = dlg.querySelector(`.qt[data-i="${p}"]`); if (el) { el.classList.add('here'); el.insertAdjacentHTML('beforeend', '<span class="qtok">♟</span>'); }
      if (k < steps) setTimeout(hop, 170); else { busy = false; land(co, list, p, passed); } }, 480);
  }
  function open() { render(); dlg.classList.add('on'); }
  function close() { dlg.classList.remove('on'); }
  btn.onclick = open; dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  paint(); new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
})();
