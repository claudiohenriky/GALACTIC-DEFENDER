export class EnemyProjectile {
  constructor(x, y, targetX, targetY, options = {}) {
    this.x = x;
    this.y = y;
    this.radius = options.radius ?? 4;
    this.speed = options.speed ?? 190;
    this.damage = options.damage ?? 10;
    this.color = options.color ?? '#ffe0a8';
    this.glowColor = options.glowColor ?? '#ffad55';
    this.homing = Boolean(options.homing && options.target);
    this.target = this.homing ? options.target : null;
    this.turnRate = options.turnRate ?? 1.8;
    this.clashResistance = options.clashResistance ?? (this.damage >= 15 ? 3 : this.damage >= 8 ? 2 : 1);
    this.active = true;

    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.hypot(dx, dy) || 1;
    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;
  }

  update(dt) {
    if (this.homing && this.target) {
      const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const current = Math.atan2(this.vy, this.vx);
      const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
      const angle = current + Math.max(-this.turnRate * dt, Math.min(this.turnRate * dt, delta));
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
