/**
 * Docs: manual select often invisible to isolated-world getSelection.
 * MAIN-world bridge + postMessage; session cache via background.js.
 */
function pushSelection(text) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
  if (t.length < 1) return;
  chrome.runtime.sendMessage({ type: 'captureSelection', text: t });
}

function captureFromIsolated() {
  pushSelection(window.getSelection?.()?.toString?.() ?? '');
}

function injectMainWorldBridge() {
  const host = location.hostname;
  if (host !== 'docs.google.com' && !host.endsWith('.google.com')) return;
  if (!location.pathname.includes('/document')) return;
  if (document.documentElement.dataset.slopMainBridge) return;
  document.documentElement.dataset.slopMainBridge = '1';

  const el = document.createElement('script');
  el.textContent = `(function(){
    if (window.__slopMainSel) return;
    window.__slopMainSel = 1;
    function emit(){
      var t = (window.getSelection && window.getSelection().toString() || '')
        .replace(/\\s+/g,' ').trim();
      if (t.length) window.postMessage({source:'slop-checker',text:t.slice(0,8000)},'*');
    }
    document.addEventListener('mouseup',function(){ emit(); setTimeout(emit,60); setTimeout(emit,200); });
    document.addEventListener('selectionchange',function(){ setTimeout(emit,60); });
    document.addEventListener('copy', emit);
  })();`;
  (document.head || document.documentElement).appendChild(el);
  el.remove();
}

window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.source !== 'slop-checker') return;
  pushSelection(e.data.text);
});

injectMainWorldBridge();

document.addEventListener('selectionchange', captureFromIsolated);
document.addEventListener('mouseup', () => {
  captureFromIsolated();
  setTimeout(captureFromIsolated, 80);
});
document.addEventListener('keyup', captureFromIsolated);
document.addEventListener('copy', captureFromIsolated);