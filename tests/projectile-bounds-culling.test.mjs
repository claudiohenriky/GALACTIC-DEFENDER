import test from 'node:test';
import assert from 'node:assert/strict';
import { Projectile } from '../src/combat/projectile.js';
import { EnemyProjectile } from '../src/combat/enemy-projectile.js';

test('player projectile is culled after leaving the arena margin', () => {
  const shot = new Projectile(10, 10, 0);
  shot.update(0.1, 20, 20);
  assert.equal(shot.active, false);
  assert.ok(shot.x > 40);
});

test('enemy projectile is culled after leaving the arena margin', () => {
  const shot = new EnemyProjectile(10, 10, 100, 10, { speed: 190 });
  shot.update(0.2, 20, 20);
  assert.equal(shot.active, false);
  assert.equal(shot.target, null);
});

test('projectiles inside the arena remain active', () => {
  const playerShot = new Projectile(10, 10, 0);
  const enemyShot = new EnemyProjectile(10, 10, 10, 100, { speed: 100 });
  playerShot.update(0.01, 100, 100);
  enemyShot.update(0.01, 100, 100);
  assert.equal(playerShot.active, true);
  assert.equal(enemyShot.active, true);
});

test('projectile updates without arena dimensions preserve standalone behavior', () => {
  const shot = new Projectile(10, 10, 0);
  shot.update(0.1);
  assert.equal(shot.active, true);
  assert.ok(shot.x > 10);
});
