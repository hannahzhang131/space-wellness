const TRACKING_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'si',
  'ref',
  'ref_src',
  'ref_url',
]);

export function cleanUrl(raw) {
  const url = new URL(raw);
  const toDelete = [];
  for (const key of url.searchParams.keys()) {
    const lower = key.toLowerCase();
    if (TRACKING_KEYS.has(lower) || lower.startsWith('utm_')) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) {
    url.searchParams.delete(key);
  }
  url.hash = '';
  return url.toString();
}