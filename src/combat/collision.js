/**
 * Shared geometric primitives for combat collision checks.
 *
 * This module deliberately contains no gameplay policy: it does not decide
 * which attack wins, whether an attack is destroyed, or how damage is applied.
 * Keeping geometry separate lets later attack-vs-attack mechanics reuse the
 * same low-allocation checks without changing existing combat rules.
 */

/** Return squared distance between two points without a square root. */
export function distanceSquared(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** Test two circular hit areas, preserving the game's strict-overlap boundary. */
export function circlesOverlap(a, b, radiusA = a.radius ?? 0, radiusB = b.radius ?? 0) {
  const combinedRadius = radiusA + radiusB;
  return distanceSquared(a.x, a.y, b.x, b.y) < combinedRadius * combinedRadius;
}

/** Test a circular hit area against a line segment, useful for swept attacks. */
export function circleOverlapsSegment(circle, startX, startY, endX, endY, radius = circle.radius ?? 0) {
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared > 0
    ? Math.max(0, Math.min(1, ((circle.x - startX) * segmentX + (circle.y - startY) * segmentY) / segmentLengthSquared))
    : 0;
  const closestX = startX + segmentX * projection;
  const closestY = startY + segmentY * projection;
  return distanceSquared(circle.x, circle.y, closestX, closestY) <= radius * radius;
}


/** Circle-versus-oriented-ellipse test for elongated ship hulls. */
export function orientedEllipseOverlapsCircle(ellipse, circle, radiusX, radiusY, rotation = 0) {
  const dx = circle.x - ellipse.x, dy = circle.y - ellipse.y;
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  const localX = dx * cos + dy * sin, localY = -dx * sin + dy * cos;
  const circleRadius = Math.max(0, circle.radius ?? 0);
  const expandedX = Math.max(0, radiusX) + circleRadius;
  const expandedY = Math.max(0, radiusY) + circleRadius;
  if (Math.abs(localX) > expandedX || Math.abs(localY) > expandedY) return false;
  return (localX * localX) / (expandedX * expandedX) + (localY * localY) / (expandedY * expandedY) <= 1;
}


/** Predict the single shield sector threatened by an incoming projectile. */
export function getIncomingProjectileShieldSector(player, projectile, dangerRadius = (player?.radius ?? 13) + 18, maxTime = 0.55) {
  if (!player || !projectile || !projectile.active ||
      !Number.isFinite(projectile.x) || !Number.isFinite(projectile.y) ||
      !Number.isFinite(projectile.vx) || !Number.isFinite(projectile.vy) ||
      !Number.isFinite(dangerRadius) || dangerRadius < 0 ||
      !Number.isFinite(maxTime) || maxTime < 0) return -1;
  const relativeX = projectile.x - player.x, relativeY = projectile.y - player.y;
  const speedSquared = projectile.vx * projectile.vx + projectile.vy * projectile.vy;
  if (speedSquared < 1) return -1;
  const impactTime = -(relativeX * projectile.vx + relativeY * projectile.vy) / speedSquared;
  if (impactTime < 0 || impactTime > maxTime) return -1;
  const impactX = relativeX + projectile.vx * impactTime, impactY = relativeY + projectile.vy * impactTime;
  const impactDistanceSquared = impactX * impactX + impactY * impactY;
  if (impactDistanceSquared > dangerRadius * dangerRadius) return -1;
  const directionX = impactDistanceSquared > 4 ? impactX : -projectile.vx;
  const directionY = impactDistanceSquared > 4 ? impactY : -projectile.vy;
  const angle = Math.atan2(directionY, directionX);
  const sector = Math.round((angle + Math.PI) / (Math.PI / 4));
  return ((sector % 8) + 8) % 8;
}
