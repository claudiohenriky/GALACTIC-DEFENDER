export class Enemy {
  constructor(x, y, level = 1, type = 'chaser') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.radius = type === 'sentinel' ? 12 : 10 + Math.random() * 3;
    this.speed = (type === 'sentinel' ? 42 : 48 + Math.random() * 24) + Math.min(level, 8) * 2;
    this.phase = Math.random() * Math.PI * 2;
    this.fireCooldown = type === 'sentinel'
      ? 1.1 + Math.random() * 0.8
      : 3.8 + Math.random() * 1.8;
    this.active = true;
  }

  update(dt, targetX, targetY, width, height) {
    this.phase += dt * (this.type === 'sentinel' ? 1.4 : 2);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    const drift = Math.sin(this.phase) * (this.type === 'sentinel' ? 18 : 9);

    if (this.type === 'sentinel') {
      // Ranged enemies try to keep a firing lane above the ship instead of rushing it.
      const desiredY = Math.max(42, targetY - Math.min(175, height * 0.3));
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (desiredY - this.y) * Math.min(1, dt * 1.5);
      this.fireCooldown -= dt;

      if (this.fireCooldown <= 0 && this.y > 18) {
        this.fireCooldown = 2.2;
        return {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage: 10,
          speed: 190,
          radius: 4,
          color: '#ffe0a8',
          glowColor: '#ffad55'
        };
      }
    } else {
      // Chasers pursue the ship directly with a small lateral drift.
      this.x += (dx / distance) * this.speed * dt + drift * dt;
      this.y += (dy / distance) * this.speed * dt;

      // Chasers only gain a weak ranged attack from wave 3 onward.
      this.fireCooldown -= dt;
      if (this.level >= 3 && distance > 90 && this.fireCooldown <= 0) {
        this.fireCooldown = 4.2 + Math.random() * 1.6;
        const damage = this.radius >= 12 ? 5 : this.radius >= 11 ? 4 : 3;
        return {
          x: this.x,
          y: this.y + this.radius,
          targetX,
          targetY,
          damage,
          speed: 135,
          radius: 3,
          color: '#ff9ab0',
          glowColor: '#ff718d'
        };
      }
    }

    // Keep enemies in the arena so reaching an edge never deals automatic damage.
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    return null;
  }

  draw(ctx) {
    const ranged = this.type === 'sentinel';
    const color = ranged ? '#ffbd69' : '#ff718d';
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI);
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ranged) {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, -3);
      ctx.lineTo(this.radius * 0.65, this.radius);
      ctx.lineTo(-this.radius * 0.65, this.radius);
      ctx.lineTo(-this.radius, -3);
    } else {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(5, this.radius);
      ctx.lineTo(0, this.radius - 3);
      ctx.lineTo(-5, this.radius);
      ctx.lineTo(-this.radius, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff0f4';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}
