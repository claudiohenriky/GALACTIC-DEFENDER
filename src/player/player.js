export class Player {
  constructor(width = 360, height = 780) {
    this.radius = 13;
    this.baseSpeed = 250;
    this.speed = this.baseSpeed;
    this.baseMaxHealth = 100;
    this.maxHealth = this.baseMaxHealth;
    this.health = this.maxHealth;
    this.weaponDamage = 1;
    this.doubleShotLevel = 0;
    this.laserLevel = 0;
    this.shieldLevel = 0;
    this.shieldHealth = 0;
    this.shieldMaxHealth = 0;
    this.shieldRechargeDuration = 7;
    this.shieldRechargeTimer = 0;
    this.invulnerabilityDuration = 1.25;
    // Temporary spawn protection prevents an unavoidable hit while the pilot gets oriented.
    this.invulnerabilityTimer = 3;
    this.flamePhase = 0;
    // The ship points upward by default; rotation is stored as a world-space angle.
    this.rotation = -Math.PI / 2;
    this.x = width / 2;
    this.y = height * (width > height ? 0.66 : 0.78);
    this.fitToArena(width, height);
  }

  fitToArena(width, height) {
    this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
    this.y = Math.max(this.radius + 5, Math.min(height - this.radius - 5, this.y));
  }

  update(dt, keys, width, height, joystick = null, targetAngle = this.rotation, relativeMovement = false) {
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
    if (this.shieldLevel > 0 && this.shieldHealth <= 0) {
      this.shieldRechargeTimer = Math.max(0, this.shieldRechargeTimer - dt);
      if (this.shieldRechargeTimer === 0) this.shieldHealth = this.shieldMaxHealth;
    }
    this.flamePhase += dt;

    // Smoothly rotate toward the active aim direction using the shortest angular path.
    const angleDelta = Math.atan2(
      Math.sin(targetAngle - this.rotation),
      Math.cos(targetAngle - this.rotation)
    );
    this.rotation += angleDelta * Math.min(1, dt * 14);

    let dx = 0, dy = 0;
    if (joystick && Math.hypot(joystick.x, joystick.y) > 0.04) {
      // Mobile joystick movement stays screen-relative so it remains intuitive.
      dx = joystick.x;
      dy = joystick.y;
      const magnitude = Math.hypot(dx, dy);
      if (magnitude > 1) {
        dx /= magnitude;
        dy /= magnitude;
      }
    } else {
      const forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0)
        - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
      const strafe = (keys.has('d') || keys.has('arrowright') ? 1 : 0)
        - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      if (relativeMovement) {
        // W/S move along the ship's facing; A/D strafe without changing aim.
        dx = Math.cos(this.rotation) * forward + Math.cos(this.rotation + Math.PI / 2) * strafe;
        dy = Math.sin(this.rotation) * forward + Math.sin(this.rotation + Math.PI / 2) * strafe;
      } else {
        dx = strafe;
        dy = -forward;
      }
      // Normalize diagonals so they are never faster than straight movement.
      const magnitude = Math.hypot(dx, dy) || 1;
      dx /= magnitude;
      dy /= magnitude;
    }
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;
    this.fitToArena(width, height);
  }

  upgradeShield() {
    this.shieldLevel = Math.min(3, this.shieldLevel + 1);
    this.shieldMaxHealth = 2 + this.shieldLevel;
    this.shieldHealth = this.shieldMaxHealth;
    this.shieldRechargeTimer = 0;
  }

  takeDamage(amount) {
    if (this.shieldHealth > 0 && this.health > 0) {
      this.shieldHealth = Math.max(0, this.shieldHealth - 1);
      if (this.shieldHealth === 0) this.shieldRechargeTimer = this.shieldRechargeDuration;
      return false;
    }
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
    ctx.rotate(this.rotation + Math.PI / 2);
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
