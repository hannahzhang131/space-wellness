let lastReport = null;
let pro = false;

const resultsEl = document.getElementById('results');
const scoreEl = document.getElementById('score');
const rhythmEl = document.getElementById('rhythm');
const runHintEl = document.getElementById('run-hint');
const statsEl = document.getElementById('stats');
const matchesEl = document.getElementById('matches');
const proCtaEl = document.getElementById('pro-cta');
const statusEl = document.getElementById('status');
const proBadge = document.getElementById('pro-badge');
const highlightBtn = document.getElementById('highlight');
const copyBtn = document.getElementById('copy');

async function loadContext() {
  pro = await isProUnlocked();
  proBadge.classList.toggle('hidden', !pro);
  document.querySelectorAll('.pro-only').forEach((el) => {
    el.classList.toggle('hidden', !pro);
  });
  return new Promise((resolve) => {
    chrome.storage.local.get(['customPhrases'], (data) => {
      resolve(Array.isArray(data.customPhrases) ? data.customPhrases : []);
    });
  });
}

function renderReport(report) {
  if (report.short || report.score === null) {
    resultsEl.classList.remove('hidden');
    scoreEl.textContent = report.lines?.[0] ?? 'Too little text.';
    rhythmEl.textContent = '';
    runHintEl.classList.add('hidden');
    statsEl.textContent = '';
    matchesEl.innerHTML = '';
    proCtaEl.classList.add('hidden');
    return;
  }

  resultsEl.classList.remove('hidden');
  scoreEl.textContent = `Slop pattern score: ${report.score}/100 — ${report.band}`;
  rhythmEl.textContent = report.rhythmTip;
  if (report.runHint) {
    runHintEl.textContent = report.runHint;
    runHintEl.classList.remove('hidden');
  } else {
    runHintEl.classList.add('hidden');
  }
  const b = report.breakdown;
  statsEl.textContent = `Words≈${report.words} · ${report.sentenceCount} sentences · avg ${report.avgLen.toFixed(1)} words · σ ${report.burstiness.toFixed(1)} · breakdown: phrases ${b.phraseScore} + evenness ${b.uniformity} + lists ${b.listy} + transitions ${b.transitionScore}`;

  const freeLimit = 2;
  const phrases = report.hitPhrases;
  const showPhrases = pro ? phrases : phrases.slice(0, freeLimit);
  const hiddenCount = pro ? 0 : Math.max(0, phrases.length - freeLimit);

  let html = '';
  if (showPhrases.length) {
    html += '<h3>Matched slop phrases</h3><ul>';
    for (const p of showPhrases) html += `<li>${escapeHtml(p)}</li>`;
    html += '</ul>';
  } else {
    html += '<p>No built-in slop phrases matched.</p>';
  }

  if (pro && report.transitionHits.length) {
    html += '<h3>Transitions</h3><ul>';
    for (const t of report.transitionHits) html += `<li>${escapeHtml(t)}</li>`;
    html += '</ul>';
  }

  if (pro && report.customHits.length) {
    html += '<h3>Your custom list</h3><ul>';
    for (const c of report.customHits) html += `<li>${escapeHtml(c)}</li>`;
    html += '</ul>';
  }

  matchesEl.innerHTML = html;

  if (!pro && (hiddenCount > 0 || report.transitionHits.length > 0)) {
    proCtaEl.textContent = `Pro: full phrase list (${phrases.length}), transitions, highlight on page, copy report, custom blocklist.`;
    proCtaEl.classList.remove('hidden');
  } else if (!pro) {
    proCtaEl.textContent = 'Pro: highlight hits on the page, copy report, custom blocklist.';
    proCtaEl.classList.remove('hidden');
  } else {
    proCtaEl.classList.add('hidden');
  }

  highlightBtn.disabled = !pro || buildHighlightTerms(report).length === 0;
  copyBtn.disabled = !pro;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function reportPlainText(report) {
  if (!report || report.score === null) return '';
  const lines = [
    `Slop pattern score: ${report.score}/100 — ${report.band}`,
    report.rhythmTip,
    report.runHint || '',
    `Words≈${report.words}, sentences ${report.sentenceCount}, avg ${report.avgLen.toFixed(1)}, σ ${report.burstiness.toFixed(1)}`,
    'Phrases: ' + (report.hitPhrases.join('; ') || 'none'),
    'Transitions: ' + (report.transitionHits.join('; ') || 'none'),
    '',
    'On-device pattern hints — not proof of AI authorship.',
  ];
  return lines.filter(Boolean).join('\n');
}

async function runInPage(mode) {
  statusEl.textContent = 'Reading…';
  const customPhrases = await loadContext();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusEl.textContent = 'No active tab.';
    return;
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: (pickMode) => {
      const pickArticleText = () => {
        const docEditor = document.querySelector(
          '.kix-appview-editor, .kix-page-content-wrapper',
        );
        if (docEditor) {
          const t = docEditor.innerText?.replace(/\s+/g, ' ').trim() ?? '';
          if (t.length > 80) return t.slice(0, 12000);
        }
        const roots = [
          document.querySelector('article'),
          document.querySelector('main'),
          document.querySelector('[role="article"]'),
          document.querySelector('[role="textbox"]'),
          document.body,
        ].filter(Boolean);
        let best = '';
        for (const root of roots) {
          const text = root.innerText?.replace(/\s+/g, ' ').trim() ?? '';
          if (text.length > best.length) best = text;
        }
        return best.slice(0, 12000);
      };
      const pickSelectionText = () => {
        const sel = window.getSelection()?.toString() ?? '';
        return sel.replace(/\s+/g, ' ').trim().slice(0, 8000);
      };
      return pickMode === 'selection' ? pickSelectionText() : pickArticleText();
    },
    args: [mode],
  });
  let text = result ?? '';
  if (mode === 'selection' && text.length < 80) {
    const session = await chrome.storage.session.get([
      'slopLastSelection',
      'slopLastSelectionAt',
    ]);
    const age = Date.now() - (session.slopLastSelectionAt || 0);
    if (age < 180_000 && (session.slopLastSelection?.length ?? 0) >= 80) {
      text = session.slopLastSelection;
      statusEl.textContent =
        'Used your last selection (Docs keeps selection when popup opens). / 使用了刚才在文档里的选中文字。';
    }
  }
  lastReport = analyzeText(text, { customPhrases });
  renderReport(lastReport);
  if (!statusEl.textContent) statusEl.textContent = '';
}

