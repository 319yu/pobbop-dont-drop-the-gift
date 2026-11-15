import test from 'node:test';
import assert from 'node:assert/strict';

test('nullish pause expression preserves explicit false', () => {
  const state = 'paused';
  assert.equal(false ?? state === 'playing', false);
  assert.equal(undefined ?? state === 'playing', false);
});
