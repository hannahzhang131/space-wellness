#!/usr/bin/env node
/** Generate SLPC-XXXX-XXXX keys for manual Pro sales (no Gumroad). */
const CHECK = 41803;
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function checksum(body) {
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000;
}

function randBlock(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const count = Number(process.argv[2] || 5);
const keys = [];
while (keys.length < count) {
  const body = randBlock(8);
  if (checksum(body) !== CHECK) continue;
  keys.push(`SLPC-${body.slice(0, 4)}-${body.slice(4)}`);
}
console.log(keys.join('\n'));