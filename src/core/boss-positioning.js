// Shared world-space standoff used by the DREADNOUGHT's combat AI.
export function getBossCombatTargetY(playerY, worldHeight, radius = 100, collisionRadius = radius * 1.45) {
  const safeHeight = Math.max(1, Number(worldHeight) || 1);
  const standoff = Math.max(radius * 2.18 + 38, safeHeight * (0.92 / 2.4));
  return Math.max(collisionRadius + 24, Math.min(playerY - standoff, safeHeight - collisionRadius - 30));
}


// Cinematic spawn geometry keeps the DREADNOUGHT in front of the pilot with a guaranteed hull gap.
export function getBossCinematicSpawnPositions(player, boss, viewportHeight, worldWidth, worldHeight) {
  const radius = Math.max(1, boss?.radius || 100);
  const playerRadius = Math.max(1, player?.radius || 13);
  const margin = Math.max(1, boss?.collisionRadius || radius * 1.45);
  const targetY = Math.max(
    margin + 24,
    Math.min(worldHeight - margin - 24, player.y - (radius * 2.1 + playerRadius + 80))
  );
  const targetX = Math.max(margin + 24, Math.min(worldWidth - margin - 24, player.x));
  return {
    startX: targetX,
    startY: targetY - Math.max(viewportHeight * 0.9, radius * 2.8),
    targetX,
    targetY
  };
}
