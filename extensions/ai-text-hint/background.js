importScripts('config.js', 'ExtPay.js');

const extpay = ExtPay(EXT_PAY_EXTENSION_ID);
extpay.startBackground();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'slopGetPaid') {
    extpay.getUser().then((user) => sendResponse({ paid: !!user.paid }));
    return true;
  }
  if (msg.type === 'slopOpenPayment') {
    extpay.openPaymentPage().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (msg.type !== 'captureSelection' || !_sender.tab?.id) return;
  const text = String(msg.text || '').slice(0, 8000);
  if (text.length < 1) return;
  chrome.storage.session.set({
    slopCapture: {
      tabId: _sender.tab.id,
      text,
      at: Date.now(),
    },
  });
});