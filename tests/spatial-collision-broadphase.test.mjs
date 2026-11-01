import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../src/enemies/enemy.js';
import { Game } from '../src/core/game.js';

function createCollisionGridHarness(enemies) {
  return {
    worldWidth: 640,
    worldHeight: 480,
    enemies,
    enemyCollisionCellSize: 160,
    enemyCollisionGrid: [],
    enemyCollisionMaxRadius: 0,
    enemyCollisionColumns: 0,
    enemyCollisionRows: 0,
    enemyCollisionQueryStamp: 0,
    enemyCollisionCandidates: [],
    enemyCollisionBosses: []
  };
}

test('spatial broadphase returns nearby enemies and excludes distant cells', () => {
  const nearby = new Enemy(110, 110, 1, 'sentinel');
  const distant = new Enemy(550, 390, 1, 'artillery');
  const boss = new Enemy(520, 350, 1, 'boss');
  const game = createCollisionGridHarness([nearby, distant, boss]);

  Game.prototype.initializeEnemyCollisionGrid.call(game);
  Game.prototype.rebuildEnemyCollisionGrid.call(game);
  const candidates = Game.prototype.getEnemyCollisionCandidates.call(game, 100, 100, 80);

  assert.ok(candidates.includes(nearby));
  assert.ok(!candidates.includes(distant));
  // Large boss hulls are held in a separate list and retain exact downstream tests.
  assert.ok(candidates.includes(boss));
});

test('spatial broadphase refreshes buckets after enemies move between cells', () => {
  const enemy = new Enemy(110, 110, 1, 'sentinel');
  const game = createCollisionGridHarness([enemy]);

  Game.prototype.initializeEnemyCollisionGrid.call(game);
  Game.prototype.rebuildEnemyCollisionGrid.call(game);
  assert.ok(Game.prototype.getEnemyCollisionCandidates.call(game, 100, 100, 40).includes(enemy));

  enemy.x = 520;
  enemy.y = 360;
  Game.prototype.initializeEnemyCollisionGrid.call(game);
  Game.prototype.rebuildEnemyCollisionGrid.call(game);

  assert.ok(!Game.prototype.getEnemyCollisionCandidates.call(game, 100, 100, 40).includes(enemy));
  assert.ok(Game.prototype.getEnemyCollisionCandidates.call(game, 520, 360, 40).includes(enemy));
});
