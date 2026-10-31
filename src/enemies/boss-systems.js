// Modular systems for the first GALACTIC-DEFENDER heavy battleship boss.
// This module keeps weapon, shield and overload state independent from hull health.
// It is intentionally data-driven so later bosses can reuse the same system.

const MODULE_TEMPLATES = [
  { id: 'machine-gun-left', kind: 'machine-gun', region: 'left', x: -1.02, y: -0.30, maxHealth: 34, replacement: 'plasma-turret', firingRange: 920, crossSide: true },
  { id: 'machine-gun-right', kind: 'machine-gun', region: 'right', x: 1.02, y: -0.30, maxHealth: 34, replacement: 'plasma-turret', firingRange: 920, crossSide: true },
  { id: 'missile-left', kind: 'missile', region: 'left', x: -1.16, y: 0.82, maxHealth: 38, replacement: 'rocket-pod', firingRange: 980 },
  { id: 'missile-right', kind: 'missile', region: 'right', x: 1.16, y: 0.82, maxHealth: 38, replacement: 'rocket-pod', firingRange: 980 },
  { id: 'light-laser-left', kind: 'light-laser', region: 'front', x: -0.42, y: -1.50, maxHealth: 28, replacement: 'light-laser', firingRange: 620 },
  { id: 'light-laser-right', kind: 'light-laser', region: 'front', x: 0.42, y: -1.50, maxHealth: 28, replacement: 'light-laser', firingRange: 620 },
  { id: 'plasma-cannon-left-forward', kind: 'plasma-cannon', region: 'left', x: -1.34, y: -0.02, maxHealth: 48, replacement: 'reinforced-plasma', firingRange: 500 },
  { id: 'plasma-cannon-left-rear', kind: 'plasma-cannon', region: 'left', x: -1.42, y: 0.52, maxHealth: 48, replacement: 'reinforced-plasma', firingRange: 500 },
  { id: 'plasma-cannon-right-forward', kind: 'plasma-cannon', region: 'right', x: 1.34, y: -0.02, maxHealth: 48, replacement: 'reinforced-plasma', firingRange: 500 },
  { id: 'plasma-cannon-right-rear', kind: 'plasma-cannon', region: 'right', x: 1.42, y: 0.52, maxHealth: 48, replacement: 'reinforced-plasma', firingRange: 500 }, 
  { id: 'main-energy-cannon', kind: 'energy-cannon', region: 'front', x: 0, y: -1.84, maxHealth: 58, replacement: 'overload-cannon', firingRange: 1250, energyState: 'standby', energyChargeDuration: 7.2, energyChargeTimer: 7.2, energyAlignDuration: 1.35, energyAlignTimer: 0, energyWarningDuration: 1.8, energyWarningTimer: 0, energyFireDuration: 0.42, energyFireTimer: 0, energyCooldownDuration: 5.5, energyCooldownTimer: 0, energyAimAngle: 0, energyBeamRange: 1250, energyBeamWidth: 46, energyDamage: 34 },
  { id: 'auxiliary-system', kind: 'support-system', region: 'core', x: 0, y: 1.04, maxHealth: 42, replacement: 'adaptive-system' }
];

