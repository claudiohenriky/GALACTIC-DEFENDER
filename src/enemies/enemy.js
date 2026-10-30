export class Enemy {
  constructor(x, y, level = 1, type = 'chaser', isElite = false) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.isElite = Boolean(isElite && (type === 'artillery' || type === 'sentinel'));
    // The energy shield remains exclusive to the Artillery Elite.
    this.eliteMaxShield = this.isElite && type === 'artillery' ? 8 : 0;
    this.eliteShield = this.eliteMaxShield;
    this.eliteSpawnTimer = this.isElite ? 1.65 : 0;
    this.radius = type === 'boss' ? 23 : type === 'guardian' ? 15 : type === 'artillery' ? 13 : type === 'sentinel' ? 12 : type === 'interceptor' ? 8 : 10 + Math.random() * 3;
    this.maxHealth = type === 'boss' ? 34 + level * 4 : type === 'guardian' ? 7 + level : type === 'artillery' ? 6 + Math.floor(level / 2) : type === 'sentinel' ? 5 : type === 'interceptor' ? 1 : 2;
    this.health = this.maxHealth;
    this.bossPhase = 1;
    this.bossPhaseTransition = 0;
    this.speed = (type === 'boss' ? 34 : type === 'guardian' ? 28 : type === 'artillery' ? 32 : type === 'sentinel' ? 42 : type === 'interceptor' ? 88 + Math.random() * 18 : 48 + Math.random() * 24) + Math.min(level, 8) * (type === 'guardian' ? 1.2 : 2);
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

  update(dt, targetX, targetY, width, height, playerProjectiles = [], allies = []) {
    const previousX = this.x;
    const previousY = this.y;
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.phase += dt * (this.type === 'sentinel' ? 1.4 : this.type === 'artillery' ? (this.isElite ? 1.25 : 0.9) : this.type === 'guardian' ? 1.1 : this.type === 'interceptor' ? 3.2 : 2);
    this.eliteSpawnTimer = Math.max(0, this.eliteSpawnTimer - dt);

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;

    // First tactical-cooperation pass: Guardians screen nearby Sentinels;
    // Sentinels use that cover to keep a firing lane behind the Guardian.
    // This changes positioning only, not health, damage, collision, or firing rules.
    let supportAlly = null;
    let supportDistance = Infinity;
    if (this.type === 'guardian' || this.type === 'sentinel') {
      let supportPriority = Infinity;
      for (const ally of allies) {
        if (ally === this || !ally.active) continue;
        const isPreferredSupport = this.type === 'guardian'
          ? (ally.isElite || ally.type === 'sentinel')
          : ally.type === 'guardian';
        if (!isPreferredSupport) continue;
        const priority = this.type === 'guardian' && ally.isElite ? 0 : 1;
        const allyDistance = Math.hypot(ally.x - this.x, ally.y - this.y);
        if (priority < supportPriority || (priority === supportPriority && allyDistance < supportDistance)) {
          supportPriority = priority;
          supportDistance = allyDistance;
          supportAlly = ally;
        }
      }
    }

    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 18 : this.type === 'artillery' ? (this.isElite ? 9 : 3) : this.type === 'guardian' ? 2.5 : this.type === 'interceptor' ? 5 : 9);
    let shot = null;

    // Estimate closest approach over a short horizon using relative velocity.
    // Only Sentinel, Artillery and Boss react in this first pass; each has a different response strength.
    if (this.type === 'sentinel' || this.type === 'artillery' || this.type === 'boss') {
      let bestThreat = null;
      let bestClearance = Infinity;
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
        const clearance = Math.hypot(closestX, closestY);
        const dangerRadius = this.radius + (projectile.radius ?? 3) + (this.type === 'boss' ? 5 : 12);
        if (clearance < dangerRadius && clearance < bestClearance) {
          bestClearance = clearance;
          bestThreat = { x: closestX, y: closestY };
        }
      }
      if (bestThreat && this.dodgeCooldown <= 0) {
        this.dodgeDirection = bestThreat.x >= 0 ? -1 : 1;
        this.dodgeTimer = this.type === 'boss' ? 0.26 : 0.48;
        this.dodgeCooldown = this.type === 'boss' ? 1.8 : this.type === 'artillery' ? 1.25 : 0.95;
      }
    }
    const dodgeStrength = this.dodgeTimer > 0
      ? (this.type === 'sentinel' ? 132 : this.type === 'artillery' ? (this.isElite ? 72 : 104) : this.type === 'boss' ? 42 : 0) * this.dodgeDirection * Math.min(1, this.dodgeTimer / (this.type === 'boss' ? 0.26 : 0.48))
      : 0;

    if (this.type === 'boss') {
      // Boss phases unlock at 66% and 33% health. A short transition pause signals each change.
      const healthRatio = this.health / Math.max(1, this.maxHealth);
      const nextBossPhase = healthRatio <= 0.33 ? 3 : healthRatio <= 0.66 ? 2 : 1;
      if (nextBossPhase > this.bossPhase) {
        this.bossPhase = nextBossPhase;
        this.bossPhaseTransition = 0.85;
        this.fireCooldown = Math.max(this.fireCooldown, 1.05);
      }
      this.bossPhaseTransition = Math.max(0, this.bossPhaseTransition - dt);
      // Bosses advance into the arena, then sweep across a broad horizontal lane.
      // Steering toward a sinusoidal destination avoids the old edge-to-edge velocity oscillation.
      const horizontalRange = Math.max(0, width * (this.bossPhase === 3 ? 0.36 : 0.32));
      const desiredX = width / 2 + Math.sin(this.phase * (this.bossPhase === 3 ? 1.05 : 0.8)) * horizontalRange;
      const desiredY = Math.max(58, Math.min(targetY - Math.max(90, height * 0.18), height * 0.52));
      this.x += (desiredX - this.x) * Math.min(1, dt * (this.bossPhase === 3 ? 1.65 : 1.35));
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.1);
      this.x = Math.max(this.radius + 4, Math.min(width - this.radius - 4, this.x));
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && this.y > 18 && this.bossPhaseTransition <= 0) {
        this.fireCooldown = this.bossPhase === 1 ? 1.65 : this.bossPhase === 2 ? 1.85 : 2.05;
        const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const shotCount = this.bossPhase === 1 ? 1 : this.bossPhase === 2 ? 3 : 5;
        const spread = this.bossPhase === 2 ? 0.2 : 0.17;
        const shotDamage = this.bossPhase === 1 ? 8 : this.bossPhase === 2 ? 6 : 5;
        const shotSpeed = this.bossPhase === 3 ? 185 : 165;
        const shots = [];
        for (let index = 0; index < shotCount; index += 1) {
          const offset = index - (shotCount - 1) / 2;
          const angle = baseAngle + offset * spread;
          shots.push({
            x: this.x,
            y: this.y + this.radius,
            targetX: this.x + Math.cos(angle) * 420,
            targetY: this.y + Math.sin(angle) * 420,
            damage: shotDamage,
            speed: shotSpeed,
            radius: this.bossPhase === 3 ? 4.5 : 5,
            color: this.bossPhase === 1 ? '#d59bff' : this.bossPhase === 2 ? '#ffb36b' : '#ff6d8f',
            glowColor: this.bossPhase === 1 ? '#a85cff' : this.bossPhase === 2 ? '#ff7b42' : '#ff315e'
          });
        }
        shot = shotCount === 1 ? shots[0] : shots;
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
      const desiredX = width / 2 + Math.sin(this.phase * 0.65) * Math.min(width * 0.3, 150) + eliteStrafe + dodgeStrength;
      const desiredY = Math.max(36, targetY - Math.min(235, height * 0.42));
      this.x += (desiredX - this.x) * Math.min(1, dt * (this.isElite ? 1.05 : 0.8));
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.0);
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = 3.4;
        const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const spread = 0.22;
        shot = [-1, 0, 1].map((offset) => {
          const angle = baseAngle + offset * spread;
          return {
            x: this.x,
            y: this.y + this.radius,
            targetX: this.x + Math.cos(angle) * 420,
            targetY: this.y + Math.sin(angle) * 420,
            damage: 5,
            speed: 150,
            radius: 3.5,
            color: '#d6a0ff',
            glowColor: '#a95cff'
          };
        });
      }
    } else if (this.type === 'sentinel') {
      // Sentinels strafe around a moving firing lane instead of sliding directly toward the player.
      const laneOffset = Math.sin(this.phase * 0.8) * Math.min(105, width * 0.23);
      let desiredX = Math.max(this.radius, Math.min(width - this.radius, targetX + laneOffset + dodgeStrength));
      let desiredY = Math.max(42, targetY - Math.min(175, height * 0.3));

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

      this.x += (desiredX - this.x) * Math.min(1, dt * 1.15);
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.5);
      this.fireCooldown -= dt;

      if (this.fireCooldown <= 0 && this.y > 18) {
        if (this.isElite) {
          // A compact two-shot plasma burst gives this variant a distinct attack without a shield.
          this.fireCooldown = 3.0;
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
      // A Guardian normally advances on the pilot. Near a Sentinel, it instead
      // takes a screening position between that ally and the player.
      if (supportAlly && supportDistance < 280) {
        const screenX = supportAlly.x + (targetX - supportAlly.x) * 0.45;
        const screenY = supportAlly.y + (targetY - supportAlly.y) * 0.45;
        this.x += (screenX - this.x) * Math.min(1, dt * 0.95) + drift * dt;
        this.y += (screenY - this.y) * Math.min(1, dt * 0.95);
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

    // Keep enemies in the arena so reaching an edge never deals automatic damage.
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    this.updateMotionFeedback(dt, previousX, previousY);

    // Ranged classes keep their weapons oriented toward the pilot while repositioning.
    // Movement rotation still drives the motion feedback; facing rotation drives the hull.
    if (this.type === 'sentinel' || this.type === 'artillery' || this.type === 'boss') {
      const desiredFacing = Math.atan2(targetY - this.y, targetX - this.x);
      const facingDelta = Math.atan2(
        Math.sin(desiredFacing - this.facingRotation),
        Math.cos(desiredFacing - this.facingRotation)
      );
      this.facingRotation += facingDelta * Math.min(1, dt * (this.type === 'boss' ? 3.2 : 4.5));
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
    const color = this.isElite ? '#7546a6' : boss ? (this.bossPhase === 3 ? '#ff6d8f' : this.bossPhase === 2 ? '#ffb36b' : '#d59bff') : guardian ? '#78d9a8' : artillery ? '#bd83ff' : ranged ? '#ffbd69' : interceptor ? '#70e7ff' : '#ff718d';
    const edge = this.isElite ? '#d9b8ff' : boss ? (this.bossPhase === 3 ? '#ffd1dc' : this.bossPhase === 2 ? '#fff0cf' : '#f1d7ff') : guardian ? '#d8ffea' : artillery ? '#f0dcff' : ranged ? '#fff0cf' : interceptor ? '#e3fbff' : '#ffd5de';

    ctx.save();
    ctx.translate(this.x, this.y);
    if (boss && this.bossPhaseTransition > 0) {
      ctx.globalAlpha = 0.55 + Math.sin(this.bossPhaseTransition * 22) * 0.25;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
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
      ctx.moveTo(0, -this.radius * 1.35);
      ctx.lineTo(this.radius * 0.52, -this.radius * 0.72);
      ctx.lineTo(this.radius * 1.35, -this.radius * 0.15);
      ctx.lineTo(this.radius * 0.88, this.radius * 0.72);
      ctx.lineTo(this.radius * 0.36, this.radius * 0.88);
      ctx.lineTo(0, this.radius * 1.22);
      ctx.lineTo(-this.radius * 0.36, this.radius * 0.88);
      ctx.lineTo(-this.radius * 0.88, this.radius * 0.72);
      ctx.lineTo(-this.radius * 1.35, -this.radius * 0.15);
      ctx.lineTo(-this.radius * 0.52, -this.radius * 0.72);
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
      ctx.strokeStyle = '#d9b8ff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = '#25152f';
    ctx.fillRect(-this.radius * 0.62, -this.radius * 0.1, this.radius * 1.24, this.radius * 0.38);
    ctx.fillStyle = edge;
    ctx.fillRect(-this.radius * 0.2, -this.radius * 0.24, this.radius * 0.4, this.radius * 0.48);
    ctx.fillStyle = boss ? '#fff2ff' : this.isElite && ranged ? '#8fdcff' : this.isElite ? '#65c98b' : color;
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

    const barWidth = this.radius * 2.2;
    const barY = this.radius + 5;
    ctx.fillStyle = '#182338';
    ctx.fillRect(-barWidth / 2, barY, barWidth, 3);
    ctx.fillStyle = this.health / this.maxHealth <= 0.35 ? '#ff526f' : '#8cf5c7';
    ctx.fillRect(-barWidth / 2, barY, barWidth * (this.health / this.maxHealth), 3);
    if (this.isElite && this.eliteShield > 0) {
      // Lightweight segmented shield cue, visually consistent with the player's shield arcs.
      const shieldRatio = this.eliteShield / Math.max(1, this.eliteMaxShield);
      ctx.globalAlpha = 0.35 + shieldRatio * 0.35;
      ctx.strokeStyle = '#82dca2';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 5, -2.72, -2.12);
      ctx.arc(0, 0, this.radius + 5, -1.02, -0.42);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (this.isElite && this.eliteSpawnTimer > 0) {
      const progress = 1 - this.eliteSpawnTimer / 1.65;
      const fade = Math.min(1, this.eliteSpawnTimer / 0.35);
      ctx.globalAlpha = fade * 0.75;
      ctx.strokeStyle = '#b68be8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 9 + progress * 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#e8d5ff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.type === 'sentinel' ? 'SENTINELA DE ELITE' : 'ARTILHEIRO DE ELITE', 0, -this.radius - 17);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
