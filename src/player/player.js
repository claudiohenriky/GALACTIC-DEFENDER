export class Player {
  constructor(width = 360, height = 780) {
    this.radius = 13;
    this.speed = 250;
    this.health = 100;
    this.x = width / 2;
    this.y = height * 0.78;
    this.fitToArena(width, height);
  }

  fitToArena(width, height) {
    this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
    this.y = Math.max(this.radius + 5, Math.min(height - this.radius - 5, this.y));
  }

  update(dt, keys, width, height) {
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

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 22;
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
    ctx.ellipse(0, 14, 3, 6 + Math.random() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
