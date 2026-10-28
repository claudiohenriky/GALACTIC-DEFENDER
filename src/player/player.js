export class Player {
  constructor(width = 360, height = 780) {
    this.radius = 13;
    this.speed = 250;
    this.health = 100;
    this.invulnerabilityDuration = 1.25;
    this.invulnerabilityTimer = 0;
    this.flamePhase = 0;
    this.x = width / 2;
    this.y = height * (width > height ? 0.66 : 0.78);
    this.fitToArena(width, height);
  }

  fitToArena(width, height) {
    this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
    this.y = Math.max(this.radius + 5, Math.min(height - this.radius - 5, this.y));
  }

  update(dt, keys, width, height) {
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    this.flamePhase += dt;

    let dx = 0, dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;

    // Normalize diagonal movement so it is not faster than horizontal/vertical movement.
    const magnitude = Math.hypot(dx, dy) || 1;
    this.x += (dx / magnitude) * this.speed * dt;
    this.y += (dy / magnitude) * this.speed * dt;
    this.fitToArena(width, height);
  }

  takeDamage(amount) {
    // A hit starts a short invulnerability window; repeated hits during it are ignored.
    if (this.invulnerabilityTimer > 0 || this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    return true;
  }

  draw(ctx, visible = true) {
    if (!visible) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#58e4e8';
    ctx.fillStyle = '#58e4e8';
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(12, 12);
    ctx.lineTo(0, 7);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#eafcff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7c9cff';
    ctx.beginPath();
    ctx.ellipse(0, 14, 3, 6 + Math.sin(this.flamePhase * 18) * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
