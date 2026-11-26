/**
 * Google Docs clears selection when the extension popup steals focus.
 * Remember the last in-doc selection in session storage (this device only).
 */
function captureSelection() {
  const raw = window.getSelection?.()?.toString?.() ?? '';
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length < 1) return;
  chrome.storage.session.set({
    slopLastSelection: text.slice(0, 8000),
    slopLastSelectionAt: Date.now(),
  });
}

document.addEventListener('selectionchange', captureSelection);
document.addEventListener('mouseup', captureSelection);
document.addEventListener('keyup', captureSelection);