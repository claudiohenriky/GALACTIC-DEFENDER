export class Enemy {
  constructor(x, y, level = 1) {
    this.x = x;
    this.y = y;
    this.radius = 10 + Math.random() * 3;
    this.speed = 48 + Math.random() * 24 + Math.min(level, 8) * 2;
    this.phase = Math.random() * Math.PI * 2;
    this.active = true;
  }

  update(dt, targetX, targetY, width, height) {
    this.phase += dt * 2;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;

    // Pursue the ship directly, with a small lateral drift to avoid robotic movement.
    const drift = Math.sin(this.phase) * 9;
    this.x += (dx / distance) * this.speed * dt + drift * dt;
    this.y += (dy / distance) * this.speed * dt;

    // Keep enemies in the arena so escaping past an edge never deals automatic damage.
    this.x = Math.max(-this.radius, Math.min(width + this.radius, this.x));
    this.y = Math.max(-this.radius, Math.min(height + this.radius, this.y));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI);
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff718d';
    ctx.fillStyle = '#ff718d';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(5, this.radius);
    ctx.lineTo(0, this.radius - 3);
    ctx.lineTo(-5, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff0f4';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}
