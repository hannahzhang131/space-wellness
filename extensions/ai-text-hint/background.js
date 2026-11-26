chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'captureSelection' || !sender.tab?.id) return;
  const text = String(msg.text || '').slice(0, 8000);
  if (text.length < 1) return;
  chrome.storage.session.set({
    slopCapture: {
      tabId: sender.tab.id,
      text,
      at: Date.now(),
    },
  });
});