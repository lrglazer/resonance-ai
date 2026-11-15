/* ChemFluent — course-completion certificates (uses the shared certificate.js as window.Cert).
   Course certificate: every chapter mastered (80%+, the tiles' "Mastered" mark) AND the open-note final passed (70%+, finals.js).
   Virtual Lab certificate: every lab in that lab course scored 2 or more on its post-lab (S.labs[id] >= 2). */
(function () {
  'use strict';
  if (!window.Cert) return;
  const NOTE = 'Self-study course completion. Not college credit.';
  const DEEP = { '#FF8A6B': '#D9472B', '#7FA2FF': '#3D5BD9', '#FFC93C': '#A87400', '#3ED1AC': '#0F8F70', '#C29BFF': '#7646D6' };
  const theme = color => ({ bg: '#FFFDF7', ink: '#1D1B3A', accent: DEEP[color] || '#3D6BFF', font: 'Unbounded' });
  const LAB_TITLE = { '1111': 'General Chemistry I Lab', '1112': 'General Chemistry II Lab', '2123': 'Organic Chemistry Lab I', '2125': 'Organic Chemistry Lab II', bio: 'Biochemistry Lab Techniques' };
  const MASTER = 80, PASS = 2;
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function courseInfo(cid) {
    const co = COURSES.find(c => c.id === cid); if (!co) return null;
    const chs = CH.filter(c => c.course === cid); if (!chs.length) return null;
    const ms = chs.map(c => mastery(c.id)), done = ms.filter(m => m >= MASTER).length;
    const F = window.cfFinal, st = F ? F.status(cid) : { passed: false, best: null };
    // Course certificate = every chapter mastered AND the open-note final passed (70%+); it carries the final grade.
    return {
      co, total: chs.length, done, final: st, earned: done === chs.length && st.passed, left: chs.filter((c, i) => ms[i] < MASTER),
      opts: F ? F.certOpts(cid) : { id: 'chemfluent-' + cid, title: co.name, kind: 'Certificate of Completion', issuer: 'ChemFluent', site: 'chemfluent', detail: `All ${chs.length} chapters mastered`, modules: chs.map(c => c.title), theme: theme(co.color), note: NOTE },
    };
  }
  function labInfo(lid) {
    const co = LCOURSES.find(c => c.id === lid); if (!co) return null;
    const ls = LABS.filter(l => l.course === lid); if (!ls.length) return null;
    const sc = S.labs || {}, got = ls.map(l => sc[l.id] || 0), done = got.filter(g => g >= PASS).length;
    const pct = Math.round(ls.reduce((s, l, i) => s + Math.min(1, got[i] / Math.max(1, Math.min(3, (l.post || []).length))), 0) / ls.length * 100);
    return {
      co, total: ls.length, done, earned: done === ls.length, left: ls.filter((l, i) => got[i] < PASS),
      opts: { id: 'chemfluent-lab-' + lid, site: 'chemfluent', title: LAB_TITLE[lid] || co.name, kind: 'Virtual Lab Certificate', issuer: 'ChemFluent', detail: `All ${ls.length} virtual labs completed with post-labs passed`, modules: ls.map(l => l.title), score: pct, theme: theme(co.color), note: NOTE },
    };
  }

  function card(info, what) {
    const { opts, done, total, earned } = info, p = Math.round(done / total * 100);
    if (earned) {
      const have = Cert.has(opts.id);
      return `<div class="cfc-card won"><span class="cfc-ic" aria-hidden="true">🎓</span><div class="cfc-tx"><b>${have ? 'Certificate earned' : 'You earned the certificate!'}</b><small>${escH(opts.title)} · ${escH(opts.kind)}</small></div>${Cert.button(Object.assign({}, opts, { className: 'btn pri cfc-go' }))}</div>`;
    }
    const next = info.left.slice(0, 3).map(x => x.title).join(', ') + (info.left.length > 3 ? '…' : '');
    if (what === 'course') {
      const f = info.final || {}, fin = f.best == null ? 'Final: not taken yet' : `Final best: ${Math.round(f.best)}%${f.passed ? ' ✓' : ' (need 70%)'}`;
      const todo = info.left.length ? `Next: ${escH(next)}.` : `All chapters mastered. <a href="#/final/${info.co.id}">Take the open-note final →</a>`;
      const pp = Math.round((done + (f.passed ? 1 : 0)) / (total + 1) * 100);
      return `<div class="cfc-card"><span class="cfc-ic" aria-hidden="true">🎓</span><div class="cfc-tx"><b>${done} of ${total} chapters mastered · ${fin}</b><small>Certificate = every chapter at 80%+ and the final at 70%+. ${todo}</small></div><span class="cfc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pp}" aria-label="Certificate progress"><i style="width:${pp}%"></i></span></div>`;
    }
    const rule = `Score ${PASS}/3 or better on every post-lab to earn the Virtual Lab certificate.`;
    return `<div class="cfc-card"><span class="cfc-ic" aria-hidden="true">🎓</span><div class="cfc-tx"><b>${done} of ${total} labs passed</b><small>${rule} Next: ${escH(next)}</small></div><span class="cfc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="Certificate progress"><i style="width:${p}%"></i></span></div>`;
  }

  function fill() {
    document.querySelectorAll('[data-cfc]').forEach(el => {
      const [k, id] = el.dataset.cfc.split(':');
      let h = '';
      if (k === 'course') { const i = courseInfo(id); h = i ? card(i, 'course') : ''; }
      else if (k === 'lab') { const i = labInfo(id); h = i ? card(i, 'lab') : ''; }
      else if (k === 'wall') { const n = Cert.list().filter(r => String(r.id).startsWith('chemfluent-')).length; h = n ? `<section class="course"><div class="course-h"><div><span class="code">Self-study</span><h2>🎓 Your certificates</h2></div></div>${Cert.wall()}</section>` : ''; }
      if (el.innerHTML !== h) el.innerHTML = h;
    });
  }

  const css = document.createElement('style');
  css.textContent = `
.cfcert:empty,.cfcert-wall:empty{display:none}
.cfc-card{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 16px;padding:12px 16px;border:var(--bw) solid var(--ink);border-radius:var(--r);background:var(--panel);box-shadow:var(--sh)}
.cfc-card.won{background:color-mix(in srgb,var(--cc,var(--lc,#FFC93C)) 26%,var(--panel))}
.labgrp .cfc-card.won{background:color-mix(in srgb,#FFC93C 26%,var(--panel))}
.cfc-ic{display:grid;place-items:center;width:44px;height:44px;flex:none;font-size:24px;border:var(--bw) solid var(--ink);border-radius:12px;background:var(--c3)}
.cfc-tx{flex:1 1 240px;min-width:0}.cfc-tx b{display:block;font:800 15px/1.25 Unbounded,"Arial Black",sans-serif}.cfc-tx small{display:block;color:var(--muted);font-size:14px;line-height:1.4;margin-top:3px}
.cfc-bar{flex:0 1 160px;height:14px;border:2px solid var(--ink);border-radius:99px;overflow:hidden;background:var(--panel2)}.cfc-bar i{display:block;height:100%;background:var(--c4)}
.ctc-btn.cfc-go{min-height:0;padding:11px 18px;border:var(--bw) solid var(--ink);border-radius:12px;background:var(--c4);color:#10132A;box-shadow:var(--sh);font:700 15px "Atkinson Hyperlegible",sans-serif}
.ctc-btn.cfc-go:hover{transform:translate(-2px,-2px);box-shadow:var(--sh2)}
.cfcert-wall .ctc-card{border:var(--bw) solid var(--ink);background:var(--panel);box-shadow:var(--sh);border-radius:var(--r)}
.cfcert-wall .ctc-card b{font-family:Unbounded,"Arial Black",sans-serif;font-weight:800}
.ctc-dlg{border:3px solid #1D1B3A;box-shadow:8px 8px 0 #1D1B3A}.ctc-dlg h2{font-weight:800}
.ctc-dlg .ctc-b{border:2.5px solid #1D1B3A;box-shadow:3px 3px 0 #1D1B3A;font-family:"Atkinson Hyperlegible",system-ui,sans-serif}
.ctc-dlg .ctc-in{border:2.5px solid #1D1B3A}`;
  document.head.appendChild(css);

  fill();
  const mainEl = document.getElementById('main');
  if (mainEl && window.MutationObserver) new MutationObserver(fill).observe(mainEl, { childList: true });
  addEventListener('hashchange', fill);
  document.addEventListener('ct-cert-change', fill);
  document.addEventListener('cf-final-done', fill);
  addEventListener('storage', fill);
  window.cfCert = { courseInfo, labInfo, fill };
})();