const SHIELD_TEMPLATES = [
  { id: 'front', maxHealth: 88, rechargeDelay: 16 },
  { id: 'left', maxHealth: 64, rechargeDelay: 14 },
  { id: 'right', maxHealth: 64, rechargeDelay: 14 },
  { id: 'rear', maxHealth: 54, rechargeDelay: 12 }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getWeaponFamily = (kind = '') => {
  if (kind.includes('plasma')) return 'plasma';
  if (kind.includes('missile') || kind.includes('rocket')) return 'missile';
  if (kind.includes('machine-gun')) return 'machine-gun';
  if (kind.includes('light-laser')) return 'light-laser';
  return null;
};

// Select one readable weapon family per volley. Selection considers live modules,
// target range, the side envelope and whether a plasma mount has actually charged.
export function selectBossAttack(modules, targetDistance, targetLocalX, centerlineTolerance = 8, phase = 1) {
  // Each phase changes the order of weapon families without stacking every
  // attack at once. Phase 3 mixes close-range missile pressure with plasma.
  const priorities = phase >= 3
    ? (targetDistance <= 500
      ? ['missile', 'plasma', 'machine-gun', 'light-laser']
      : ['missile', 'machine-gun', 'light-laser', 'plasma'])
    : phase === 2
      ? (targetDistance <= 500
        ? ['plasma', 'missile', 'machine-gun', 'light-laser']
        : ['missile', 'light-laser', 'machine-gun', 'plasma'])
      : (targetDistance <= 500
        ? ['plasma', 'machine-gun', 'light-laser', 'missile']
        : ['missile', 'machine-gun', 'light-laser', 'plasma']);

  for (const family of priorities) {
    const available = modules.some((module) => {
      if (getWeaponFamily(module.kind) !== family) return false;
      if (module.state === 'destroyed' || module.state === 'disabled' || (module.transitionTimer ?? 0) > 0) return false;
      if (targetDistance > (module.firingRange ?? 700)) return false;
      const sideAllowed = module.region !== 'left' && module.region !== 'right'
        || module.crossSide
        || Math.abs(targetLocalX) <= centerlineTolerance
        || Math.sign(targetLocalX) === Math.sign(module.x);
      if (!sideAllowed) return false;
      return family !== 'plasma' || (module.plasmaChargeTimer ?? 0) <= 0;
    });
    if (available) return family;
  }
  return null;
}

// Missile performance rises slightly by phase, but launch cadence stays deliberate.
export function getBossMissileProfile(phase = 1) {
  if (phase >= 3) return { speed: 225, damage: 15, turnRate: 1.48, cooldown: 4.4 };
  if (phase === 2) return { speed: 205, damage: 13, turnRate: 1.42, cooldown: 4.8 };
  return { speed: 185, damage: 12, turnRate: 1.36, cooldown: 5.2 };
}

// Only one operational launcher may fire in a salvo. When both wings can reach
// the target, alternate sides so a centered player does not receive paired rockets.
export function selectBossMissileLauncher(modules, targetDistance, targetLocalX, centerlineTolerance = 8, preferredSide = -1) {
  const candidates = modules.filter((module) => {
    if (!module.kind.includes('missile') && !module.kind.includes('rocket')) return false;
    if (module.state !== 'operational' && module.state !== 'damaged') return false;
    if ((module.transitionTimer ?? 0) > 0 || targetDistance > (module.firingRange ?? 700)) return false;
    return module.region !== 'left' && module.region !== 'right'
      || module.crossSide
      || Math.abs(targetLocalX) <= centerlineTolerance
      || Math.sign(targetLocalX) === Math.sign(module.x);
  });
  return candidates.find((module) => Math.sign(module.x) === preferredSide) ?? candidates[0] ?? null;
}

// World-space line from the DREADNOUGHT's open bow aperture. The same geometry
// drives both the warning renderer and collision, preventing visual/hitbox drift.
export function getBossBeamSegment(boss, module) {
  const angle = module.energyAimAngle ?? boss.facingRotation;
  const range = module.energyBeamRange ?? module.firingRange ?? 1250;
  const apertureOffset = boss.radius * 1.82;
  const startX = boss.x + Math.cos(angle) * apertureOffset;
  const startY = boss.y + Math.sin(angle) * apertureOffset;
  return {
    startX, startY,
    endX: startX + Math.cos(angle) * range,
    endY: startY + Math.sin(angle) * range,
    angle,
    range,
    width: module.energyBeamWidth ?? 46
  };
}

// Exact muzzle-to-trajectory geometry for plasma warning and shot readability.
export function getBossPlasmaSegment(boss, module) {
  const hullRotation = boss.facingRotation + Math.PI / 2;
  const localX = module.x * boss.radius;
  const localY = (module.y - 0.16) * boss.radius;
  const cosHull = Math.cos(hullRotation);
  const sinHull = Math.sin(hullRotation);
  const startX = boss.x + localX * cosHull - localY * sinHull;
  const startY = boss.y + localX * sinHull + localY * cosHull;
  const angle = boss.facingRotation + (module.turretAngle ?? 0);
  const range = 520;
  return { startX, startY, endX: startX + Math.cos(angle) * range,
    endY: startY + Math.sin(angle) * range, angle, range, width: 42 };
}

// A plasma telegraph is shown only when the weapon is near-ready, can reach
// the pilot, and its wing is allowed to engage that side.
export function isBossPlasmaTelegraphActive(boss, module, targetX, targetY) {
  if (!boss || !module || !module.kind.includes('plasma')) return false;
  if (boss.bossEntranceTimer > 0 || boss.bossPhaseTransition > 0 || boss.fireCooldown <= 0) return false;
  if (module.state === 'destroyed' || module.state === 'disabled' || (module.transitionTimer ?? 0) > 0) return false;
  const charge = module.plasmaChargeTimer ?? 0;
  const warningWindow = module.plasmaWarningDuration ?? 1.5;
  if (charge > warningWindow || charge > boss.fireCooldown) return false;
  const segment = getBossPlasmaSegment(boss, module);
  const dx = targetX - segment.startX, dy = targetY - segment.startY;
  if (dx * dx + dy * dy > (module.firingRange ?? 500) ** 2) return false;
  const hullRotation = boss.facingRotation + Math.PI / 2;
  const targetLocalX = dx * Math.cos(hullRotation) + dy * Math.sin(hullRotation);
  return Math.abs(targetLocalX) <= boss.radius * 0.08 || Math.sign(targetLocalX) === Math.sign(module.x);
}

export class BossSystems {
  constructor() {
    this.modules = MODULE_TEMPLATES.map((module) => ({
      ...module,
      health: module.maxHealth,
      state: 'operational',
      smoke: 0,
      fire: 0,
      sparks: 0,
      repairGlow: 0,
      replacementInstalled: false,
      transitionTimer: 0,
      transitionType: '',
      catastrophic: false,
      originalKind: module.kind,
      turretAngle: 0,
      plasmaChargeDuration: 5.4,
      plasmaWarningDuration: 1.5,
      plasmaChargeTimer: module.kind.includes('plasma') ? 5.4 : 0
    }));
    this.shields = SHIELD_TEMPLATES.map((shield) => ({
      ...shield,
      health: shield.maxHealth,
      rechargeTimer: 0,
      disabled: false,
      repairGlow: 0,
      impactFlash: 0,
      impactStrength: 0
    }));
    // The auxiliary generator is stable for this boss lifetime; cache its reference
    // instead of searching the module array on every simulation frame.
    this.moduleById = new Map(this.modules.map((module) => [module.id, module]));
    this.shieldById = new Map(this.shields.map((shield) => [shield.id, shield]));
    this.shieldGenerator = this.moduleById.get('auxiliary-system') || null;
    this.overloadUsed = false;
    this.rebuildTimer = 0;
    this.rebuildComplete = false;
  }

  getModule(moduleId) {
    return this.moduleById.get(moduleId) || null;
  }

  damageModule(moduleId, amount) {
    const module = this.getModule(moduleId);
    if (!module || module.state === 'destroyed' || amount <= 0) return null;

    const previousHealth = module.health;
    module.health = Math.max(0, module.health - amount);
    module.repairGlow = 0;
    const ratio = module.health / module.maxHealth;

    if (module.health <= 0) {
      const overkill = Math.max(0, amount - previousHealth);
      module.catastrophic = overkill >= module.maxHealth * 0.45;
      module.state = 'destroyed';
      module.smoke = Math.max(module.smoke, 1);
      module.fire = Math.max(module.fire, 1);
      module.sparks = Math.max(module.sparks, 1);
    } else if (ratio <= 0.25) {
      module.state = 'disabled';
      module.smoke = Math.max(module.smoke, 0.8);
      module.fire = Math.max(module.fire, 0.45);
      module.sparks = Math.max(module.sparks, 0.9);
    } else if (ratio <= 0.65) {
      module.state = 'damaged';
      module.smoke = Math.max(module.smoke, 0.45);
      module.fire = Math.max(module.fire, 0.2);
      module.sparks = Math.max(module.sparks, 0.55);
    }

    return module;
  }

  damageShield(region, amount, moduleBypassRatio = 0) {
    const shield = this.shieldById.get(region) || null;
    if (!shield || amount <= 0 || shield.health <= 0) return { absorbed: 0, remaining: amount };

    // Precise hits on exposed weapon hardpoints can transfer part of their energy through the regional barrier.
    const bypassRatio = clamp(moduleBypassRatio, 0, 0.65);
    const shieldDamage = amount * (1 - bypassRatio);
    const absorbed = Math.min(shield.health, shieldDamage);
    shield.health -= absorbed;
    if (absorbed > 0) {
      shield.impactFlash = 0.46;
      shield.impactStrength = Math.min(1, Math.max(shield.impactStrength, absorbed / Math.max(1, shield.maxHealth * 0.16)));
    }
    const remaining = amount - absorbed;

    if (shield.health <= 0) {
      shield.health = 0;
      shield.disabled = true;
      shield.rechargeTimer = shield.rechargeDelay;
    }

    return { absorbed, remaining };
  }

  update(dt) {
    const shieldGenerator = this.shieldGenerator;
    const canRechargeShields = shieldGenerator &&
      shieldGenerator.state !== 'destroyed' && shieldGenerator.state !== 'disabled';
    for (const shield of this.shields) {
      if (!canRechargeShields) continue;
      if (shield.health > 0 || !shield.disabled) continue;
      shield.rechargeTimer = Math.max(0, shield.rechargeTimer - dt);
      if (shield.rechargeTimer === 0) {
        shield.health = shield.maxHealth * 0.55;
        shield.disabled = false;
        shield.repairGlow = 0.65;
      }
    }

    // Residual damage and repair visuals must fade even after a replacement returns online.
    for (const module of this.modules) {
      const decay = dt * 0.12;
      if (module.smoke > 0) module.smoke = Math.max(0, module.smoke - decay);
      if (module.fire > 0) module.fire = Math.max(0, module.fire - decay * 0.7);
      if (module.sparks > 0) module.sparks = Math.max(0, module.sparks - decay * 1.4);
      if (module.repairGlow > 0) module.repairGlow = Math.max(0, module.repairGlow - dt * 0.48);
      if (module.transitionTimer > 0) {
        module.transitionTimer = Math.max(0, module.transitionTimer - dt);
        if (module.transitionTimer === 0) {
          // Transition metadata is temporary presentation state; clear it once
          // the physical repair/rebuild/replacement animation has fully completed.
          module.transitionType = '';
          module.transitionFromKind = '';
        }
      }
    }
    for (const shield of this.shields) {
      if (shield.repairGlow > 0) shield.repairGlow = Math.max(0, shield.repairGlow - dt * 0.42);
      if (shield.impactFlash > 0) {
        shield.impactFlash = Math.max(0, shield.impactFlash - dt);
        if (shield.impactFlash === 0) shield.impactStrength = 0;
      }
    }

    if (this.rebuildTimer > 0) {
      this.rebuildTimer = Math.max(0, this.rebuildTimer - dt);
      if (this.rebuildTimer === 0) this.rebuildComplete = true;
    }
  }

  beginOverloadRebuild() {
    if (this.overloadUsed) return false;
    this.overloadUsed = true;
    this.rebuildTimer = 4.5;
    this.rebuildComplete = false;

    for (const module of this.modules) {
      if (module.state === 'destroyed' && module.catastrophic) {
        // Irrecoverable mounts are withdrawn and replaced by a different weapon family.
        module.replacementInstalled = true;
        module.transitionType = 'replacement';
        module.transitionTimer = 2.2;
        module.transitionFromKind = module.kind;
        module.kind = module.replacement;
        // Newly installed plasma mounts must complete a visible charge cycle before firing.
        module.plasmaChargeTimer = module.kind.includes('plasma') ? module.plasmaChargeDuration : 0;
        module.repairGlow = 1;
        module.state = 'damaged';
        module.health = module.maxHealth * 0.58;
        module.smoke = 0.5;
        module.fire = 0;
        module.sparks = 0.55;
        module.catastrophic = false;
      } else if (module.state === 'destroyed') {
        // Recoverable wreckage keeps its original weapon identity and is rebuilt in place.
        module.transitionType = 'rebuild';
        module.transitionTimer = 1.8;
        module.repairGlow = 1;
        module.kind = module.originalKind;
        // Rebuilt plasma mounts restart their charge cycle instead of firing immediately.
        module.plasmaChargeTimer = module.kind.includes('plasma') ? module.plasmaChargeDuration : 0;
        module.state = 'damaged';
        module.health = module.maxHealth * 0.5;
        module.smoke = 0.45;
        module.fire = 0;
        module.sparks = 0.5;
      } else if (module.state === 'disabled' || module.state === 'damaged') {
        module.transitionType = 'repair';
        module.transitionTimer = 1.35;
        module.repairGlow = 1;
        module.health = clamp(module.maxHealth * 0.55, 1, module.maxHealth);
        module.state = 'damaged';
        module.smoke = Math.max(module.smoke, 0.35);
        module.fire = Math.min(module.fire, 0.15);
        module.sparks = Math.max(module.sparks, 0.3);
      }
    }

    for (const shield of this.shields) {
      shield.repairGlow = 1;
      shield.health = Math.min(shield.maxHealth * 0.4, Math.max(shield.health, shield.maxHealth * 0.2));
      shield.disabled = shield.health <= 0;
      shield.rechargeTimer = shield.disabled ? 5 : 0;
    }

    return true;
  }

  getOperationalModules() {
    return this.modules.filter((module) => module.state === 'operational' || module.state === 'damaged');
  }
}
