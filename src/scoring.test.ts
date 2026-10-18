// Run with: node --test src/scoring.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns, LEVEL1_LOCK_LIMIT, LEVEL3_ITEM_LIMITS, LEVEL_LIMITS, levelPoints, totalScore } from './scoring.ts';

test('full time remaining earns 1000', () => {
  assert.equal(levelPoints(180, 180), 1000);
});

test('points scale with time remaining and round', () => {
  assert.equal(levelPoints(90, 180), 500);
  assert.equal(levelPoints(100, 150), 667);
});

test('clearing with little time left still earns the 100 minimum', () => {
  assert.equal(levelPoints(5, 180), 100);
  assert.equal(levelPoints(0, 180), 100);
});

test('level 3 uses the summed time left on each item', () => {
  const limit = LEVEL3_ITEM_LIMITS.reduce((a, b) => a + b, 0);
  assert.equal(LEVEL_LIMITS[3], limit);
  // 30s left on the object, 15s on the selfie
  assert.equal(levelPoints(30 + 15, limit), 500);
});

test('level 1 uses the summed time left on each 15s lock', () => {
  assert.equal(LEVEL1_LOCK_LIMIT, 15);
  assert.equal(LEVEL_LIMITS[1], LEVEL1_LOCK_LIMIT * 2);
  // 10s left on the riddle, 5s on the sum
  assert.equal(levelPoints(10 + 5, LEVEL_LIMITS[1]), 500);
});

test('timeouts cost 250 each', () => {
  assert.equal(totalScore([1000, 500, 500], 2), 1500);
});

test('total score is floored at 0', () => {
  assert.equal(totalScore([100, 100, 100], 5), 0);
});

test('ties go to the faster total time', () => {
  const runs = [
    { score: 900, time: 300 },
    { score: 1200, time: 400 },
    { score: 900, time: 250 },
  ].sort(compareRuns);
  assert.deepEqual(runs, [
    { score: 1200, time: 400 },
    { score: 900, time: 250 },
    { score: 900, time: 300 },
  ]);
});
