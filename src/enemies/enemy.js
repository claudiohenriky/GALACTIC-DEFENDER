import { BossSystems, getBossMissileProfile, selectBossAttack, selectBossMissileLauncher } from './boss-systems.js?v=0.53.0-stage-6-7';
import { getBossCombatTargetY } from '../core/boss-positioning.js?v=0.54.0-clean-cinematic';
import { ENEMY_MOTION_PROFILES, steerToPoint } from '../movement/motion.js?v=0.56.0-devastator-profiles';
import { getGuardianProtectionPriority } from '../ai/guardian-protection.js?v=0.50.0-ai-balance';

export class Enemy {
  constructor(x, y, level = 1, type = 'chaser', isElite = false) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.isElite = Boolean(isElite && (type === 'artillery' || type === 'sentinel' || type === 'guardian' || type === 'devastator'));
    // Artillery keeps its 8-point shield; Guardian Elite has a stronger defensive reserve.
    this.eliteMaxShield = this.isElite ? (type === 'artillery' ? 8 : type === 'guardian' || type === 'devastator' ? 12 : 0) : 0;
    this.eliteShield = this.eliteMaxShield;
    this.eliteShieldFlash = 0;
    this.protectedAllies = [];
    this.guardianCoverShieldMax = this.isElite && type === 'guardian' ? 18 : 0;
    this.guardianCoverShield = this.guardianCoverShieldMax;
    this.eliteSpawnTimer = this.isElite ? 1.65 : 0;
    this.radius = type === 'boss' ? 100 : type === 'devastator' ? 18 : type === 'guardian' ? 15 : type === 'artillery' ? 13 : type === 'sentinel' ? 12 : type === 'interceptor' ? 8 : 10 + Math.random() * 3;
    // Keep the general movement/separation radius compact; the elongated boss hull
    // uses an oriented ellipse for projectile and pilot contact tests in Game.
    this.collisionRadius = type === 'boss' ? this.radius * 1.45 : this.radius;
    this.maxHealth = type === 'boss' ? 360 + level * 12 : type === 'devastator' ? (this.isElite ? 22 + Math.floor(level / 2) : 16 + Math.floor(level / 2)) : type === 'guardian' ? (this.isElite ? 9 + level : 7 + level) : type === 'artillery' ? 5 + Math.floor(level / 2) : type === 'sentinel' ? 4 : type === 'interceptor' ? 1 : 2;
    this.health = this.maxHealth;
    this.bossSystems = type === 'boss' ? new BossSystems() : null;
    this.bossPhase = 1;
    this.bossMovementState = 'patrol';
    this.bossMovementTimer = 0;
    this.bossRepositionCooldown = 0;
    this.bossMoveTargetX = x;
    this.bossMoveTargetY = y;
    this.bossPatrolSide = 1;
    this.bossPhaseTransition = 0;
    this.bossEntranceDuration = type === 'boss' ? 5.2 : 0;
    this.bossEntranceTimer = this.bossEntranceDuration;
    this.bossDying = false;
    this.bossDeathTimer = 0;
    this.bossDeathDuration = 8.4;
    this.bossDeathDriftX = 0;
    this.bossDeathDriftY = 0;
    this.bossDeathSpin = 0;
    this.bossMissileCooldown = 0;
    this.bossMissileNextSide = -1;
    this.bossBeamHit = false;
    this.rewardGranted = false;
    this.speed = (type === 'boss' ? 16 : type === 'devastator' ? 12 : type === 'guardian' ? 23 : type === 'artillery' ? 25 : type === 'sentinel' ? 30 : type === 'interceptor' ? 70 + Math.random() * 14 : 38 + Math.random() * 17) + Math.min(level, 8) * (type === 'guardian' ? 0.8 : type === 'devastator' ? 0.35 : 1.35);
    this.motionProfile = type === 'devastator' ? (this.isElite ? ENEMY_MOTION_PROFILES.devastatorElite : ENEMY_MOTION_PROFILES.devastator)
      : type === 'artillery' ? (this.isElite ? ENEMY_MOTION_PROFILES.artilleryElite : ENEMY_MOTION_PROFILES.artillery)
        : type === 'sentinel' ? (this.isElite ? ENEMY_MOTION_PROFILES.sentinelElite : ENEMY_MOTION_PROFILES.sentinel)
          : type === 'guardian' ? (this.isElite ? ENEMY_MOTION_PROFILES.guardianElite : ENEMY_MOTION_PROFILES.guardian)
            : type === 'chaser' ? ENEMY_MOTION_PROFILES.chaser : null;
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = type === 'boss'
      ? 1.65
      : type === 'artillery'
        ? 3.6 + Math.random() * 0.6
        : type === 'sentinel'
          ? (this.isElite ? 3.0 : 1.8 + Math.random() * 0.6)
          : 2.4 + Math.random() * 0.8;
    this.siegeState = type === 'devastator' ? 'charging' : 'offline';
    this.siegeChargeDuration = type === 'devastator' ? (this.isElite ? 2.45 : 2.85) : 0;
    this.siegeChargeTimer = this.siegeChargeDuration;
    this.siegeWarningDuration = this.isElite ? 0.82 : 1.05;
    this.siegeWarningTimer = 0;
    this.siegeRecoveryTimer = 0;
    this.siegeAimAngle = Math.PI / 2;
    this.active = true;
    this.contactCooldown = 0;
    // Threat response is deliberately limited: ranged units dodge predicted near-misses, not every shot.
    this.dodgeCooldown = 0;
    this.dodgeScanTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeDirection = 0;
    this.disruptionTimer = 0;
    this.disruptionImpulseX = 0;
    this.disruptionImpulseY = 0;