async function highlightOnPage() {
  if (!pro || !lastReport) return;
  const terms = buildHighlightTerms(lastReport);
  if (!terms.length) return;
  statusEl.textContent = 'Highlighting…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (tab.url?.includes('docs.google.com')) {
    statusEl.textContent =
      'Highlight not supported in Google Docs — use Copy report or a normal webpage.';
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: (patterns) => {
      const STYLE_ID = 'slop-checker-hl-style';
      if (!document.getElementById(STYLE_ID)) {
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = 'mark.slop-hl{background:#ffe566;padding:0 1px;border-radius:2px;}';
        document.head.appendChild(st);
      }
      document.querySelectorAll('mark.slop-hl').forEach((mark) => {
        const t = document.createTextNode(mark.textContent);
        mark.replaceWith(t);
      });
      const escaped = patterns.map((p) =>
        p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      );
      if (!escaped.length) return;
      const regex = new RegExp(escaped.join('|'), 'gi');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest('script,style,noscript,textarea,code,mark.slop-hl')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      let count = 0;
      for (const textNode of nodes) {
        if (count > 120) break;
        const text = textNode.textContent;
        regex.lastIndex = 0;
        if (!regex.test(text)) continue;
        regex.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;
        let m;
        const re = new RegExp(regex.source, regex.flags);
        while ((m = re.exec(text)) !== null) {
          if (count > 120) break;
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const mark = document.createElement('mark');
          mark.className = 'slop-hl';
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
          count++;
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        if (count > 0) textNode.parentNode.replaceChild(frag, textNode);
      }
    },
    args: [terms],
  });
  statusEl.textContent = 'Highlighted (reload page to clear).';
}

document.getElementById('page').addEventListener('click', () => void runInPage('page'));
document.getElementById('selection').addEventListener('click', () => void runInPage('selection'));
highlightBtn.addEventListener('click', () => void highlightOnPage());
copyBtn.addEventListener('click', async () => {
  if (!pro || !lastReport) return;
  const text = reportPlainText(lastReport);
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = 'Report copied.';
  } catch {
    statusEl.textContent = 'Copy failed — select from results manually.';
  }
});
document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

void loadContext();