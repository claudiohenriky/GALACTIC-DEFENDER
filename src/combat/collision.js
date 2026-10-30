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