    // Motion feedback is visual only: steering does not change damage or projectile rules.
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = Math.PI / 2;
    // Visual facing is separated from movement direction for ranged units that strafe or retreat while aiming.
    this.facingRotation = this.rotation;
    this.bank = 0;
    this.thrust = 0;
    this.lateralThrust = 0;
    // Elite flanking is a timed reposition order coordinated by Game; it never changes attack damage.
    this.flankTimer = 0;
    this.flankCooldown = 0;
    this.flankTargetX = x;
    this.flankTargetY = y;
    this.flankSide = 0;
    this.repositionTimer = 0;
    this.repositionCooldown = 0;
    this.repositionTargetX = x;
    this.repositionTargetY = y;
  }

  applyDisruption(impulseX, impulseY, duration = 0.82) {
    this.disruptionTimer = Math.max(this.disruptionTimer, duration);
    this.disruptionImpulseX += impulseX;
    this.disruptionImpulseY += impulseY;
  }

  updateMotionFeedback(dt, previousX, previousY) {
    if (dt <= 0) return;
    this.velocityX = (this.x - previousX) / dt;
    this.velocityY = (this.y - previousY) / dt;
    const movementSpeed = Math.hypot(this.velocityX, this.velocityY);

    if (movementSpeed > 4) {
      const targetRotation = Math.atan2(this.velocityY, this.velocityX);
      const angleDelta = Math.atan2(
        Math.sin(targetRotation - this.rotation),
        Math.cos(targetRotation - this.rotation)
      );
      this.rotation += angleDelta * Math.min(1, dt * 8);
    }

    const targetThrust = Math.min(1, movementSpeed / Math.max(1, this.speed));
    this.thrust += (targetThrust - this.thrust) * Math.min(1, dt * 7);
    const targetLateral = Math.min(1, Math.abs(this.velocityX) / Math.max(1, this.speed));
    this.lateralThrust += (targetLateral - this.lateralThrust) * Math.min(1, dt * 8);

    // The hull leans into lateral motion, echoing the player's smooth pseudo-3D response.
    const targetBank = Math.max(-0.5, Math.min(0.5, -this.velocityX / Math.max(1, this.speed) * 0.5));
    this.bank += (targetBank - this.bank) * Math.min(1, dt * 8);
  }

  update(dt, targetX, targetY, width, height, playerProjectiles = [], allies = [], cameraTop = 0, playerVelocityX = 0, playerVelocityY = 0) {
    const previousX = this.x;
    const previousY = this.y;
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.dodgeScanTimer = Math.max(0, this.dodgeScanTimer - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.flankCooldown = Math.max(0, this.flankCooldown - dt);
    this.flankTimer = Math.max(0, this.flankTimer - dt);
    this.repositionTimer = Math.max(0, this.repositionTimer - dt);
    this.repositionCooldown = Math.max(0, this.repositionCooldown - dt);
    this.bossMovementTimer = Math.max(0, this.bossMovementTimer - dt);
    this.bossRepositionCooldown = Math.max(0, this.bossRepositionCooldown - dt);
    this.bossMissileCooldown = Math.max(0, this.bossMissileCooldown - dt);
    const repositionActive = this.type === 'chaser' && this.repositionTimer > 0;
    const flankActive = this.isElite && this.flankTimer > 0 && this.type !== 'guardian';
    this.phase += dt * (this.type === 'devastator' ? 0.62 : this.type === 'sentinel' ? 1.4 : this.type === 'artillery' ? (this.isElite ? 1.25 : 0.9) : this.type === 'guardian' ? 1.1 : this.type === 'interceptor' ? 3.2 : 2);
    this.eliteSpawnTimer = Math.max(0, this.eliteSpawnTimer - dt);
    this.eliteShieldFlash = Math.max(0, this.eliteShieldFlash - dt);

    // A destroyed dreadnought becomes a non-combat visual entity until its finale completes.
    if (this.type === 'boss' && this.bossDying) {
      this.bossDeathTimer = Math.min(this.bossDeathDuration, this.bossDeathTimer + dt);
      const collapseProgress = Math.min(1, this.bossDeathTimer / this.bossDeathDuration);
      // The wreck loses thrust, tumbles and drifts instead of vanishing in place.
      this.bossDeathDriftX += Math.sin(this.bossDeathTimer * 1.7) * dt * 2.2;
      this.bossDeathDriftY += dt * (5 + collapseProgress * 18);
      this.bossDeathSpin += dt * (0.035 + collapseProgress * 0.12);
      this.x += this.bossDeathDriftX * dt;
      this.y += this.bossDeathDriftY * dt;
      this.facingRotation += this.bossDeathSpin * dt;
      return null;
    }

    // Disruption temporarily suspends steering and firing so AI pursuit cannot
    // immediately cancel the physical impulse that pushed this ship away.
    if (this.disruptionTimer > 0) {
      this.disruptionTimer = Math.max(0, this.disruptionTimer - dt);
      const damping = Math.exp(-3.2 * dt);
      this.disruptionImpulseX *= damping;
      this.disruptionImpulseY *= damping;
      this.x += this.disruptionImpulseX * dt;
      this.y += this.disruptionImpulseY * dt;
      const movementRadius = this.collisionRadius ?? this.radius;
      this.x = Math.max(movementRadius, Math.min(width - movementRadius, this.x));
      this.y = Math.max(movementRadius, Math.min(height - movementRadius, this.y));
      this.fireCooldown = Math.max(this.fireCooldown, 0.18);
      this.updateMotionFeedback(dt, previousX, previousY);
      return null;
    }

    // Clear residual impulse before normal steering resumes; the damping above
    // leaves only a small tail, avoiding a visible snap when the recovery ends.
    this.disruptionImpulseX *= Math.exp(-8 * dt);
    this.disruptionImpulseY *= Math.exp(-8 * dt);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    // Ranged classes steer toward explicit lanes and do not consume target distance.
    // Avoid a square root for them; pursuit/formation classes retain the exact distance.
    const needsTargetDistance = this.type === 'interceptor' || this.type === 'guardian' ||
      (this.type !== 'boss' && this.type !== 'artillery' && this.type !== 'sentinel');
    const distance = needsTargetDistance ? (Math.hypot(dx, dy) || 1) : 1;

    // First tactical-cooperation pass: Guardians screen nearby Sentinels;
    // Sentinels use that cover to keep a firing lane behind the Guardian.
    // This changes positioning only, not health, damage, collision, or firing rules.
    let supportAlly = null;
    let supportDistanceSquared = Infinity;
    if (this.type === 'guardian' || this.type === 'sentinel') {
      let supportPriority = Infinity;
      for (const ally of allies) {
        if (ally === this || !ally.active) continue;
        const isPreferredSupport = this.type === 'guardian'
          ? (this.protectedAllies || []).includes(ally) &&
            getGuardianProtectionPriority(ally) < Infinity
          : ally.type === 'guardian' && (ally.protectedAllies || []).includes(this);
        if (!isPreferredSupport) continue;
        const offsetX = ally.x - this.x;
        const offsetY = ally.y - this.y;
        const allyDistanceSquared = offsetX * offsetX + offsetY * offsetY;
        const priority = this.type === 'guardian'
          ? getGuardianProtectionPriority(ally)
          : 0;
        if (priority < supportPriority || (priority === supportPriority && allyDistanceSquared < supportDistanceSquared)) {
          supportPriority = priority;
          supportDistanceSquared = allyDistanceSquared;
          supportAlly = ally;
        }
      }
    }
    const supportDistance = supportAlly ? Math.sqrt(supportDistanceSquared) : Infinity;

    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 14 : this.type === 'artillery' ? (this.isElite ? 7 : 2) : this.type === 'guardian' ? 2 : this.type === 'interceptor' ? 4 : 7);
    let shot = null;

    // Estimate closest approach over a short horizon using relative velocity.
    // Only Sentinel, Artillery and Boss react in this first pass; each has a different response strength.
    if ((this.type === 'sentinel' || this.type === 'artillery') && this.dodgeCooldown <= 0 && this.dodgeScanTimer <= 0) {
      // No threat is usually present. Re-scan projectile trajectories at 6.25 Hz
      // instead of repeating the full projectile pass on every rendered frame.
      this.dodgeScanTimer = 0.2;
      let hasBestThreat = false;
      let bestThreatX = 0;
      let bestClearanceSquared = Infinity;
      for (const projectile of playerProjectiles) {
        if (!projectile.active) continue;
        const rvx = (projectile.vx ?? 0) - this.velocityX;
        const rvy = (projectile.vy ?? 0) - this.velocityY;
        const rx = projectile.x - this.x;
        const ry = projectile.y - this.y;
        const speedSquared = rvx * rvx + rvy * rvy;
        if (speedSquared < 1) continue;
        const impactTime = Math.max(0, Math.min(0.62, -(rx * rvx + ry * rvy) / speedSquared));
        if (impactTime < 0.07) continue;
        const closestX = rx + rvx * impactTime;
        const closestY = ry + rvy * impactTime;
        const clearanceSquared = closestX * closestX + closestY * closestY;
        const dangerRadius = this.radius + (projectile.radius ?? 3) + (this.type === 'boss' ? 5 : 12);
        if (clearanceSquared < dangerRadius * dangerRadius && clearanceSquared < bestClearanceSquared) {
          bestClearanceSquared = clearanceSquared;
          bestThreatX = closestX;
          hasBestThreat = true;
        }
      }
      if (hasBestThreat && this.dodgeCooldown <= 0) {
        this.dodgeDirection = bestThreatX >= 0 ? -1 : 1;
        this.dodgeTimer = this.type === 'sentinel' ? (this.isElite ? 0.42 : 0.18)
          : this.type === 'artillery' ? (this.isElite ? 0.36 : 0.25) : 0.48;
        this.dodgeCooldown = this.type === 'sentinel' ? (this.isElite ? 1.1 : 2.3)
          : this.type === 'artillery' ? (this.isElite ? 1.8 : 2.0) : 0.95;
      }
    }
    const dodgeStrength = this.dodgeTimer > 0
      ? (this.type === 'sentinel' ? (this.isElite ? 90 : 14) : this.type === 'artillery' ? (this.isElite ? 55 : 15) : 0) * this.dodgeDirection * Math.min(1, this.dodgeTimer / (this.type === 'sentinel' && this.isElite ? 0.42 : this.type === 'sentinel' ? 0.18 : this.type === 'artillery' && !this.isElite ? 0.25 : this.type === 'artillery' ? 0.36 : 0.48))
      : 0;

    if (this.type === 'boss') {
      this.bossSystems?.update(dt);
      // Boss phases unlock at 66% and 33% health. A short transition pause signals each change.
      const healthRatio = this.health / Math.max(1, this.maxHealth);
      const nextBossPhase = healthRatio <= 0.33 ? 3 : healthRatio <= 0.66 ? 2 : 1;
      if (nextBossPhase > this.bossPhase) {
        this.bossPhase = nextBossPhase;
        this.bossPhaseTransition = 0.85;
        this.fireCooldown = Math.max(this.fireCooldown, 1.05);
      }
      this.bossPhaseTransition = Math.max(0, this.bossPhaseTransition - dt);
      // A short, readable arrival sequence gives the heavy ship a clear entrance before combat.
      // Smoothstep keeps the descent controlled and avoids a sudden position snap.
      this.bossEntranceTimer = Math.max(0, this.bossEntranceTimer - dt);
      const entranceProgress = 1 - this.bossEntranceTimer / Math.max(0.001, this.bossEntranceDuration);
      const entranceEase = entranceProgress * entranceProgress * (3 - 2 * entranceProgress);
      const horizontalRange = Math.min(width * (this.bossPhase === 3 ? 0.22 : 0.17), this.bossPhase === 3 ? 260 : 210);
      const bowClearance = this.radius * 2.18 + 38;
      const playerSpeed = Math.hypot(playerVelocityX, playerVelocityY);
      const predictionHorizon = this.bossPhase === 3 ? 0.5 : 0.38;
      const predictedTargetX = Math.max(this.radius, Math.min(width - this.radius, targetX + playerVelocityX * predictionHorizon));
      const predictedTargetY = Math.max(this.radius, Math.min(height - this.radius, targetY + playerVelocityY * predictionHorizon));
      const desiredY = getBossCombatTargetY(predictedTargetY, height, this.radius, this.collisionRadius);
      const entryStartY = cameraTop - this.radius * 1.9;

      if (this.bossMovementState === 'reposition' && this.bossMovementTimer <= 0) {
        this.bossMovementState = 'stabilize';
        this.bossMovementTimer = 0.45;
      } else if (this.bossMovementState === 'stabilize' && this.bossMovementTimer <= 0) {
        this.bossMovementState = 'patrol';
      }

      if (this.bossEntranceTimer > 0) {
        // Keep the cinematic entrance deterministic; tactical steering begins after arrival.
        const patrolX = targetX + Math.sin(this.phase * (this.bossPhase === 3 ? 0.62 : 0.42)) * horizontalRange;
        const entryY = entryStartY + (desiredY - entryStartY) * entranceEase;
        const entryX = targetX + (patrolX - targetX) * entranceEase;
        this.x += (entryX - this.x) * Math.min(1, dt * 1.8);
        this.y += (entryY - this.y) * Math.min(1, dt * 1.8);
      } else {
        const toPlayerX = targetX - this.x;
        const toPlayerY = targetY - this.y;
        const playerDistance = Math.hypot(toPlayerX, toPlayerY) || 1;
        const playerAngle = Math.atan2(toPlayerY, toPlayerX);
        const facingDelta = Math.atan2(
          Math.sin(playerAngle - this.facingRotation),
          Math.cos(playerAngle - this.facingRotation)
        );
        const standoff = Math.max(bowClearance, height * 0.28);
        if (this.bossMovementState === 'patrol' && this.bossRepositionCooldown <= 0 &&
            (Math.abs(facingDelta) > 1.35 || playerDistance < standoff * 0.82)) {
          // Reposition laterally to recover a firing angle. Never add an "away from
          // player" vector here: that caused repeated retreating and edge pinning.
          const sideX = -toPlayerY / playerDistance;
          const sideY = toPlayerX / playerDistance;
          this.bossPatrolSide *= -1;
          const sideOffset = Math.min(width * 0.10, 118) * this.bossPatrolSide;
          this.bossMoveTargetX = Math.max(this.collisionRadius + 12, Math.min(width - this.collisionRadius - 12,
            predictedTargetX + sideX * sideOffset));
          this.bossMoveTargetY = Math.max(this.collisionRadius + 30, Math.min(height - this.collisionRadius - 36,
            desiredY + sideY * sideOffset * 0.32));
          this.bossMovementState = 'reposition';
          this.bossMovementTimer = 1.45;
          this.bossRepositionCooldown = 3.5;
        }

        if (this.bossMovementState === 'patrol') {
          this.bossMoveTargetX = Math.max(this.collisionRadius + 4, Math.min(width - this.collisionRadius - 4,
            predictedTargetX + Math.sin(this.phase * (this.bossPhase === 3 ? 0.62 : 0.42)) * horizontalRange));
          this.bossMoveTargetY = desiredY;
        }
        const profile = this.bossPhase === 3
          ? ENEMY_MOTION_PROFILES.bossPhaseThree : ENEMY_MOTION_PROFILES.boss;
        steerToPoint(this, this.bossMoveTargetX, this.bossMoveTargetY, profile, dt);
      }
      this.x = Math.max(this.collisionRadius + 4, Math.min(width - this.collisionRadius - 4, this.x));

      // Independent weapon tracking: each hardpoint turns toward the pilot only inside its own firing arc.
      const turretSystems = this.bossSystems;
      if (turretSystems && this.bossEntranceTimer <= 0) {
        const hullRotation = this.facingRotation + Math.PI / 2;
        const cosHull = Math.cos(hullRotation);
        const sinHull = Math.sin(hullRotation);
        for (const module of turretSystems.modules) {
          if (module.kind.includes('plasma') && module.state !== 'destroyed' && module.state !== 'disabled') {
            module.plasmaChargeTimer = Math.max(0, (module.plasmaChargeTimer ?? module.plasmaChargeDuration) - dt);
          }
          if (module.kind.includes('support') || module.state === 'destroyed' || module.state === 'disabled') continue;
          const localX = module.x * this.radius;
          const localY = (module.y - 0.16) * this.radius;
          const muzzleX = this.x + localX * cosHull - localY * sinHull;
          const muzzleY = this.y + localX * sinHull + localY * cosHull;
          const targetLocalX = (predictedTargetX - this.x) * cosHull + (predictedTargetY - this.y) * sinHull;
          const targetOnWeaponSide = module.region !== 'left' && module.region !== 'right'
            || module.crossSide || Math.abs(targetLocalX) <= this.radius * 0.08 || Math.sign(targetLocalX) === Math.sign(module.x);
          if (!targetOnWeaponSide) continue;
          const rawAngle = Math.atan2(predictedTargetY - muzzleY, predictedTargetX - muzzleX) - this.facingRotation;
          const desired = Math.atan2(Math.sin(rawAngle), Math.cos(rawAngle));
          const side = Math.sign(module.x);
          let minArc = -0.85;
          let maxArc = 0.85;
          if (module.kind.includes('energy') || module.kind.includes('overload-cannon')) {
            minArc = -0.22; maxArc = 0.22;
          } else if (module.kind.includes('light-laser')) {
            minArc = -0.78; maxArc = 0.78;
          } else if (module.kind.includes('missile') || module.kind.includes('rocket')) {
            minArc = side < 0 ? -2.45 : -0.85;
            maxArc = side > 0 ? 2.45 : 0.85;
          } else if (module.kind.includes('plasma')) {
            minArc = side < 0 ? -2.05 : -0.72;
            maxArc = side > 0 ? 2.05 : 0.72;
          } else if (module.kind.includes('machine-gun')) {
            minArc = side < 0 ? -2.25 : -0.72;
            maxArc = side > 0 ? 2.25 : 0.72;
          }
          const targetAngle = Math.max(minArc, Math.min(maxArc, desired));
          const delta = Math.atan2(Math.sin(targetAngle - (module.turretAngle ?? 0)), Math.cos(targetAngle - (module.turretAngle ?? 0)));
          const turnSpeed = module.kind.includes('energy') ? 0.42
            : module.kind.includes('plasma') ? 0.82
              : module.kind.includes('missile') || module.kind.includes('rocket') ? 1.05 : 1.35;
          module.turretAngle = (module.turretAngle ?? 0) + Math.max(-turnSpeed * dt, Math.min(turnSpeed * dt, delta));
        }
      }

      // The main cannon uses a complete attack cycle: charge, align, warn, fire, recover.
      // The firing direction locks before the warning ends, leaving a clear dodge window.
      const mainCannon = turretSystems?.getModule('main-energy-cannon');
      if (mainCannon) {
        const cannonAvailable = mainCannon.state !== 'destroyed' && mainCannon.state !== 'disabled' && mainCannon.transitionTimer <= 0;
        if (!cannonAvailable) {
          mainCannon.energyState = 'offline';
          mainCannon.energyChargeTimer = mainCannon.energyChargeDuration;
          mainCannon.energyAlignTimer = 0;
          mainCannon.energyWarningTimer = 0;
          mainCannon.energyFireTimer = 0;
          mainCannon.energyCooldownTimer = 0;
        } else if (this.bossPhase < 2 || this.bossEntranceTimer > 0) {
          mainCannon.energyState = 'standby';
          mainCannon.energyChargeTimer = mainCannon.energyChargeDuration;
          mainCannon.energyAlignTimer = 0;
          mainCannon.energyWarningTimer = 0;
          mainCannon.energyFireTimer = 0;
          mainCannon.energyCooldownTimer = 0;
        } else if (mainCannon.energyState === 'standby' || mainCannon.energyState === 'offline') {
          mainCannon.energyState = 'charging';
          mainCannon.energyChargeTimer = mainCannon.energyChargeDuration;
        } else if (mainCannon.energyState === 'charging') {
          mainCannon.energyChargeTimer = Math.max(0, mainCannon.energyChargeTimer - dt);
          if (mainCannon.energyChargeTimer === 0) {
            mainCannon.energyState = 'aligning';
            mainCannon.energyAlignTimer = mainCannon.energyAlignDuration;
          }
        } else if (mainCannon.energyState === 'aligning') {
          mainCannon.energyAlignTimer = Math.max(0, mainCannon.energyAlignTimer - dt);
          if (mainCannon.energyAlignTimer === 0) {
            mainCannon.energyState = 'warning';
            mainCannon.energyWarningTimer = mainCannon.energyWarningDuration;
            mainCannon.energyAimAngle = this.facingRotation;
          }
        } else if (mainCannon.energyState === 'warning') {
          mainCannon.energyWarningTimer = Math.max(0, mainCannon.energyWarningTimer - dt);
          if (mainCannon.energyWarningTimer === 0) {
            mainCannon.energyState = 'firing';
            mainCannon.energyFireTimer = mainCannon.energyFireDuration;
            this.bossBeamHit = false;
          }
        } else if (mainCannon.energyState === 'firing') {
          mainCannon.energyFireTimer = Math.max(0, mainCannon.energyFireTimer - dt);
          if (mainCannon.energyFireTimer === 0) {
            mainCannon.energyState = 'cooldown';
            mainCannon.energyCooldownTimer = mainCannon.energyCooldownDuration;
            mainCannon.energyChargeTimer = mainCannon.energyChargeDuration;
          }
        } else if (mainCannon.energyState === 'cooldown') {
          mainCannon.energyCooldownTimer = Math.max(0, mainCannon.energyCooldownTimer - dt);
          if (mainCannon.energyCooldownTimer === 0) mainCannon.energyState = 'charging';
        }
      }
      if (this.bossEntranceTimer <= 0) this.fireCooldown -= dt;
      else this.fireCooldown = Math.max(this.fireCooldown, 1.8);
      if (this.bossEntranceTimer <= 0 && this.fireCooldown <= 0 && this.y > 18 && this.bossPhaseTransition <= 0) {
        const systems = this.bossSystems;
        const modules = systems?.getOperationalModules() || [];
        const shots = [];
        const shipRotation = this.facingRotation + Math.PI / 2;
        const getMuzzle = (module, forwardOffset = 0.16) => {
          const localX = module.x * this.radius;
          const localY = (module.y - forwardOffset) * this.radius;
          const cos = Math.cos(shipRotation);
          const sin = Math.sin(shipRotation);
          return {
            x: this.x + localX * cos - localY * sin,
            y: this.y + localX * sin + localY * cos
          };
        };
        const makeShot = (module, options = {}) => {
          const muzzle = getMuzzle(module, options.forwardOffset ?? 0.16);
          const angle = this.facingRotation + (module.turretAngle ?? 0) + (options.angleOffset ?? 0);
          const speed = options.speed ?? 190;
          return {
            x: muzzle.x,
            y: muzzle.y,
            targetX: muzzle.x + Math.cos(angle) * 520,
            targetY: muzzle.y + Math.sin(angle) * 520,
            damage: options.damage ?? 4,
            speed,
            radius: options.radius ?? 4,
            color: options.color ?? '#73e7ff',
            glowColor: options.glowColor ?? '#36aee8',
            homing: options.homing ?? false,
            turnRate: options.turnRate ?? 1.8,
            heavyImpact: options.heavyImpact ?? false,
            plasmaImpact: options.plasmaImpact ?? false
          };
        };

        // Every surviving mount now fires from its own physical position.
        // Destroying one weapon reduces that weapon family's actual output.
        const targetLocalX = (targetX - this.x) * Math.cos(shipRotation) + (targetY - this.y) * Math.sin(shipRotation);
        const targetDistance = Math.hypot(targetX - this.x, targetY - this.y);
        const attackModules = this.bossMissileCooldown > 0
          ? modules.filter((module) => !module.kind.includes('missile') && !module.kind.includes('rocket'))
          : modules;
        const selectedAttack = selectBossAttack(attackModules, targetDistance, targetLocalX, this.radius * 0.08, this.bossPhase);
        const selectedMissileLauncher = selectedAttack === 'missile'
          ? selectBossMissileLauncher(modules, targetDistance, targetLocalX, this.radius * 0.08, this.bossMissileNextSide)
          : null;
        for (const module of modules) {
          const moduleSideAllowed = module.region !== 'left' && module.region !== 'right'
            || module.crossSide || Math.abs(targetLocalX) <= this.radius * 0.08 || Math.sign(targetLocalX) === Math.sign(module.x);
          if (!moduleSideAllowed) continue;
          const family = module.kind.includes('plasma') ? 'plasma'
            : module.kind.includes('missile') || module.kind.includes('rocket') ? 'missile'
              : module.kind.includes('machine-gun') ? 'machine-gun'
                : module.kind.includes('light-laser') ? 'light-laser' : null;
          if (!family || family !== selectedAttack) continue;
          if (family === 'missile' && module !== selectedMissileLauncher) continue;
          const muzzleForRange = getMuzzle(module);
          const targetDistance = Math.hypot(targetX - muzzleForRange.x, targetY - muzzleForRange.y);
          if (targetDistance > (module.firingRange ?? 700)) continue;
          if (module.kind.includes('light-laser')) {
            const spread = this.bossPhase === 3 ? 0.045 : 0.075;
            shots.push(makeShot(module, {
              damage: 2.2, speed: 245, radius: 3,
              angleOffset: module.x < 0 ? -spread : spread,
              color: '#8df4ff', glowColor: '#32c9ff'
            }));
          } else if (module.kind.includes('machine-gun')) {
            const burst = this.bossPhase === 1 ? 2 : 3;
            for (let index = 0; index < burst; index += 1) {
              const offset = index - (burst - 1) / 2;
              shots.push(makeShot(module, {
                damage: 3.2, speed: 215, radius: 4,
                angleOffset: offset * 0.075,
                color: '#ffd08a', glowColor: '#ff9b45'
              }));
            }
          } else if (module.kind.includes('missile') || module.kind.includes('rocket')) {
            const profile = getBossMissileProfile(this.bossPhase);
            const spread = this.bossPhase === 3 ? 0.09 : 0.14;
            shots.push(makeShot(module, {
              damage: profile.damage, speed: profile.speed, radius: 7,
              homing: true, turnRate: profile.turnRate,
              angleOffset: module.x < 0 ? -spread : spread,
              color: '#d7b6ff', glowColor: '#9d6cff'
            }));
            this.bossMissileCooldown = profile.cooldown;
            this.bossMissileNextSide = -Math.sign(module.x);
          } else if (module.kind.includes('plasma')) {
            if ((module.plasmaChargeTimer ?? 0) <= 0) {
              shots.push(makeShot(module, {
                damage: 68, speed: 760, radius: 15,
                heavyImpact: true, plasmaImpact: true,
                color: '#fff0c2', glowColor: '#ff542e'
              }));
              module.plasmaChargeTimer = module.plasmaChargeDuration ?? 5.4;
            }
          } else if (module.kind.includes('energy') || module.kind.includes('overload-cannon')) {
            // The main energy cannon is presentation-only in this iteration:
            // keep its independent tracking and visible hardware, but do not
            // launch a damaging projectile until its telegraph/charge sequence
            // and counterplay are implemented and validated together.
          }
        }

        this.fireCooldown = this.bossPhase === 1 ? 1.65 : this.bossPhase === 2 ? 1.45 : 1.28;
        if (shots.length) shot = shots;
      }
    } else if (this.type === 'interceptor') {
      // Interceptors combine pursuit with a smooth side-to-side arc to pressure the pilot.
      const towardX = dx / distance;
      const towardY = dy / distance;
      const weave = Math.sin(this.phase) * this.speed * 0.48;
      this.x += towardX * this.speed * 0.70 * dt - towardY * weave * dt;
      this.y += towardY * this.speed * 0.70 * dt + towardX * weave * dt;
    } else if (this.type === 'devastator') {
      // Siege positioning is deliberately slow: the unit holds a distant lane
      // and makes small corrections instead of chasing the pilot around the arena.
      const laneOffset = Math.sin(this.phase * 0.28) * Math.min(width * 0.045, this.isElite ? 28 : 20);
      const desiredX = Math.max(this.radius * 1.5, Math.min(width - this.radius * 1.5, targetX + laneOffset));
      const desiredY = Math.max(this.radius * 2.6, targetY - Math.min(300, height * 0.42));
      steerToPoint(this, desiredX, desiredY, this.motionProfile, dt);

      if (this.siegeState === 'charging') {
        this.siegeChargeTimer = Math.max(0, this.siegeChargeTimer - dt);
        const muzzleX = this.x + Math.cos(this.facingRotation) * this.radius * 1.72;
        const muzzleY = this.y + Math.sin(this.facingRotation) * this.radius * 1.72;
        const distanceToPilot = Math.hypot(targetX - muzzleX, targetY - muzzleY);
        const leadTime = Math.min(this.isElite ? 0.95 : 0.78, distanceToPilot / 760);
        const predictedX = targetX + playerVelocityX * leadTime;
        const predictedY = targetY + playerVelocityY * leadTime;
        this.siegeAimAngle = Math.atan2(predictedY - muzzleY, predictedX - muzzleX);
        if (this.siegeChargeTimer <= 0) {
          this.siegeState = 'warning';
          this.siegeWarningTimer = this.siegeWarningDuration;
        }
      } else if (this.siegeState === 'warning') {
        this.siegeWarningTimer = Math.max(0, this.siegeWarningTimer - dt);
        if (this.siegeWarningTimer <= 0) {
          const angle = this.siegeAimAngle;
          const muzzleX = this.x + Math.cos(angle) * this.radius * 1.82;
          const muzzleY = this.y + Math.sin(angle) * this.radius * 1.82;
          const reach = Math.max(width, height) * 1.9;
          shot = {
            x: muzzleX,
            y: muzzleY,
            targetX: muzzleX + Math.cos(angle) * reach,
            targetY: muzzleY + Math.sin(angle) * reach,
            damage: this.isElite ? 44 : 36,
            speed: 760,
            radius: this.isElite ? 7.5 : 7,
            heavyImpact: true,
            siegeImpact: true,
            color: this.isElite ? '#d6ffd9' : '#fff0d2',
            glowColor: this.isElite ? '#65e99a' : '#ff9b55'
          };
          this.siegeState = 'recover';
          this.siegeRecoveryTimer = this.isElite ? 1.25 : 1.55;
        }
      } else if (this.siegeState === 'recover') {
        this.siegeRecoveryTimer = Math.max(0, this.siegeRecoveryTimer - dt);
        if (this.siegeRecoveryTimer <= 0) {
          this.siegeState = 'charging';
          this.siegeChargeTimer = this.siegeChargeDuration;
        }
      }
    } else if (this.type === 'artillery') {
      // Artillery keeps a distant firing lane and uses a lighter two-shot fan.
      const eliteStrafe = this.isElite ? Math.sin(this.phase * 0.82) * Math.min(width * 0.12, 52) : 0;
      const desiredX = flankActive
        ? this.flankTargetX
        : targetX + Math.sin(this.phase * 0.65) * Math.min(width * (this.isElite ? 0.21 : 0.14), this.isElite ? 96 : 58) + eliteStrafe + dodgeStrength;
      const desiredY = flankActive
        ? this.flankTargetY
        : Math.max(36, targetY - Math.min(185, height * 0.32));
      steerToPoint(this, desiredX, desiredY, this.motionProfile, dt);
      if (flankActive) this.fireCooldown = Math.max(this.fireCooldown, 0.2);
      else this.fireCooldown -= dt;
      if (!flankActive && this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = this.isElite ? 4.2 : 5.2;
        const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const spread = this.isElite ? 0.14 : 0.12;
        shot = [-0.5, 0.5].map((offset) => {
          const angle = baseAngle + offset * spread;
          return {
            x: this.x,
            y: this.y + this.radius,
            targetX: this.x + Math.cos(angle) * 420,
            targetY: this.y + Math.sin(angle) * 420,
            damage: this.isElite ? 4.2 : 3.0,
            speed: this.isElite ? 145 : 118,
            radius: this.isElite ? 3.8 : 3.3,
            color: this.isElite ? '#8ff0b0' : '#d6a0ff',
            glowColor: this.isElite ? '#42c978' : '#a95cff'
          };
        });
      }
    } else if (this.type === 'sentinel') {
      // Sentinels strafe around a moving firing lane instead of sliding directly toward the player.
      const laneOffset = Math.sin(this.phase * (this.isElite ? 0.92 : 0.52)) * Math.min(this.isElite ? 78 : 24, width * (this.isElite ? 0.18 : 0.065));
      let desiredX = Math.max(this.radius, Math.min(width - this.radius, targetX + laneOffset + dodgeStrength));
      let desiredY = Math.max(42, targetY - Math.min(this.isElite ? 170 : 130, height * (this.isElite ? 0.29 : 0.22)));
      if (flankActive) {
        desiredX = this.flankTargetX;
        desiredY = this.flankTargetY;
      }

      if (!flankActive && supportAlly && supportDistance < 230) {
        const awayX = supportAlly.x - targetX;
        const awayY = supportAlly.y - targetY;
        const awayDistance = Math.hypot(awayX, awayY) || 1;
        const coverX = supportAlly.x + awayX / awayDistance * 58;
        const coverY = supportAlly.y + awayY / awayDistance * 58;
        const coverWeight = Math.min(0.65, (230 - supportDistance) / 230 * 0.65);
        desiredX += (coverX - desiredX) * coverWeight;
        desiredY += (coverY - desiredY) * coverWeight;
      }

      steerToPoint(this, desiredX, desiredY, this.motionProfile, dt);
      if (flankActive) this.fireCooldown = Math.max(this.fireCooldown, 0.2);
      else this.fireCooldown -= dt;

      if (!flankActive && this.fireCooldown <= 0 && this.y > 18) {
        if (this.isElite) {
          // A compact two-shot plasma burst gives this variant a distinct attack without a shield.
          this.fireCooldown = 3.15;
          const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
          shot = [-1, 1].map((offset) => {
            const angle = baseAngle + offset * 0.055;
            return {
              x: this.x,
              y: this.y + this.radius,
              targetX: this.x + Math.cos(angle) * 420,
              targetY: this.y + Math.sin(angle) * 420,
              damage: 4.2,
              speed: 168,
              radius: 3.8,
              color: '#c99aff',
              glowColor: '#9255d8'
            };
          });
        } else {
          this.fireCooldown = 3.2;
          shot = {
            x: this.x,
            y: this.y + this.radius,
            targetX,
            targetY,
            damage: 6,
            speed: 158,
            radius: 4,
            color: '#ffe0a8',
            glowColor: '#ffad55'
          };
        }
      }
    } else if (this.type === 'guardian') {
      // Each Guardian screens its own assigned formation of at most two allies.
      // Accumulate active positions directly to avoid a filtered array and reduce passes.
      let formationCount = 0;
      let centerX = 0;
      let centerY = 0;
      for (const ally of this.protectedAllies || []) {
        if (!ally.active) continue;
        formationCount += 1;
        centerX += ally.x;
        centerY += ally.y;
      }
      if (this.isElite && this.flankTimer > 0 && formationCount === 0) {
        steerToPoint(this, this.flankTargetX, this.flankTargetY, this.motionProfile, dt);
      } else if (formationCount > 0) {
        centerX /= formationCount;
        centerY /= formationCount;
        const screenX = centerX + (targetX - centerX) * 0.45;
        const screenY = centerY + (targetY - centerY) * 0.45;
        steerToPoint(this, screenX, screenY, this.motionProfile, dt);
      } else {
        steerToPoint(this, targetX, targetY, this.motionProfile, dt);
      }
    } else {
      if (repositionActive) {
        // Basic Chasers may take one short lateral lane when the group is crowded.
        // Unlike Elite flanking, this is not predictive and does not attempt a rear approach.
        steerToPoint(this, this.repositionTargetX, this.repositionTargetY, this.motionProfile, dt);
        this.fireCooldown = Math.max(this.fireCooldown, 0.2);
      } else {
        // Chasers otherwise pursue directly while weaving laterally, keeping their movement readable.
        this.x += (dx / distance) * this.speed * dt + drift * dt;
        this.y += (dy / distance) * this.speed * dt;

        this.fireCooldown -= dt;
        if (this.level >= 2 && distance > Math.max(185, width * 0.31) && this.fireCooldown <= 0) {
          this.fireCooldown = 4.0 + Math.random() * 1.0;
          const damage = this.radius >= 12 ? 3.8 : this.radius >= 11 ? 3.2 : 2.5;
          shot = {
            x: this.x,
            y: this.y + this.radius,
            targetX,
            targetY,
            damage,
            speed: 122,
            radius: 3,
            color: '#ff9ab0',
            glowColor: '#ff718d'
          };
        }
      }
    }

    // Apply lateral dodge after normal steering so it produces a meaningful curved displacement.
    if (dodgeStrength !== 0) this.x += dodgeStrength * dt;

    // Keep enemies inside the arena, except while the battleship is completing
    // its deliberate off-screen entrance. Clamping its Y coordinate here would
    // snap it to the top edge and cancel the planned smooth descent.
    const movementRadius = this.collisionRadius ?? this.radius;
    this.x = Math.max(movementRadius, Math.min(width - movementRadius, this.x));
    if (this.type !== 'boss' || this.bossEntranceTimer <= 0) {
      this.y = Math.max(movementRadius, Math.min(height - movementRadius, this.y));
    } else {
      // The boss may remain above the visible playfield, but cannot drift below it.
      this.y = Math.min(height - movementRadius, this.y);
    }
    this.updateMotionFeedback(dt, previousX, previousY);

    // Ranged classes keep their weapons oriented toward the pilot while repositioning.
    // Movement rotation still drives the motion feedback; facing rotation drives the hull.
    if (this.type === 'sentinel' || this.type === 'artillery' || this.type === 'boss' || this.type === 'devastator') {
      const cannon = this.type === 'boss' ? this.bossSystems?.getModule('main-energy-cannon') : null;
      if (this.type === 'devastator' && this.siegeState === 'warning') {
        this.facingRotation = this.siegeAimAngle;
      } else if (cannon && (cannon.energyState === 'warning' || cannon.energyState === 'firing')) {
        this.facingRotation = cannon.energyAimAngle;
      } else {
        const desiredFacing = this.type === 'devastator' ? this.siegeAimAngle : Math.atan2(targetY + playerVelocityY * 0.32 - this.y, targetX + playerVelocityX * 0.32 - this.x);
        const facingDelta = Math.atan2(Math.sin(desiredFacing - this.facingRotation), Math.cos(desiredFacing - this.facingRotation));
        const turnResponse = this.type === 'boss' ? (cannon?.energyState === 'aligning' ? 1.15 : 0.62) : this.type === 'devastator' ? 1.35 : 4.5;
        this.facingRotation += facingDelta * Math.min(1, dt * turnResponse);
      }
    } else {
      this.facingRotation = this.rotation;
    }
    return shot;
  }

  draw(ctx, effectsScale = 1) {
    // The Dreadnought uses the game's smooth vector renderer; its depth comes
    // from layered geometry, bevels, gradients and cast shadows rather than pixel scaling.
    return this.drawVector(ctx, effectsScale);
  }

  drawVector(ctx, effectsScale = 1) {
    const boss = this.type === 'boss';
    const guardian = this.type === 'guardian';
    const devastator = this.type === 'devastator';
    const artillery = this.type === 'artillery';
    const ranged = this.type === 'sentinel';
    const interceptor = this.type === 'interceptor';
    const reducedEffects = effectsScale < 0.75;
    const color = boss ? '#202833' : this.isElite ? (devastator ? '#25202e' : artillery ? '#171d24' : ranged ? '#59377f' : guardian ? '#245b4b' : '#7546a6') : devastator ? '#596d82' : guardian ? '#78d9a8' : artillery ? '#bd83ff' : ranged ? '#ffbd69' : interceptor ? '#70e7ff' : '#ff718d';
    const edge = boss ? '#8796a6' : this.isElite ? (devastator ? '#a7f2ce' : artillery ? '#78d99a' : ranged ? '#c9a5ff' : guardian ? '#a7f2ce' : '#d9b8ff') : devastator ? '#b7d2e6' : guardian ? '#d8ffea' : artillery ? '#f0dcff' : ranged ? '#fff0cf' : interceptor ? '#e3fbff' : '#ffd5de';

    ctx.save();
    // The death update already integrates wreck velocity into x/y; do not add a second visual drift offset here.
    ctx.translate(this.x, this.y);
    if (boss && this.bossDying) {
      const collapse = Math.min(1, this.bossDeathTimer / this.bossDeathDuration);
      ctx.rotate(Math.sin(this.bossDeathTimer * 1.35) * collapse * 0.075);
      ctx.globalAlpha = Math.max(0.18, 1 - Math.max(0, collapse - 0.48) * 1.45);
    }
    if (boss && this.bossPhaseTransition > 0) {
      ctx.globalAlpha = 0.55 + Math.sin(this.bossPhaseTransition * 22) * 0.25;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (boss && this.bossEntranceTimer > 0) {
      const progress = 1 - this.bossEntranceTimer / Math.max(0.001, this.bossEntranceDuration);
      const pulse = 0.5 + Math.sin(this.phase * 7) * 0.18;
      ctx.globalAlpha = (1 - progress * 0.45) * pulse;
      ctx.strokeStyle = '#8feaff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * (1.55 + progress * 0.18), this.radius * (0.48 + progress * 0.08), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.rotate(-(this.facingRotation + Math.PI / 2));
      ctx.globalAlpha = 0.78 + Math.sin(this.phase * 8) * 0.12;
      ctx.fillStyle = '#8feaff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('DREADNOUGHT', 0, -this.radius * 1.22);
      ctx.font = 'bold 7px monospace';
      ctx.fillText(progress < 0.48 ? 'COLOSSAL WARSHIP · CONTATO HOSTIL' : 'SISTEMAS DE COMBATE ATIVANDO', 0, -this.radius * 1.10);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.rotate(this.facingRotation + Math.PI / 2);
    // A little squash-and-stretch plus stronger shear gives enemy hulls the player's elastic turn cue.
    ctx.transform(
      1 + this.lateralThrust * 0.10 - Math.abs(this.bank) * 0.05,
      0,
      this.bank * 0.38,
      1 + this.thrust * 0.07,
      0,
      0
    );
    // The capital ship reads as a long, narrow dreadnought rather than a bulky carrier.
    // This is presentation-only: the existing combat hitbox remains untouched.
    if (boss) ctx.scale(0.82, 1);

    if (devastator && this.siegeState === 'warning') {
      const pulse = 0.72 + Math.sin(this.phase * 18) * 0.18;
      ctx.save();
      ctx.globalAlpha = 0.12 * pulse;
      ctx.strokeStyle = this.isElite ? '#74f0a2' : '#ff8d4f';
      ctx.lineWidth = this.isElite ? 15 : 13;
      ctx.beginPath(); ctx.moveTo(0, -this.radius * 2.05); ctx.lineTo(0, -1800); ctx.stroke();
      ctx.globalAlpha = 0.88 * pulse;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([18, 13]);
      ctx.beginPath(); ctx.moveTo(0, -this.radius * 2.05); ctx.lineTo(0, -1800); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // The Dreadnought exhaust uses smooth tapered energy plumes rather than
    // the block-shaped flame style of the smaller ships.
    const flame = 3 + Math.sin(this.phase * 10) * 0.65 + this.thrust * 4.5;
    if (boss) {
      const pulse = 0.34 + Math.sin(this.phase * 11) * 0.06 + this.thrust * 0.12;
      for (let side = -1; side <= 1; side += 2) {
        const engineX = side * this.radius * 0.58;
        const plumeLength = this.radius * (0.58 + this.thrust * 0.16 + Math.sin(this.phase * 10 + side) * 0.035);
        ctx.save();
        ctx.globalAlpha = pulse;
        if (reducedEffects) {
          ctx.fillStyle = 'rgba(8,127,156,0.34)';
        } else {
          const plume = ctx.createLinearGradient(0, this.radius * 1.72, 0, this.radius * 1.72 + plumeLength);
          plume.addColorStop(0, 'rgba(54,217,255,0.82)');
          plume.addColorStop(0.28, 'rgba(8,127,156,0.56)');
          plume.addColorStop(1, 'rgba(8,127,156,0)');
          ctx.fillStyle = plume;
        }
        ctx.beginPath();
        ctx.moveTo(engineX - this.radius * 0.105, this.radius * 1.72);
        ctx.lineTo(engineX + this.radius * 0.105, this.radius * 1.72);
        ctx.lineTo(engineX + this.radius * 0.045, this.radius * 1.72 + plumeLength);
        ctx.lineTo(engineX - this.radius * 0.045, this.radius * 1.72 + plumeLength);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.globalAlpha = 0.22 + this.thrust * 0.25;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, this.radius * 0.88, 2 + this.thrust, 2.5 + flame * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(-2.2, this.radius * 0.72);
      ctx.lineTo(0, this.radius * 0.72 + flame);
      ctx.lineTo(2.2, this.radius * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff2b5';
      ctx.beginPath();
      ctx.moveTo(-0.8, this.radius * 0.72);
      ctx.lineTo(0, this.radius * 0.72 + flame * 0.58);
      ctx.lineTo(0.8, this.radius * 0.72);
      ctx.closePath();
      ctx.fill();
    }

    if (this.lateralThrust > 0.1) {
      ctx.globalAlpha = this.lateralThrust * 0.35;
      ctx.fillStyle = edge;
      ctx.beginPath();
      ctx.ellipse(-this.radius * 0.75, this.radius * 0.15, 1.3 + this.lateralThrust, 2 + this.lateralThrust * 2, 0, 0, Math.PI * 2);
      ctx.ellipse(this.radius * 0.75, this.radius * 0.15, 1.3 + this.lateralThrust, 2 + this.lateralThrust * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Angular plating and dark insets distinguish the hostile faction from the player hull.
    ctx.fillStyle = boss ? '#111820' : '#130d20';
    ctx.beginPath();
    ctx.ellipse(0, 2, this.radius * (boss ? 1.48 : 1.05), this.radius * (boss ? 1.78 : 0.82), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = edge;
    ctx.lineWidth = boss || guardian ? 2 : 1.2;
    ctx.beginPath();
    if (boss) {
      // Full capital-ship hull: broad shoulders, armored decks and a reinforced stern.
      ctx.moveTo(0, -this.radius * 2.22);
      ctx.lineTo(this.radius * 0.34, -this.radius * 2.02);
      ctx.lineTo(this.radius * 0.62, -this.radius * 1.55);
      ctx.lineTo(this.radius * 1.04, -this.radius * 1.12);
      ctx.lineTo(this.radius * 1.34, -this.radius * 0.56);
      ctx.lineTo(this.radius * 1.46, this.radius * 0.24);
      ctx.lineTo(this.radius * 1.32, this.radius * 1.02);
      ctx.lineTo(this.radius * 0.94, this.radius * 1.54);
      ctx.lineTo(this.radius * 0.56, this.radius * 1.86);
      ctx.lineTo(0, this.radius * 2.02);
      ctx.lineTo(-this.radius * 0.56, this.radius * 1.86);
      ctx.lineTo(-this.radius * 0.94, this.radius * 1.54);
      ctx.lineTo(-this.radius * 1.32, this.radius * 1.02);
      ctx.lineTo(-this.radius * 1.46, this.radius * 0.24);
      ctx.lineTo(-this.radius * 1.34, -this.radius * 0.56);
      ctx.lineTo(-this.radius * 1.04, -this.radius * 1.12);
      ctx.lineTo(-this.radius * 0.62, -this.radius * 1.55);
      ctx.lineTo(-this.radius * 0.34, -this.radius * 2.02);
    } else if (devastator) {
      ctx.moveTo(0, -this.radius * 1.72);
      ctx.lineTo(this.radius * 0.34, -this.radius * 1.36);
      ctx.lineTo(this.radius * 0.62, -this.radius * 0.68);
      ctx.lineTo(this.radius * 1.08, -this.radius * 0.28);
      ctx.lineTo(this.radius * 0.94, this.radius * 0.72);
      ctx.lineTo(this.radius * 0.56, this.radius * 1.08);
      ctx.lineTo(-this.radius * 0.56, this.radius * 1.08);
      ctx.lineTo(-this.radius * 0.94, this.radius * 0.72);
      ctx.lineTo(-this.radius * 1.08, -this.radius * 0.28);
      ctx.lineTo(-this.radius * 0.62, -this.radius * 0.68);
      ctx.lineTo(-this.radius * 0.34, -this.radius * 1.36);
    } else if (guardian) {
      ctx.moveTo(-this.radius * 0.48, -this.radius * 1.15);
      ctx.lineTo(this.radius * 0.48, -this.radius * 1.15);
      ctx.lineTo(this.radius * 1.22, -this.radius * 0.55);
      ctx.lineTo(this.radius * 1.18, this.radius * 0.55);
      ctx.lineTo(this.radius * 0.62, this.radius * 1.0);
      ctx.lineTo(-this.radius * 0.62, this.radius * 1.0);
      ctx.lineTo(-this.radius * 1.18, this.radius * 0.55);
      ctx.lineTo(-this.radius * 1.22, -this.radius * 0.55);
    } else if (interceptor) {
      ctx.moveTo(0, -this.radius * 1.45);
      ctx.lineTo(this.radius * 0.52, -this.radius * 0.15);
      ctx.lineTo(this.radius * 1.05, this.radius * 0.55);
      ctx.lineTo(this.radius * 0.2, this.radius * 0.35);
      ctx.lineTo(0, this.radius * 1.15);
      ctx.lineTo(-this.radius * 0.2, this.radius * 0.35);
      ctx.lineTo(-this.radius * 1.05, this.radius * 0.55);
      ctx.lineTo(-this.radius * 0.52, -this.radius * 0.15);
    } else if (artillery) {
      ctx.moveTo(0, -this.radius * 1.3);
      ctx.lineTo(this.radius * 0.58, -this.radius * 0.58);
      ctx.lineTo(this.radius * 1.28, -this.radius * 0.12);
      ctx.lineTo(this.radius * 0.88, this.radius * 0.78);
      ctx.lineTo(0, this.radius * 0.5);
      ctx.lineTo(-this.radius * 0.88, this.radius * 0.78);
      ctx.lineTo(-this.radius * 1.28, -this.radius * 0.12);
      ctx.lineTo(-this.radius * 0.58, -this.radius * 0.58);
    } else if (ranged) {
      ctx.moveTo(0, -this.radius * 1.15);
      ctx.lineTo(this.radius * 1.15, -this.radius * 0.35);
      ctx.lineTo(this.radius * 0.72, this.radius * 0.8);
      ctx.lineTo(0, this.radius * 0.55);
      ctx.lineTo(-this.radius * 0.72, this.radius * 0.8);
      ctx.lineTo(-this.radius * 1.15, -this.radius * 0.35);
    } else {
      ctx.moveTo(0, -this.radius * 1.2);
      ctx.lineTo(this.radius * 0.95, -this.radius * 0.1);
      ctx.lineTo(this.radius * 0.72, this.radius * 0.82);
      ctx.lineTo(0, this.radius * 0.52);
      ctx.lineTo(-this.radius * 0.72, this.radius * 0.82);
      ctx.lineTo(-this.radius * 0.95, -this.radius * 0.1);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (boss) {
      const systems = this.bossSystems;

      // The layered DREADNOUGHT hull below is the sole boss-body render pass.
      // DREADNOUGHT 3D pass -------------------------------------------------
      // The game remains top-down 2D. Layered silhouettes, offset sidewalls,
      // bevel highlights and directional gradients create a raised 3D hull.
      const hullR = this.radius;
      const deckLight = '#354351';

      // Deep cast shadow and lower armor lip make the upper deck appear elevated.
      ctx.save();
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#080d13';
      ctx.beginPath();
      ctx.moveTo(0, -hullR * 1.78);
      ctx.lineTo(hullR * 0.48, -hullR * 1.52);
      ctx.lineTo(hullR * 1.42, -hullR * 0.72);
      ctx.lineTo(hullR * 1.58, hullR * 0.58);
      ctx.lineTo(hullR * 1.18, hullR * 1.48);
      ctx.lineTo(0, hullR * 2.12);
      ctx.lineTo(-hullR * 1.18, hullR * 1.48);
      ctx.lineTo(-hullR * 1.58, hullR * 0.58);
      ctx.lineTo(-hullR * 1.42, -hullR * 0.72);
      ctx.lineTo(-hullR * 0.48, -hullR * 1.52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Angled port and starboard armor walls: darker lower facets sit beneath
      // the brighter top plates, giving the ship visible thickness from above.
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.fillStyle = side < 0 ? '#111a23' : '#151f2a';
        ctx.strokeStyle = '#0b1118';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(side * hullR * 0.72, -hullR * 0.92);
        ctx.lineTo(side * hullR * 1.42, -hullR * 0.64);
        ctx.lineTo(side * hullR * 1.60, hullR * 0.42);
        ctx.lineTo(side * hullR * 1.43, hullR * 1.12);
        ctx.lineTo(side * hullR * 1.08, hullR * 1.48);
        ctx.lineTo(side * hullR * 0.88, hullR * 0.88);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#202b36';
        ctx.beginPath();
        ctx.moveTo(side * hullR * 1.22, -hullR * 0.48);
        ctx.lineTo(side * hullR * 1.50, -hullR * 0.30);
        ctx.lineTo(side * hullR * 1.53, hullR * 0.52);
        ctx.lineTo(side * hullR * 1.31, hullR * 0.96);
        ctx.lineTo(side * hullR * 1.16, hullR * 0.72);
        ctx.closePath();
        ctx.fill();

        // Narrow specular edge separates the upper deck from its vertical side.
        ctx.strokeStyle = '#8796a6';
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(side * hullR * 0.82, -hullR * 0.90);
        ctx.lineTo(side * hullR * 1.36, -hullR * 0.66);
        ctx.lineTo(side * hullR * 1.50, -hullR * 0.20);
        ctx.stroke();
        ctx.restore();
      }

      // Keep the bow centerline clear: no raised bridge or gray superstructure
      // between the open energy aperture and the pointed front of the hull.

      // Recessed reactor well: radial light sits inside a dark armored socket.
      const reactorCoreColor = this.bossPhase === 3 ? '#baffff' : '#36d9ff';
      ctx.fillStyle = '#0b131b';
      ctx.beginPath();
      ctx.ellipse(0, hullR * 0.30, hullR * 0.25, hullR * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = reactorCoreColor;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.ellipse(0, hullR * 0.30, hullR * 0.20, hullR * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#36d9ff';
      ctx.fillRect(-hullR * 0.045, hullR * 0.02, hullR * 0.09, hullR * 0.54);
      ctx.strokeStyle = '#596574';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, hullR * 0.30, hullR * 0.25, hullR * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Main energy emitter aperture: an intentionally hollow, open cavity.
      // The laser will be charged and released from this opening in a later combat pass;
      // no physical barrel or protruding cannon is mounted at the bow.
      const apertureY = -hullR * 1.82;
      ctx.save();
      ctx.translate(0, apertureY);
      ctx.fillStyle = '#080e15';
      ctx.strokeStyle = '#8796a6';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-hullR * 0.39, -hullR * 0.12);
      ctx.lineTo(-hullR * 0.30, -hullR * 0.25);
      ctx.lineTo(hullR * 0.30, -hullR * 0.25);
      ctx.lineTo(hullR * 0.39, -hullR * 0.12);
      ctx.lineTo(hullR * 0.39, hullR * 0.12);
      ctx.lineTo(hullR * 0.30, hullR * 0.25);
      ctx.lineTo(-hullR * 0.30, hullR * 0.25);
      ctx.lineTo(-hullR * 0.39, hullR * 0.12);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // The center is deliberately kept dark and unobstructed to read as a void.
      ctx.fillStyle = '#02070c';
      ctx.beginPath();
      ctx.ellipse(0, 0, hullR * 0.285, hullR * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06121a';
      ctx.fill();

      // Segmented containment lips frame the opening without crossing its center.
      ctx.strokeStyle = '#596574'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, hullR * 0.34, hullR * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#36d9ff'; ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.62 + Math.sin(this.phase * 8) * 0.10;
      ctx.beginPath();
      ctx.ellipse(0, 0, hullR * 0.25, hullR * 0.135, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = '#293542'; ctx.strokeStyle = '#a0acb8'; ctx.lineWidth = 1.3;
        ctx.fillRect(side * hullR * 0.30 - hullR * 0.045, -hullR * 0.075, hullR * 0.09, hullR * 0.15);
        ctx.strokeRect(side * hullR * 0.30 - hullR * 0.045, -hullR * 0.075, hullR * 0.09, hullR * 0.15);
      }
      ctx.restore();

      // Armor segmentation, fasteners and heat vents add scale without noise.
      for (let side = -1; side <= 1; side += 2) {
        ctx.strokeStyle = '#a0acb8';
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(side * hullR * 0.94, -hullR * 0.62);
        ctx.lineTo(side * hullR * 1.20, -hullR * 0.42);
        ctx.lineTo(side * hullR * 1.25, hullR * 0.24);
        ctx.stroke();
        ctx.globalAlpha = 1;

        for (let boltIndex = 0; boltIndex < 3; boltIndex += 1) {
          const boltY = boltIndex === 0 ? -0.42 : boltIndex === 1 ? 0.38 : 0.92;
          ctx.fillStyle = '#aab5c0';
          ctx.beginPath();
          ctx.arc(side * hullR * 1.16, hullR * boltY, hullR * 0.018, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#0b121a';
        ctx.fillRect(side * hullR * 0.92 - hullR * 0.06, hullR * 0.98, hullR * 0.12, hullR * 0.24);
        ctx.fillStyle = '#596574';
        for (let vent = 0; vent < 3; vent += 1) {
          ctx.fillRect(side * hullR * (0.92 + vent * 0.055) - hullR * 0.012, hullR * 1.01, hullR * 0.024, hullR * 0.17);
        }
      }

      // Rear auxiliary thrusters reinforce the twin main engines and give the
      // stern a wider mechanical footprint; their exhaust remains presentation-only.
      for (let side = -1; side <= 1; side += 2) {
        const auxX = side * hullR * 1.02;
        ctx.fillStyle = '#0b121a';
        ctx.strokeStyle = '#596574';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(auxX - hullR * 0.09, hullR * 1.18);
        ctx.lineTo(auxX + hullR * 0.09, hullR * 1.18);
        ctx.lineTo(auxX + hullR * 0.12, hullR * 1.52);
        ctx.lineTo(auxX, hullR * 1.64);
        ctx.lineTo(auxX - hullR * 0.12, hullR * 1.52);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const auxPulse = 0.42 + this.thrust * 0.22 + Math.sin(this.phase * 12 + side) * 0.06;
        ctx.fillStyle = '#087f9c';
        ctx.globalAlpha = auxPulse;
        ctx.fillRect(auxX - hullR * 0.052, hullR * 1.40, hullR * 0.104, hullR * 0.20);
        ctx.fillStyle = '#36d9ff';
        ctx.fillRect(auxX - hullR * 0.025, hullR * 1.43, hullR * 0.05, hullR * 0.14);
        ctx.globalAlpha = 1;
      }
      // Paired side energy manifolds: recessed housings, exposed conduits and
      // small capacitor nodes make the future laser charge path readable.
      for (let side = -1; side <= 1; side += 2) {
        const railX = side * this.radius * 0.43;
        ctx.fillStyle = '#0b141d'; ctx.strokeStyle = '#596574'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(railX - this.radius * 0.075, -this.radius * 1.42);
        ctx.lineTo(railX + this.radius * 0.075, -this.radius * 1.42);
        ctx.lineTo(railX + this.radius * 0.09, this.radius * 0.78);
        ctx.lineTo(railX, this.radius * 0.94);
        ctx.lineTo(railX - this.radius * 0.09, this.radius * 0.78);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#087f9c'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(railX, this.radius * 0.68); ctx.lineTo(railX, -this.radius * 1.28); ctx.stroke();
        ctx.strokeStyle = '#36d9ff'; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.78;
        ctx.beginPath(); ctx.moveTo(railX, this.radius * 0.58); ctx.lineTo(railX, -this.radius * 1.20); ctx.stroke(); ctx.globalAlpha = 1;
        for (let nodeIndex = 0; nodeIndex < 3; nodeIndex += 1) {
          const nodeY = nodeIndex === 0 ? -1.08 : nodeIndex === 1 ? -0.42 : 0.30;
          ctx.fillStyle = '#111d28'; ctx.strokeStyle = '#718091'; ctx.lineWidth = 1;
          ctx.fillRect(railX - this.radius * 0.105, this.radius * nodeY - this.radius * 0.075, this.radius * 0.21, this.radius * 0.15);
          ctx.strokeRect(railX - this.radius * 0.105, this.radius * nodeY - this.radius * 0.075, this.radius * 0.21, this.radius * 0.15);
          ctx.fillStyle = '#36d9ff'; ctx.globalAlpha = 0.58 + Math.sin(this.phase * 8 + nodeY) * 0.12;
          ctx.fillRect(railX - this.radius * 0.035, this.radius * nodeY - this.radius * 0.035, this.radius * 0.07, this.radius * 0.07);
          ctx.globalAlpha = 1;
        }
      }

      // End DREADNOUGHT 3D pass ---------------------------------------------

      // Twelve independently damageable weapon modules are represented by visible sockets.
      if (systems) {
        const radius = this.radius;
        const damagePulse = Math.sin(this.phase * 8);
        const smokeDrift = this.phase * 2;
        for (const module of systems.modules) {
          const mx = module.x * radius;
          const my = module.y * radius;
          const transitionDuration = module.transitionType === 'replacement' ? 2.2
            : module.transitionType === 'rebuild' ? 1.8
              : module.transitionType === 'repair' ? 1.35 : 0;
          const transitionProgress = transitionDuration > 0 && module.transitionTimer > 0
            ? Math.max(0, Math.min(1, 1 - module.transitionTimer / transitionDuration)) : 1;
          const renderKind = module.transitionType === 'replacement' &&
            module.transitionTimer > 0 && transitionProgress < 0.46
            ? (module.transitionFromKind || module.kind) : module.kind;
          const moduleColor = module.state === 'destroyed' ? '#343b45'
            : module.state === 'disabled' ? '#713d32'
              : module.state === 'damaged' ? '#b86a37'
                : renderKind.includes('laser') ? '#36d9ff'
                  : renderKind.includes('missile') || renderKind.includes('rocket') ? '#aab6c2'
                    : renderKind.includes('plasma') ? '#ff653d'
                      : renderKind.includes('energy') || renderKind.includes('cannon') ? '#36d9ff' : '#8796a6';
          const weaponScale = renderKind.includes('plasma') ? 1.28
            : renderKind.includes('missile') || renderKind.includes('rocket') ? 1.24
              : renderKind.includes('energy') || renderKind.includes('cannon') ? 1.18
                : renderKind.includes('machine-gun') ? 1.10 : 1;
          const mountSize = radius * 0.12;
          const moduleSize = mountSize * 2.15 * weaponScale;
          const moduleHalfSize = moduleSize / 2;
          ctx.save();
          ctx.translate(mx, my);
          if (module.kind.includes('plasma') && module.state !== 'destroyed' && module.state !== 'disabled' &&
              module.plasmaChargeTimer <= (module.plasmaWarningDuration ?? 1.5)) {
            const charge = 1 - Math.max(0, module.plasmaChargeTimer) / (module.plasmaWarningDuration ?? 1.5);
            const reducedEffects = effectsScale < 0.75;
            const pulse = reducedEffects ? 0 : 0.72 + Math.sin(this.phase * 18 + module.x * 3) * 0.28;
            ctx.globalAlpha = reducedEffects ? 0.32 + charge * 0.28 : 0.28 + charge * 0.58;
            ctx.strokeStyle = '#ff7544';
            ctx.lineWidth = mountSize * (0.09 + charge * 0.05);
            ctx.beginPath();
            ctx.arc(0, 0, mountSize * (1.2 + charge * 0.9), 0, Math.PI * 2);
            ctx.stroke();
            if (!reducedEffects) {
              ctx.globalAlpha = 0.18 + charge * 0.42;
              ctx.fillStyle = '#ff4b24';
              ctx.beginPath();
              ctx.arc(0, 0, mountSize * (0.65 + pulse * 0.22), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          if (module.id !== 'main-energy-cannon') ctx.rotate(module.turretAngle ?? 0);
          ctx.scale(weaponScale, weaponScale);
          // The main energy module is represented by the open bow aperture above,
          // not by a turret, barrel or solid socket covering the cavity.
          if (module.id !== 'main-energy-cannon') {
            ctx.fillStyle = '#111820';
            ctx.strokeStyle = '#8796a6';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-mountSize * 1.15, -mountSize * 0.75);
            ctx.lineTo(mountSize * 0.75, -mountSize * 1.15);
            ctx.lineTo(mountSize * 1.15, mountSize * 0.75);
            ctx.lineTo(-mountSize * 0.75, mountSize * 1.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          if (module.id !== 'main-energy-cannon' && !module.catastrophic) {
            // Replacement animation physically withdraws the old mount, then seats
            // the new weapon into the same hardpoint. Repair/rebuild uses a shorter lift.
            let weaponOffsetY = 0;
            let weaponAlpha = 1;
            if (module.transitionTimer > 0 && transitionDuration > 0) {
              if (module.transitionType === 'replacement') {
                const retracting = transitionProgress < 0.46;
                const phaseProgress = retracting ? transitionProgress / 0.46 : (transitionProgress - 0.46) / 0.54;
                weaponOffsetY = retracting
                  ? -mountSize * 2.8 * phaseProgress
                  : mountSize * 2.4 * (1 - phaseProgress);
                weaponAlpha = retracting ? Math.max(0, 1 - phaseProgress * 1.35) : Math.min(1, phaseProgress * 1.5);
              } else {
                weaponOffsetY = -mountSize * 0.7 * (1 - transitionProgress);
                weaponAlpha = 0.35 + transitionProgress * 0.65;
              }
            }
            ctx.save();
            ctx.translate(0, weaponOffsetY);
            ctx.globalAlpha *= weaponAlpha;
            // Weapons are separate, readable mechanical assemblies drawn above the hull.
            // Flat fills and short strokes keep the silhouettes crisp without adding blur,
            // per-weapon gradients or shadow filters to the frame loop.
            ctx.fillStyle = moduleColor;
            ctx.strokeStyle = '#dce7ef';
            ctx.lineWidth = 1.45;
            ctx.lineJoin = 'round';

            if (renderKind.includes('machine-gun')) {
              // Twin-barrel armored receiver.
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.82, mountSize * 0.42);
              ctx.lineTo(mountSize * 0.82, mountSize * 0.42);
              ctx.lineTo(mountSize * 0.70, -mountSize * 0.72);
              ctx.lineTo(mountSize * 0.42, -mountSize * 1.08);
              ctx.lineTo(-mountSize * 0.42, -mountSize * 1.08);
              ctx.lineTo(-mountSize * 0.70, -mountSize * 0.72);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              for (let barrel = -1; barrel <= 1; barrel += 2) {
                const barrelX = barrel * mountSize * 0.38;
                ctx.fillStyle = '#202b36';
                ctx.fillRect(barrelX - mountSize * 0.17, -mountSize * 2.22, mountSize * 0.34, mountSize * 1.30);
                ctx.strokeRect(barrelX - mountSize * 0.17, -mountSize * 2.22, mountSize * 0.34, mountSize * 1.30);
                ctx.fillStyle = '#aab8c5';
                ctx.fillRect(barrelX - mountSize * 0.055, -mountSize * 2.08, mountSize * 0.11, mountSize * 0.98);
                ctx.fillStyle = '#080e15';
                ctx.beginPath();
                ctx.arc(barrelX, -mountSize * 2.20, mountSize * 0.14, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
              }
              ctx.fillStyle = '#8796a6';
              ctx.fillRect(-mountSize * 0.48, -mountSize * 0.18, mountSize * 0.96, mountSize * 0.10);
            } else if (renderKind.includes('missile') || renderKind.includes('rocket')) {
              // Three recessed launch tubes inside a visibly armored pod.
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.86, mountSize * 0.52);
              ctx.lineTo(mountSize * 0.86, mountSize * 0.52);
              ctx.lineTo(mountSize * 0.72, -mountSize * 0.86);
              ctx.lineTo(mountSize * 0.48, -mountSize * 1.18);
              ctx.lineTo(-mountSize * 0.48, -mountSize * 1.18);
              ctx.lineTo(-mountSize * 0.72, -mountSize * 0.86);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              for (let tube = -1; tube <= 1; tube += 1) {
                const tubeX = tube * mountSize * 0.43;
                ctx.fillStyle = '#0a1119';
                ctx.beginPath();
                ctx.arc(tubeX, -mountSize * 0.48, mountSize * 0.235, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#aab8c5';
                ctx.lineWidth = 1.25;
                ctx.stroke();
                ctx.fillStyle = '#263544';
                ctx.beginPath();
                ctx.arc(tubeX, -mountSize * 0.48, mountSize * 0.115, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.strokeStyle = '#dce7ef';
              ctx.lineWidth = 1.45;
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.56, mountSize * 0.22);
              ctx.lineTo(mountSize * 0.56, mountSize * 0.22);
              ctx.stroke();
            } else if (renderKind.includes('laser')) {
              // Slim twin emitter rails make the light-laser distinct from a cannon.
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.70, mountSize * 0.48);
              ctx.lineTo(mountSize * 0.70, mountSize * 0.48);
              ctx.lineTo(mountSize * 0.48, -mountSize * 0.78);
              ctx.lineTo(0, -mountSize * 1.10);
              ctx.lineTo(-mountSize * 0.48, -mountSize * 0.78);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              for (let emitter = -1; emitter <= 1; emitter += 2) {
                const emitterX = emitter * mountSize * 0.23;
                ctx.fillStyle = '#202b36';
                ctx.fillRect(emitterX - mountSize * 0.105, -mountSize * 2.10, mountSize * 0.21, mountSize * 1.35);
                ctx.strokeRect(emitterX - mountSize * 0.105, -mountSize * 2.10, mountSize * 0.21, mountSize * 1.35);
                ctx.fillStyle = '#d8fbff';
                ctx.fillRect(emitterX - mountSize * 0.045, -mountSize * 1.94, mountSize * 0.09, mountSize * 1.08);
              }
              ctx.fillStyle = '#36d9ff';
              ctx.fillRect(-mountSize * 0.10, -mountSize * 0.40, mountSize * 0.20, mountSize * 0.62);
            } else if (renderKind.includes('plasma')) {
              // Heavy plasma weapon: armored breech, exposed coil and orange emitter.
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.88, mountSize * 0.48);
              ctx.lineTo(mountSize * 0.88, mountSize * 0.48);
              ctx.lineTo(mountSize * 0.72, -mountSize * 0.56);
              ctx.lineTo(mountSize * 0.42, -mountSize * 0.94);
              ctx.lineTo(-mountSize * 0.42, -mountSize * 0.94);
              ctx.lineTo(-mountSize * 0.72, -mountSize * 0.56);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#202b36';
              ctx.fillRect(-mountSize * 0.34, -mountSize * 2.02, mountSize * 0.68, mountSize * 1.28);
              ctx.strokeRect(-mountSize * 0.34, -mountSize * 2.02, mountSize * 0.68, mountSize * 1.28);
              ctx.fillStyle = '#ff9a55';
              ctx.globalAlpha *= 0.86;
              ctx.beginPath();
              ctx.arc(0, -mountSize * 1.98, mountSize * 0.24, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha /= 0.86;
              ctx.strokeStyle = '#ffd0a3';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(0, -mountSize * 1.98, mountSize * 0.31, 0, Math.PI * 2);
              ctx.stroke();
              ctx.strokeStyle = '#dce7ef';
              ctx.lineWidth = 1.45;
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.60, -mountSize * 0.28);
              ctx.lineTo(-mountSize * 0.60, mountSize * 0.20);
              ctx.moveTo(mountSize * 0.60, -mountSize * 0.28);
              ctx.lineTo(mountSize * 0.60, mountSize * 0.20);
              ctx.stroke();
            } else if (renderKind.includes('energy') || renderKind.includes('cannon')) {
              // Generic heavy emitter used by future replacement variants.
              ctx.beginPath();
              ctx.moveTo(-mountSize * 0.82, mountSize * 0.52);
              ctx.lineTo(mountSize * 0.82, mountSize * 0.52);
              ctx.lineTo(mountSize * 0.62, -mountSize * 0.72);
              ctx.lineTo(mountSize * 0.34, -mountSize * 1.04);
              ctx.lineTo(-mountSize * 0.34, -mountSize * 1.04);
              ctx.lineTo(-mountSize * 0.62, -mountSize * 0.72);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#202b36';
              ctx.fillRect(-mountSize * 0.28, -mountSize * 2.24, mountSize * 0.56, mountSize * 1.48);
              ctx.strokeRect(-mountSize * 0.28, -mountSize * 2.24, mountSize * 0.56, mountSize * 1.48);
              ctx.fillStyle = '#d8faff';
              ctx.fillRect(-mountSize * 0.09, -mountSize * 2.10, mountSize * 0.18, mountSize * 1.20);
              ctx.fillStyle = '#36d9ff';
              ctx.beginPath();
              ctx.arc(0, -mountSize * 2.22, mountSize * 0.17, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, mountSize * 0.78, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          } else if (module.id !== 'main-energy-cannon') {
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = '#ff704e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-mountSize, -mountSize);
            ctx.lineTo(mountSize, mountSize);
            ctx.moveTo(mountSize, -mountSize);
            ctx.lineTo(-mountSize, mountSize);
            ctx.stroke();
          }
          ctx.restore();
          if (module.state !== 'operational') {
            ctx.globalAlpha = 0.45 + damagePulse * 0.18;
            ctx.strokeStyle = '#ff9a55';
            ctx.beginPath();
            ctx.moveTo(mx - 7, my - 7);
            ctx.lineTo(mx + 7, my + 7);
            ctx.moveTo(mx + 7, my - 7);
            ctx.lineTo(mx - 7, my + 7);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          if (module.smoke > 0.08) {
            ctx.globalAlpha = Math.min(0.55, module.smoke * 0.45);
            ctx.fillStyle = '#aab4bd';
            ctx.beginPath();
            ctx.arc(mx + Math.sin(smokeDrift + mx) * 7, my - 12 - module.smoke * 10, 5 + module.smoke * 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (module.fire > 0.08) {
            ctx.globalAlpha = Math.min(0.85, module.fire);
            ctx.fillStyle = '#ff7a32';
            ctx.beginPath();
            ctx.arc(mx, my, 4 + module.fire * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (module.sparks > 0.08) {
            const sparkPhase = this.phase * 19 + mx * 0.7 + my;
            const sparkAlpha = Math.min(0.9, module.sparks);
            ctx.globalAlpha = sparkAlpha;
            ctx.strokeStyle = '#ffe2a3';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(mx - 5 + Math.sin(sparkPhase) * 3, my - 3);
            ctx.lineTo(mx - 1 + Math.sin(sparkPhase + 1.2) * 4, my - 8);
            ctx.moveTo(mx + 3, my + 2);
            ctx.lineTo(mx + 7 + Math.cos(sparkPhase) * 3, my - 3);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          if (module.repairGlow > 0.08) {
            ctx.globalAlpha = module.repairGlow * (0.55 + damagePulse * 0.12);
            ctx.strokeStyle = '#78f4ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(mx - moduleHalfSize - 3, my - moduleHalfSize - 3, moduleSize + 6, moduleSize + 6);
            ctx.globalAlpha = 1;
          }
          if (renderKind.includes('plasma') && module.state !== 'destroyed' && module.state !== 'disabled') {
            const chargeRatio = 1 - Math.max(0, module.plasmaChargeTimer ?? 0) / Math.max(0.1, module.plasmaChargeDuration ?? 2.6);
            if (chargeRatio > 0.02) {
              const pulse = 0.72 + Math.sin(this.phase * (7 + chargeRatio * 12) + mx) * 0.2;
              ctx.save();
              ctx.globalAlpha = Math.min(0.9, chargeRatio * pulse);
              ctx.strokeStyle = '#ff9d5c';
              ctx.lineWidth = 1.5 + chargeRatio * 2;
              ctx.beginPath();
              ctx.arc(mx, my, moduleHalfSize + 4 + chargeRatio * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargeRatio);
              ctx.stroke();
              ctx.fillStyle = '#ffd6a1';
              ctx.globalAlpha = chargeRatio * pulse * 0.75;
              ctx.beginPath();
              ctx.arc(mx, my, 2 + chargeRatio * 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          if (module.id === 'main-energy-cannon' && module.state !== 'destroyed' && module.state !== 'disabled' &&
              ['charging', 'aligning', 'warning', 'firing'].includes(module.energyState)) {
            const warning = module.energyState === 'warning';
            const firing = module.energyState === 'firing';
            const chargeRatio = warning || firing || module.energyState === 'aligning'
              ? 1 : 1 - module.energyChargeTimer / Math.max(0.1, module.energyChargeDuration);
            const pulse = 0.78 + Math.sin(this.phase * (warning || firing ? 18 : 10)) * 0.16;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = (warning || firing ? 0.9 : 0.25 + chargeRatio * 0.55) * pulse;
            ctx.strokeStyle = firing ? '#fff0c9' : warning ? '#ff684f' : '#72eaff';
            ctx.lineWidth = firing ? 4 : warning ? 2.8 : 1.4 + chargeRatio * 1.8;
            ctx.beginPath();
            ctx.arc(mx, my, moduleHalfSize + 5 + chargeRatio * 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.08, chargeRatio));
            ctx.stroke();
            ctx.fillStyle = firing ? '#fff0c9' : warning ? '#ffb08a' : '#c8f8ff';
            ctx.globalAlpha = (warning || firing ? 0.85 : 0.18 + chargeRatio * 0.58) * pulse;
            ctx.beginPath();
            ctx.arc(mx, my, 2 + chargeRatio * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          if (module.transitionTimer > 0) {
            const transitionProgress = 1 - module.transitionTimer / (module.transitionType === 'replacement' ? 2.2 : module.transitionType === 'rebuild' ? 1.8 : 1.35);
            const transitionPulse = 0.55 + Math.sin(this.phase * 16 + mx) * 0.2;
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - transitionProgress * 0.72) * transitionPulse;
            ctx.strokeStyle = module.transitionType === 'replacement' ? '#ffb56b' : '#78f4ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mx, my, moduleHalfSize + 4 + transitionProgress * 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Scalar arc bounds avoid allocating four temporary arrays on every boss draw.
        for (const shield of systems.shields) {
          if (shield.health <= 0 || this.bossDying) continue;
          let arcStart = 0;
          let arcEnd = 0;
          if (shield.id === 'front') {
            arcStart = -2.72;
            arcEnd = -0.42;
          } else if (shield.id === 'left') {
            arcStart = 2.45;
            arcEnd = 3.8;
          } else if (shield.id === 'right') {
            arcStart = -0.68;
            arcEnd = 0.68;
          } else {
            arcStart = 0.42;
            arcEnd = 2.72;
          }
          const shieldRatio = shield.health / Math.max(1, shield.maxHealth);
          // A broad, segmented cyan barrier echoes the player's shield language at the dreadnought's scale.
          ctx.globalAlpha = 0.13 + shieldRatio * 0.20;
          ctx.strokeStyle = '#36d9ff';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 1.40, arcStart, arcEnd);
          ctx.stroke();
          ctx.globalAlpha = 0.24 + shieldRatio * 0.24;
          ctx.strokeStyle = '#b8f7ff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 1.40, arcStart, arcEnd);
          ctx.stroke();
          if (shield.impactFlash > 0) {
            const impactProgress = 1 - shield.impactFlash / 0.46;
            const impactRadius = radius * (1.34 + impactProgress * 0.2);
            ctx.globalAlpha = Math.min(1, shield.impactFlash * 2.5) * (0.55 + shield.impactStrength * 0.45);
            ctx.strokeStyle = '#b8f7ff';
            ctx.lineWidth = 3 + shield.impactStrength * 2;
            ctx.beginPath();
            ctx.arc(0, 0, impactRadius, arcStart, arcEnd);
            ctx.stroke();
            ctx.globalAlpha = shield.impactFlash * 1.2;
            ctx.strokeStyle = '#5fe5ff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, impactRadius + 4, arcStart, arcEnd);
            ctx.stroke();
          }
          if (shield.repairGlow > 0.08) {
            ctx.globalAlpha = shield.repairGlow * 0.72;
            ctx.strokeStyle = '#b4f8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.52, arcStart, arcEnd);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    if (devastator) {
      // The siege barrel is integrated into the hull rather than mounted as a turret.
      ctx.save();
      ctx.fillStyle = '#1a2633';
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.25;
      ctx.fillRect(-this.radius * 0.23, -this.radius * 2.12, this.radius * 0.46, this.radius * 1.72);
      ctx.strokeRect(-this.radius * 0.23, -this.radius * 2.12, this.radius * 0.46, this.radius * 1.72);
      ctx.fillStyle = '#354657';
      ctx.fillRect(-this.radius * 0.39, -this.radius * 0.92, this.radius * 0.78, this.radius * 0.28);
      ctx.fillStyle = '#0a111a';
      ctx.fillRect(-this.radius * 0.15, -this.radius * 2.18, this.radius * 0.30, this.radius * 0.20);
      ctx.strokeStyle = this.isElite ? '#9df0b5' : '#ffbf78';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.11, -this.radius * 1.88);
      ctx.lineTo(-this.radius * 0.11, -this.radius * 0.65);
      ctx.moveTo(this.radius * 0.11, -this.radius * 1.88);
      ctx.lineTo(this.radius * 0.11, -this.radius * 0.65);
      ctx.stroke();
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = '#263646';
        ctx.fillRect(side * this.radius * 0.53 - this.radius * 0.12, -this.radius * 0.55, this.radius * 0.24, this.radius * 0.82);
        ctx.fillStyle = this.isElite ? '#5fd58a' : '#e7a05d';
        ctx.fillRect(side * this.radius * 0.53 - this.radius * 0.035, -this.radius * 0.34, this.radius * 0.07, this.radius * 0.36);
      }
      if (this.siegeState === 'charging' || this.siegeState === 'warning') {
        const charge = this.siegeState === 'warning' ? 1 : 1 - this.siegeChargeTimer / Math.max(0.01, this.siegeChargeDuration);
        const pulse = 0.72 + Math.sin(this.phase * 14) * 0.16;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (0.22 + charge * 0.62) * pulse;
        ctx.strokeStyle = this.isElite ? '#77f0a2' : '#ffad63';
        ctx.lineWidth = 1.6 + charge * 1.8;
        ctx.beginPath();
        ctx.arc(0, -this.radius * 2.03, this.radius * (0.20 + charge * 0.18), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.isElite ? '#d7ffe1' : '#fff0d2';
        ctx.globalAlpha = (0.28 + charge * 0.62) * pulse;
        ctx.beginPath();
        ctx.arc(0, -this.radius * 2.03, this.radius * (0.07 + charge * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (artillery) {
      ctx.fillStyle = '#6d3b9d';
      ctx.fillRect(-this.radius * 0.78, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
      ctx.fillRect(this.radius * 0.44, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.radius * 0.78, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
      ctx.strokeRect(this.radius * 0.44, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
    }

    if (guardian) {
      ctx.fillStyle = '#315b4b';
      ctx.fillRect(-this.radius * 0.98, -this.radius * 0.25, this.radius * 0.34, this.radius * 0.75);
      ctx.fillRect(this.radius * 0.64, -this.radius * 0.25, this.radius * 0.34, this.radius * 0.75);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.radius * 0.98, -this.radius * 0.25, this.radius * 0.34, this.radius * 0.75);
      ctx.strokeRect(this.radius * 0.64, -this.radius * 0.25, this.radius * 0.34, this.radius * 0.75);
    }

    if (this.isElite && artillery) {
      // Elite Artillery keeps the base silhouette with dark plating and a green energy core.
      ctx.fillStyle = '#17131f';
      ctx.fillRect(-this.radius * 0.78, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
      ctx.fillRect(this.radius * 0.44, -this.radius * 0.35, this.radius * 0.34, this.radius * 0.8);
      ctx.fillStyle = '#65c98b';
      ctx.fillRect(-this.radius * 0.07, -this.radius * 0.18, this.radius * 0.14, this.radius * 0.34);
    }

    if (this.isElite && ranged) {
      // Dark shoulder plates and a cool luminous core distinguish the Elite Sentinel.
      ctx.fillStyle = '#17131f';
      ctx.beginPath();
      ctx.moveTo(-this.radius * 1.02, -this.radius * 0.34);
      ctx.lineTo(-this.radius * 0.48, -this.radius * 0.05);
      ctx.lineTo(-this.radius * 0.72, this.radius * 0.58);
      ctx.lineTo(-this.radius * 1.18, this.radius * 0.18);
      ctx.closePath();
      ctx.moveTo(this.radius * 1.02, -this.radius * 0.34);
      ctx.lineTo(this.radius * 0.48, -this.radius * 0.05);
      ctx.lineTo(this.radius * 0.72, this.radius * 0.58);
      ctx.lineTo(this.radius * 1.18, this.radius * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c9a5ff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#2a1a3b';
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 1.22);
      ctx.lineTo(this.radius * 0.28, -this.radius * 0.42);
      ctx.lineTo(0, -this.radius * 0.12);
      ctx.lineTo(-this.radius * 0.28, -this.radius * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8fdcff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    if (this.isElite && guardian) {
      // Broad defensive shoulders make the Guardian Elite read as a shield unit.
      ctx.fillStyle = '#173b34';
      ctx.beginPath();
      ctx.moveTo(-this.radius * 1.25, -this.radius * 0.55);
      ctx.lineTo(-this.radius * 0.48, -this.radius * 0.25);
      ctx.lineTo(-this.radius * 0.72, this.radius * 0.72);
      ctx.lineTo(-this.radius * 1.42, this.radius * 0.25);
      ctx.closePath();
      ctx.moveTo(this.radius * 1.25, -this.radius * 0.55);
      ctx.lineTo(this.radius * 0.48, -this.radius * 0.25);
      ctx.lineTo(this.radius * 0.72, this.radius * 0.72);
      ctx.lineTo(this.radius * 1.42, this.radius * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a7f2ce';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.fillStyle = '#25152f';
    ctx.fillRect(-this.radius * 0.62, -this.radius * 0.1, this.radius * 1.24, this.radius * 0.38);
    ctx.fillStyle = edge;
    ctx.fillRect(-this.radius * 0.2, -this.radius * 0.24, this.radius * 0.4, this.radius * 0.48);
    ctx.fillStyle = boss ? '#fff2ff' : this.isElite && ranged ? '#8fdcff' : this.isElite && guardian ? '#9fffd1' : this.isElite ? '#65c98b' : color;
    ctx.fillRect(-this.radius * 0.08, this.radius * 0.3, this.radius * 0.16, this.radius * 0.32);
    if (boss) {
      ctx.strokeStyle = '#fff0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 1.25, -this.radius * 0.12);
      ctx.lineTo(-this.radius * 0.52, this.radius * 0.22);
      ctx.moveTo(this.radius * 1.25, -this.radius * 0.12);
      ctx.lineTo(this.radius * 0.52, this.radius * 0.22);
      ctx.stroke();
    }

    const barWidth = this.radius * (this.isElite ? 2.5 : 2.2);
    const barY = this.radius + 5;
    const barHeight = this.isElite ? 4 : 3;
    ctx.fillStyle = this.isElite ? '#101a27' : '#182338';
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    ctx.fillStyle = this.health / this.maxHealth <= 0.35 ? '#ff526f' : this.isElite ? (guardian ? '#8af0bf' : artillery ? '#76dc98' : '#c6a0ff') : '#8cf5c7';
    ctx.fillRect(-barWidth / 2, barY, barWidth * (this.health / this.maxHealth), barHeight);
    if (this.isElite) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }
    if (this.isElite && this.eliteShield > 0) {
      // Lightweight segmented shield cue, visually consistent with the player's shield arcs.
      const shieldRatio = this.eliteShield / Math.max(1, this.eliteMaxShield);
      const flashProgress = this.eliteShieldFlash > 0 ? 1 - this.eliteShieldFlash / 0.42 : 1;
      const shieldRadius = this.radius + 3 + (this.eliteShieldFlash > 0 ? flashProgress * 5 : 2);
      ctx.globalAlpha = 0.28 + shieldRatio * 0.28 + (this.eliteShieldFlash > 0 ? this.eliteShieldFlash * 1.15 : 0);
      ctx.strokeStyle = guardian ? '#a7f2ce' : devastator ? '#9df0b5' : '#82dca2';
      ctx.lineWidth = this.eliteShieldFlash > 0 ? 2.5 + this.eliteShieldFlash * 3 : 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, -2.72, -2.12);
      ctx.arc(0, 0, shieldRadius, -1.02, -0.42);
      ctx.stroke();
      if (this.eliteShieldFlash > 0) {
        ctx.globalAlpha = this.eliteShieldFlash * 1.45;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, shieldRadius + 3, -2.72, -2.12);
        ctx.arc(0, 0, shieldRadius + 3, -1.02, -0.42);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (this.isElite && this.eliteSpawnTimer > 0) {
      // Brief spatial refraction: three thin fading ellipses, without particles or text.
      const progress = 1 - this.eliteSpawnTimer / 1.65;
      const fade = Math.min(1, this.eliteSpawnTimer / 0.28);
      const tint = guardian ? '#8af0bf' : artillery ? '#76dc98' : '#b68be8';
      ctx.globalAlpha = fade * 0.42;
      ctx.strokeStyle = tint;
      ctx.lineWidth = 1.2;
      for (let ring = 0; ring < 3; ring += 1) {
        const spread = 5 + progress * 15 + ring * 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius + spread, (this.radius + spread) * 0.62, (ring - 1) * 0.12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (boss && this.bossDying) {
      const deathTime = this.bossDeathTimer;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Seven deterministic detonations now span the bow, side batteries, core and stern.
      // Fixed local coordinates avoid per-frame particle allocation during the finale.
      for (let index = 0; index < 7; index += 1) {
        const burstStart = 0.35 + index * 0.52;
        const burstAge = deathTime - burstStart;
        const side = index % 2 === 0 ? -1 : 1;
        const burstX = side * this.radius * (0.22 + (index % 3) * 0.16);
        const burstY = this.radius * (-1.55 + index * 0.5);

        // A short-lived pressure ring marks each internal detonation.
        if (burstAge >= 0 && burstAge <= 0.56) {
          const fade = 1 - burstAge / 0.56;
          ctx.globalAlpha = fade * 0.88;
          ctx.strokeStyle = index % 2 === 0 ? '#ffb45f' : '#8feaff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(burstX, burstY, 5 + burstAge * 76, 0, Math.PI * 2);
          ctx.stroke();

          // Local flame tongues flicker from fixed hull breaches without particle allocation.
          const flicker = 0.72 + Math.sin(deathTime * 31 + index * 2.1) * 0.18;
          ctx.globalAlpha = fade * flicker;
          ctx.fillStyle = '#ff9b45';
          ctx.beginPath();
          ctx.ellipse(burstX, burstY, 5 + fade * 7, 10 + fade * 15, side * 0.22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff0b5';
          ctx.beginPath();
          ctx.arc(burstX, burstY, 3 + fade * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Smoke remains visible after each blast and slowly drifts away from the breach.
        if (burstAge > 0.08 && burstAge < 2.65) {
          const smokeAge = burstAge - 0.08;
          const smokeFade = Math.min(0.48, (1 - smokeAge / 2.65) * 0.42);
          const drift = smokeAge * (8 + index * 1.2);
          ctx.globalAlpha = smokeFade;
          ctx.fillStyle = '#8995a3';
          ctx.beginPath();
          ctx.ellipse(
            burstX + Math.sin(smokeAge * 2.4 + index) * 5,
            burstY - drift,
            7 + smokeAge * 5,
            5 + smokeAge * 4,
            smokeAge * 0.12,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.globalAlpha = smokeFade * 0.52;
          ctx.fillStyle = '#c1c9d0';
          ctx.beginPath();
          ctx.arc(burstX - 4 + Math.cos(smokeAge * 1.8 + index) * 4, burstY - drift - 5, 4 + smokeAge * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Four deterministic armor fragments detach over time and drift away from the wreck.
      // They are drawn from fixed local transforms: no per-frame arrays or particle objects.
      for (let index = 0; index < 4; index += 1) {
        const detachStart = 1.1 + index * 0.82;
        const fragmentAge = deathTime - detachStart;
        if (fragmentAge < 0 || fragmentAge > 3.7) continue;

        const side = index % 2 === 0 ? -1 : 1;
        const originX = side * this.radius * (0.48 + (index % 2) * 0.1);
        const originY = this.radius * (-0.92 + index * 0.62);
        const fragmentX = originX + side * (10 + fragmentAge * 28);
        const fragmentY = originY + fragmentAge * (12 + index * 1.5);
        const fragmentFade = Math.min(1, fragmentAge / 0.18) * Math.max(0, 1 - fragmentAge / 3.7);

        ctx.save();
        ctx.translate(fragmentX, fragmentY);
        ctx.rotate(side * (fragmentAge * 0.72 + index * 0.16));
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = fragmentFade * 0.92;
        ctx.fillStyle = index % 2 === 0 ? '#263747' : '#343044';
        ctx.strokeStyle = '#b5c6d2';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-11, -5);
        ctx.lineTo(5, -8);
        ctx.lineTo(13, -1);
        ctx.lineTo(7, 7);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = fragmentFade * (0.45 + Math.sin(deathTime * 19 + index) * 0.18);
        ctx.strokeStyle = '#ffad63';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-5, -2);
        ctx.lineTo(2, 1);
        ctx.lineTo(7, 4);
        ctx.stroke();
        ctx.restore();
      }

      const finalAge = deathTime - 4.15;
      if (finalAge >= 0) {
        const finalFade = Math.max(0, 1 - finalAge / 1.45);
        const shockRadius = 12 + finalAge * 145;

        // Two expanding shockwave rings create a stronger final detonation silhouette.
        ctx.globalAlpha = finalFade * 0.9;
        ctx.strokeStyle = '#fff0c2';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, shockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = finalFade * 0.58;
        ctx.strokeStyle = '#ff9b54';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, shockRadius - 22), 0, Math.PI * 2);
        ctx.stroke();

        // Bright core flash fades before the hull is removed.
        ctx.globalAlpha = finalFade * 0.22;
        ctx.fillStyle = '#ff9b54';
        ctx.beginPath();
        ctx.arc(0, 0, 9 + finalAge * 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = finalFade * 0.34;
        ctx.fillStyle = '#fff0c2';
        ctx.beginPath();
        ctx.arc(0, 0, 5 + finalFade * 13, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
