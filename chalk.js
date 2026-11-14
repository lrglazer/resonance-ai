/* Chalk Talk bridge (shared by every study site).
   - On each chapter/course page: "Watch on Chalk Talk" (live lesson), "Ask the tutor" and "Flashcards", all pre-set to that topic.
   - In the footer: links to every sister site, plus Chalk Talk.
   The study sites stay free with no account; Chalk Talk is where the personal, AI-powered tools live. */
(() => {
  const CT = 'https://chalktalkstudy.com';
  const SITES = [
    ['FreeBody', 'Mechanical engineering', 'https://claude.ai/artifact/NxpZJ9DqtbzY25gvCP9KRT', 'freebody'],
    ['Epsilon', 'Math', 'https://claude.ai/artifact/4grUk2UBReNAq2SRTC1zFN', 'epsilon'],
    ['Bench', 'Engineering skills', 'https://claude.ai/artifact/5iSxSw6MksBRRH1u1CX51v', 'bench'],
    ['Fieldline', 'Physics & EE', 'https://lrglazer.github.io/fieldline/', 'fieldline'],
    ['ChemFluent', 'Chemistry', 'https://lrglazer.github.io/resonance-ai/', 'resonance-ai'],
    ['Bytewise', 'Computer science', 'https://lrglazer.github.io/bytewise/', 'bytewise'],
    ['Inkwell', 'History & government', 'https://claude.ai/artifact/5MST8n9ACQXjchfT28TmZv', 'inkwell'],
  ];
  const css = `.ctrow{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}.ctw,.ctb{display:inline-flex;align-items:center;gap:8px;padding:7px 14px 7px 8px;border-radius:999px;font:700 13.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none!important;border:2px solid #111214;box-shadow:2px 2px 0 #111214;transition:transform .15s}.ctw{background:#FDDB25;color:#111214!important}.ctb{background:#fff;color:#111214!important;padding:7px 14px}.ctw:hover,.ctb:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #111214}.ctw i{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#111214;color:#FDDB25;font-style:normal;font-size:10px}.ctk{display:inline-flex;align-items:center;padding:7px 12px;border-radius:999px;font:600 13px/1 system-ui,sans-serif;text-decoration:none!important;border:1.5px solid currentColor;opacity:.75}.ctk:hover{opacity:1}
.ctfam{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:14px auto 0;padding:12px 0 0;border-top:1px solid rgba(127,127,127,.35);font:600 13px/1.4 system-ui,sans-serif;width:100%}.ctfam b{opacity:.7;margin-right:4px}.ctfam a{text-decoration:none!important;opacity:.85}.ctfam a:hover{opacity:1;text-decoration:underline!important}.ctfam a span{opacity:.6;font-weight:500}.ctfam .ctme{background:#FDDB25;color:#111214!important;padding:3px 10px;border-radius:999px;opacity:1}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const clean = t => t.replace(/^\s*(Ch(apter)?\s*[\d–\-, ]+\s*[·:.-]\s*)/i, '').replace(/\s+/g, ' ').trim();
  const link = (tool, topic) => CT + '/?app=1&tool=' + tool + (topic ? '&topic=' + encodeURIComponent(topic.slice(0, 110)) : '');
  const el = (tag, cls, attrs, html) => { const e = document.createElement(tag); e.className = cls; Object.assign(e, attrs || {}); if (html) e.innerHTML = html; return e; };
  function add() {
    const h = document.querySelector(window.CT_H1 || 'main header h1');
    if (h && h.textContent.trim() && !h.parentNode.querySelector('.ctrow')) {
      const ce = window.CT_COURSE && document.querySelector(window.CT_COURSE), course = ce ? ce.textContent.split('·').pop() : (window.CT_SUBJ || '');
      const topic = clean(h.textContent) + (course && !h.textContent.includes(course.trim()) ? ' (' + course.trim() + ')' : '');
      const o = { target: '_blank', rel: 'noopener' };
      const row = el('div', 'ctrow');
      row.append(
        el('a', 'ctw', { ...o, href: link('live', topic) }, '<i>▶</i>Watch on Chalk Talk'),
        el('a', 'ctb', { ...o, href: link('tutor', topic) }, 'Ask the tutor'),
        el('a', 'ctb', { ...o, href: link('flashcards', topic) }, 'Flashcards from my notes'),
        el('a', 'ctk', { ...o, href: CT + '/toolkit.html' }, 'All study sites ↗'));
      h.after(row);
    }
    const f = document.querySelector(window.CT_FOOT || 'footer');
    if (f && !f.querySelector('.ctfam')) {
      const here = location.href.toLowerCase();
      const fam = el('div', 'ctfam', {}, '<b>Free study sites:</b>' +
        SITES.filter(s => !here.includes(s[3]) && !document.title.toLowerCase().startsWith(s[0].toLowerCase()))
          .map(s => `<a href="${s[2]}" target="_blank" rel="noopener">${s[0]} <span>${s[1]}</span></a>`).join('') +
        `<a class="ctme" href="${CT}" target="_blank" rel="noopener">Chalk Talk ↗</a>`);
      f.appendChild(fam);
    }
  }
  new MutationObserver(() => add()).observe(document.body, { childList: true, subtree: true });
  addEventListener('hashchange', () => setTimeout(add, 50)); setTimeout(add, 300);
})();
