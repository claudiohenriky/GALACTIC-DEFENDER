import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { approachVelocity, integrateVelocity } from '../src/movement/motion.js';

function simulateVelocity(fps, duration, targetX, targetY, acceleration = 2400) {
  const entity = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
  const dt = 1 / fps;
  const frames = Math.round(duration * fps);
  for (let frame = 0; frame < frames; frame += 1) {
    approachVelocity(entity, targetX, targetY, acceleration, dt);
    integrateVelocity(entity, dt);
  }
  return entity;
}

test('shared motion integrator reaches the same capped velocity at 30, 60 and 120 FPS', () => {
  for (const fps of [30, 60, 120]) {
    const entity = simulateVelocity(fps, 0.5, 250, 0);
    assert.equal(entity.velocityX, 250);
    assert.equal(entity.velocityY, 0);
  }
});

test('shared motion integrator reverses direction without overshooting the target velocity', () => {
  const entity = { x: 0, y: 0, velocityX: 250, velocityY: 0 };
  approachVelocity(entity, -250, 0, 2400, 0.1);
  assert.ok(Math.abs(entity.velocityX - 10) < 1e-9);
  approachVelocity(entity, -250, 0, 2400, 0.2);
  assert.equal(entity.velocityX, -250);
});

test('invalid or zero delta time does not mutate motion state', () => {
  const entity = { x: 4, y: 8, velocityX: 12, velocityY: -6 };
  approachVelocity(entity, 100, 100, 2400, 0);
  integrateVelocity(entity, -1);
  assert.deepEqual(entity, { x: 4, y: 8, velocityX: 12, velocityY: -6 });
});

test('player keeps its top speed while diagonal keyboard movement remains normalized', () => {
  const player = new Player(1000, 1000);
  const keys = new Set(['w', 'd']);
  for (let frame = 0; frame < 30; frame += 1) {
    player.update(1 / 60, keys, 1000, 1000);
  }
  assert.ok(Math.abs(Math.hypot(player.velocityX, player.velocityY) - player.speed) < 1e-9);
  assert.equal(player.speed, 250);
});

test('player direction reversal responds faster while preserving the existing speed cap', () => {
  const player = new Player(1000, 1000);
  for (let frame = 0; frame < 30; frame += 1) {
    player.update(1 / 60, new Set(['d']), 1000, 1000);
  }
  assert.equal(player.velocityX, 250);
  for (let frame = 0; frame < 6; frame += 1) {
    player.update(1 / 60, new Set(['a']), 1000, 1000);
  }
  assert.ok(Math.abs(player.velocityX - 10) < 1e-9);
});
