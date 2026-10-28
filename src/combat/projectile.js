export class Projectile {
  constructor(x, y) { this.x = x; this.y = y; this.radius = 3; this.speed = 440; this.active = true; }
  update(dt) { this.y -= this.speed * dt; }
  draw(ctx) { ctx.save(); ctx.shadowBlur = 5; ctx.shadowColor = '#58e4e8'; ctx.fillStyle = '#c4ffff'; ctx.fillRect(this.x - 1.5, this.y - 8, 3, 12); ctx.restore(); }
}
