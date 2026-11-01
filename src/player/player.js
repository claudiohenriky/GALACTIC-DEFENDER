import { approachVelocity, integrateVelocity } from '../movement/motion.js?v=0.45.0-motion-core';

export const SHIP_CLASS_CONFIG = Object.freeze({
  vanguard: Object.freeze({ name: 'Vanguard', speed: 250, acceleration: 2400, maxHealth: 100, label: 'Equilibrada' }),
  phantom: Object.freeze({ name: 'Phantom', speed: 275, acceleration: 2500, maxHealth: 90, label: 'Ágil' }),
  aegis: Object.freeze({ name: 'Aegis', speed: 215, acceleration: 1900, maxHealth: 125, label: 'Blindada' }),
  wraith: Object.freeze({ name: 'Wraith', speed: 285, acceleration: 2750, maxHealth: 105, damageMultiplier: 1.08, label: 'Caça de superioridade' })
});

export const SHIP_APPEARANCE_DEFAULTS = Object.freeze({
  vanguard: Object.freeze({ primary: '#58e4e8', secondary: '#d9ffff', core: '#f4ffff', accent: '#7c9cff', glow: true }),
  phantom: Object.freeze({ primary: '#a78bfa', secondary: '#f0eaff', core: '#ffffff', accent: '#ff77b7', glow: true }),
  aegis: Object.freeze({ primary: '#f5b85d', secondary: '#fff0c9', core: '#fff9e8', accent: '#ff718d', glow: true }),
  wraith: Object.freeze({ primary: '#76279b', secondary: '#e5a0ff', core: '#f04cff', accent: '#b52be8', glow: true })
});
const isHexColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export class Player {
  constructor(width = 360, height = 780) {
    this.radius = 13;
    this.baseSpeed = 250;
    this.speed = this.baseSpeed;
    // Higher acceleration shortens reversals and stopping response without raising top speed.
    this.baseMovementAcceleration = 2400;
    this.movementAcceleration = this.baseMovementAcceleration;
    this.baseMaxHealth = 100;
    this.maxHealth = this.baseMaxHealth;
    this.health = this.maxHealth;
    this.weaponDamage = 1;
    this.permanentFireRateBonus = 0;
    this.permanentShieldBonus = 0;
    this.shieldRechargeMultiplier = 1;
    this.abilityCooldownMultiplier = 1;
    this.xpMultiplier = 1;
    this.missionResearchBonus = 0;
    this.upgradeSpecializations = {
      guidedMissileGuidance: 0, guidedMissilePayload: 0, guidedMissileFragmentation: 0,
      shieldCapacity: 0, shieldRecharge: 0, doubleShotSpread: 0
    };
    this.fireRateLevel = 0;
    this.projectileSpeedLevel = 0;
    this.propulsionControlLevel = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.doubleShotLevel = 0;
    this.guidedMissileLevel = 0;
    this.guidedMissileCooldown = 0;
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
    this.setShipClass('vanguard');
    // The ship points upward by default; rotation is stored as a world-space angle.
    this.rotation = -Math.PI / 2;
    this.overloadSpeedFactor = 1;
    this.phaseDriveTimer = 0;
    this.phantomEvasionTimer = 0;
    this.wraithPredatorTimer = 0;
    this.vanguardSyncTimer = 0;
    this.aegisBastionTimer = 0;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.systemDisruptionTimer = 0;
    this.systemDisruptionDuration = 1.4;
    this.x = width / 2;
    this.y = height * (width > height ? 0.66 : 0.78);
    this.fitToArena(width, height);
  }

  setShipClass(shipClass = 'vanguard') {
    const normalized = Object.hasOwn(SHIP_CLASS_CONFIG, shipClass) ? shipClass : 'vanguard';
    const config = SHIP_CLASS_CONFIG[normalized];
    this.shipClass = normalized;
    this.phaseDriveTimer = 0;
    this.phantomEvasionTimer = 0;
    this.wraithPredatorTimer = 0;
    this.vanguardSyncTimer = 0;
    this.aegisBastionTimer = 0;
    this.shipAppearance = { ...SHIP_APPEARANCE_DEFAULTS[normalized] };
    this.baseSpeed = config.speed;
    this.speed = config.speed;
    this.shipDamageMultiplier = config.damageMultiplier || 1;
    this.baseMovementAcceleration = config.acceleration;
    this.movementAcceleration = config.acceleration;
    this.baseMaxHealth = config.maxHealth;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    return config;
  }

  activatePhaseDrive(duration = 2.2) {
    this.phaseDriveTimer = Math.max(this.phaseDriveTimer, duration);
    return this.phaseDriveTimer;
  }

  getMovementSpeedMultiplier() {
    if (this.shipClass === 'phantom' && this.phantomEvasionTimer > 0) return 1.42;
    return this.phaseDriveTimer > 0 ? 1.22 : 1;
  }

  getWeaponFireRateMultiplier() {
    return this.shipClass === 'wraith' && this.wraithPredatorTimer > 0 ? 1.3 : 1;
  }

  getClassDamageMultiplier() {
    return this.shipClass === 'vanguard' && this.vanguardSyncTimer > 0 ? 1.2 : 1;
  }

  getDamageTakenMultiplier() {
    return this.shipClass === 'aegis' && this.aegisBastionTimer > 0 ? 0.7 : 1;
  }

  setShipAppearance(appearance = {}) {
    const defaults = SHIP_APPEARANCE_DEFAULTS[this.shipClass] || SHIP_APPEARANCE_DEFAULTS.vanguard;
    this.shipAppearance = {
      primary: isHexColor(appearance.primary) ? appearance.primary : defaults.primary,
      secondary: isHexColor(appearance.secondary) ? appearance.secondary : defaults.secondary,
      core: isHexColor(appearance.core) ? appearance.core : defaults.core,
      accent: isHexColor(appearance.accent) ? appearance.accent : defaults.accent,
      glow: typeof appearance.glow === 'boolean' ? appearance.glow : defaults.glow
    };
    return this.shipAppearance;
  }

  fitToArena(width, height) {
    this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
    this.y = Math.max(this.radius + 5, Math.min(height - this.radius - 5, this.y));
  }

  applySystemDisruption(duration = 1.4) {
    this.systemDisruptionDuration = Math.max(this.systemDisruptionDuration, duration);
    this.systemDisruptionTimer = Math.max(this.systemDisruptionTimer, duration);
  }

  update(dt, keys, width, height, joystick = null, targetAngle = this.rotation, relativeMovement = false) {
    this.systemDisruptionTimer = Math.max(0, this.systemDisruptionTimer - dt);
    this.phaseDriveTimer = Math.max(0, this.phaseDriveTimer - dt);
    this.phantomEvasionTimer = Math.max(0, this.phantomEvasionTimer - dt);
    this.wraithPredatorTimer = Math.max(0, this.wraithPredatorTimer - dt);
    this.vanguardSyncTimer = Math.max(0, this.vanguardSyncTimer - dt);
    this.aegisBastionTimer = Math.max(0, this.aegisBastionTimer - dt);
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
    // A heavy impact temporarily reduces propulsion authority, then restores it smoothly.
    const disruptionProgress = this.systemDisruptionDuration > 0
      ? 1 - this.systemDisruptionTimer / this.systemDisruptionDuration : 1;
    const controlRecovery = this.systemDisruptionTimer > 0
      ? 0.38 + 0.62 * Math.max(0, Math.min(1, disruptionProgress)) : 1;
    dx *= controlRecovery;
    dy *= controlRecovery;
    inputStrength *= controlRecovery;
    // Movement velocity ramps up smoothly; the attribute improves acceleration without raising top speed.
    const movementFactor = (this.overloadSpeedFactor ?? 1) * this.getMovementSpeedMultiplier();
    const targetVelocityX = dx * this.speed * movementFactor;
    const targetVelocityY = dy * this.speed * movementFactor;
    const acceleration = this.movementAcceleration * (1 + this.propulsionControlLevel * 0.08);
    approachVelocity(this, targetVelocityX, targetVelocityY, acceleration, dt);
    integrateVelocity(this, dt);
    this.knockbackX *= Math.exp(-7 * dt);
    this.knockbackY *= Math.exp(-7 * dt);
    this.x += this.knockbackX * dt;
    this.y += this.knockbackY * dt;

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
    this.shieldMaxHealth = 2 + this.shieldLevel + (this.permanentShieldBonus || 0) + (this.upgradeSpecializations?.shieldCapacity || 0);
    this.shieldRechargeDuration = Math.max(3.5, 7 * (this.shieldRechargeMultiplier || 1) * (1 - 0.15 * (this.upgradeSpecializations?.shieldRecharge || 0)));
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
    this.health = Math.max(0, this.health - amount * this.getDamageTakenMultiplier());
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    return true;
  }

  draw(ctx, visible = true) {
    if (!visible) return;
    const phantom = this.shipClass === 'phantom', aegis = this.shipClass === 'aegis', wraith = this.shipClass === 'wraith';
    const appearance = this.shipAppearance || SHIP_APPEARANCE_DEFAULTS[this.shipClass] || SHIP_APPEARANCE_DEFAULTS.vanguard;
    const hull = appearance.primary;
    const edge = appearance.secondary;
    const wing = appearance.accent;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation + Math.PI / 2);
    ctx.transform(1 - Math.abs(this.bank) * 0.08, 0, this.bank * 0.32, 1, 0, 0);
    if (phantom && this.phantomEvasionTimer > 0) {
      const pulse = Math.min(1, this.phantomEvasionTimer / 0.22);
      ctx.save();
      ctx.globalAlpha = 0.16 + pulse * 0.2;
      ctx.strokeStyle = wing;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(-7, 7, 18, 26, -0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(7, 7, 18, 26, 0.12, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#030814'; ctx.beginPath(); ctx.ellipse(0, 4, aegis ? 16 : 14, 20, 0, 0, Math.PI * 2); ctx.fill();
    if (wraith && this.phaseDriveTimer > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(0.42, this.phaseDriveTimer * 0.18);
      ctx.strokeStyle = wing; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 1, 25, 31, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    if (wraith && this.wraithPredatorTimer > 0) {
      const pulse = 0.5 + Math.sin((2.5 - this.wraithPredatorTimer) * 17) * 0.5;
      ctx.save(); ctx.globalAlpha = 0.2 + pulse * 0.22;
      ctx.strokeStyle = wing; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(0, 1, 29 + pulse * 2, 36 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (this.shipClass === 'vanguard' && this.vanguardSyncTimer > 0) {
      const pulse = 0.5 + Math.sin((3 - this.vanguardSyncTimer) * 12) * 0.5;
      ctx.save(); ctx.globalAlpha = 0.18 + pulse * 0.16;
      ctx.strokeStyle = '#58e4e8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 1, 24 + pulse * 2, 31 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (aegis && this.aegisBastionTimer > 0) {
      const pulse = 0.5 + Math.sin((3.5 - this.aegisBastionTimer) * 10) * 0.5;
      ctx.save(); ctx.globalAlpha = 0.28 + pulse * 0.2;
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 1, 29 + pulse * 2, 37 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (wraith) {
      // Wraith reference-inspired silhouette: broad swept wings, layered shoulder armor,
      // raised twin engine nacelles and a long luminous central cockpit.
      ctx.fillStyle = '#080610';
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(5, -25);
      ctx.lineTo(13, -18);
      ctx.lineTo(34, -8);
      ctx.lineTo(30, -2);
      ctx.lineTo(18, -4);
      ctx.lineTo(29, 8);
      ctx.lineTo(24, 12);
      ctx.lineTo(11, 8);
      ctx.lineTo(8, 20);
      ctx.lineTo(0, 27);
      ctx.lineTo(-8, 20);
      ctx.lineTo(-11, 8);
      ctx.lineTo(-24, 12);
      ctx.lineTo(-29, 8);
      ctx.lineTo(-18, -4);
      ctx.lineTo(-30, -2);
      ctx.lineTo(-34, -8);
      ctx.lineTo(-13, -18);
      ctx.lineTo(-5, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Main wing armor: two broad swept surfaces with stepped outer tips.
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(10, -17); ctx.lineTo(30, -8);
      ctx.lineTo(17, -6); ctx.lineTo(26, 7); ctx.lineTo(12, 4);
      ctx.lineTo(6, 17); ctx.lineTo(0, 23); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -30); ctx.lineTo(-10, -17); ctx.lineTo(-30, -8);
      ctx.lineTo(-17, -6); ctx.lineTo(-26, 7); ctx.lineTo(-12, 4);
      ctx.lineTo(-6, 17); ctx.lineTo(0, 23); ctx.closePath();
      ctx.fill();

      // Dark inset armor plates give the wings the layered, aggressive profile of the reference.
      ctx.fillStyle = '#100a19';
      ctx.beginPath();
      ctx.moveTo(-9, -15); ctx.lineTo(-29, -8); ctx.lineTo(-17, -5);
      ctx.lineTo(-12, 1); ctx.lineTo(-5, -7); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, -15); ctx.lineTo(29, -8); ctx.lineTo(17, -5);
      ctx.lineTo(12, 1); ctx.lineTo(5, -7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#24132f';
      ctx.beginPath();
      ctx.moveTo(-15, -4); ctx.lineTo(-25, 7); ctx.lineTo(-13, 4); ctx.lineTo(-7, 10); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(15, -4); ctx.lineTo(25, 7); ctx.lineTo(13, 4); ctx.lineTo(7, 10); ctx.closePath(); ctx.fill();

      // Twin dorsal engine nacelles sit high on the rear shoulders, integrated into the hull.
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#090711';
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(side * 7, -11);
        ctx.lineTo(side * 10, -24);
        ctx.lineTo(side * 15, -29);
        ctx.lineTo(side * 19, -26);
        ctx.lineTo(side * 17, -12);
        ctx.lineTo(side * 12, -5);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#291436';
        ctx.beginPath();
        ctx.moveTo(side * 10, -13); ctx.lineTo(side * 12, -23);
        ctx.lineTo(side * 15, -26); ctx.lineTo(side * 15, -13);
        ctx.lineTo(side * 12, -8); ctx.closePath(); ctx.fill();

        ctx.save();
        ctx.shadowColor = wing;
        ctx.shadowBlur = 0;
        ctx.fillStyle = wing;
        ctx.beginPath();
        ctx.moveTo(side * 13, -22); ctx.lineTo(side * 15, -25);
        ctx.lineTo(side * 15, -12); ctx.lineTo(side * 13, -9);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        // Engine vent slots and rear exhaust.
        ctx.strokeStyle = '#d879ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(side * 9, -10); ctx.lineTo(side * 11, -5);
        ctx.moveTo(side * 13, -9); ctx.lineTo(side * 15, -4);
        ctx.stroke();
      }

      // Wing-edge energy rails and inset magenta emitters.
      ctx.save();
      ctx.shadowColor = wing;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = wing;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-31, -8); ctx.lineTo(-19, -5); ctx.lineTo(-10, 3);
      ctx.moveTo(31, -8); ctx.lineTo(19, -5); ctx.lineTo(10, 3);
      ctx.stroke();
      ctx.fillStyle = appearance.core;
      ctx.beginPath();
      ctx.moveTo(-22, -5); ctx.lineTo(-14, -2); ctx.lineTo(-10, 2); ctx.lineTo(-17, 0); ctx.closePath();
      ctx.moveTo(22, -5); ctx.lineTo(14, -2); ctx.lineTo(10, 2); ctx.lineTo(17, 0); ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Layered central spine and bright elongated reactor/canopy.
      ctx.fillStyle = '#171020';
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -33); ctx.lineTo(8, -19); ctx.lineTo(7, 7);
      ctx.lineTo(4, 20); ctx.lineTo(0, 25); ctx.lineTo(-4, 20);
      ctx.lineTo(-7, 7); ctx.lineTo(-8, -19); ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#321642';
      ctx.beginPath();
      ctx.moveTo(0, -29); ctx.lineTo(5, -17); ctx.lineTo(4, 5);
      ctx.lineTo(0, 17); ctx.lineTo(-4, 5); ctx.lineTo(-5, -17); ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.shadowColor = appearance.core;
      ctx.shadowBlur = 0;
      ctx.fillStyle = appearance.core;
      ctx.beginPath();
      ctx.moveTo(0, -25); ctx.lineTo(4, -14); ctx.lineTo(3, -2);
      ctx.lineTo(0, 5); ctx.lineTo(-3, -2); ctx.lineTo(-4, -14); ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Lower armor blades frame the rear core and give the ship a strong tail silhouette.
      ctx.fillStyle = '#0d0915';
      ctx.strokeStyle = edge;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-8, 5); ctx.lineTo(-13, 15); ctx.lineTo(-7, 13); ctx.lineTo(-3, 21); ctx.lineTo(-2, 9); ctx.closePath();
      ctx.moveTo(8, 5); ctx.lineTo(13, 15); ctx.lineTo(7, 13); ctx.lineTo(3, 21); ctx.lineTo(2, 9); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = hull; ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.beginPath();
      if (phantom) { ctx.moveTo(0,-20);ctx.lineTo(6,-5);ctx.lineTo(17,8);ctx.lineTo(9,9);ctx.lineTo(4,5);ctx.lineTo(0,15);ctx.lineTo(-4,5);ctx.lineTo(-9,9);ctx.lineTo(-17,8);ctx.lineTo(-6,-5); }
      else if (aegis) { ctx.moveTo(0,-18);ctx.lineTo(10,-9);ctx.lineTo(17,3);ctx.lineTo(13,12);ctx.lineTo(5,10);ctx.lineTo(0,16);ctx.lineTo(-5,10);ctx.lineTo(-13,12);ctx.lineTo(-17,3);ctx.lineTo(-10,-9); }
      else { ctx.moveTo(0,-22);ctx.lineTo(7,-8);ctx.lineTo(16,7);ctx.lineTo(11,11);ctx.lineTo(4,7);ctx.lineTo(0,15);ctx.lineTo(-4,7);ctx.lineTo(-11,11);ctx.lineTo(-16,7);ctx.lineTo(-7,-8); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = wing; ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(-13,7);ctx.lineTo(-9,8);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(5,-4);ctx.lineTo(13,7);ctx.lineTo(9,8);ctx.lineTo(3,3);ctx.closePath();ctx.fill();
      ctx.save();
      ctx.shadowColor = appearance.core;
      ctx.shadowBlur = appearance.glow ? 8 : 0;
      ctx.fillStyle = appearance.core;
      ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(4,2);ctx.lineTo(0,7);ctx.lineTo(-4,2);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    // Twin missile pods are part of the ship only while the missile ability is ready.
    if (this.guidedMissileLevel > 0 && this.guidedMissileCooldown <= 0) {
      ctx.save();
      ctx.fillStyle = wraith ? '#21132d' : '#24364d';
      ctx.strokeStyle = wraith ? edge : '#ffdca4';
      ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.rect(side * (wraith ? 21 : 17) - 2.5, 1, 5, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = wraith ? wing : '#ffb45e';
        ctx.fillRect(side * (wraith ? 21 : 17) - 1, 3, 2, 4);
        ctx.fillStyle = wraith ? '#21132d' : '#24364d';
      }
      ctx.restore();
    }
    ctx.fillStyle='#142e48';ctx.fillRect(-2,-3,4,9);ctx.fillStyle=edge;ctx.fillRect(-1,-2,2,6);
    const flame = 4 + Math.sin(this.flamePhase * 18) * 0.8 + this.thrust * 8;
    if (wraith) {
      ctx.save();
      ctx.globalAlpha = 0.28 + this.thrust * 0.35;
      ctx.shadowColor = wing; ctx.shadowBlur = 0;
      ctx.fillStyle = wing;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 9 - 2, 12);
        ctx.lineTo(side * 9, 17 + flame * 0.75);
        ctx.lineTo(side * 9 + 2, 12);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
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
