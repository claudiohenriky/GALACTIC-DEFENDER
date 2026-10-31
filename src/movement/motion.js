// Shared, allocation-free velocity integration for player and AI movement.
// Decision systems choose a desired velocity; this module handles the physical response.

export function approachVelocity(entity, targetVelocityX, targetVelocityY, acceleration, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const safeAcceleration = Number.isFinite(acceleration) ? Math.max(0, acceleration) : 0;
  const deltaX = targetVelocityX - entity.velocityX;
  const deltaY = targetVelocityY - entity.velocityY;
  const deltaLength = Math.hypot(deltaX, deltaY);
  if (deltaLength === 0) return;

  const maxChange = safeAcceleration * dt;
  if (deltaLength <= maxChange) {
    entity.velocityX = targetVelocityX;
    entity.velocityY = targetVelocityY;
    return;
  }

  const scale = maxChange / deltaLength;
  entity.velocityX += deltaX * scale;
  entity.velocityY += deltaY * scale;
}

export function integrateVelocity(entity, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  entity.x += entity.velocityX * dt;
  entity.y += entity.velocityY * dt;
}
