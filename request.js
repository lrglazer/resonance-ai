/* Shared "Request a course" button + form. Sends the request to the owner dashboard inbox (never email). */
(() => {
  const INBOX = 'https://chalktalkstudy.com/api/inbox', SITE = document.title.split(/[:—–|]/)[0].trim();
  const css = `.rqbtn{position:fixed;right:18px;bottom:18px;z-index:60;font:700 14px system-ui,sans-serif;padding:10px 16px;border-radius:999px;border:2px solid currentColor;background:var(--panel,#fff);color:var(--ink,#111);cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18)}
  .rqbtn:hover{transform:translateY(-2px)}
  .rqwrap{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px}
  .rqbox{width:min(440px,100%);background:var(--panel,#fff);color:var(--ink,#111);border:2px solid var(--ink,#111);border-radius:14px;padding:20px 22px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)}
  .rqbox h3{margin:0 0 4px;font-size:20px}.rqbox p{margin:0 0 12px;opacity:.75;font-size:14px}
  .rqbox label{display:block;font-weight:600;font-size:13px;margin:10px 0 4px}
  .rqbox input,.rqbox textarea{width:100%;box-sizing:border-box;font:15px system-ui,sans-serif;padding:9px 11px;border-radius:8px;border:1.5px solid var(--line,#bbb);background:var(--panel2,#f6f6f6);color:inherit}
  .rqbox textarea{min-height:70px;resize:vertical}
  .rqrow{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
  .rqrow button{font:700 14px system-ui,sans-serif;padding:9px 14px;border-radius:8px;border:1.5px solid var(--ink,#111);background:transparent;color:inherit;cursor:pointer}
  .rqrow button.go{background:var(--acc,#E8742C);color:#fff;border-color:var(--acc,#E8742C)}
  @media print{.rqbtn{display:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const b = document.createElement('button'); b.className = 'rqbtn'; b.type = 'button'; b.textContent = '＋ Request a course'; b.setAttribute('aria-haspopup', 'dialog'); document.body.appendChild(b);
  b.onclick = () => {
    const w = document.createElement('div'); w.className = 'rqwrap';
    w.innerHTML = `<form class="rqbox" role="dialog" aria-label="Request a course"><h3>Request a course</h3><p>Tell us what you're studying and we'll build it next.</p>
      <label>Course <input name="course" required placeholder="e.g. Thermodynamics, Linear Algebra"></label>
      <label>School (optional) <input name="school" placeholder="e.g. UT Austin"></label>
      <label>Textbook (optional) <input name="book" placeholder="title or author"></label>
      <label>Anything else? (optional) <textarea name="notes" placeholder="topics, exam dates, what you struggle with"></textarea></label>
      <div class="rqrow"><button type="button" class="x">Cancel</button><button type="submit" class="go">Send request</button></div></form>`;
    document.body.appendChild(w); w.querySelector('input').focus(); const t0 = Date.now();
    const close = () => w.remove(); w.querySelector('.x').onclick = close; w.onclick = e => { if (e.target === w) close(); };
    w.querySelector('form').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
      const body = `Course: ${f.get('course')}\nSchool: ${f.get('school') || '-'}\nTextbook: ${f.get('book') || '-'}\n\n${f.get('notes') || ''}\n\n(sent from ${SITE})`;
      const box = e.target.querySelector('.rqrow'); box.innerHTML = '<span>Sending…</span>';
      fetch(INBOX, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: 'chemfluent', kind: 'request', message: body.slice(0, 2000), page: location.href, t: Date.now() - t0 }) })
        .then(r => { if (!r.ok) throw 0; box.innerHTML = '<b>Got it, thanks! We read every request.</b>'; setTimeout(close, 1600); })
        .catch(() => { box.innerHTML = "<span>That didn't send. Please try again in a minute.</span>"; setTimeout(close, 2200); }); };
    addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); removeEventListener('keydown', esc); } });
  };
})();
