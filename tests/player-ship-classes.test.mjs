import test from 'node:test';
import assert from 'node:assert/strict';
import { Player, SHIP_CLASS_CONFIG } from '../src/player/player.js';

test('all selectable ships have distinct base profiles', () => {
  const player = new Player(800, 600);
  player.setShipClass('vanguard');
  assert.equal(player.speed, 250);
  assert.equal(player.movementAcceleration, 2400);
  assert.equal(player.maxHealth, 100);

  player.setShipClass('phantom');
  assert.equal(player.speed, 275);
  assert.equal(player.movementAcceleration, 2500);
  assert.equal(player.maxHealth, 90);

  player.setShipClass('aegis');
  assert.equal(player.speed, 215);
  assert.equal(player.movementAcceleration, 1900);
  assert.equal(player.maxHealth, 125);

  player.setShipClass('wraith');
  assert.equal(player.speed, 285);
  assert.equal(player.movementAcceleration, 2750);
  assert.equal(player.maxHealth, 105);
  assert.equal(player.shipDamageMultiplier, 1.08);
});

test('ship profile changes restore base stats and full integrity before a run', () => {
  const player = new Player(800, 600);
  player.health = 30;
  player.speed = 340;
  player.maxHealth = 150;
  player.setShipClass('aegis');
  assert.equal(player.health, 125);
  assert.equal(player.maxHealth, 125);
  assert.equal(player.speed, 215);
});

test('invalid ship identifiers safely fall back to Vanguard', () => {
  const player = new Player(800, 600);
  const config = player.setShipClass('unknown');
  assert.equal(player.shipClass, 'vanguard');
  assert.equal(config, SHIP_CLASS_CONFIG.vanguard);
});

test('ship configuration is immutable and exposes the three standard classes plus the special ship', () => {
  assert.deepEqual(Object.keys(SHIP_CLASS_CONFIG), ['vanguard', 'phantom', 'aegis', 'wraith']);
  assert.equal(Object.isFrozen(SHIP_CLASS_CONFIG), true);
  for (const config of Object.values(SHIP_CLASS_CONFIG)) assert.equal(Object.isFrozen(config), true);
});

test('permanent mobility research scales the selected hull acceleration baseline', async () => {
  const { SkillTree } = await import('../src/progression/skill-tree.js');
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: key => key === 'gd-skill-tree-v1'
      ? JSON.stringify({ researchPoints: 0, purchased: ['mobility-1', 'mobility-2', 'mobility-3'], missionsCompleted: 0 })
      : null,
    setItem: () => {}
  };
  try {
    const tree = new SkillTree();
    const player = new Player(800, 600);
    player.setShipClass('aegis');
    tree.applyToPlayer(player);
    assert.equal(player.baseMovementAcceleration, 1900);
    assert.equal(player.movementAcceleration, 1900 * 1.08);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});


test('ship appearance accepts custom colors and safely falls back for invalid values', () => {
  const player = new Player(800, 600);
  const appearance = player.setShipAppearance({
    primary: '#123456', secondary: '#abcdef', core: '#fedcba', accent: '#654321', glow: false
  });
  assert.deepEqual(appearance, {
    primary: '#123456', secondary: '#abcdef', core: '#fedcba', accent: '#654321', glow: false
  });
  const fallback = player.setShipAppearance({ primary: 'red', core: '#fff', glow: 'yes' });
  assert.equal(fallback.primary, '#58e4e8');
  assert.equal(fallback.core, '#f4ffff');
  assert.equal(fallback.glow, true);
});


test('Wraith phase drive temporarily increases movement speed and expires cleanly', () => {
  const player = new Player(800, 600);
  player.setShipClass('wraith');
  assert.equal(player.getMovementSpeedMultiplier(), 1);
  player.activatePhaseDrive(2.2);
  assert.equal(player.getMovementSpeedMultiplier(), 1.22);
  player.update(2.3, new Set(), 800, 600);
  assert.equal(player.phaseDriveTimer, 0);
  assert.equal(player.getMovementSpeedMultiplier(), 1);
});

test('changing away from Wraith clears its temporary phase drive', () => {
  const player = new Player(800, 600);
  player.setShipClass('wraith');
  player.activatePhaseDrive();
  player.setShipClass('vanguard');
  assert.equal(player.phaseDriveTimer, 0);
  assert.equal(player.getMovementSpeedMultiplier(), 1);
});


test('Wraith uses its signature violet and graphite default appearance', () => {
  const player = new Player(800, 600);
  player.setShipClass('wraith');
  assert.deepEqual(player.shipAppearance, {
    primary: '#76279b', secondary: '#e5a0ff', core: '#f04cff', accent: '#b52be8', glow: true
  });
});


test('Wraith is the strongest generalist while Aegis remains the toughest hull', () => {
  const player = new Player(800, 600);
  player.setShipClass('wraith');
  const wraith = { speed: player.speed, acceleration: player.movementAcceleration, health: player.maxHealth };
  player.setShipClass('aegis');
  assert.ok(wraith.speed > player.speed);
  assert.ok(wraith.acceleration > player.movementAcceleration);
  assert.ok(wraith.health < player.maxHealth);
});
