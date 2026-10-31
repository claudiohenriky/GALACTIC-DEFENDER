import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { Enemy } from '../src/enemies/enemy.js';
import { EliteTacticalCoordinator } from '../src/ai/elite-tactics.js';
import { EnemyTacticalCoordinator } from '../src/ai/enemy-tactics.js';
import { approachVelocity, integrateVelocity, steerToPoint, ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';

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

test('braking-aware steering converges on a destination at common frame rates', () => {
  for (const fps of [30, 60, 120]) {
    const entity = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
    const profile = { maxSpeed: 150, acceleration: 300 };
    for (let frame = 0; frame < fps * 4; frame += 1) {
      steerToPoint(entity, 120, 80, profile, 1 / fps);
    }
    assert.ok(Math.hypot(entity.x - 120, entity.y - 80) < 0.5, `failed to settle at ${fps} FPS`);
    assert.ok(Math.hypot(entity.velocityX, entity.velocityY) < 1);
  }
});

test('ranged enemy profiles preserve distinct class and Elite movement capabilities', () => {
  assert.ok(ENEMY_MOTION_PROFILES.sentinelElite.maxSpeed > ENEMY_MOTION_PROFILES.sentinel.maxSpeed);
  assert.ok(ENEMY_MOTION_PROFILES.artilleryElite.acceleration > ENEMY_MOTION_PROFILES.artillery.acceleration);
  assert.ok(ENEMY_MOTION_PROFILES.guardianElite.maxSpeed > ENEMY_MOTION_PROFILES.guardian.maxSpeed);

  const sentinel = new Enemy(500, 200, 14, 'sentinel', true);
  const artillery = new Enemy(500, 200, 12, 'artillery', true);
  const interceptor = new Enemy(500, 200, 12, 'interceptor', true);
  const boss = new Enemy(500, 0, 10, 'boss');
  assert.deepEqual(sentinel.motionProfile, ENEMY_MOTION_PROFILES.sentinelElite);
  assert.deepEqual(artillery.motionProfile, ENEMY_MOTION_PROFILES.artilleryElite);
  assert.equal(interceptor.motionProfile, null);
  assert.equal(boss.motionProfile, null);
});

test('ranged enemy steering keeps position and velocity finite during a sustained encounter', () => {
  for (const type of ['sentinel', 'artillery']) {
    const enemy = new Enemy(500, 160, 16, type, true);
    for (let frame = 0; frame < 600; frame += 1) {
      enemy.update(1 / 60, 650, 900, 1200, 1600, [], [], 0);
      assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y));
      assert.ok(Number.isFinite(enemy.velocityX) && Number.isFinite(enemy.velocityY));
    }
  }
});

test('Elite coordinator assigns at most one flank and prioritizes Sentinel Elite', () => {
  const player = { x: 500, y: 500, velocityX: 0, velocityY: 0, rotation: -Math.PI / 2 };
  const sentinel = new Enemy(430, 250, 14, 'sentinel', true);
  const artillery = new Enemy(570, 250, 14, 'artillery', true);
  sentinel.eliteSpawnTimer = 0;
  artillery.eliteSpawnTimer = 0;
  const enemies = [
    sentinel,
    artillery,
    new Enemy(350, 180, 8, 'chaser'),
    new Enemy(650, 180, 8, 'chaser')
  ];
  const coordinator = new EliteTacticalCoordinator();
  coordinator.update(1 / 60, enemies, player, 1200, 1600);
  assert.ok(sentinel.flankTimer > 3);
  assert.equal(artillery.flankTimer, 0);
  assert.equal(enemies.filter(enemy => enemy.flankTimer > 0).length, 1);
  assert.ok(sentinel.flankTargetY > player.y, 'rear position should be behind the player facing upward');
});

test('Elite Guardian does not abandon living allies to perform a flank', () => {
  const player = { x: 500, y: 500, velocityX: 0, velocityY: 0, rotation: -Math.PI / 2 };
  const guardian = new Enemy(500, 250, 16, 'guardian', true);
  guardian.eliteSpawnTimer = 0;
  const ally = new Enemy(450, 220, 16, 'sentinel');
  guardian.protectedAllies = [ally];
  const enemies = [guardian, ally, new Enemy(300, 180, 8, 'chaser'), new Enemy(700, 180, 8, 'chaser')];
  new EliteTacticalCoordinator().update(1 / 60, enemies, player, 1200, 1600);
  assert.equal(guardian.flankTimer, 0);
});

test('flanking Elite Sentinel holds fire while moving to its assigned rear position', () => {
  const sentinel = new Enemy(250, 200, 14, 'sentinel', true);
  sentinel.eliteSpawnTimer = 0;
  sentinel.flankTimer = 2;
  sentinel.flankTargetX = 760;
  sentinel.flankTargetY = 700;
  sentinel.fireCooldown = 0.01;
  const startDistance = Math.hypot(sentinel.x - sentinel.flankTargetX, sentinel.y - sentinel.flankTargetY);
  const shot = sentinel.update(1 / 60, 300, 800, 1000, 1200, [], [], 0);
  const endDistance = Math.hypot(sentinel.x - sentinel.flankTargetX, sentinel.y - sentinel.flankTargetY);
  assert.equal(shot, null);
  assert.ok(sentinel.fireCooldown >= 0.2);
  assert.ok(endDistance < startDistance);
});

