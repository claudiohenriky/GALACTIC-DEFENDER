export class Enemy {
  constructor(x, y, level = 1, type = 'chaser') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.radius = type === 'boss' ? 23 : type === 'sentinel' ? 12 : type === 'interceptor' ? 8 : 10 + Math.random() * 3;
    this.maxHealth = type === 'boss' ? 34 + level * 4 : type === 'sentinel' ? 5 : type === 'interceptor' ? 1 : 2;
    this.health = this.maxHealth;
    this.speed = (type === 'boss' ? 34 : type === 'sentinel' ? 42 : type === 'interceptor' ? 88 + Math.random() * 18 : 48 + Math.random() * 24) + Math.min(level, 8) * 2;
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = type === 'boss'
      ? 1.8
      : type === 'sentinel'
        ? 1.1 + Math.random() * 0.8
        : 2.4 + Math.random() * 0.8;
    this.active = true;
    this.contactCooldown = 0;

    // Motion feedback is visual only: steering does not change damage or projectile rules.
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = Math.PI / 2;
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

  update(dt, targetX, targetY, width, height) {
    const previousX = this.x;
    const previousY = this.y;
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.phase += dt * (this.type === 'sentinel' ? 1.4 : this.type === 'interceptor' ? 3.2 : 2);

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 18 : this.type === 'interceptor' ? 5 : 9);
    let shot = null;

    if (this.type === 'boss') {
      // Bosses advance into the arena, then sweep across a broad horizontal lane.
      // Steering toward a sinusoidal destination avoids the old edge-to-edge velocity oscillation.
      const horizontalRange = Math.max(0, width * 0.32);
      const desiredX = width / 2 + Math.sin(this.phase * 0.8) * horizontalRange;
      const desiredY = Math.max(58, Math.min(targetY - Math.max(90, height * 0.18), height * 0.52));
      this.x += (desiredX - this.x) * Math.min(1, dt * 1.35);
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.1);
      this.x = Math.max(this.radius + 4, Math.min(width - this.radius - 4, this.x));
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = 1.65;
        shot = {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage: 8,
          speed: 165,
          radius: 5,
          color: '#d59bff',
          glowColor: '#a85cff'
        };
      }
    } else if (this.type === 'interceptor') {
      // Interceptors combine pursuit with a smooth side-to-side arc to pressure the pilot.
      const towardX = dx / distance;
      const towardY = dy / distance;
      const weave = Math.sin(this.phase) * this.speed * 0.62;
      this.x += towardX * this.speed * 0.78 * dt - towardY * weave * dt;
      this.y += towardY * this.speed * 0.78 * dt + towardX * weave * dt;
    } else if (this.type === 'sentinel') {
      // Sentinels strafe around a moving firing lane instead of sliding directly toward the player.
      const laneOffset = Math.sin(this.phase * 0.8) * Math.min(105, width * 0.23);
      const desiredX = Math.max(this.radius, Math.min(width - this.radius, targetX + laneOffset));
      const desiredY = Math.max(42, targetY - Math.min(175, height * 0.3));
      this.x += (desiredX - this.x) * Math.min(1, dt * 1.15);
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.5);
      this.fireCooldown -= dt;

      if (this.fireCooldown <= 0 && this.y > 18) {
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

    // Keep enemies in the arena so reaching an edge never deals automatic damage.
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    this.updateMotionFeedback(dt, previousX, previousY);
    return shot;
  }

  draw(ctx) {
    const boss = this.type === 'boss';
    const ranged = this.type === 'sentinel';
    const interceptor = this.type === 'interceptor';
    const color = boss ? '#d59bff' : ranged ? '#ffbd69' : interceptor ? '#70e7ff' : '#ff718d';
    const edge = boss ? '#f1d7ff' : ranged ? '#fff0cf' : interceptor ? '#e3fbff' : '#ffd5de';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation + Math.PI / 2);
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
    ctx.lineWidth = boss ? 2 : 1.2;
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
    } else if (interceptor) {
      ctx.moveTo(0, -this.radius * 1.45);
      ctx.lineTo(this.radius * 0.52, -this.radius * 0.15);
      ctx.lineTo(this.radius * 1.05, this.radius * 0.55);
      ctx.lineTo(this.radius * 0.2, this.radius * 0.35);
      ctx.lineTo(0, this.radius * 1.15);
      ctx.lineTo(-this.radius * 0.2, this.radius * 0.35);
      ctx.lineTo(-this.radius * 1.05, this.radius * 0.55);
      ctx.lineTo(-this.radius * 0.52, -this.radius * 0.15);
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

    ctx.fillStyle = '#25152f';
    ctx.fillRect(-this.radius * 0.62, -this.radius * 0.1, this.radius * 1.24, this.radius * 0.38);
    ctx.fillStyle = edge;
    ctx.fillRect(-this.radius * 0.2, -this.radius * 0.24, this.radius * 0.4, this.radius * 0.48);
    ctx.fillStyle = boss ? '#fff2ff' : color;
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
    ctx.restore();
  }
}
