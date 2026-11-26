/* global isProUnlocked, openUpgradePage */

function isProUnlocked() {
  return chrome.runtime
    .sendMessage({ type: 'slopGetPaid' })
    .then((r) => !!r?.paid)
    .catch(() => false);
}

function openUpgradePage() {
  return chrome.runtime.sendMessage({ type: 'slopOpenPayment' });
}