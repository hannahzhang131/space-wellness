/* global analyzeText */

const PHRASES = [
  'it is important to note',
  'in conclusion',
  'in summary',
  'furthermore',
  'moreover',
  'additionally',
  'delve',
  'dive into',
  'comprehensive',
  'robust',
  'leverage',
  'utilize',
  'ensure that',
  'as an ai',
  'as a language model',
  'i hope this helps',
  'happy to help',
  'navigate the complexities',
  'tapestry',
  'landscape of',
  'testament to',
  'it is worth noting',
  'plays a crucial role',
  "in today's world",
  'ever-changing world',
  'rich tapestry',
  'it goes without saying',
  'myriad',
  'embark on',
  'at its core',
  '综上所述',
  '值得一提的是',
  '不仅如此',
  '在当今',
  '随着科技的发展',
  '人工智能',
  '首先',
  '其次',
  '最后',
  '总之',
  '希望本文',
  '为您提供',
  '深入探讨',
];

function countWords(text) {
  const latin = text.match(/[a-zA-Z]+(?:'[a-z]+)?/g) || [];
  const cjk = text.match(/[\u4e00-\u9fff]/g) || [];
  return latin.length + Math.round(cjk.length / 1.6);
}

function sentences(text) {
  return text
    .split(/(?<=[.!?。！？])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function analyzeText(text) {
  if (text.length < 80) {
    return { score: null, lines: ['Need at least ~80 characters of text.'] };
  }
  const lower = text.toLowerCase();
  const hitPhrases = PHRASES.filter((p) => lower.includes(p.toLowerCase()));
  const sents = sentences(text);
  const words = countWords(text);
  const lengths = sents.map((s) => Math.max(1, countWords(s)));
  const avgLen =
    lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : countWords(text);
  let variance = 0;
  if (lengths.length > 1) {
    variance = lengths.reduce((sum, len) => sum + (len - avgLen) ** 2, 0) / lengths.length;
  }
  const burstiness = Math.sqrt(variance);
  const phraseScore = Math.min(45, hitPhrases.length * 7);
  const uniformity =
    avgLen > 8 && burstiness < 5 ? 28 : avgLen > 6 && burstiness < 8 ? 14 : 0;
  const listy = (text.match(/^\s*[-*•]\s/mg) || []).length >= 4 ? 10 : 0;
  const transitions = (
    text.match(
      /\b(firstly|secondly|thirdly|in addition|on the other hand|lastly)\b|^[一二三四五六七八九十][、．.]/gm,
    ) || []
  ).length;
  const transitionScore = Math.min(15, transitions * 5);
  const score = Math.min(92, Math.round(phraseScore + uniformity + listy + transitionScore));
  const band =
    score >= 55
      ? 'More templated patterns (not proof of AI)'
      : score >= 25
        ? 'Some templated patterns'
        : 'Few templated patterns';

  const variety =
    burstiness >= 7
      ? 'high (uneven sentences — often looks more “human” in this model)'
      : burstiness >= 4
        ? 'medium'
        : 'low (even sentence lengths — one signal of templated text)';

  const lines = [
    `Template-pattern score: ${score}/100 — ${band}`,
    `(Not “% AI”. Low score = few patterns found, not proof a human wrote it.)`,
    `Words≈${words} | Sentences: ${Math.max(sents.length, lengths.length ? lengths.length : 1)}`,
    `Avg sentence length: ${avgLen.toFixed(1)} | Variety σ: ${burstiness.toFixed(1)} — ${variety}`,
    `Breakdown: phrases ${phraseScore} + evenness ${uniformity} + lists ${listy} + transitions ${transitionScore}`,
    hitPhrases.length
      ? `Matched patterns: ${hitPhrases.slice(0, 8).join(', ')}${hitPhrases.length > 8 ? '…' : ''}`
      : 'No listed template phrases matched.',
    '',
    'On-device hints only — not an AI classifier.',
  ];
  return { score, lines };
}