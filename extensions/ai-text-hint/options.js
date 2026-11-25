const licenseInput = document.getElementById('license');
const licenseStatus = document.getElementById('license-status');
const customArea = document.getElementById('custom');
const customStatus = document.getElementById('custom-status');

function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.className = ok ? 'status ok' : 'status err';
}

chrome.storage.local.get(['licenseKey', 'customPhrases', 'proUnlocked'], (data) => {
  if (data.licenseKey) licenseInput.value = data.licenseKey;
  if (Array.isArray(data.customPhrases)) {
    customArea.value = data.customPhrases.join('\n');
  }
  if (data.proUnlocked) {
    setStatus(licenseStatus, 'Pro is active on this browser.', true);
  }
});

document.getElementById('save-license').addEventListener('click', () => {
  const key = licenseInput.value.trim();
  if (!validateProLicense(key)) {
    setStatus(licenseStatus, 'Invalid key. Format: SLPC-XXXX-XXXX', false);
    chrome.storage.local.set({ proUnlocked: false, licenseKey: '' });
    return;
  }
  chrome.storage.local.set({ proUnlocked: true, licenseKey: key }, () => {
    setStatus(licenseStatus, 'Pro unlocked — reload the popup on any tab.', true);
  });
});

document.getElementById('save-custom').addEventListener('click', async () => {
  const pro = await isProUnlocked();
  if (!pro) {
    setStatus(customStatus, 'Custom phrases require Pro.', false);
    return;
  }
  const lines = customArea.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 80);
  chrome.storage.local.set({ customPhrases: lines }, () => {
    setStatus(customStatus, `Saved ${lines.length} custom phrase(s).`, true);
  });
});