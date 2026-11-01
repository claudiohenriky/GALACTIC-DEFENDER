import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { Game } from '../src/core/game.js';

test('Aegis Bastion Protocol reduces only Aegis incoming hull damage by 30%', () => {
  const player = Object.create(Player.prototype);
  player.shipClass = 'aegis';
  player.aegisBastionTimer = 2;
  assert.equal(player.getDamageTakenMultiplier(), 0.7);
  player.aegisBastionTimer = 0;
  assert.equal(player.getDamageTakenMultiplier(), 1);
  player.shipClass = 'phantom';
  player.aegisBastionTimer = 2;
  assert.equal(player.getDamageTakenMultiplier(), 1);
});

test('Aegis ability activates for 3.5 seconds with a 20-second cooldown', () => {
  let uses = 0;
  const game = {
    status: 'running',
    player: { shipClass: 'aegis', aegisBastionTimer: 0, abilityCooldownMultiplier: 1 },
    classAbilityCooldown: 0,
    classAbilityCooldownMax: 14,
    overloadLockTimer: 0,
    mission: { registerAbilityUse() { uses += 1; return null; } },
    handleMissionCompletion() {},
    updateClassAbilityButton() {}
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), true);
  assert.equal(game.player.aegisBastionTimer, 3.5);
  assert.equal(game.classAbilityCooldown, 20);
  assert.equal(uses, 1);
});

test('Aegis ability is exclusive and respects cooldown', () => {
  const game = {
    status: 'running',
    player: { shipClass: 'vanguard', aegisBastionTimer: 0 },
    classAbilityCooldown: 0,
    overloadLockTimer: 0
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
  game.player.shipClass = 'aegis';
  game.classAbilityCooldown = 1;
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
});

test('Aegis takeDamage applies the defensive multiplier to hull damage', () => {
  const player = Object.create(Player.prototype);
  player.shieldHealth = 0;
  player.invulnerabilityTimer = 0;
  player.health = 100;
  player.invulnerabilityDuration = 1;
  player.shipClass = 'aegis';
  player.aegisBastionTimer = 3;
  assert.equal(player.takeDamage(20), true);
  assert.equal(player.health, 86);
});
