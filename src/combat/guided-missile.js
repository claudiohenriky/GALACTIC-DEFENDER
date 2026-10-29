export class GuidedMissile {
  constructor(x, y, target, level = 1, initialAngle = -Math.PI / 2, formationSide = 0) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.level = level;
    this.formationSide = formationSide;
    this.radius = 6.5;
    this.angle = target && target.active ? Math.atan2(target.y - y, target.x - x) : initialAngle;
    this.speed = 235 + level * 18;
    this.turnRate = 3.5 + level * 0.3;
    this.damage = 16 + level * 5;
    this.blastRadius = 70 + level * 12;
    this.life = 6;
    this.active = true;
    this.trail = [];
    this.trailTimer = 0;
  }

  update(dt, enemies, width, height, missiles = []) {
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    if (!this.target || !this.target.active) {
      let nearest = null;
      let nearestDistance = Infinity;
      let fallback = null;
      let fallbackDistance = Infinity;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = dx * dx + dy * dy;
        if (distance < fallbackDistance) {
          fallbackDistance = distance;
          fallback = enemy;
        }
        let reserved = false;
        for (const other of missiles) {
          if (other !== this && other.active && other.target === enemy) {
            reserved = true;
            break;
          }
        }
        if (!reserved && distance < nearestDistance) {
          nearestDistance = distance;
          nearest = enemy;
        }
      }
      this.target = nearest || fallback;
    }

    if (this.target && this.target.active) {
      const otherMissiles = missiles;
      const targetDx = this.target.x - this.x;
      const targetDy = this.target.y - this.y;
      const targetDistance = Math.hypot(targetDx, targetDy) || 1;
      let steerX = targetDx / targetDistance;
      let steerY = targetDy / targetDistance;

      // Repulsion only activates when the missiles get close, preventing them from visually merging.
      const separationRadius = 30;
      for (const other of otherMissiles) {
        if (other === this || !other.active) continue;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= 0.001 || distance >= separationRadius) continue;
        const strength = 1.5 * (1 - distance / separationRadius);
        steerX += (dx / distance) * strength;
        steerY += (dy / distance) * strength;
      }

      const desired = Math.atan2(steerY, steerX);
      const delta = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
      const maxTurn = this.turnRate * dt;
      this.angle += Math.max(-maxTurn, Math.min(maxTurn, delta));
    }

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Keep a short, lightweight trail so both flight paths remain readable on mobile.
    this.trailTimer += dt;
    if (this.trailTimer >= 0.055) {
      this.trailTimer %= 0.055;
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 4) this.trail.shift();
    }

    if (this.x < -24 || this.x > width + 24 || this.y < -24 || this.y > height + 24) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (this.trail.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.strokeStyle = this.formationSide < 0 ? '#ff9b4a' : '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let index = 1; index < this.trail.length; index += 1) {
        ctx.lineTo(this.trail[index].x, this.trail[index].y);
      }
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#ffb45e';
    ctx.strokeStyle = '#fff0c8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff8a3d';
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(3, -5.5);
    ctx.lineTo(-7, -4.5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-7, 4.5);
    ctx.lineTo(3, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff744d';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-13, -3.5);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-13, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
