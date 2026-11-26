const customArea = document.getElementById('custom');
const customStatus = document.getElementById('custom-status');
const paidStatus = document.getElementById('paid-status');

function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.className = ok ? 'status ok' : 'status err';
}

async function refreshPaid() {
  const paid = await isProUnlocked();
  setStatus(
    paidStatus,
    paid ? 'Paid features are active on this browser profile.' : 'Free tier — upgrade to unlock all features.',
    paid,
  );
}

chrome.storage.local.get(['customPhrases'], (data) => {
  if (Array.isArray(data.customPhrases)) {
    customArea.value = data.customPhrases.join('\n');
  }
});

document.getElementById('manage-pay').addEventListener('click', () => void openUpgradePage());
void refreshPaid();

document.getElementById('save-custom').addEventListener('click', async () => {
  const pro = await isProUnlocked();
  if (!pro) {
    setStatus(customStatus, 'Upgrade first (button above).', false);
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