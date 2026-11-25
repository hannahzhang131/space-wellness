import { cleanUrl } from './lib/clean-url.js';

const statusEl = document.getElementById('status');
const cleanBtn = document.getElementById('clean');
const printBtn = document.getElementById('print');

function setStatus(message) {
  statusEl.textContent = message;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('http')) {
    throw new Error('Open a recipe page first (http or https).');
  }
  return tab;
}

async function copyText(tabId, text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* Chrome popup clipboard is flaky; copy from the page instead. */
  }
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (value) => {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.left = '-1000px';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      return ok;
    },
    args: [text],
  });
  return Boolean(result);
}

cleanBtn.addEventListener('click', async () => {
  setStatus('');
  try {
    const tab = await activeTab();
    const cleaned = cleanUrl(tab.url);
    const copied = await copyText(tab.id, cleaned);
    if (!copied) {
      throw new Error('Clipboard blocked. Select the text below and copy manually.');
    }
    setStatus(`Copied clean link:\n${cleaned}`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Could not clean link.');
  }
});

printBtn.addEventListener('click', async () => {
  setStatus('');
  try {
    const tab = await activeTab();
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const id = 'recipe-connects-print-style';
        if (!document.getElementById(id)) {
          const style = document.createElement('style');
          style.id = id;
          style.textContent = `
            @media print {
              nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"],
              .ad, .ads, [class*="advert"], [id*="advert"], [class*="newsletter"], [class*="popup"] {
                display: none !important;
              }
              article, main, body { max-width: 100% !important; }
              body { font-size: 12pt !important; line-height: 1.5 !important; color: #000 !important; }
              img { max-width: 100% !important; page-break-inside: avoid; }
            }
          `;
          document.head.appendChild(style);
        }
        window.print();
      },
    });
    setStatus('Print dialog opened.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Could not print.');
  }
});