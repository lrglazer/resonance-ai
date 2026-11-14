/* Chalk Talk bridge: a "Watch on Chalk Talk" button on every chapter (opens a live lesson on that topic) and a link to the Engineering Toolkit hub. */
(() => {
  const CT = 'https://chalktalkstudy.com';
  const css = `.ctw{display:inline-flex;align-items:center;gap:8px;margin:10px 8px 0 0;padding:7px 14px 7px 8px;border-radius:999px;background:#FDDB25;color:#111214!important;font:700 13.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none!important;border:2px solid #111214;box-shadow:2px 2px 0 #111214;transition:transform .15s}.ctw:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #111214}.ctw i{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#111214;color:#FDDB25;font-style:normal;font-size:10px}.ctk{display:inline-flex;margin:10px 0 0;padding:7px 12px;border-radius:999px;font:600 13px/1 system-ui,sans-serif;text-decoration:none!important;border:1.5px solid currentColor;opacity:.75}.ctk:hover{opacity:1}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const clean = t => t.replace(/^\s*(Ch(apter)?\s*[\d–\-, ]+\s*[·:.-]\s*)/i, '').replace(/\s+/g, ' ').trim();
  function add() {
    const h = document.querySelector(window.CT_H1 || 'main header h1');
    if (!h || h.parentNode.querySelector('.ctw')) return;
    const ce = window.CT_COURSE && document.querySelector(window.CT_COURSE), course = ce ? ce.textContent.split('·').pop() : (window.CT_SUBJ || '');
    const topic = clean(h.textContent) + (course ? ' (' + course.trim() + ')' : '');
    const a = document.createElement('a'); a.className = 'ctw'; a.target = '_blank'; a.rel = 'noopener';
    a.href = CT + '/?app=1&tool=live&topic=' + encodeURIComponent(topic.slice(0, 110));
    a.innerHTML = '<i>▶</i>Watch on Chalk Talk';
    const k = document.createElement('a'); k.className = 'ctk'; k.href = CT + '/toolkit.html'; k.target = '_blank'; k.rel = 'noopener'; k.textContent = 'Engineering Toolkit ↗';
    const wrap = document.createElement('div'); wrap.append(a, k); h.after(wrap);
  }
  new MutationObserver(() => add()).observe(document.body, { childList: true, subtree: true });
  addEventListener('hashchange', () => setTimeout(add, 50)); setTimeout(add, 300);
})();
