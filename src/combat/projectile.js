export class Projectile {
  constructor(x, y, angle = -Math.PI / 2, speedMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.radius = 3;
    this.damage = 1;
    this.speed = 440 * speedMultiplier;
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
    const tint = this.piercing ? '#a68cff' : '#58e4e8';
    ctx.globalAlpha = 0.24; ctx.fillStyle = tint;
    ctx.fillRect(this.piercing ? -3.5 : -3, this.piercing ? -15 : -11, this.piercing ? 7 : 6, this.piercing ? 26 : 18);
    ctx.globalAlpha = 1; ctx.fillStyle = this.piercing ? '#e0d4ff' : '#c4ffff';
    ctx.fillRect(this.piercing ? -2 : -1.5, this.piercing ? -12 : -8, this.piercing ? 4 : 3, this.piercing ? 20 : 12);
    ctx.restore();
  }
}
