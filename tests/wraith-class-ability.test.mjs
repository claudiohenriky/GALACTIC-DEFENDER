import test from 'node:test';
import assert from 'node:assert/strict';
import { Player } from '../src/player/player.js';
import { Game } from '../src/core/game.js';

test('Wraith Predatory Overdrive raises only Wraith primary fire cadence while active', () => {
  const player = Object.create(Player.prototype);
  player.shipClass = 'wraith';
  player.wraithPredatorTimer = 1.2;
  assert.equal(player.getWeaponFireRateMultiplier(), 1.3);
  player.wraithPredatorTimer = 0;
  assert.equal(player.getWeaponFireRateMultiplier(), 1);
  player.shipClass = 'phantom';
  player.wraithPredatorTimer = 1.2;
  assert.equal(player.getWeaponFireRateMultiplier(), 1);
});

test('Wraith class ability grants its timed offensive effect and cooldown', () => {
  let missionUses = 0;
  const game = {
    status: 'running',
    player: { shipClass: 'wraith', wraithPredatorTimer: 0, abilityCooldownMultiplier: 1 },
    classAbilityCooldown: 0,
    classAbilityCooldownMax: 14,
    overloadLockTimer: 0,
    mission: { registerAbilityUse() { missionUses += 1; return null; } },
    handleMissionCompletion() {},
    updateClassAbilityButton() {}
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), true);
  assert.equal(game.player.wraithPredatorTimer, 2.5);
  assert.equal(game.classAbilityCooldown, 16);
  assert.equal(missionUses, 1);
});

test('Wraith class ability cannot be activated by other classes or during cooldown', () => {
  const game = {
    status: 'running',
    player: { shipClass: 'aegis', wraithPredatorTimer: 0 },
    classAbilityCooldown: 0,
    overloadLockTimer: 0
  };
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
  game.player.shipClass = 'wraith';
  game.classAbilityCooldown = 2;
  assert.equal(Game.prototype.activateClassAbility.call(game), false);
});
