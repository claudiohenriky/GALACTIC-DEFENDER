import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { Game } from '../src/core/game.js';

test('Vanguard Tactical Synchronization increases only Vanguard damage while active', () => {
  const player = Object.create(Player.prototype);
  player.shipClass = 'vanguard';
  player.vanguardSyncTimer = 1.5;
  assert.equal(player.getClassDamageMultiplier(), 1.2);
  player.vanguardSyncTimer = 0;
  assert.equal(player.getClassDamageMultiplier(), 1);
  player.shipClass = 'wraith';
  player.vanguardSyncTimer = 1.5;
  assert.equal(player.getClassDamageMultiplier(), 1);
});

test('Vanguard class ability grants its timed damage effect and cooldown', () => {
  let uses = 0;
  const game = {
    status: 'running',
    player: { shipClass: 'vanguard', vanguardSyncTimer: 0, abilityCooldownMultiplier: 1 },
    classAbilityCooldown: 0,
    classAbilityCooldownMax: 14,
    overloadLockTimer: 0,
    mission: { registerAbilityUse() { uses += 1; return null; } },
    handleMissionCompletion() {},
    updateClassAbilityButton() {}
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), true);
  assert.equal(game.player.vanguardSyncTimer, 3);
  assert.equal(game.classAbilityCooldown, 18);
  assert.equal(uses, 1);
});

test('Vanguard ability cannot activate for another class or during cooldown', () => {
  const game = {
    status: 'running',
    player: { shipClass: 'aegis', vanguardSyncTimer: 0 },
    classAbilityCooldown: 0,
    overloadLockTimer: 0
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
  game.player.shipClass = 'vanguard';
  game.classAbilityCooldown = 1;
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
});
