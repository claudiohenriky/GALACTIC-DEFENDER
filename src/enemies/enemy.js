import { BossSystems } from './boss-systems.js?v=0.44.0';

export class Enemy {
  constructor(x, y, level = 1, type = 'chaser', isElite = false) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.isElite = Boolean(isElite && (type === 'artillery' || type === 'sentinel' || type === 'guardian'));
    // Artillery keeps its 8-point shield; Guardian Elite has a stronger defensive reserve.
    this.eliteMaxShield = this.isElite ? (type === 'artillery' ? 8 : type === 'guardian' ? 12 : 0) : 0;
    this.eliteShield = this.eliteMaxShield;
    this.protectedAllies = [];
    this.guardianCoverShieldMax = this.isElite && type === 'guardian' ? 18 : 0;
    this.guardianCoverShield = this.guardianCoverShieldMax;
    this.eliteSpawnTimer = this.isElite ? 1.65 : 0;
    this.radius = type === 'boss' ? 82 : type === 'guardian' ? 15 : type === 'artillery' ? 13 : type === 'sentinel' ? 12 : type === 'interceptor' ? 8 : 10 + Math.random() * 3;
    // Collision footprint follows the full armored silhouette, not only its visual core radius.
    this.collisionRadius = type === 'boss' ? this.radius * 1.35 : this.radius;
    this.maxHealth = type === 'boss' ? 360 + level * 12 : type === 'guardian' ? (this.isElite ? 9 + level : 7 + level) : type === 'artillery' ? 6 + Math.floor(level / 2) : type === 'sentinel' ? 5 : type === 'interceptor' ? 1 : 2;
    this.health = this.maxHealth;
    this.bossSystems = type === 'boss' ? new BossSystems() : null;
    this.bossPhase = 1;
    this.bossPhaseTransition = 0;
    this.bossEntranceDuration = type === 'boss' ? 5.2 : 0;
    this.bossEntranceTimer = this.bossEntranceDuration;
    this.bossDying = false;
    this.bossDeathTimer = 0;
    this.bossDeathDuration = 8.4;
    this.bossDeathDriftX = 0;
    this.bossDeathDriftY = 0;
    this.bossDeathSpin = 0;
    this.rewardGranted = false;
    this.speed = (type === 'boss' ? 16 : type === 'guardian' ? 28 : type === 'artillery' ? 32 : type === 'sentinel' ? 42 : type === 'interceptor' ? 88 + Math.random() * 18 : 48 + Math.random() * 24) + Math.min(level, 8) * (type === 'guardian' ? 1.2 : 2);
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = type === 'boss'
      ? 1.8
      : type === 'artillery'
        ? 2.6 + Math.random() * 0.8
        : type === 'sentinel'
          ? (this.isElite ? 2.8 : 1.1 + Math.random() * 0.8)
          : 2.4 + Math.random() * 0.8;
    this.active = true;
    this.contactCooldown = 0;
    // Threat response is deliberately limited: ranged units dodge predicted near-misses, not every shot.
    this.dodgeCooldown = 0;
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

