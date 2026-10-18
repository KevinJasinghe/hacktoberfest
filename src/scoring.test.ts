// Run with: node --test src/scoring.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRuns, levelPoints, totalScore } from './scoring.ts';

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

test('level 3 uses the summed item time out of 150', () => {
  // 40s left on object 1, 30s on object 2, 5s on the selfie
  assert.equal(levelPoints(40 + 30 + 5, 150), 500);
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
