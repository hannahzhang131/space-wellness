/* global analyzeText */

const PHRASES = [
  'it is important to note',
  'in conclusion',
  'in summary',
  'furthermore',
  'moreover',
  'delve',
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
];

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 8);
}

function analyzeText(text) {
  if (text.length < 80) {
    return { score: null, lines: ['Need at least ~80 characters of text.'] };
  }
  const lower = text.toLowerCase();
  const hitPhrases = PHRASES.filter((p) => lower.includes(p));
  const sents = sentences(text);
  const words = text.split(/\s+/).filter(Boolean);
  const lengths = sents.map((s) => s.split(/\s+/).length);
  const avgLen =
    lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  let variance = 0;
  if (lengths.length > 1) {
    variance = lengths.reduce((sum, len) => sum + (len - avgLen) ** 2, 0) / lengths.length;
  }
  const stdev = Math.sqrt(variance);
  const burstiness = stdev;
  const phraseScore = Math.min(40, hitPhrases.length * 8);
  const uniformity = avgLen > 8 && burstiness < 4 ? 25 : burstiness < 7 ? 12 : 0;
  const listy = (text.match(/^\s*[-*•]\s/mg) || []).length >= 4 ? 10 : 0;
  const score = Math.min(92, Math.round(phraseScore + uniformity + listy));
  const band =
    score >= 55 ? 'Higher signals (still not proof)' :
    score >= 30 ? 'Mixed signals' :
    'Lower signals';

  const lines = [
    `Hint score: ${score}/100 — ${band}`,
    `Words: ${words.length} | Sentences: ${sents.length}`,
    `Avg sentence length: ${avgLen.toFixed(1)} | Burstiness (σ): ${burstiness.toFixed(1)}`,
    hitPhrases.length
      ? `Phrases often seen in templated text: ${hitPhrases.join(', ')}`
      : 'No common templated phrases found.',
    '',
    'Pattern-based hint only — not an AI classifier.',
  ];
  return { score, lines };
}