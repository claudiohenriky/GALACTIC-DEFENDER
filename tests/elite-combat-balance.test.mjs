import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/enemies/enemy.js';
import { EnemyProjectile } from '../src/combat/enemy-projectile.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';
import { getGuardianProtectionPriority, selectGuardianProtectionTargets } from '../src/ai/guardian-protection.js';
import { isBossPlasmaTelegraphActive } from '../src/enemies/boss-systems.js';
import { Game } from '../src/core/game.js';

test('Elite movement profiles stay close to their normal class baselines', () => {
  const pairs = [
    ['sentinel', 'sentinelElite'],
    ['artillery', 'artilleryElite'],
    ['guardian', 'guardianElite'],
    ['devastator', 'devastatorElite']
  ];
  for (const [normalKey, eliteKey] of pairs) {
    const normal = ENEMY_MOTION_PROFILES[normalKey];
    const elite = ENEMY_MOTION_PROFILES[eliteKey];
    assert.ok(elite.maxSpeed > normal.maxSpeed);
    assert.ok(elite.maxSpeed <= normal.maxSpeed * 1.2);
    assert.ok(elite.acceleration > normal.acceleration);
    assert.ok(elite.acceleration <= normal.acceleration * 1.2);
  }
});

test('all Elite classes have a personal shield and only modest health premiums', () => {
  const expected = { sentinel: 8, artillery: 8, guardian: 12, devastator: 12 };
  for (const [type, shield] of Object.entries(expected)) {
    const normal = new Enemy(300, 300, 10, type, false);
    const elite = new Enemy(300, 300, 10, type, true);
    assert.equal(elite.eliteMaxShield, shield);
    assert.ok(elite.maxHealth >= normal.maxHealth);
    assert.ok(elite.maxHealth <= normal.maxHealth + 2);
    assert.ok(elite.speed > normal.speed);
    assert.ok(elite.speed <= normal.speed * 1.12);
  }
});

test('Sentinel Elite launches two short-guidance micro-missiles', () => {
  const sentinel = new Enemy(300, 300, 10, 'sentinel', true);
  sentinel.fireCooldown = 100;
  sentinel.eliteMissileCooldown = 0;
  sentinel.dodgeScanTimer = 10;
  const shots = sentinel.update(1 / 60, 520, 120, 1000, 700);
  assert.equal(shots.length, 2);
  assert.ok(shots.every(shot => shot.homing && shot.homingDuration === 0.52));
  assert.ok(shots.every(shot => shot.damage < 3 && shot.lifetime < 3));
  assert.equal(sentinel.eliteMissileCooldown, 7.5);
});

test('micro-missiles stop tracking after their short guidance window', () => {
  const target = { x: 500, y: 100 };
  const missile = new EnemyProjectile(100, 100, target.x, target.y, {
    target, homing: true, homingDuration: 0.5, turnRate: 1.3, speed: 185
  });
  missile.update(0.6);
  assert.equal(missile.homing, false);
  assert.equal(missile.target, null);
});

test('Elite Artillery fires a three-projectile fan while normal Artillery keeps two', () => {
  const normal = new Enemy(300, 300, 10, 'artillery', false);
  const elite = new Enemy(300, 300, 10, 'artillery', true);
  normal.fireCooldown = 0;
  elite.fireCooldown = 0;
  normal.dodgeScanTimer = elite.dodgeScanTimer = 10;
  const normalShots = normal.update(1 / 60, 520, 100, 1000, 700);
  const eliteShots = elite.update(1 / 60, 520, 100, 1000, 700);
  assert.equal(normalShots.length, 2);
  assert.equal(eliteShots.length, 3);
  assert.ok(eliteShots.every(shot => shot.damage <= 3.5));
});

test('Devastator Elite auxiliary guns fire two low-damage support shots', () => {
  const devastator = new Enemy(300, 300, 10, 'devastator', true);
  devastator.siegeState = 'charging';
  devastator.siegeChargeTimer = 10;
  devastator.eliteAuxCooldown = 0;
  const shots = devastator.update(1 / 60, 520, 100, 1000, 700);
  assert.equal(shots.length, 2);
  assert.ok(shots.every(shot => shot.damage <= 1.5 && shot.speed >= 230));
});

test('Guardians rank every Elite ally above ordinary troops', () => {
  const guardian = new Enemy(300, 300, 10, 'guardian', true);
  const eliteSentinel = new Enemy(310, 300, 10, 'sentinel', true);
  const eliteDevastator = new Enemy(320, 300, 10, 'devastator', true);
  const normalSentinel = new Enemy(305, 300, 10, 'sentinel', false);
  const normalInterceptor = new Enemy(315, 300, 10, 'interceptor', false);
  assert.equal(getGuardianProtectionPriority(eliteDevastator), 0);
  assert.equal(getGuardianProtectionPriority(normalSentinel), 1);
  const selected = selectGuardianProtectionTargets(
    guardian, [guardian, normalSentinel, normalInterceptor, eliteSentinel, eliteDevastator], new Set(), 360
  );
  assert.deepEqual(selected, [eliteSentinel, eliteDevastator]);
});

test('guided missile hits are absorbed by an Elite shield without leaking into hull health', () => {
  const elite = new Enemy(300, 300, 10, 'sentinel', true);
  const originalHealth = elite.health;
  const fakeGame = { enemies: [] };
  Game.prototype.damageEnemy.call(fakeGame, elite, 24, null, null, true);
  assert.equal(elite.eliteShield, 0);
  assert.equal(elite.health, originalHealth);
});

test('a charged plasma cannon starts a visible warning even when the boss cooldown is ready', () => {
  const boss = new Enemy(500, 500, 1, 'boss');
  const cannon = boss.bossSystems.getModule('plasma-cannon-left-forward');
  boss.bossEntranceTimer = 0;
  boss.bossPhaseTransition = 0;
  boss.fireCooldown = 0;
  boss.facingRotation = -Math.PI / 2;
  cannon.plasmaChargeTimer = 0;
  cannon.plasmaWarningActive = true;
  cannon.plasmaWarningTimer = 0.8;
  assert.equal(isBossPlasmaTelegraphActive(boss, cannon, 300, 500), true);
  cannon.plasmaWarningActive = false;
  assert.equal(isBossPlasmaTelegraphActive(boss, cannon, 300, 500), false);
});


test('Guardian support selection uses only its assigned protected allies', () => {
  const guardian = new Enemy(300, 300, 10, 'guardian', true);
  const ordinarySentinel = new Enemy(310, 300, 10, 'sentinel', false);
  const eliteSentinel = new Enemy(320, 300, 10, 'sentinel', true);
  guardian.protectedAllies = [ordinarySentinel, eliteSentinel];
  guardian.supportScanTimer = 0;
  guardian.fireCooldown = 100;

  guardian.update(1 / 60, 520, 100, 1000, 700, [], []);

  assert.equal(guardian.supportAllyCache, eliteSentinel);
});

test('Sentinel support selection follows its direct assigned Guardian link', () => {
  const guardian = new Enemy(300, 300, 10, 'guardian', true);
  const sentinel = new Enemy(320, 300, 10, 'sentinel', false);
  guardian.protectedAllies = [sentinel];
  sentinel.supportGuardianCache = guardian;
  sentinel.supportScanTimer = 0;
  sentinel.fireCooldown = 100;
  sentinel.dodgeScanTimer = 10;

  sentinel.update(1 / 60, 520, 100, 1000, 700, [], []);

  assert.equal(sentinel.supportAllyCache, guardian);
});
