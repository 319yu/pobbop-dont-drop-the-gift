import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { BOX_TYPES } from '../src/config.js';

const gameSource = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('game contains no drop trajectory or prediction guide', () => {
  assert.doesNotMatch(gameSource, /drawDropGuide|drop guide|prediction line/i);
});

test('share poster uses the required 1080 by 1350 canvas', () => {
  assert.match(uiSource, /c\.width=1080;c\.height=1350/);
});

test('each supplied flat box has an isolated asset and matching body aspect', () => {
  for (const type of ['classic', 'mirror', 'bouncy']) {
    assert.ok(existsSync(new URL(`../public/assets/boxes/${type}.png`, import.meta.url)));
    assert.ok(BOX_TYPES[type].aspect > 2.1 && BOX_TYPES[type].aspect < 2.3);
  }
  assert.match(gameSource, /h = w \/ cfg\.aspect/);
});