test('common troop coordinator gives one Chaser a lateral reposition, never an Interceptor', () => {
  const player = { x: 500, y: 500, velocityX: 0, velocityY: 0, rotation: -Math.PI / 2 };
  const chaserA = new Enemy(420, 220, 8, 'chaser');
  const chaserB = new Enemy(580, 220, 8, 'chaser');
  const interceptor = new Enemy(500, 180, 8, 'interceptor', true);
  const artillery = new Enemy(350, 190, 12, 'artillery');
  const enemies = [chaserA, chaserB, interceptor, artillery];
  const coordinator = new EnemyTacticalCoordinator();
  coordinator.update(1 / 60, enemies, player, 1200, 1600);
  assert.equal([chaserA, chaserB].filter(enemy => enemy.repositionTimer > 0).length, 1);
  assert.equal(interceptor.repositionTimer, 0);
  assert.equal(interceptor.isElite, false);
});

test('common Chaser holds fire during its short lateral reposition', () => {
  const chaser = new Enemy(250, 200, 8, 'chaser');
  chaser.repositionTimer = 2;
  chaser.repositionTargetX = 700;
  chaser.repositionTargetY = 500;
  chaser.fireCooldown = 0.01;
  const startDistance = Math.hypot(chaser.x - chaser.repositionTargetX, chaser.y - chaser.repositionTargetY);
  const shot = chaser.update(1 / 60, 300, 800, 1000, 1200, [], [], 0);
  const endDistance = Math.hypot(chaser.x - chaser.repositionTargetX, chaser.y - chaser.repositionTargetY);
  assert.equal(shot, null);
  assert.ok(chaser.fireCooldown >= 0.2);
  assert.ok(endDistance < startDistance);
});

test('common troop reposition waits while an Elite flank is active', () => {
  const player = { x: 500, y: 500, velocityX: 0, velocityY: 0, rotation: -Math.PI / 2 };
  const enemies = [
    new Enemy(420, 220, 8, 'chaser'),
    new Enemy(580, 220, 8, 'chaser'),
    new Enemy(500, 180, 8, 'interceptor'),
    new Enemy(350, 190, 12, 'artillery')
  ];
  new EnemyTacticalCoordinator().update(1 / 60, enemies, player, 1200, 1600, true);
  assert.ok(enemies.every(enemy => enemy.repositionTimer === 0));
});

test('Dreadnought uses a heavy reposition state when the pilot leaves its forward arc', () => {
  const boss = new Enemy(500, 300, 10, 'boss');
  boss.bossEntranceTimer = 0;
  boss.facingRotation = 0;
  boss.bossRepositionCooldown = 0;
  boss.update(1 / 60, 200, 900, 1200, 1600, [], [], 0, 0, 0);
  assert.equal(boss.bossMovementState, 'reposition');
  assert.ok(Number.isFinite(boss.bossMoveTargetX) && Number.isFinite(boss.bossMoveTargetY));
  assert.ok(Math.hypot(boss.velocityX, boss.velocityY) <= ENEMY_MOTION_PROFILES.boss.maxSpeed + 1e-6);
  assert.ok(Math.hypot(boss.bossMoveTargetX - 200, boss.bossMoveTargetY - 900) > 250);
});

test('Dreadnought turret tracking leads a moving pilot instead of aiming only at its current position', () => {
  const stationaryBoss = new Enemy(500, 200, 10, 'boss');
  const leadingBoss = new Enemy(500, 200, 10, 'boss');
  stationaryBoss.bossEntranceTimer = 0;
  leadingBoss.bossEntranceTimer = 0;
  stationaryBoss.facingRotation = Math.PI / 2;
  leadingBoss.facingRotation = Math.PI / 2;
  stationaryBoss.bossSystems.getModule('machine-gun-left').turretAngle = 0.12;
  leadingBoss.bossSystems.getModule('machine-gun-left').turretAngle = 0.12;
  stationaryBoss.update(1 / 60, 500, 900, 1200, 1600, [], [], 0, 0, 0);
  leadingBoss.update(1 / 60, 500, 900, 1200, 1600, [], [], 0, 120, 0);
  const stationaryAngle = stationaryBoss.bossSystems.getModule('machine-gun-left').turretAngle;
  const leadingAngle = leadingBoss.bossSystems.getModule('machine-gun-left').turretAngle;
  assert.notEqual(leadingAngle, stationaryAngle);
});

test('Guardian uses its class-specific steering profile with and without a protected formation', () => {
  for (const isElite of [false, true]) {
    const guardian = new Enemy(200, 180, 16, 'guardian', isElite);
    const ally = new Enemy(220, 160, 16, 'sentinel');
    if (isElite) guardian.protectedAllies = [ally];
    for (let frame = 0; frame < 180; frame += 1) {
      guardian.update(1 / 60, 650, 700, 1200, 1600, [], [ally], 0);
      assert.ok(Number.isFinite(guardian.x) && Number.isFinite(guardian.y));
      assert.ok(Math.hypot(guardian.velocityX, guardian.velocityY) <= guardian.motionProfile.maxSpeed + 1e-6);
    }
  }
});
