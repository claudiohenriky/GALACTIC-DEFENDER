export class EnemyProjectile {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.speed = 190;
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
    ctx.shadowColor = '#ffad55';
    ctx.fillStyle = '#ffe0a8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
