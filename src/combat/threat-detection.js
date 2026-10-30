// Predict whether a moving projectile will pass close enough to hit the pilot soon.
// Relative velocity includes the pilot's current propulsion and knockback.
export function predictProjectileThreat(projectile, player, horizon = 0.9, safetyMargin = 14) {
  if (!projectile?.active || !player) return null;
  const relativeX = projectile.x - player.x;
  const relativeY = projectile.y - player.y;
  const relativeVelocityX = (projectile.vx ?? 0) - (player.velocityX ?? 0) - (player.knockbackX ?? 0);
  const relativeVelocityY = (projectile.vy ?? 0) - (player.velocityY ?? 0) - (player.knockbackY ?? 0);
  const speedSquared = relativeVelocityX * relativeVelocityX + relativeVelocityY * relativeVelocityY;
  if (speedSquared < 1) return null;

  const impactTime = -(relativeX * relativeVelocityX + relativeY * relativeVelocityY) / speedSquared;
  if (impactTime < 0.06 || impactTime > horizon) return null;

  const closestX = relativeX + relativeVelocityX * impactTime;
  const closestY = relativeY + relativeVelocityY * impactTime;
  const clearanceSquared = closestX * closestX + closestY * closestY;
  const dangerRadius = (player.radius ?? 0) + (projectile.radius ?? 0) + safetyMargin;
  if (clearanceSquared > dangerRadius * dangerRadius) return null;

  return { impactTime, clearanceSquared };
}