  update(dt, targetX, targetY, width, height, playerProjectiles = [], allies = [], cameraTop = 0) {
    const previousX = this.x;
    const previousY = this.y;
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.phase += dt * (this.type === 'sentinel' ? 1.4 : this.type === 'artillery' ? (this.isElite ? 1.25 : 0.9) : this.type === 'guardian' ? 1.1 : this.type === 'interceptor' ? 3.2 : 2);
    this.eliteSpawnTimer = Math.max(0, this.eliteSpawnTimer - dt);

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
          ? (ally.isElite || ally.type === 'sentinel')
          : ally.type === 'guardian' && (ally.protectedAllies || []).includes(this);
        if (!isPreferredSupport) continue;
        const offsetX = ally.x - this.x;
        const offsetY = ally.y - this.y;
        const allyDistanceSquared = offsetX * offsetX + offsetY * offsetY;
        const priority = this.type === 'guardian' && ally.isElite ? 0 : 1;
        if (priority < supportPriority || (priority === supportPriority && allyDistanceSquared < supportDistanceSquared)) {
          supportPriority = priority;
          supportDistanceSquared = allyDistanceSquared;
          supportAlly = ally;
        }
      }
    }
    const supportDistance = supportAlly ? Math.sqrt(supportDistanceSquared) : Infinity;

    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 18 : this.type === 'artillery' ? (this.isElite ? 9 : 3) : this.type === 'guardian' ? 2.5 : this.type === 'interceptor' ? 5 : 9);
    let shot = null;

    // Estimate closest approach over a short horizon using relative velocity.
    // Only Sentinel, Artillery and Boss react in this first pass; each has a different response strength.
    if ((this.type === 'sentinel' || this.type === 'artillery' || this.type === 'boss') && this.dodgeCooldown <= 0) {
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
        this.dodgeTimer = this.type === 'boss' ? 0.26 : this.type === 'sentinel' ? (this.isElite ? 0.62 : 0.30) : 0.48;
        this.dodgeCooldown = this.type === 'boss' ? 1.8 : this.type === 'sentinel' ? (this.isElite ? 0.72 : 1.45) : this.type === 'artillery' ? 1.25 : 0.95;
      }
    }
    const dodgeStrength = this.dodgeTimer > 0
      ? (this.type === 'sentinel' ? (this.isElite ? 168 : 68) : this.type === 'artillery' ? (this.isElite ? 122 : 76) : this.type === 'boss' ? 42 : 0) * this.dodgeDirection * Math.min(1, this.dodgeTimer / (this.type === 'boss' ? 0.26 : this.type === 'sentinel' && this.isElite ? 0.62 : this.type === 'sentinel' ? 0.30 : 0.48))
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
      const horizontalRange = Math.min(width * (this.bossPhase === 3 ? 0.14 : 0.11), this.bossPhase === 3 ? 120 : 92);
      // The battleship repositions around the encounter instead of mirroring every player movement.
      // Its slow drift leaves room for the pilot to circle and attack different shield sectors.
      const patrolX = targetX + Math.sin(this.phase * (this.bossPhase === 3 ? 0.62 : 0.42)) * horizontalRange;
      const desiredY = Math.max(this.collisionRadius + 24, Math.min(targetY - Math.max(145, height * 0.18), height - this.collisionRadius - 30));
      const entryStartY = cameraTop - this.radius * 1.9;
      const entryY = entryStartY + (desiredY - entryStartY) * entranceEase;
      const desiredX = targetX + (patrolX - targetX) * entranceEase;
      this.x += (desiredX - this.x) * Math.min(1, dt * (this.bossPhase === 3 ? 0.18 : 0.14));
      this.y += (entryY - this.y) * Math.min(1, dt * (this.bossEntranceTimer > 0 ? 1.8 : this.bossPhase === 3 ? 0.16 : 0.12));
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
          const rawAngle = Math.atan2(targetY - muzzleY, targetX - muzzleX) - this.facingRotation;
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
            turnRate: options.turnRate ?? 1.8
          };
        };

        // Every surviving mount now fires from its own physical position.
        // Destroying one weapon reduces that weapon family's actual output.
        for (const module of modules) {
          if (module.kind.includes('light-laser')) {
            const spread = this.bossPhase === 3 ? 0.045 : 0.075;
            shots.push(makeShot(module, {
              damage: 2.2, speed: 245, radius: 3,
              angleOffset: module.x < 0 ? -spread : spread,
              color: '#8df4ff', glowColor: '#32c9ff'
            }));
          } else if (module.kind.includes('machine-gun')) {
            const burst = this.bossPhase === 1 ? 2 : this.bossPhase === 2 ? 3 : 4;
            for (let index = 0; index < burst; index += 1) {
              const offset = index - (burst - 1) / 2;
              shots.push(makeShot(module, {
                damage: 3.2, speed: 215, radius: 4,
                angleOffset: offset * 0.075,
                color: '#ffd08a', glowColor: '#ff9b45'
              }));
            }
          } else if (module.kind.includes('missile') || module.kind.includes('rocket')) {
            const spread = this.bossPhase === 3 ? 0.12 : 0.19;
            shots.push(makeShot(module, {
              damage: 9, speed: 118, radius: 7, homing: true, turnRate: 1.35,
              angleOffset: module.x < 0 ? -spread : spread,
              color: '#d7b6ff', glowColor: '#9d6cff'
            }));
          } else if (module.kind.includes('plasma')) {
            if ((module.plasmaChargeTimer ?? 0) <= 0) {
              shots.push(makeShot(module, {
                damage: 34, speed: 142, radius: 13,
                heavyImpact: true, plasmaImpact: true,
                color: '#ffb66e', glowColor: '#ff542e'
              }));
              module.plasmaChargeTimer = module.plasmaChargeDuration ?? 4.8;
            }
          } else if (module.kind.includes('energy') || module.kind.includes('overload-cannon')) {
            // The main energy cannon is presentation-only in this iteration:
            // keep its independent tracking and visible hardware, but do not
            // launch a damaging projectile until its telegraph/charge sequence
            // and counterplay are implemented and validated together.
          }
        }

        this.fireCooldown = this.bossPhase === 1 ? 2.35 : this.bossPhase === 2 ? 2.05 : 1.7;
        if (shots.length) shot = shots;
      }
    } else if (this.type === 'interceptor') {
      // Interceptors combine pursuit with a smooth side-to-side arc to pressure the pilot.
      const towardX = dx / distance;
      const towardY = dy / distance;
      const weave = Math.sin(this.phase) * this.speed * 0.62;
      this.x += towardX * this.speed * 0.78 * dt - towardY * weave * dt;
      this.y += towardY * this.speed * 0.78 * dt + towardX * weave * dt;
    } else if (this.type === 'artillery') {
      // Artillery keeps a distant firing lane and uses a readable three-shot fan.
      const eliteStrafe = this.isElite ? Math.sin(this.phase * 0.82) * Math.min(width * 0.18, 88) : 0;
      const desiredX = targetX + Math.sin(this.phase * 0.65) * Math.min(width * 0.3, 150) + eliteStrafe + dodgeStrength;
      const desiredY = Math.max(36, targetY - Math.min(235, height * 0.42));
      this.x += (desiredX - this.x) * Math.min(1, dt * (this.isElite ? 1.05 : 0.8));
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.0);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = this.isElite ? 2.95 : 3.4;
        const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const spread = this.isElite ? 0.19 : 0.22;
        shot = [-1, 0, 1].map((offset) => {
          const angle = baseAngle + offset * spread;
          return {
            x: this.x,
            y: this.y + this.radius,
            targetX: this.x + Math.cos(angle) * 420,
            targetY: this.y + Math.sin(angle) * 420,
            damage: this.isElite ? 5.8 : 5,
            speed: this.isElite ? 172 : 150,
            radius: this.isElite ? 4 : 3.5,
            color: this.isElite ? '#8ff0b0' : '#d6a0ff',
            glowColor: this.isElite ? '#42c978' : '#a95cff'
          };
        });
      }
    } else if (this.type === 'sentinel') {
      // Sentinels strafe around a moving firing lane instead of sliding directly toward the player.
      const laneOffset = Math.sin(this.phase * (this.isElite ? 1.05 : 0.72)) * Math.min(this.isElite ? 125 : 70, width * (this.isElite ? 0.27 : 0.16));
      let desiredX = Math.max(this.radius, Math.min(width - this.radius, targetX + laneOffset + dodgeStrength));
      let desiredY = Math.max(42, targetY - Math.min(this.isElite ? 195 : 160, height * (this.isElite ? 0.34 : 0.28)));

      if (supportAlly && supportDistance < 230) {
        const awayX = supportAlly.x - targetX;
        const awayY = supportAlly.y - targetY;
        const awayDistance = Math.hypot(awayX, awayY) || 1;
        const coverX = supportAlly.x + awayX / awayDistance * 58;
        const coverY = supportAlly.y + awayY / awayDistance * 58;
        const coverWeight = Math.min(0.65, (230 - supportDistance) / 230 * 0.65);
        desiredX += (coverX - desiredX) * coverWeight;
        desiredY += (coverY - desiredY) * coverWeight;
      }

      this.x += (desiredX - this.x) * Math.min(1, dt * (this.isElite ? 1.35 : 0.82));
      this.y += (desiredY - this.y) * Math.min(1, dt * (this.isElite ? 1.65 : 1.2));
      this.fireCooldown -= dt;

      if (this.fireCooldown <= 0 && this.y > 18) {
        if (this.isElite) {
          // A compact two-shot plasma burst gives this variant a distinct attack without a shield.
          this.fireCooldown = 2.65;
          const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
          shot = [-1, 1].map((offset) => {
            const angle = baseAngle + offset * 0.055;
            return {
              x: this.x,
              y: this.y + this.radius,
              targetX: this.x + Math.cos(angle) * 420,
              targetY: this.y + Math.sin(angle) * 420,
              damage: 5.5,
              speed: 185,
              radius: 3.8,
              color: '#c99aff',
              glowColor: '#9255d8'
            };
          });
        } else {
          this.fireCooldown = 2.2;
          shot = {
            x: this.x,
            y: this.y + this.radius,
            targetX,
            targetY,
            damage: 10,
            speed: 190,
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
      if (formationCount > 0) {
        centerX /= formationCount;
        centerY /= formationCount;
        const screenX = centerX + (targetX - centerX) * 0.45;
        const screenY = centerY + (targetY - centerY) * 0.45;
        this.x += (screenX - this.x) * Math.min(1, dt * (this.isElite ? 1.15 : 0.95)) + drift * dt;
        this.y += (screenY - this.y) * Math.min(1, dt * (this.isElite ? 1.15 : 0.95));
      } else {
        this.x += (dx / distance) * this.speed * dt + drift * dt;
        this.y += (dy / distance) * this.speed * dt;
      }
    } else {
      // Chasers pursue directly while weaving laterally, keeping their movement readable.
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (dy / distance) * this.speed * dt;

      this.fireCooldown -= dt;
      if (this.level >= 2 && distance > Math.max(185, width * 0.31) && this.fireCooldown <= 0) {
        this.fireCooldown = 3.2 + Math.random() * 1.0;
        const damage = this.radius >= 12 ? 5 : this.radius >= 11 ? 4 : 3;
        shot = {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage,
          speed: 135,
          radius: 3,
          color: '#ff9ab0',
          glowColor: '#ff718d'
        };
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
    if (this.type === 'sentinel' || this.type === 'artillery' || this.type === 'boss') {
      const desiredFacing = Math.atan2(targetY - this.y, targetX - this.x);
      const facingDelta = Math.atan2(
        Math.sin(desiredFacing - this.facingRotation),
        Math.cos(desiredFacing - this.facingRotation)
      );
      this.facingRotation += facingDelta * Math.min(1, dt * (this.type === 'boss' ? 0.34 : 4.5));
    } else {
      this.facingRotation = this.rotation;
    }
    return shot;
  }

  draw(ctx) {
    const boss = this.type === 'boss';
    const guardian = this.type === 'guardian';
    const artillery = this.type === 'artillery';
    const ranged = this.type === 'sentinel';
    const interceptor = this.type === 'interceptor';
    const color = this.isElite ? (artillery ? '#171d24' : ranged ? '#59377f' : guardian ? '#245b4b' : '#7546a6') : boss ? (this.bossPhase === 3 ? '#ff6d8f' : this.bossPhase === 2 ? '#ffb36b' : '#d59bff') : guardian ? '#78d9a8' : artillery ? '#bd83ff' : ranged ? '#ffbd69' : interceptor ? '#70e7ff' : '#ff718d';
    const edge = this.isElite ? (artillery ? '#78d99a' : ranged ? '#c9a5ff' : guardian ? '#a7f2ce' : '#d9b8ff') : boss ? (this.bossPhase === 3 ? '#ffd1dc' : this.bossPhase === 2 ? '#fff0cf' : '#f1d7ff') : guardian ? '#d8ffea' : artillery ? '#f0dcff' : ranged ? '#fff0cf' : interceptor ? '#e3fbff' : '#ffd5de';

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
      ctx.fillText(progress < 0.48 ? 'ALERTA · NAVE DE GUERRA DETECTADA' : 'SISTEMAS HOSTIS ATIVANDO', 0, -this.radius * 1.18);
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

    // Small animated exhaust makes acceleration and direction changes visible without sprites.
    const flame = 3 + Math.sin(this.phase * 10) * 0.65 + this.thrust * 4.5;
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
    ctx.fillStyle = '#130d20';
    ctx.beginPath();
    ctx.ellipse(0, 2, this.radius * 1.05, this.radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = edge;
    ctx.lineWidth = boss || guardian ? 2 : 1.2;
    ctx.beginPath();
    if (boss) {
      // Broad armored dreadnought silhouette: the long axis is the ship's forward direction.
      // Long, narrow armored keel: the silhouette reads as a battleship rather than a compact fighter.
      ctx.moveTo(0, -this.radius * 2.18);
      ctx.lineTo(this.radius * 0.22, -this.radius * 1.92);
      ctx.lineTo(this.radius * 0.34, -this.radius * 1.38);
      ctx.lineTo(this.radius * 0.58, -this.radius * 0.98);
      ctx.lineTo(this.radius * 0.72, -this.radius * 0.35);
      ctx.lineTo(this.radius * 0.78, this.radius * 0.62);
      ctx.lineTo(this.radius * 0.62, this.radius * 1.28);
      ctx.lineTo(this.radius * 0.38, this.radius * 1.68);
      ctx.lineTo(0, this.radius * 1.86);
      ctx.lineTo(-this.radius * 0.38, this.radius * 1.68);
      ctx.lineTo(-this.radius * 0.62, this.radius * 1.28);
      ctx.lineTo(-this.radius * 0.78, this.radius * 0.62);
      ctx.lineTo(-this.radius * 0.72, -this.radius * 0.35);
      ctx.lineTo(-this.radius * 0.58, -this.radius * 0.98);
      ctx.lineTo(-this.radius * 0.34, -this.radius * 1.38);
      ctx.lineTo(-this.radius * 0.22, -this.radius * 1.92);
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
      // Layered armor plates and engine housings keep the large silhouette readable.
      ctx.fillStyle = '#182638';
      ctx.strokeStyle = '#91b9d6';
      ctx.lineWidth = 2;
      ctx.fillRect(-this.radius * 0.82, -this.radius * 0.34, this.radius * 1.64, this.radius * 1.18);
      ctx.strokeRect(-this.radius * 0.82, -this.radius * 0.34, this.radius * 1.64, this.radius * 1.18);
      ctx.fillStyle = '#263d53';
      ctx.fillRect(-this.radius * 1.14, -this.radius * 0.18, this.radius * 0.34, this.radius * 0.86);
      ctx.fillRect(this.radius * 0.80, -this.radius * 0.18, this.radius * 0.34, this.radius * 0.86);
      const coreColor = this.bossPhase === 3 ? '#ff704e' : '#55c9ed';
      // Layered solid rectangles replace Canvas shadow blur, which is costly on mobile GPUs.
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = coreColor;
      ctx.fillRect(-this.radius * 0.29, -this.radius * 0.21, this.radius * 0.58, this.radius * 0.74);
      ctx.globalAlpha = 0.28;
      ctx.fillRect(-this.radius * 0.24, -this.radius * 0.16, this.radius * 0.48, this.radius * 0.66);
      ctx.globalAlpha = 1;
      ctx.fillRect(-this.radius * 0.20, -this.radius * 0.12, this.radius * 0.40, this.radius * 0.56);

      // Ten independently damageable weapon modules are represented by visible sockets.
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
                : renderKind.includes('laser') ? '#64e5ff'
                  : renderKind.includes('missile') || renderKind.includes('rocket') ? '#c7a6ff'
                    : renderKind.includes('plasma') ? '#ffb56b'
                      : renderKind.includes('energy') || renderKind.includes('cannon') ? '#ff8cae' : '#9ab7ca';
          const mountSize = radius * 0.105;
          const moduleSize = mountSize * 2;
          const moduleHalfSize = moduleSize / 2;
          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(module.turretAngle ?? 0);
          // Each module gets a visible armored hardpoint and a recognizable weapon silhouette.
          ctx.fillStyle = '#101d2a';
          ctx.strokeStyle = '#9ebbd0';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-mountSize * 1.15, -mountSize * 0.75);
          ctx.lineTo(mountSize * 0.75, -mountSize * 1.15);
          ctx.lineTo(mountSize * 1.15, mountSize * 0.75);
          ctx.lineTo(-mountSize * 0.75, mountSize * 1.15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (!module.catastrophic) {
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
            ctx.fillStyle = moduleColor;
            ctx.strokeStyle = '#e3f0f7';
            ctx.lineWidth = 1.2;
            if (renderKind.includes('machine-gun')) {
              ctx.fillRect(-mountSize * 0.72, -mountSize * 0.55, mountSize * 1.44, mountSize * 1.1);
              ctx.fillRect(-mountSize * 0.42, -mountSize * 1.75, mountSize * 0.25, mountSize * 1.55);
              ctx.fillRect(mountSize * 0.17, -mountSize * 1.75, mountSize * 0.25, mountSize * 1.55);
            } else if (renderKind.includes('missile') || renderKind.includes('rocket')) {
              ctx.fillRect(-mountSize * 0.82, -mountSize * 0.7, mountSize * 1.64, mountSize * 1.35);
              for (let tube = -1; tube <= 1; tube += 1) {
                ctx.beginPath();
                ctx.arc(tube * mountSize * 0.48, -mountSize * 0.08, mountSize * 0.19, 0, Math.PI * 2);
                ctx.fillStyle = '#172332';
                ctx.fill();
                ctx.stroke();
              }
            } else if (renderKind.includes('laser')) {
              ctx.fillRect(-mountSize * 0.55, -mountSize * 0.65, mountSize * 1.1, mountSize * 1.2);
              ctx.fillStyle = '#d8fbff';
              ctx.fillRect(-mountSize * 0.16, -mountSize * 2.05, mountSize * 0.32, mountSize * 1.75);
            } else if (renderKind.includes('plasma')) {
              ctx.beginPath();
              ctx.arc(0, 0, mountSize * 0.72, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-mountSize * 0.24, -mountSize * 1.85, mountSize * 0.48, mountSize * 1.55);
            } else if (renderKind.includes('energy') || renderKind.includes('cannon')) {
              ctx.fillRect(-mountSize * 0.72, -mountSize * 0.7, mountSize * 1.44, mountSize * 1.35);
              ctx.fillStyle = '#ffe0ed';
              ctx.fillRect(-mountSize * 0.32, -mountSize * 2.5, mountSize * 0.64, mountSize * 2.35);
              ctx.fillStyle = '#ff83b0';
              ctx.fillRect(-mountSize * 0.12, -mountSize * 2.35, mountSize * 0.24, mountSize * 2.1);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, mountSize * 0.78, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.strokeRect(-mountSize * 0.72, -mountSize * 0.55, mountSize * 1.44, mountSize * 1.1);
            ctx.restore();
          } else {
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
          ctx.globalAlpha = 0.12 + 0.26 * (shield.health / shield.maxHealth);
          ctx.strokeStyle = '#67dcff';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 1.38, arcStart, arcEnd);
          ctx.stroke();
          if (shield.repairGlow > 0.08) {
            ctx.globalAlpha = shield.repairGlow * 0.72;
            ctx.strokeStyle = '#b4f8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.48, arcStart, arcEnd);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }
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
      ctx.globalAlpha = 0.35 + shieldRatio * 0.35;
      ctx.strokeStyle = guardian ? '#a7f2ce' : '#82dca2';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 5, -2.72, -2.12);
      ctx.arc(0, 0, this.radius + 5, -1.02, -0.42);
      ctx.stroke();
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
