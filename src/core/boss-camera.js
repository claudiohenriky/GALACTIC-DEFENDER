export function getBossEntrancePositions(playerY, height) {
  const safeHeight = Math.max(1, Number(height) || 1);
  return {
    startY: playerY - safeHeight * 1.42,
    endY: playerY - safeHeight * 0.92
  };
}

const PHASE_CAMERA = {
  loading: { zoom: 0.72, focusOffset: 0.12 },
  'pilot-report': { zoom: 0.9, focusOffset: 0.08 },
  'pilot-warning': { zoom: 0.76, focusOffset: 0.22 },
  'boss-entry': { zoom: 0.52, focusOffset: 0.34 },
  'boss-taunt': { zoom: 0.4, focusOffset: 0.34 },
  complete: { zoom: 0.4, focusOffset: 0.34 }
};

// Returns a camera target in the same offset coordinates used by Game.updateCamera.
// The simulation world and collision geometry remain untouched.
export function getBossCameraFrame({ phase, player, boss = null, width, height, minZoom = 0.4, worldWidth = width * 2.4, worldHeight = height * 2.4 }) {
  const profile = PHASE_CAMERA[phase] ?? PHASE_CAMERA.loading;
  const bossPhase = phase === 'boss-entry' || phase === 'boss-taunt' || phase === 'complete';
  const bossHalfHeight = boss
    ? (Number.isFinite(boss.collisionRadius) ? boss.collisionRadius * 1.5 : height * 0.44)
    : 0;
  const playerHalfHeight = Number.isFinite(player.radius) ? player.radius : 12;
  // Frame the outer bounds of the long hull and the pilot, not just their centers.
  // This leaves headroom for the DREADNOUGHT's silhouette on short landscape screens.
  const focusY = boss && bossPhase
    ? (boss.y - bossHalfHeight + player.y + playerHalfHeight) / 2
    : player.y - height * profile.focusOffset;
  const zoom = Math.max(minZoom, profile.zoom);
  let x = player.x - width / 2;
  let y = focusY - height / 2;

  // The final cinematic frame must use the same world bounds as updateCamera().
  // Otherwise the first combat frame clamps the camera and changes the apparent
  // positions of the pilot and boss even though their world coordinates are stable.
  if (phase === 'boss-taunt' || phase === 'complete') {
    const halfViewWidth = width / (2 * zoom);
    const halfViewHeight = height / (2 * zoom);
    const minX = halfViewWidth - width / 2;
    const minY = halfViewHeight - height / 2;
    const maxX = Math.max(minX, worldWidth - halfViewWidth - width / 2);
    const maxY = Math.max(minY, worldHeight - halfViewHeight - height / 2);
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));
  }

  return { zoom, x, y };
}


// Keep the normal combat standoff aligned with the cinematic reveal. The arena
// is 2.4x the viewport, so 0.92 viewport-heights equals this world-space ratio.
export function getBossCombatTargetY(playerY, worldHeight, radius = 100, collisionRadius = radius * 1.45) {
  const safeHeight = Math.max(1, Number(worldHeight) || 1);
  const standoff = Math.max(radius * 2.18 + 38, safeHeight * (0.92 / 2.4));
  return Math.max(collisionRadius + 24, Math.min(playerY - standoff, safeHeight - collisionRadius - 30));
}


// Finalize the cinematic entry before the first normal AI tick. The boss is
// introduced outside the simulation list, so its constructor timer otherwise
// remains active and replays the entrance after the dialogue handoff.
export function prepareBossForCombatHandoff(boss, targetY) {
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
