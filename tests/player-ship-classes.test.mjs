import test from 'node:test';
import assert from 'node:assert/strict';
import { Player, SHIP_CLASS_CONFIG } from '../src/player/player.js';

test('all three selectable ships have distinct balanced base profiles', () => {
  const player = new Player(800, 600);
  player.setShipClass('vanguard');
  assert.equal(player.speed, 250);
  assert.equal(player.movementAcceleration, 2400);
  assert.equal(player.maxHealth, 100);

  player.setShipClass('phantom');
  assert.equal(player.speed, 285);
  assert.equal(player.movementAcceleration, 2500);
  assert.equal(player.maxHealth, 95);

  player.setShipClass('aegis');
  assert.equal(player.speed, 215);
  assert.equal(player.movementAcceleration, 1900);
  assert.equal(player.maxHealth, 125);
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

test('ship configuration is immutable and exposes the three intended classes', () => {
  assert.deepEqual(Object.keys(SHIP_CLASS_CONFIG), ['vanguard', 'phantom', 'aegis']);
  assert.equal(Object.isFrozen(SHIP_CLASS_CONFIG), true);
  for (const config of Object.values(SHIP_CLASS_CONFIG)) assert.equal(Object.isFrozen(config), true);
});
