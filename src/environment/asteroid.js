export class Asteroid {
  constructor(x, y, radius, seed = 1) {
    this.x = x; this.y = y; this.radius = radius;
    this.rotation = (seed * 2.399963) % (Math.PI * 2);
    this.spin = ((seed % 5) - 2) * 0.035;
    this.vx = Math.sin(seed * 7.13) * 5;
    this.vy = Math.cos(seed * 4.71) * 4;
    this.health = Math.max(18, Math.round(radius * 1.7));
    this.maxHealth = this.health;
    this.active = true;
    this.hitFlash = 0;
    this.vertices = [];
    const count = 8 + seed % 4;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const variation = 0.78 + (((seed * (i + 3) * 17) % 23) / 100);
      this.vertices.push({ x: Math.cos(angle) * radius * variation, y: Math.sin(angle) * radius * variation });
    }
  }

  update(dt, worldWidth, worldHeight) {
    if (!this.active) return;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.rotation += this.spin * dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    // Asteroids drift slowly and rebound at world boundaries instead of wrapping.
    if (this.x < this.radius || this.x > worldWidth - this.radius) this.vx *= -1;
    if (this.y < this.radius || this.y > worldHeight - this.radius) this.vy *= -1;
    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));
  }

  damage(amount) {
    if (!this.active || amount <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.12;
    if (this.health === 0) this.active = false;
    return !this.active;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
    ctx.fillStyle = this.hitFlash > 0 ? '#9b8790' : '#343b4a';
    ctx.strokeStyle = '#687487'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i += 1) {
      const v = this.vertices[i];
      if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#202938'; ctx.strokeStyle = '#465366'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-this.radius * .18, -this.radius * .12, this.radius * .34, this.radius * .22, -.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(this.radius * .28, this.radius * .25, this.radius * .18, this.radius * .13, .4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
