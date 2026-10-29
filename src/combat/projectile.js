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
    this.piercing = false;
    this.hitEnemies = new Set();
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
    ctx.shadowBlur = this.piercing ? 9 : 5;
    ctx.shadowColor = this.piercing ? '#a68cff' : '#58e4e8';
    ctx.fillStyle = this.piercing ? '#e0d4ff' : '#c4ffff';
    ctx.fillRect(this.piercing ? -2 : -1.5, this.piercing ? -12 : -8, this.piercing ? 4 : 3, this.piercing ? 20 : 12);
    ctx.restore();
  }
}
