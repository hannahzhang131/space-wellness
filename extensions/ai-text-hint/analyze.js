/* global analyzeText, buildHighlightTerms */

const PHRASES_EN = [
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
  'underscores',
  'pivotal',
  'seamlessly',
  'in the realm of',
];

const PHRASES_ZH = [
  '综上所述',
  '值得一提的是',
  '不仅如此',
  '在当今',
  '随着科技的发展',
  '首先',
  '其次',
  '最后',
  '总之',
  '希望本文',
  '为您提供',
  '深入探讨',
  '不可或缺的',
  '显而易见',
  '人工智能',
];

const TRANSITION_RE =
  /\b(firstly|secondly|thirdly|furthermore|moreover|in addition|in conclusion|lastly|on the other hand)\b|^[一二三四五六七八九十][、．.]/gim;

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

function findPhraseHits(text, phrases) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const p of phrases) {
    const needle = p.toLowerCase();
    if (lower.includes(needle)) hits.push(p);
  }
  return [...new Set(hits)];
}

function findTransitionHits(text) {
  const hits = [];
  const re = new RegExp(TRANSITION_RE.source, TRANSITION_RE.flags);
  let m;
  while ((m = re.exec(text)) !== null) {
    hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

function rhythmRunHint(lengths) {
  if (lengths.length < 3) return null;
  let best = 0;
  let runStart = 0;
  let i = 0;
  while (i < lengths.length) {
    let j = i;
    const base = lengths[i];
    while (j < lengths.length && Math.abs(lengths[j] - base) <= 2) j++;
    const run = j - i;
    if (run >= 3 && run > best) {
      best = run;
      runStart = i + 1;
    }
    i = j > i ? j : i + 1;
  }
  if (best >= 3) {
    return `Sentences ${runStart}–${runStart + best - 1} have similar length (robotic rhythm). Merge or split a few. / 第 ${runStart}–${runStart + best - 1} 句长度接近，可适当合并或拆句。`;
  }
  return null;
}

function analyzeText(text, options = {}) {
  const custom = Array.isArray(options.customPhrases) ? options.customPhrases : [];
  const allPhrases = [...PHRASES_EN, ...PHRASES_ZH, ...custom];
  if (text.length < 80) {
    return {
      score: null,
      short: true,
      lines: ['Need at least ~80 characters. / 至少需要约 80 个字符。'],
    };
  }
  const hitPhrases = findPhraseHits(text, allPhrases);
  const transitionHits = findTransitionHits(text);
  const customHits = findPhraseHits(text, custom);
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
  const transitionScore = Math.min(15, transitionHits.length * 5);
  const score = Math.min(92, Math.round(phraseScore + uniformity + listy + transitionScore));
  const band =
    score >= 55
      ? 'Heavy template / slop signals'
      : score >= 25
        ? 'Some template signals'
        : 'Lighter template signals';

  let rhythmTip;
  if (burstiness < 4 && avgLen > 6) {
    rhythmTip =
      'Rhythm σ is low — sentences are very even. Vary length before publishing. / 句式节奏偏齐，发布前可故意长短交错。';
  } else if (burstiness >= 7) {
    rhythmTip = 'Rhythm σ is high — uneven sentences (often reads more natural in this model). / 长短句变化较大。';
  } else {
    rhythmTip = 'Rhythm σ is medium — mix of short and long sentences. / 句长变化适中。';
  }
  const runHint = burstiness < 5 ? rhythmRunHint(lengths) : null;

  return {
    score,
    band,
    words,
    sentenceCount: Math.max(sents.length, 1),
    avgLen,
    burstiness,
    hitPhrases,
    transitionHits,
    customHits,
    rhythmTip,
    runHint,
    breakdown: { phraseScore, uniformity, listy, transitionScore },
    textSnippet: text.slice(0, 500),
  };
}

function buildHighlightTerms(report) {
  return [...report.hitPhrases, ...report.transitionHits].slice(0, 40);
}