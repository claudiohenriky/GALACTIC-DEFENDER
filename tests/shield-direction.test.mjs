import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getIncomingProjectileShieldSector } from '../src/combat/collision.js';
import { Player } from '../src/player/player.js';

const player = { x: 0, y: 0, radius: 13 };
const shot = (x, y, vx, vy) => ({ x, y, vx, vy, active: true });

test('incoming projectiles from cardinal directions map to the matching shield sector', () => {
  assert.equal(getIncomingProjectileShieldSector(player, shot(0, -100, 0, 200)), 2, 'from above');
  assert.equal(getIncomingProjectileShieldSector(player, shot(100, 0, -200, 0)), 4, 'from right');
  assert.equal(getIncomingProjectileShieldSector(player, shot(0, 100, 0, -200)), 6, 'from below');
  assert.equal(getIncomingProjectileShieldSector(player, shot(-100, 0, 200, 0)), 0, 'from left');
});

test('near-center impacts use the incoming vector instead of an unstable zero-point angle', () => {
  assert.equal(getIncomingProjectileShieldSector(player, shot(1, -100, 0, 200)), 2);
  assert.equal(getIncomingProjectileShieldSector(player, shot(100, 1, -200, 0)), 4);
});

test('off-course, receding, inactive, and stationary projectiles do not activate the shield', () => {
  assert.equal(getIncomingProjectileShieldSector(player, shot(80, -100, 0, 200)), -1);
  assert.equal(getIncomingProjectileShieldSector(player, shot(0, -100, 0, -200)), -1);
  assert.equal(getIncomingProjectileShieldSector(player, { ...shot(0, -100, 0, 200), active: false }), -1);
  assert.equal(getIncomingProjectileShieldSector(player, shot(0, -100, 0, 0)), -1);
});

test('Player no longer exposes the removed laser-card states', () => {
  const ship = new Player(360, 780);
  assert.equal('laserLevel' in ship, false);
  assert.equal('continuousLaserLevel' in ship, false);
});

test('continuous laser and Attack Clash are absent from active gameplay wiring', async () => {
  const game = await readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  const main = await readFile(new URL('../main.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(game, /continuousLaser|Attack Clash|clashResistance|player\.laserLevel/);
  assert.doesNotMatch(main, /continuousLaser|laser-clash|data-laser-clash/);
  assert.doesNotMatch(html, /continuous-laser-button|laser-clash-overlay|data-laser-clash/);
});
