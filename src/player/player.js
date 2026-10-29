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
    this.thrust = 0;
    this.lateralThrust = 0;
    this.bank = 0;
    this.shipClass = 'vanguard';
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
    let inputStrength = 0;
    if (joystick && Math.hypot(joystick.x, joystick.y) > 0.04) {
      // Keep analog strength for the propulsion animation before normalizing movement.
      dx = joystick.x;
      dy = joystick.y;
      const magnitude = Math.hypot(dx, dy);
      inputStrength = Math.min(1, magnitude);
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
      inputStrength = Math.hypot(dx, dy) > 0 ? 1 : 0;
      // Normalize diagonals so they are never faster than straight movement.
      const magnitude = Math.hypot(dx, dy) || 1;
      dx /= magnitude;
      dy /= magnitude;
    }
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    // Movement feedback is purely visual: propulsion grows under input and settles smoothly at rest.
    this.thrust += (inputStrength - this.thrust) * Math.min(1, dt * 8);
    const lateralTarget = Math.min(1, Math.abs(dx));
    this.lateralThrust += (lateralTarget - this.lateralThrust) * Math.min(1, dt * 9);

    // Hull banking remains a low-cost pseudo-3D cue and does not affect movement physics.
    const targetBank = Math.max(-0.42, Math.min(0.42, dx * -0.42));
    this.bank += (targetBank - this.bank) * Math.min(1, dt * 7.5);
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
    const phantom = this.shipClass === 'phantom', aegis = this.shipClass === 'aegis';
    const hull = phantom ? '#a78bfa' : aegis ? '#f5b85d' : '#58e4e8';
    const edge = phantom ? '#f0eaff' : aegis ? '#fff0c9' : '#d9ffff';
    const wing = phantom ? '#ff77b7' : aegis ? '#ff718d' : '#7c9cff';
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation + Math.PI / 2);
    ctx.transform(1 - Math.abs(this.bank) * 0.08, 0, this.bank * 0.32, 1, 0, 0);
    ctx.fillStyle = '#030814'; ctx.beginPath(); ctx.ellipse(0, 4, aegis ? 16 : 14, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hull; ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.beginPath();
    if (phantom) { ctx.moveTo(0,-20);ctx.lineTo(6,-5);ctx.lineTo(17,8);ctx.lineTo(9,9);ctx.lineTo(4,5);ctx.lineTo(0,15);ctx.lineTo(-4,5);ctx.lineTo(-9,9);ctx.lineTo(-17,8);ctx.lineTo(-6,-5); }
    else if (aegis) { ctx.moveTo(0,-18);ctx.lineTo(10,-9);ctx.lineTo(17,3);ctx.lineTo(13,12);ctx.lineTo(5,10);ctx.lineTo(0,16);ctx.lineTo(-5,10);ctx.lineTo(-13,12);ctx.lineTo(-17,3);ctx.lineTo(-10,-9); }
    else { ctx.moveTo(0,-22);ctx.lineTo(7,-8);ctx.lineTo(16,7);ctx.lineTo(11,11);ctx.lineTo(4,7);ctx.lineTo(0,15);ctx.lineTo(-4,7);ctx.lineTo(-11,11);ctx.lineTo(-16,7);ctx.lineTo(-7,-8); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = wing; ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(-13,7);ctx.lineTo(-9,8);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(5,-4);ctx.lineTo(13,7);ctx.lineTo(9,8);ctx.lineTo(3,3);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f4ffff';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(4,2);ctx.lineTo(0,7);ctx.lineTo(-4,2);ctx.closePath();ctx.fill();
    ctx.fillStyle='#142e48';ctx.fillRect(-2,-3,4,9);ctx.fillStyle=edge;ctx.fillRect(-1,-2,2,6);
    const flame = 4 + Math.sin(this.flamePhase * 18) * 0.8 + this.thrust * 8;
    ctx.globalAlpha = 0.18 + this.thrust * 0.22;
    ctx.fillStyle = wing;
    ctx.beginPath(); ctx.ellipse(0, 14 + flame * 0.35, 2.5 + this.thrust * 1.6, 3 + flame * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(-3, 11); ctx.lineTo(0, 11 + flame); ctx.lineTo(3, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff2b5'; ctx.beginPath(); ctx.moveTo(-1, 11); ctx.lineTo(0, 11 + flame * 0.55); ctx.lineTo(1, 11); ctx.closePath(); ctx.fill();
    if (this.lateralThrust > 0.08) {
      ctx.globalAlpha = this.lateralThrust * 0.42;
      ctx.fillStyle = wing;
      ctx.beginPath(); ctx.ellipse(-11, 5, 1.5 + this.lateralThrust, 3 + this.lateralThrust * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, 5, 1.5 + this.lateralThrust, 3 + this.lateralThrust * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
