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

async function sessionSelectionForTab(tabId) {
  const { slopCapture } = await chrome.storage.session.get('slopCapture');
  if (!slopCapture || slopCapture.tabId !== tabId) return '';
  const age = Date.now() - (slopCapture.at || 0);
  if (age > 300_000) return '';
  return slopCapture.text || '';
}

async function extractFromTab(tabId, mode) {
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    world: 'MAIN',
    func: (pickMode) => {
      const clean = (s) => s.replace(/\s+/g, ' ').trim();
      const pickSelectionText = () =>
        clean(window.getSelection?.()?.toString?.() ?? '').slice(0, 8000);
      const pickArticleText = () => {
        const selectors = [
          '.kix-appview-editor',
          '.kix-page-content-wrapper',
          '.WACViewPanel_EditingElement',
          '.PageContent',
          '[data-automation-id="contentEditableRegion"]',
          '.od-FieldRenderer-text',
          'article',
          'main',
          '[role="textbox"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const t = clean(el?.innerText ?? '');
          if (t.length > 80) return t.slice(0, 12000);
        }
        let best = '';
        for (const root of [document.body].filter(Boolean)) {
          const t = clean(root.innerText ?? '');
          if (t.length > best.length) best = t;
        }
        return best.slice(0, 12000);
      };
      const text =
        pickMode === 'selection' ? pickSelectionText() : pickArticleText();
      return text;
    },
    args: [mode],
  });
  let best = '';
  for (const row of results) {
    const t = row?.result ?? '';
    if (t.length > best.length) best = t;
  }
  return best;
}

async function analyzeAndShow(text, statusNote) {
  const customPhrases = await loadContext();
  lastReport = analyzeText(text, { customPhrases });
  renderReport(lastReport);
  statusEl.textContent = statusNote || '';
}

async function runInPage(mode) {
  statusEl.textContent = 'Reading…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusEl.textContent = 'No active tab.';
    return;
  }
  const isDocs = tab.url?.includes('docs.google.com');
  let note = '';

  if (mode === 'selection' && isDocs) {
    const cached = await sessionSelectionForTab(tab.id);
    if (cached.length >= 80) {
      await analyzeAndShow(
        cached,
        'Used selection saved before popup (Google Docs). / 已用 Docs 里选中后缓存的文字。',
      );
      return;
    }
  }

  let text = await extractFromTab(tab.id, mode);

  if (mode === 'selection') {
    const cached = await sessionSelectionForTab(tab.id);
    if (cached.length > text.length) {
      text = cached;
      note =
        'Used saved selection for this tab (Docs/Office). / 已用本标签页缓存选中文字。';
    } else if (text.length < 80 && (isDocs || tab.url?.includes('office'))) {
      note =
        'Docs: select text on the page first, then open popup → Analyze selection. Or paste below. / 先选中再开弹窗，或粘贴。';
    }
  }
  await analyzeAndShow(text, note);
}

async function runPasted() {
  const text = document.getElementById('paste').value.replace(/\s+/g, ' ').trim();
  statusEl.textContent = '';
  await analyzeAndShow(
    text,
    text.length >= 80
      ? 'Analyzed from paste (nothing sent online). / 已分析粘贴内容。'
      : 'Paste at least ~80 characters. / 至少需要约 80 字。',
  );
}

async function highlightOnPage() {
  if (!pro || !lastReport) return;
  const terms = buildHighlightTerms(lastReport);
  if (!terms.length) return;
  statusEl.textContent = 'Highlighting…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const u = tab.url || '';
  if (
    u.includes('docs.google.com') ||
    u.includes('officeapps.live.com') ||
    u.includes('office.com') ||
    u.includes('sharepoint.com')
  ) {
    statusEl.textContent =
      'Highlight not supported in Docs/Office online — use Copy report.';
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
document
  .getElementById('paste-analyze')
  .addEventListener('click', () => void runPasted());
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