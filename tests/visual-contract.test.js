import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gameSource = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('game contains no drop trajectory or prediction guide', () => {
  assert.doesNotMatch(gameSource, /drawDropGuide|drop guide|prediction line/i);
});

test('share poster uses the required 1080 by 1350 canvas', () => {
  assert.match(uiSource, /c\.width=1080;c\.height=1350/);
});
