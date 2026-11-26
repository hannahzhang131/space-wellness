/**
 * Opening the popup clears selection on many sites (not only Docs).
 * Remember last selection per tab in session storage (this device only).
 */
if (globalThis.__slopSelectionBridge) {
  // already loaded
} else {
  globalThis.__slopSelectionBridge = true;

function captureSelection() {
  const raw = window.getSelection?.()?.toString?.() ?? '';
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length < 1) return;
  chrome.runtime.sendMessage({ type: 'captureSelection', text });
}

document.addEventListener('selectionchange', captureSelection);
document.addEventListener('mouseup', captureSelection);
document.addEventListener('keyup', captureSelection);
}