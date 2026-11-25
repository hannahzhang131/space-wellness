import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAddCheckIn,
  createCheckIn,
  daysBetween,
  defaultPair,
  formatWeight,
  formatWeightChange,
  FREE_CHECK_IN_LIMIT,
  ghostFor,
  parseLibrary,
  parseWeight,
  sharedPoses,
  spanLabel,
  type CheckIn,
} from './model.ts';

function checkIn(takenAt: string, photos: CheckIn['photos'], weightKg: number | null = null): CheckIn {
  return { ...createCheckIn(takenAt), photos, weightKg };
}

test('free tier keeps six check-ins', () => {
  assert.equal(canAddCheckIn(FREE_CHECK_IN_LIMIT - 1, false), true);
  assert.equal(canAddCheckIn(FREE_CHECK_IN_LIMIT, false), false);
  assert.equal(canAddCheckIn(40, true), true);
});

test('the ghost is the latest earlier photo of the same pose', () => {
  const first = checkIn('2026-10-01T08:00:00.000Z', { front: 'a-front.jpg', side: 'a-side.jpg' });
  const second = checkIn('2026-10-08T08:00:00.000Z', { front: 'b-front.jpg' });
  const third = checkIn('2026-10-15T08:00:00.000Z', {});
  const all = [third, first, second];
  assert.equal(ghostFor(all, third.id, 'front'), 'b-front.jpg');
  assert.equal(ghostFor(all, third.id, 'side'), 'a-side.jpg');
  assert.equal(ghostFor(all, third.id, 'back'), null);
  assert.equal(ghostFor(all, first.id, 'front'), null);
});

test('the default comparison is first against latest, skipping empty check-ins', () => {
  const empty = checkIn('2026-09-01T08:00:00.000Z', {});
  const first = checkIn('2026-09-08T08:00:00.000Z', { front: 'a.jpg', back: 'a-back.jpg' });
  const latest = checkIn('2026-11-03T08:00:00.000Z', { front: 'z.jpg' });
  const pair = defaultPair([latest, empty, first]);
  assert.equal(pair?.before.id, first.id);
  assert.equal(pair?.after.id, latest.id);
  assert.deepEqual(sharedPoses(first, latest), ['front']);
  assert.equal(defaultPair([first]), null);
});

test('weight is stored in kilograms and shown in the chosen unit', () => {
  assert.equal(parseWeight('72.4', 'kg'), 72.4);
  assert.equal(parseWeight('160', 'lb'), 72.57);
  assert.equal(parseWeight('72,4', 'kg'), 72.4);
  assert.equal(parseWeight('', 'kg'), null);
  assert.equal(parseWeight('-3', 'kg'), null);
  assert.equal(formatWeight(72.57, 'lb'), '160.0 lb');
  assert.equal(formatWeightChange(80, 76.5, 'kg'), '−3.5 kg');
  assert.equal(formatWeightChange(70, 71, 'kg'), '+1.0 kg');
  assert.equal(formatWeightChange(70, 70, 'kg'), 'No change in kg');
  assert.equal(formatWeightChange(null, 70, 'kg'), null);
});

test('time between check-ins reads in days, then weeks', () => {
  assert.equal(daysBetween('2026-10-01T08:00:00.000Z', '2026-10-08T08:00:00.000Z'), 7);
  assert.equal(spanLabel('2026-10-01T08:00:00.000Z', '2026-10-01T20:00:00.000Z'), 'Same day');
  assert.equal(spanLabel('2026-10-01T08:00:00.000Z', '2026-10-04T08:00:00.000Z'), '3 days');
  assert.equal(spanLabel('2026-09-01T08:00:00.000Z', '2026-11-10T08:00:00.000Z'), '10 weeks');
});

test('a saved library survives bad entries', () => {
  const parsed = parseLibrary({
    version: 1,
    checkIns: [
      { id: 'one', takenAt: '2026-10-01T08:00:00.000Z', weightKg: 70, note: 'Week 1', photos: { front: 'f.jpg', nose: 'x.jpg' } },
      { id: 'broken' },
      { id: 'two', takenAt: '2026-10-08T08:00:00.000Z', weightKg: -2, photos: null },
    ],
    settings: { unit: 'lb', reminder: { weekday: 2, hour: 8, minute: 0 }, lock: true },
  });
  assert.equal(parsed?.checkIns.length, 2);
  assert.deepEqual(parsed?.checkIns[0].photos, { front: 'f.jpg' });
  assert.equal(parsed?.checkIns[1].weightKg, null);
  assert.deepEqual(parsed?.settings, { unit: 'lb', reminder: { weekday: 2, hour: 8, minute: 0 }, lock: true });
  assert.deepEqual(parseLibrary({ version: 1, checkIns: [], settings: { reminder: { weekday: 9, hour: 8, minute: 0 } } })?.settings, {
    unit: 'kg',
    reminder: null,
    lock: false,
  });
  assert.equal(parseLibrary({ version: 2, checkIns: [] }), null);
});
