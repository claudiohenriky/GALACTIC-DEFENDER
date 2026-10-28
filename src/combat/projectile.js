export class Projectile {
  constructor(x, y, angle = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.radius = 3;
    this.damage = 1;
    this.speed = 440;
    this.angle = angle;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // The projectile's long axis points upward at angle -PI/2 by default.
    ctx.rotate(this.angle + Math.PI / 2);
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#58e4e8';
    ctx.fillStyle = '#c4ffff';
    ctx.fillRect(-1.5, -8, 3, 12);
    ctx.restore();
  }
}
