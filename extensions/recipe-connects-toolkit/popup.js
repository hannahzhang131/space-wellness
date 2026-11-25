function cleanUrl(raw) {
  const url = new URL(raw);
  [...url.searchParams.keys()].forEach((key) => {
    const k = key.toLowerCase();
    if (k.startsWith('utm_') || k === 'fbclid' || k === 'gclid' || k === 'msclkid') {
      url.searchParams.delete(key);
    }
  });
  url.hash = '';
  return url.toString();
}

const statusEl = document.getElementById('status');
document.getElementById('clean').addEventListener('click', async () => {
  statusEl.textContent = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('http')) {
    statusEl.textContent = 'Open a normal web page first.';
    return;
  }
  const cleaned = cleanUrl(tab.url);
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text) => {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    },
    args: [cleaned],
  });
  statusEl.textContent = cleaned;
});

document.getElementById('print').addEventListener('click', async () => {
  statusEl.textContent = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.print(),
  });
  statusEl.textContent = 'Print dialog opened.';
});