import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/enemies/enemy.js';
import { EnemyProjectile } from '../src/combat/enemy-projectile.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';

test('Devastador is larger, durable, and slower than the Guardian', () => {
  const unit = new Enemy(400, 200, 12, 'devastator');
  const guardian = new Enemy(400, 200, 12, 'guardian');
  assert.equal(unit.radius, 18);
  assert.ok(unit.maxHealth > 16);
  assert.ok(unit.speed < guardian.speed);
  assert.equal(unit.motionProfile, ENEMY_MOTION_PROFILES.devastator);
  assert.ok(ENEMY_MOTION_PROFILES.devastator.maxSpeed < ENEMY_MOTION_PROFILES.guardian.maxSpeed);
});

test('Devastador charges, locks a predicted line, warns, then fires a fast siege projectile', () => {
  const unit = new Enemy(400, 200, 12, 'devastator');
  unit.siegeChargeTimer = 0.01;
  const args = [0.02, 650, 850, 1200, 1600, [], [], 0, 100, 0];
  const noShot = unit.update(...args);
  assert.equal(noShot, null);
  assert.equal(unit.siegeState, 'warning');
  assert.ok(Number.isFinite(unit.siegeAimAngle));
  unit.siegeWarningTimer = 0.01;
  const shot = unit.update(...args);
  assert.equal(unit.siegeState, 'recover');
  assert.equal(shot.siegeImpact, true);
  assert.equal(shot.heavyImpact, true);
  assert.equal(shot.speed, 760);
  assert.equal(shot.damage, 36);
  assert.ok(shot.radius >= 7);
});

test('Devastador Elite has a defensive shield and a shorter, stronger attack cycle', () => {
  const elite = new Enemy(400, 200, 12, 'devastator', true);
  assert.equal(elite.isElite, true);
  assert.equal(elite.eliteMaxShield, 12);
  assert.equal(elite.eliteShield, 12);
  assert.equal(elite.siegeWarningDuration, 0.82);
  elite.siegeChargeTimer = 0.01;
  const args = [0.02, 650, 850, 1200, 1600, [], [], 0, 100, 0];
  elite.update(...args);
  elite.siegeWarningTimer = 0.01;
  const shot = elite.update(...args);
  assert.equal(shot.siegeImpact, true);
  assert.equal(shot.damage, 44);
});

test('EnemyProjectile preserves the dedicated siege-impact flag', () => {
  const shot = new EnemyProjectile(10, 20, 100, 200, {
    speed: 760, damage: 36, heavyImpact: true, siegeImpact: true
  });
  assert.equal(shot.siegeImpact, true);
  assert.equal(shot.heavyImpact, true);
  assert.equal(shot.speed, 760);
});
