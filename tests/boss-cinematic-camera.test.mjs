import test from 'node:test';
import assert from 'node:assert/strict';
import { getBossCinematicCameraFrame } from '../src/core/boss-cinematic-camera.js';

const player = { x: 1200, y: 1650, radius: 12 };
const boss = { x: 1200, y: 900, collisionRadius: 145 };

test('cinematic camera starts on the pilot and progressively widens to frame both ships', () => {
  const close = getBossCinematicCameraFrame({
    phase: 'pilot-intro', player, width: 900, height: 420,
    worldWidth: 2160, worldHeight: 1008
  });
  const revealStart = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 0, phaseDuration: 13,
    player, boss, width: 900, height: 420, worldWidth: 2160, worldHeight: 1008
  });
  const revealEnd = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 13, phaseDuration: 13,
    player, boss, width: 900, height: 420, worldWidth: 2160, worldHeight: 1008
  });
  assert.ok(close.zoom > revealStart.zoom);
  assert.ok(revealStart.zoom > revealEnd.zoom);
  assert.equal(revealEnd.zoom, 1 / 2.4);
});

test('handoff camera exactly matches the combat camera target formula', () => {
  const frame = getBossCinematicCameraFrame({
    phase: 'handoff', player, boss, width: 900, height: 420,
    minZoom: 1 / 2.4, worldWidth: 2160, worldHeight: 1008
  });
  const zoom = 1 / 2.4;
  const focusY = (boss.y - boss.collisionRadius * 1.5 + player.y + player.radius) / 2;
  const minX = 900 / (2 * zoom) - 900 / 2;
  const minY = 420 / (2 * zoom) - 420 / 2;
  const maxX = Math.max(minX, 2160 - 900 / (2 * zoom) - 900 / 2);
  const maxY = Math.max(minY, 1008 - 420 / (2 * zoom) - 420 / 2);
  assert.equal(frame.x, Math.max(minX, Math.min(maxX, player.x - 900 / 2)));
  assert.equal(frame.y, Math.max(minY, Math.min(maxY, focusY - 420 / 2)));
  assert.equal(frame.zoom, zoom);
});

test('cinematic camera clamps safely on narrow and portrait viewports', () => {
  for (const [width, height] of [[360, 740], [740, 360], [320, 240]]) {
    const frame = getBossCinematicCameraFrame({
      phase: 'handoff', player: { x: width * 1.2, y: height * 1.5, radius: 12 },
      boss: { x: width * 1.2, y: height * 0.6, collisionRadius: 145 },
      width, height, minZoom: 1 / 2.4,
      worldWidth: width * 2.4, worldHeight: height * 2.4
    });
    assert.ok(Number.isFinite(frame.x) && Number.isFinite(frame.y));
    assert.ok(frame.x >= 0 && frame.y >= 0);
  }
});

test('cinematic camera keeps both ships centered when their horizontal positions differ', () => {
  const separatedPlayer = { x: 1200, y: 1500, radius: 12 };
  const separatedBoss = { x: 1800, y: 900, collisionRadius: 145 };
  const frame = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 13, phaseDuration: 13,
    player: separatedPlayer, boss: separatedBoss,
    width: 900, height: 420, minZoom: 1 / 2.4,
    worldWidth: 3600, worldHeight: 1680
  });
  const expectedFocus = (separatedPlayer.x + separatedBoss.x) / 2;
  assert.ok(Math.abs((frame.x + 450) - expectedFocus) < 1e-9);
});

test('cinematic camera blends horizontal focus gradually instead of snapping at reveal start', () => {
  const separatedPlayer = { x: 1200, y: 1500, radius: 12 };
  const separatedBoss = { x: 1800, y: 900, collisionRadius: 145 };
  const frameAtStart = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 0, phaseDuration: 17,
    player: separatedPlayer, boss: separatedBoss,
    width: 900, height: 420, minZoom: 1 / 2.4,
    worldWidth: 2160, worldHeight: 1008
  });
  const frameMidway = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 8.5, phaseDuration: 17,
    player: separatedPlayer, boss: separatedBoss,
    width: 900, height: 420, minZoom: 1 / 2.4,
    worldWidth: 2160, worldHeight: 1008
  });
  const frameAtEnd = getBossCinematicCameraFrame({
    phase: 'distant-contact', phaseElapsed: 17, phaseDuration: 17,
    player: separatedPlayer, boss: separatedBoss,
    width: 900, height: 420, minZoom: 1 / 2.4,
    worldWidth: 3600, worldHeight: 1680
  });
  const centerAtStart = frameAtStart.x + 450;
  const centerMidway = frameMidway.x + 450;
  const centerAtEnd = frameAtEnd.x + 450;
  assert.ok(centerAtStart < centerMidway);
  assert.ok(centerMidway < centerAtEnd);
  assert.ok(Math.abs(centerAtStart - separatedPlayer.x) < 1e-9);
  assert.ok(Math.abs(centerAtEnd - (separatedPlayer.x + separatedBoss.x) / 2) < 1e-9);
});
