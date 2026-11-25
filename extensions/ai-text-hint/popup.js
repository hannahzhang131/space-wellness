function pickArticleText() {
  const roots = [
    document.querySelector('article'),
    document.querySelector('main'),
    document.querySelector('[role="article"]'),
    document.querySelector('.post-content'),
    document.querySelector('.entry-content'),
    document.body,
  ].filter(Boolean);
  let best = '';
  for (const root of roots) {
    const text = root.innerText?.replace(/\s+/g, ' ').trim() ?? '';
    if (text.length > best.length) best = text;
  }
  return best.slice(0, 12000);
}

function pickSelectionText() {
  const sel = window.getSelection()?.toString() ?? '';
  return sel.replace(/\s+/g, ' ').trim().slice(0, 8000);
}

const out = document.getElementById('out');

async function runInPage(mode) {
  out.textContent = 'Reading…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    out.textContent = 'No active tab.';
    return;
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (pickMode) => {
      const pickArticleText = () => {
        const roots = [
          document.querySelector('article'),
          document.querySelector('main'),
          document.querySelector('[role="article"]'),
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
  const text = result ?? '';
  const report = analyzeText(text);
  out.textContent = report.lines.join('\n');
}

document.getElementById('page').addEventListener('click', () => void runInPage('page'));
document.getElementById('selection').addEventListener('click', () => void runInPage('selection'));