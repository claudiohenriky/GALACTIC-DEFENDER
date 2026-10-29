export class GuidedMissile {
  constructor(x, y, target, level = 1) {
    this.x = x; this.y = y; this.target = target; this.level = level;
    this.radius = 4;
    this.angle = Math.atan2(target.y - y, target.x - x);
    this.speed = 260 + level * 24;
    this.turnRate = 3.8 + level * 0.35;
    this.damage = 3 + level * 2;
    this.life = 5; this.active = true;
  }
  update(dt, enemies, width, height) {
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return; }
    if (!this.target || !this.target.active) {
      let nearest = null; let nearestDistance = Infinity;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.x; const dy = enemy.y - this.y;
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) { nearestDistance = distance; nearest = enemy; }
      }
      this.target = nearest;
    }
    if (this.target && this.target.active) {
      const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const delta = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
      const maxTurn = this.turnRate * dt;
      this.angle += Math.max(-maxTurn, Math.min(maxTurn, delta));
    }
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    if (this.x < -24 || this.x > width + 24 || this.y < -24 || this.y > height + 24) this.active = false;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    ctx.fillStyle = '#c6a5ff'; ctx.shadowColor = '#9c7bff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -3); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#e7dcff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, 0); ctx.stroke(); ctx.restore();
  }
}
