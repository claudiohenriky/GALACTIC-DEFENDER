import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { Game } from '../src/core/game.js';

test('Phantom Evasão Espectral increases movement speed only while active', () => {
  const player = Object.create(Player.prototype);
  player.shipClass = 'phantom';
  player.phantomEvasionTimer = 0.5;
  player.phaseDriveTimer = 0;
  assert.equal(player.getMovementSpeedMultiplier(), 1.42);
  player.phantomEvasionTimer = 0;
  assert.equal(player.getMovementSpeedMultiplier(), 1);
});

test('other classes do not receive the Phantom movement multiplier', () => {
  const player = Object.create(Player.prototype);
  player.shipClass = 'vanguard';
  player.phantomEvasionTimer = 0.5;
  player.phaseDriveTimer = 0;
  assert.equal(player.getMovementSpeedMultiplier(), 1);
});

test('Phantom class ability grants its timed effect and cooldown', () => {
  let missionUses = 0;
  const game = {
    status: 'running',
    player: { shipClass: 'phantom', phantomEvasionTimer: 0, invulnerabilityTimer: 0, abilityCooldownMultiplier: 1 },
    classAbilityCooldown: 0,
    classAbilityCooldownMax: 14,
    overloadLockTimer: 0,
    mission: { registerAbilityUse() { missionUses += 1; return null; } },
    handleMissionCompletion() {},
    updateClassAbilityButton() {}
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), true);
  assert.equal(game.player.phantomEvasionTimer, 0.68);
  assert.equal(game.player.invulnerabilityTimer, 0.38);
  assert.equal(game.classAbilityCooldown, 14);
  assert.equal(missionUses, 1);
});

test('Phantom class ability cannot be activated by other classes or during cooldown', () => {
  const game = {
    status: 'running',
    player: { shipClass: 'unassigned', phantomEvasionTimer: 0, invulnerabilityTimer: 0 },
    classAbilityCooldown: 0,
    overloadLockTimer: 0
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
  game.player.shipClass = 'phantom';
  game.classAbilityCooldown = 2;
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
});
