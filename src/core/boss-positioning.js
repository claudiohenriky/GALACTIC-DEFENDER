// Shared world-space standoff used by the DREADNOUGHT's combat AI.
export function getBossCombatTargetY(playerY, worldHeight, radius = 100, collisionRadius = radius * 1.45) {
  const safeHeight = Math.max(1, Number(worldHeight) || 1);
  const standoff = Math.max(radius * 2.18 + 38, safeHeight * (0.92 / 2.4));
  return Math.max(collisionRadius + 24, Math.min(playerY - standoff, safeHeight - collisionRadius - 30));
}
