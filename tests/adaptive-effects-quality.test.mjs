import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';

function qualityHarness(mode = 'auto', scale = 1) {
  return { effectsMode: mode, effectsScale: scale, effectsPressure: 0, effectsRecovery: 0 };
}

test('automatic effects quality steps down after sustained slow frames', () => {
  const game = qualityHarness();
  for (let index = 0; index < 30; index += 1) {
    Game.prototype.updateEffectsQuality.call(game, 40);
  }
  assert.equal(game.effectsScale, 0.5);
});

test('automatic effects quality recovers in stages after sustained smooth frames', () => {
  const game = qualityHarness('auto', 0.5);
  for (let index = 0; index < 241; index += 1) {
    Game.prototype.updateEffectsQuality.call(game, 16.67);
  }
  assert.equal(game.effectsScale, 0.72);
  for (let index = 0; index < 241; index += 1) {
    Game.prototype.updateEffectsQuality.call(game, 16.67);
  }
  assert.equal(game.effectsScale, 1);
});

test('manual full and reduced effects modes are not overridden by the auto controller', () => {
  const full = qualityHarness('full', 1);
  const reduced = qualityHarness('reduced', 0.55);
  for (let index = 0; index < 100; index += 1) {
    Game.prototype.updateEffectsQuality.call(full, 50);
    Game.prototype.updateEffectsQuality.call(reduced, 50);
  }
  assert.equal(full.effectsScale, 1);
  assert.equal(reduced.effectsScale, 0.55);
});

test('effect spawn limits scale proportionally with the selected quality level', () => {
  const game = qualityHarness('auto', 0.72);
  assert.equal(Game.prototype.getEffectLimit.call(game, 20), 14);
  game.effectsScale = 0.5;
  assert.equal(Game.prototype.getEffectLimit.call(game, 20), 10);
});
