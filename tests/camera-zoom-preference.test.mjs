import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core/game.js';

test('camera zoom preference clamps the requested view and snaps the camera', () => {
  const game = {
    cameraMinZoom: 1 / 2.4,
    cameraBaseZoom: 1,
    cameraZoom: 1,
    updateCamera(dt, snap) {
      this.lastCameraUpdate = { dt, snap };
    }
  };

  Game.prototype.setCameraZoomPreference.call(game, 0.75);

  assert.equal(game.cameraBaseZoom, 0.75);
  assert.equal(game.cameraZoom, 0.75);
  assert.deepEqual(game.lastCameraUpdate, { dt: 0, snap: true });
});

test('camera zoom preference never zooms in beyond 100% or out beyond arena bounds', () => {
  const game = {
    cameraMinZoom: 1 / 2.4,
    cameraBaseZoom: 1,
    cameraZoom: 1,
    updateCamera() {}
  };

  Game.prototype.setCameraZoomPreference.call(game, 1.4);
  assert.equal(game.cameraBaseZoom, 1);

  Game.prototype.setCameraZoomPreference.call(game, 0.1);
  assert.equal(game.cameraBaseZoom, 1 / 2.4);
});

test('invalid camera zoom preference uses the safe 75% default', () => {
  const game = {
    cameraMinZoom: 1 / 2.4,
    cameraBaseZoom: 1,
    cameraZoom: 1,
    updateCamera() {}
  };

  Game.prototype.setCameraZoomPreference.call(game, Number.NaN);
  assert.equal(game.cameraBaseZoom, 0.75);
});
