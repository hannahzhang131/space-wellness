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

  if (!pro) {
    proCtaEl.textContent =
      'Pro: full phrase list, highlight on page, copy report, custom blocklist.';
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
    `Words≈${report.words}, sentences ${report.sentenceCount}`,
    'Phrases: ' + (report.hitPhrases.join('; ') || 'none'),
    '',
    'On-device pattern hints — not proof of AI authorship.',
  ];
  return lines.filter(Boolean).join('\n');
}

async function docsCachedSelection(tabId) {
  const { slopCapture } = await chrome.storage.session.get('slopCapture');
  if (!slopCapture || slopCapture.tabId !== tabId) return '';
  if (Date.now() - (slopCapture.at || 0) > 300_000) return '';
  return slopCapture.text || '';
}

function pageExtractFunc(pickMode) {
  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const pickSelectionText = () =>
    clean(window.getSelection?.()?.toString?.() ?? '').slice(0, 8000);
  const pickArticleText = () => {
    const selectors = [
      '.kix-appview-editor',
      '.kix-page-content-wrapper',
      '.WACViewPanel_EditingElement',
      'article',
      'main',
      '[role="article"]',
    ];
    for (const sel of selectors) {
      const t = clean(document.querySelector(sel)?.innerText ?? '');
      if (t.length > 80) return t.slice(0, 12000);
    }
    let best = '';
    for (const root of [document.body]) {
      const t = clean(root?.innerText ?? '');
      if (t.length > best.length) best = t;
    }
    return best.slice(0, 12000);
  };
  return pickMode === 'selection' ? pickSelectionText() : pickArticleText();
}

async function runScript(tabId, pickMode, allFrames) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: !!allFrames },
    world: 'MAIN',
    func: pageExtractFunc,
    args: [pickMode],
  });
  return result ?? '';
}

async function extractFromTab(tabId, tabUrl, mode) {
  if (mode === 'selection') {
    let text = await runScript(tabId, 'selection', false);
    if (text.length >= 80) return { text, note: '' };

    const isDocs =
      tabUrl?.includes('docs.google.com') ||
      tabUrl?.includes('officeapps.live.com') ||
      tabUrl?.includes('sharepoint.com');

    if (isDocs) {
      const cached = await docsCachedSelection(tabId);
      if (cached.length >= 80) {
        return {
          text: cached,
          note:
            'Used selection saved before popup (Google Docs). Or paste below. / 已用 Docs 缓存选区。',
        };
      }
      for (const allFrames of [true]) {
        const results = await chrome.scripting.executeScript({
          target: { tabId, allFrames },
          world: 'MAIN',
          func: pageExtractFunc,
          args: ['selection'],
        });
        for (const row of results) {
          const t = row?.result ?? '';
          if (t.length > text.length) text = t;
        }
      }
      if (text.length >= 80) return { text, note: '' };
      return {
        text,
        note:
          'Google Docs: Cmd+C → expand “Docs / Word / Excel online” → paste. / Docs 请用粘贴分析。',
      };
    }

    return { text, note: text.length < 80 ? 'Select at least ~80 characters on the page first.' : '' };
  }

  const text = await runScript(tabId, 'page', false);
  if (text.length >= 80) return { text, note: '' };
  const results = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    world: 'MAIN',
    func: pageExtractFunc,
    args: ['page'],
  });
  let best = text;
  for (const row of results) {
    const t = row?.result ?? '';
    if (t.length > best.length) best = t;
  }
  return { text: best, note: '' };
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
  const { text, note } = await extractFromTab(tab.id, tab.url, mode);
  await analyzeAndShow(text, note);
}

async function runPasted() {
  const text = document.getElementById('paste').value.replace(/\s+/g, ' ').trim();
  await analyzeAndShow(
    text,
    text.length >= 80
      ? 'Analyzed from paste. / 已分析粘贴内容。'
      : 'Paste at least ~80 characters.',
  );
}

async function highlightOnPage() {
  if (!pro || !lastReport) return;
  const terms = buildHighlightTerms(lastReport);
  if (!terms.length) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const u = tab.url || '';
  if (u.includes('docs.google.com') || u.includes('officeapps.live.com')) {
    statusEl.textContent = 'Highlight not supported in Docs/Office — use Copy report.';
    return;
  }
  statusEl.textContent = 'Highlighting…';
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: (patterns) => {
      const STYLE_ID = 'slop-checker-hl-style';
      if (!document.getElementById(STYLE_ID)) {
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = 'mark.slop-hl{background:#ffe566;padding:0 1px;}';
        document.head.appendChild(st);
      }
      document.querySelectorAll('mark.slop-hl').forEach((mark) => {
        mark.replaceWith(document.createTextNode(mark.textContent));
      });
      const escaped = patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (!escaped.length) return;
      const re = new RegExp(escaped.join('|'), 'gi');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          return p && !p.closest('script,style,noscript,textarea,code,mark.slop-hl')
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });
      let node;
      let count = 0;
      while ((node = walker.nextNode()) && count < 120) {
        const text = node.textContent;
        re.lastIndex = 0;
        if (!re.test(text)) continue;
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;
        let m;
        while ((m = re.exec(text)) !== null && count < 120) {
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const mark = document.createElement('mark');
          mark.className = 'slop-hl';
          mark.textContent = m[0];
          frag.appendChild(mark);
          last = m.index + m[0].length;
          count++;
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    },
    args: [terms],
  });
  statusEl.textContent = 'Highlighted (reload to clear).';
}

document.getElementById('page').addEventListener('click', () => void runInPage('page'));
document.getElementById('selection').addEventListener('click', () => void runInPage('selection'));
document.getElementById('paste-analyze').addEventListener('click', () => void runPasted());
highlightBtn.addEventListener('click', () => void highlightOnPage());
copyBtn.addEventListener('click', async () => {
  if (!pro || !lastReport) return;
  try {
    await navigator.clipboard.writeText(reportPlainText(lastReport));
    statusEl.textContent = 'Report copied.';
  } catch {
    statusEl.textContent = 'Copy failed.';
  }
});
document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

void loadContext();