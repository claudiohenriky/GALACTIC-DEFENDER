import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBossCinematicCameraFrame,
  BOSS_CINEMATIC_REVEAL_ZOOM,
  BOSS_CINEMATIC_ARENA_ZOOM
} from '../src/core/boss-cinematic-camera.js';
import { getBossCinematicSpawnPositions } from '../src/core/boss-positioning.js';

const player = { x: 1200, y: 1650, radius: 13 };
const boss = { x: 1200, y: 1200, radius: 100, collisionRadius: 145 };

test('pilot dialogue phases keep the player centered and use a deliberate close-up', () => {
  for (const phase of ['hud-fade', 'loading', 'pilot-intro', 'anomaly-scan']) {
    const frame = getBossCinematicCameraFrame({
      phase, player, width: 900, height: 420,
      worldWidth: 2160, worldHeight: 1008
    });
    assert.equal(frame.x + 450, player.x);
    assert.equal(frame.y + 210, player.y);
  }
  const close = getBossCinematicCameraFrame({
    phase: 'pilot-intro', player, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  assert.equal(close.zoom, 1.12);
});

test('boss reveal widens progressively without horizontal camera drift', () => {
  const start = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 0, phaseDuration: 21,
    player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  const middle = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 10.5, phaseDuration: 21,
    player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  const end = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 21, phaseDuration: 21,
    player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  assert.equal(start.x, middle.x);
  assert.equal(middle.x, end.x);
  assert.equal(start.x + 450, player.x);
  assert.ok(start.zoom > middle.zoom && middle.zoom > end.zoom);
  assert.equal(end.zoom, BOSS_CINEMATIC_REVEAL_ZOOM);
  assert.ok(end.y < start.y, 'camera should shift upward in world space only enough to frame the pair');
});

test('arena reveal adds a small final zoom-out and combat handoff keeps that scale', () => {
  const reveal = getBossCinematicCameraFrame({
    phase: 'boss-identification', player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  const arena = getBossCinematicCameraFrame({
    phase: 'arena-reveal', player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  const handoff = getBossCinematicCameraFrame({
    phase: 'handoff', player, boss, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  assert.equal(reveal.zoom, BOSS_CINEMATIC_REVEAL_ZOOM);
  assert.equal(arena.zoom, BOSS_CINEMATIC_ARENA_ZOOM);
  assert.equal(handoff.zoom, BOSS_CINEMATIC_ARENA_ZOOM);
  assert.equal(arena.x, handoff.x);
  assert.equal(arena.y, handoff.y);
});

test('camera remains locked to the player even if a boss fixture is horizontally offset', () => {
  const offsetBoss = { ...boss, x: 1800 };
  const frame = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 21, phaseDuration: 21,
    player, boss: offsetBoss, width: 900, height: 420,
    worldWidth: 3600, worldHeight: 1680
  });
  assert.equal(frame.x + 450, player.x);
});

test('cinematic camera clamps safely on narrow and portrait viewports', () => {
  for (const [width, height] of [[360, 740], [740, 360], [320, 240]]) {
    const frame = getBossCinematicCameraFrame({
      phase: 'handoff',
      player: { x: width * 1.2, y: height * 1.5, radius: 12 },
      boss: { x: width * 1.2, y: height * 0.6, radius: 100, collisionRadius: 145 },
      width, height, minZoom: 1 / 2.4,
      worldWidth: width * 2.4, worldHeight: height * 2.4
    });
    assert.ok(Number.isFinite(frame.x) && Number.isFinite(frame.y));
    assert.ok(frame.x >= 0 && frame.y >= 0);
  }
});

test('boss spawn stays in front of the player with a fixed hull clearance', () => {
  const ship = { x: 1200, y: 1650, radius: 13 };
  const capitalShip = { radius: 100, collisionRadius: 145 };
  const position = getBossCinematicSpawnPositions(ship, capitalShip, 420, 2160, 1008);
  assert.equal(position.startX, ship.x);
  assert.equal(position.targetX, ship.x);
  assert.ok(position.startY < position.targetY);
  assert.equal(position.targetY, ship.y - (100 * 2.1 + 13 + 80));
  assert.ok(position.targetY - position.startY >= 420 * 0.9);
});
