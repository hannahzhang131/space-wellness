/** Google Docs / Office: remember selection before popup steals focus (session only). */
function captureSelection() {
  const text = (window.getSelection?.()?.toString?.() ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < 1) return;
  chrome.runtime.sendMessage({ type: 'captureSelection', text });
}

document.addEventListener('selectionchange', captureSelection);
document.addEventListener('mouseup', captureSelection);