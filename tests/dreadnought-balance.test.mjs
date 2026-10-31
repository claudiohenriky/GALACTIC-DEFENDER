import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/enemies/enemy.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';

test('DREADNOUGHT keeps one plasma cannon per side with the longer 7.2-second recharge', () => {
  const boss = new Enemy(400, 120, 1, 'boss');
  const cannons = boss.bossSystems.modules.filter((module) => module.kind.includes('plasma'));

  assert.equal(cannons.length, 2);
  assert.equal(cannons.filter((module) => module.region === 'left').length, 1);
  assert.equal(cannons.filter((module) => module.region === 'right').length, 1);
  assert.ok(cannons.every((module) => module.plasmaChargeDuration === 7.2));
  assert.ok(cannons.every((module) => module.plasmaChargeTimer === 7.2));
});

test('Devastator fires along the exact angle locked at the end of its warning', () => {
  const devastator = new Enemy(300, 300, 12, 'devastator');
  devastator.siegeState = 'warning';
  devastator.siegeWarningTimer = 0.01;
  devastator.siegeLockedAngle = 0.63;
  devastator.siegeAimAngle = 0.63;
  const shot = devastator.update(0.02, 600, 700, 1000, 1000);
  assert.ok(shot);
  const firedAngle = Math.atan2(shot.targetY - shot.y, shot.targetX - shot.x);
  assert.ok(Math.abs(firedAngle - devastator.siegeLockedAngle) < 1e-9);
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
