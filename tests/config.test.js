import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBoxType, stageForScore, titleFor, windSpeedMultiplier } from '../src/config.js';

test('early difficulty only returns classic boxes',()=>{for(let score=0;score<5;score++)assert.equal(chooseBoxType(score,()=>.99),'classic');});
test('silver unlocks first and yellow remains the rarest special box',()=>{assert.equal(chooseBoxType(5,()=>.99),'mirror');assert.equal(chooseBoxType(10,()=>.9),'mirror');assert.equal(chooseBoxType(10,()=>.99),'bouncy');assert.equal(chooseBoxType(21,()=>.99),'bouncy');});
test('player titles respect score boundaries',()=>{assert.equal(titleFor(5),'THE BEGINNER');assert.equal(titleFor(6),'THE GIFT LOVER');assert.equal(titleFor(20),'THE BALANCE MASTER');assert.equal(titleFor(31),'THE UNBOXABLE');});
test('three stages advance every ten points',()=>{assert.equal(stageForScore(9).number,1);assert.equal(stageForScore(10).number,2);assert.equal(stageForScore(19).number,2);assert.equal(stageForScore(20).number,3);assert.equal(stageForScore(99).number,3);});
test('tailwind accelerates and headwind slows rail movement',()=>{assert.equal(windSpeedMultiplier(1,1),1.45);assert.equal(windSpeedMultiplier(-1,-1),1.45);assert.equal(windSpeedMultiplier(1,-1),.62);assert.equal(windSpeedMultiplier(-1,1),.62);assert.equal(windSpeedMultiplier(1,0),1);});
