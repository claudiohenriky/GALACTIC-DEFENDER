import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/enemies/enemy.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';

test('DREADNOUGHT plasma cannons use the longer 7.2-second recharge', () => {
  const boss = new Enemy(400, 120, 1, 'boss');
  const cannons = boss.bossSystems.modules.filter((module) => module.kind.includes('plasma'));

  assert.equal(cannons.length, 4);
  assert.ok(cannons.every((module) => module.plasmaChargeDuration === 7.2));
  assert.ok(cannons.every((module) => module.plasmaChargeTimer === 7.2));
});

test('DREADNOUGHT movement profiles preserve a heavy, slower hull', () => {
  assert.deepEqual(ENEMY_MOTION_PROFILES.boss, { maxSpeed: 34, acceleration: 24 });
  assert.deepEqual(ENEMY_MOTION_PROFILES.bossPhaseThree, { maxSpeed: 42, acceleration: 30 });
});

test('DREADNOUGHT holds a patrol waypoint instead of retargeting every frame', () => {
  const boss = new Enemy(400, 120, 1, 'boss');
  boss.bossEntranceTimer = 0;
  boss.fireCooldown = 100;
  boss.bossRepositionCooldown = 100;
  boss.facingRotation = Math.atan2(500 - boss.y, 350 - boss.x);

  boss.update(1 / 60, 350, 500, 1000, 700);
  const waypoint = { x: boss.bossMoveTargetX, y: boss.bossMoveTargetY };

  boss.update(1 / 60, 370, 500, 1000, 700);

  assert.equal(boss.bossMovementState, 'patrol');
  assert.equal(boss.bossMoveTargetX, waypoint.x);
  assert.equal(boss.bossMoveTargetY, waypoint.y);
  assert.ok(boss.bossPatrolTargetTimer > 0);
});
