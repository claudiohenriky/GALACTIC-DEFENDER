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
    // Most shots are non-piercing and never need a per-projectile Set allocation.
    this.hitEnemies = null;
    this.palette = 'standard';
  }

  update(dt, width = Infinity, height = Infinity) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Cull shots before collision resolution; off-arena projectiles cannot hit anything.
    if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
      this.active = false;
    }
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
