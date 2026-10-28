export class Enemy {
  constructor(x, y, level = 1) {
    this.x = x; this.y = y; this.radius = 10 + Math.random() * 3;
    this.speed = 55 + Math.random() * 40 + level * 4;
    this.phase = Math.random() * Math.PI * 2;
    this.active = true;
  }
  update(dt, height) { this.y += this.speed * dt; this.phase += dt * 2; this.x += Math.sin(this.phase) * 22 * dt; }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.PI);
    ctx.shadowBlur = 15; ctx.shadowColor = '#ff718d'; ctx.fillStyle = '#ff718d';
    ctx.beginPath(); ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius, 0); ctx.lineTo(5, this.radius); ctx.lineTo(0, this.radius - 3); ctx.lineTo(-5, this.radius); ctx.lineTo(-this.radius, 0); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff0f4'; ctx.fillRect(-2, -2, 4, 4); ctx.restore();
  }
}
