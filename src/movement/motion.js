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

export const ENEMY_MOTION_PROFILES = Object.freeze({
  artillery: Object.freeze({ maxSpeed: 125, acceleration: 260 }),
  artilleryElite: Object.freeze({ maxSpeed: 155, acceleration: 340 }),
  sentinel: Object.freeze({ maxSpeed: 150, acceleration: 300 }),
  sentinelElite: Object.freeze({ maxSpeed: 185, acceleration: 390 }),
  guardian: Object.freeze({ maxSpeed: 105, acceleration: 190 }),
  guardianElite: Object.freeze({ maxSpeed: 125, acceleration: 240 })
});

// Accelerates toward a point and brakes according to stopping distance.
// AI chooses the destination; this function only handles the physical response.
export function steerToPoint(entity, targetX, targetY, profile, dt) {
  if (!profile || !Number.isFinite(dt) || dt <= 0) return;
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  const distance = Math.hypot(dx, dy);
  const currentSpeed = Math.hypot(entity.velocityX, entity.velocityY);
  const arrivalTolerance = 0.15;
  if (distance <= arrivalTolerance && currentSpeed <= Math.max(6, profile.acceleration * dt)) {
    entity.x = targetX;
    entity.y = targetY;
    entity.velocityX = 0;
    entity.velocityY = 0;
    return;
  }
  if (distance <= 0.001) {
    approachVelocity(entity, 0, 0, profile.acceleration, dt);
    integrateVelocity(entity, dt);
    return;
  }

  const brakingSpeed = Math.sqrt(2 * profile.acceleration * distance);
  const desiredSpeed = Math.min(profile.maxSpeed, brakingSpeed);
  const desiredVelocityX = dx / distance * desiredSpeed;
  const desiredVelocityY = dy / distance * desiredSpeed;
  approachVelocity(entity, desiredVelocityX, desiredVelocityY, profile.acceleration, dt);
  integrateVelocity(entity, dt);
}
