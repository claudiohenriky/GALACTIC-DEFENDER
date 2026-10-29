export class GuidedMissile {
  constructor(x, y, target, level = 1) {
    this.x = x; this.y = y; this.target = target; this.level = level;
    this.radius = 6.5;
    this.angle = Math.atan2(target.y - y, target.x - x);
    this.speed = 235 + level * 18;
    this.turnRate = 3.5 + level * 0.3;
    this.damage = 16 + level * 5;
    this.blastRadius = 70 + level * 12;
    this.life = 6; this.active = true;
  }
  update(dt, enemies, width, height) {
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return; }
    if (!this.target || !this.target.active) {
      let nearest = null; let nearestDistance = Infinity;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.x, dy = enemy.y - this.y;
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
    ctx.fillStyle = '#ffb45e'; ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 1.3;
    ctx.shadowColor = '#ff8a3d'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(3, -5.5); ctx.lineTo(-7, -4.5); ctx.lineTo(-4, 0); ctx.lineTo(-7, 4.5); ctx.lineTo(3, 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ff744d';
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-13, -3.5); ctx.lineTo(-10, 0); ctx.lineTo(-13, 3.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
