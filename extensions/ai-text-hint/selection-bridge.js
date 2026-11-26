/**
 * Docs/Office online often clear selection when the popup opens, or use iframes.
 * Capture selection per tab (session only, this device).
 */
function captureSelection() {
  const raw = window.getSelection?.()?.toString?.() ?? '';
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length < 1) return;
  chrome.runtime.sendMessage({ type: 'captureSelection', text });
}

document.addEventListener('selectionchange', captureSelection);
document.addEventListener('mouseup', captureSelection);
document.addEventListener('keyup', captureSelection);