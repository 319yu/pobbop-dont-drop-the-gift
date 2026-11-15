import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';

test('a suspended gift becomes a finite falling body when released', () => {
  const engine = Matter.Engine.create();
  const gift = Matter.Bodies.rectangle(120, 100, 118, 68, { density: .0025 });
  Matter.Body.setStatic(gift, true);
  Matter.Composite.add(engine.world, gift);
  Matter.Body.setStatic(gift, false);
  for (let i = 0; i < 30; i++) Matter.Engine.update(engine, 16);
  assert.equal(gift.isStatic, false);
  assert.ok(Number.isFinite(gift.position.y));
  assert.ok(gift.position.y > 100);
});

test('release starts vertically without inherited horizontal drift', () => {
  const engine = Matter.Engine.create();
  const gift = Matter.Bodies.rectangle(200, 100, 118, 68);
  Matter.Body.setStatic(gift, true);
  Matter.Composite.add(engine.world, gift);
  Matter.Body.setPosition(gift, { x: 260, y: 100 });
  Matter.Body.setStatic(gift, false);
  Matter.Body.setVelocity(gift, { x: 0, y: 0 });
  gift.positionPrev.x = gift.position.x;
  gift.positionPrev.y = gift.position.y;
  for (let i = 0; i < 20; i++) Matter.Engine.update(engine, 16);
  assert.ok(Math.abs(gift.position.x - 260) < .001);
  assert.ok(gift.position.y > 100);
});

test('a kinematically suspended dynamic gift falls as soon as driving stops', () => {
  const engine = Matter.Engine.create();
  const gift = Matter.Bodies.rectangle(160, 100, 118, 68);
  Matter.Composite.add(engine.world, gift);
  for (let i = 0; i < 10; i++) {
    Matter.Engine.update(engine, 16);
    Matter.Body.setPosition(gift, { x: 160 + i * 2, y: 100 });
    Matter.Body.setVelocity(gift, { x: 0, y: 0 });
    gift.positionPrev.x = gift.position.x;
    gift.positionPrev.y = gift.position.y;
  }
  const releaseX = gift.position.x;
  for (let i = 0; i < 20; i++) Matter.Engine.update(engine, 16);
  assert.ok(gift.position.y > 100);
  assert.ok(Math.abs(gift.position.x - releaseX) < .001);
});

test('a sleeping gift is explicitly woken on every release', () => {
  const engine = Matter.Engine.create({ enableSleeping: true });
  const gift = Matter.Bodies.rectangle(160, 100, 118, 68);
  Matter.Composite.add(engine.world, gift);
  Matter.Sleeping.set(gift, true);
  assert.equal(gift.isSleeping, true);
  Matter.Sleeping.set(gift, false);
  for (let i = 0; i < 20; i++) Matter.Engine.update(engine, 16);
  assert.equal(gift.isSleeping, false);
  assert.ok(gift.position.y > 100);
});
