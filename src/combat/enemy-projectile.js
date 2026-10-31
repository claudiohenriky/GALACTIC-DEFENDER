export class EnemyProjectile {
  constructor(x, y, targetX, targetY, options = {}) {
    this.x = x;
    this.y = y;
    this.radius = options.radius ?? 4;
    this.speed = options.speed ?? 190;
    this.damage = options.damage ?? 10;
    this.plasmaImpact = Boolean(options.plasmaImpact);
    this.heavyImpact = Boolean(options.heavyImpact);
    this.siegeImpact = Boolean(options.siegeImpact);
    this.color = options.color ?? '#ffe0a8';
    this.glowColor = options.glowColor ?? '#ffad55';
    this.homing = Boolean(options.homing && options.target);
    this.target = this.homing ? options.target : null;
    this.turnRate = options.turnRate ?? 1.8;
    this.guidedStyle = Boolean(options.guidedStyle);
    this.life = options.lifetime ?? Infinity;
    this.age = 0;
    this.curveAmplitude = options.curveAmplitude ?? 0;
    this.curveFrequency = options.curveFrequency ?? 0;
    this.active = true;

    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.hypot(dx, dy) || 1;
    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;
  }

  update(dt) {
    this.age += dt;
    if (Number.isFinite(this.life)) {
      this.life -= dt;
      if (this.life <= 0) {
        this.active = false;
        this.target = null;
        return;
      }
    }
    if (this.homing && this.target) {
      const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x)
        + Math.sin(this.age * this.curveFrequency) * this.curveAmplitude;
      const current = Math.atan2(this.vy, this.vx);
      const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
      const angle = current + Math.max(-this.turnRate * dt, Math.min(this.turnRate * dt, delta));
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx, effectsScale = 1) {
    ctx.save();
    const reducedEffects = effectsScale < 0.75;
    const heavyVisual = this.plasmaImpact || this.siegeImpact;
    if (this.guidedStyle) {
      const angle = Math.atan2(this.vy, this.vx);
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.globalAlpha = reducedEffects ? 0.18 : 0.30;
      ctx.strokeStyle = this.glowColor;
      ctx.lineWidth = this.radius * 1.15;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-this.radius * 3.8, 0);
      ctx.lineTo(-this.radius * 0.55, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.radius * 2.1, 0);
      ctx.lineTo(-this.radius * 1.2, -this.radius * 0.62);
      ctx.lineTo(-this.radius * 0.65, 0);
      ctx.lineTo(-this.radius * 1.2, this.radius * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this.glowColor;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.7, -this.radius * 0.45);
      ctx.lineTo(-this.radius * 1.65, -this.radius * 1.0);
      ctx.lineTo(-this.radius * 1.35, -this.radius * 0.18);
      ctx.moveTo(-this.radius * 0.7, this.radius * 0.45);
      ctx.lineTo(-this.radius * 1.65, this.radius * 1.0);
      ctx.lineTo(-this.radius * 1.35, this.radius * 0.18);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.globalAlpha = heavyVisual ? (reducedEffects ? 0.16 : 0.32) : 0.2;
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (heavyVisual ? (reducedEffects ? 1.65 : 2.5) : 1.9), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    if (heavyVisual) {
      const angle = Math.atan2(this.vy, this.vx);
      const lengthScale = this.siegeImpact ? 1.95 : 1.55;
      const widthScale = this.siegeImpact ? 0.52 : 0.78;
      ctx.ellipse(this.x, this.y, this.radius * lengthScale, this.radius * widthScale, angle, 0, Math.PI * 2);
      ctx.fill();
      if (!reducedEffects) {
        ctx.fillStyle = this.siegeImpact ? '#fff8e5' : '#fff1d4';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (this.siegeImpact ? 0.34 : 0.48), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
