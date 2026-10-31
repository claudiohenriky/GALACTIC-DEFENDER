const smoothstep = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

const clampCamera = (focus, viewport, zoom, worldSize) => {
  const halfView = viewport / (2 * zoom);
  const min = halfView - viewport / 2;
  const max = Math.max(min, worldSize - halfView - viewport / 2);
  return Math.max(min, Math.min(max, focus - viewport / 2));
};

export const BOSS_CINEMATIC_REVEAL_ZOOM = 0.58;
export const BOSS_CINEMATIC_ARENA_ZOOM = 0.54;

export function getBossCinematicCameraFrame({
  phase, phaseElapsed = 0, phaseDuration = 1, player, boss = null,
  width, height, minZoom = 1 / 2.4, worldWidth = width * 2.4, worldHeight = height * 2.4
}) {
  const revealProgress = phase === 'distant-contact'
    ? smoothstep(phaseElapsed / Math.max(0.001, phaseDuration))
    : ['boss-identification', 'arena-reveal', 'handoff', 'complete'].includes(phase) ? 1 : 0;

  const closeZoom = phase === 'hud-fade' || phase === 'loading' ? 1
    : phase === 'pilot-intro' ? 1.12
      : phase === 'anomaly-scan' ? 1.04
        : phase === 'distant-contact'
          ? 1.04 + (BOSS_CINEMATIC_REVEAL_ZOOM - 1.04) * revealProgress
          : BOSS_CINEMATIC_REVEAL_ZOOM;
  const arenaProgress = phase === 'arena-reveal' || phase === 'handoff' || phase === 'complete' ? 1 : 0;
  const zoom = Math.max(minZoom, closeZoom + (BOSS_CINEMATIC_ARENA_ZOOM - closeZoom) * arenaProgress);

  // Horizontal framing is deliberately locked to the pilot. The boss enters on the same axis,
  // so the camera never drifts sideways during the reveal.
  const focusX = player.x;
  const bossTopY = boss ? boss.y - (boss.radius || boss.collisionRadius || 100) * 2.1 : player.y;
  const pairFocusY = boss ? (bossTopY + player.y) / 2 : player.y;
  const focusY = player.y + (pairFocusY - player.y) * revealProgress;

  return {
    zoom,
    x: clampCamera(focusX, width, zoom, worldWidth),
    y: clampCamera(focusY, height, zoom, worldHeight)
  };
}

export function prepareBossForCombatHandoff(boss, targetY = boss?.y) {
  if (!boss) return null;
  boss.y = targetY;
  boss.bossMoveTargetY = targetY;
  boss.bossMoveTargetX = boss.x;
  boss.bossMovementState = 'patrol';
  boss.bossMovementTimer = 0;
  boss.bossEntranceTimer = 0;
  boss.velocityX = 0;
  boss.velocityY = 0;
  return boss;
}
