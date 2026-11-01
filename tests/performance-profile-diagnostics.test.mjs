import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';

test('performance profile reports p95 and maximum frame, update, render, and work times', () => {
  const game = {
    performanceProfileSamples: [
      { frame: 10, update: 1, render: 2, work: 3 },
      { frame: 20, update: 2, render: 3, work: 5 },
      { frame: 30, update: 3, render: 4, work: 7 },
      { frame: 40, update: 4, render: 5, work: 9 }
    ],
    effectsMode: 'auto',
    effectsScale: 1,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    levelUpParticles: [],
    damageSparks: [],
    shieldBreakEffects: []
  };
  const originalInfo = console.info;
  let report = null;
  console.info = (label, value) => {
    if (label === '[GALACTIC-DEFENDER profile]') report = value;
  };
  try {
    Game.prototype.reportPerformanceProfile.call(game);
  } finally {
    console.info = originalInfo;
  }

  assert.ok(report);
  assert.equal(report.p95FrameMs, 40);
  assert.equal(report.maxFrameMs, 40);
  assert.equal(report.p95UpdateMs, 4);
  assert.equal(report.maxUpdateMs, 4);
  assert.equal(report.p95RenderMs, 5);
  assert.equal(report.maxRenderMs, 5);
  assert.equal(report.p95GameWorkMs, 9);
  assert.equal(report.maxGameWorkMs, 9);
  assert.equal(game.performanceProfileSamples.length, 0);
});
