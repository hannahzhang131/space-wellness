/* global validateProLicense, isProUnlocked */

const LICENSE_CHECK = 41803;

function licenseBodyChecksum(body) {
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

function validateProLicense(key) {
  const k = String(key || '')
    .trim()
    .toUpperCase();
  const m = k.match(/^SLPC-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
  if (!m) return false;
  const body = m[1] + m[2];
  return licenseBodyChecksum(body) === LICENSE_CHECK;
}

function isProUnlocked() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['proUnlocked', 'licenseKey'], (data) => {
      if (data.proUnlocked === true) {
        resolve(true);
        return;
      }
      const ok = validateProLicense(data.licenseKey);
      if (ok) {
        chrome.storage.local.set({ proUnlocked: true, licenseKey: data.licenseKey?.trim() });
      }
      resolve(ok);
    });
  });
}