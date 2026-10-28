export class EnemyProjectile {
  constructor(x, y, targetX, targetY, options = {}) {
    this.x = x;
    this.y = y;
    this.radius = options.radius ?? 4;
    this.speed = options.speed ?? 190;
    this.damage = options.damage ?? 10;
    this.color = options.color ?? '#ffe0a8';
    this.glowColor = options.glowColor ?? '#ffad55';
    this.active = true;

    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.hypot(dx, dy) || 1;
    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
