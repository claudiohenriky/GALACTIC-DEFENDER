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
    this.palette = 'standard';
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    // Avoid per-projectile shadowBlur: canvas blur is expensive on mobile GPUs
    // and every active shot would otherwise trigger a separate blur operation.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);
    const wraith = this.palette === 'wraith';
    const width = this.piercing ? 4 : 3;
    const height = this.piercing ? 20 : 12;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = wraith ? '#c43cff' : '#58e4e8';
    ctx.fillRect(-width * 0.9, -height * 0.58, width * 1.8, height * 1.16);
    ctx.globalAlpha = 1;
    ctx.fillStyle = wraith
      ? (this.piercing ? '#f4c7ff' : '#e88cff')
      : (this.piercing ? '#e0d4ff' : '#c4ffff');
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }
}
