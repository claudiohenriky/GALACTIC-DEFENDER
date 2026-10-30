// Modular systems for the first GALACTIC-DEFENDER heavy battleship boss.
// This module keeps weapon, shield and overload state independent from hull health.
// It is intentionally data-driven so later bosses can reuse the same system.

const MODULE_TEMPLATES = [
  { id: 'machine-gun-left', kind: 'machine-gun', region: 'left', x: -0.72, y: -0.08, maxHealth: 34, replacement: 'plasma-turret' },
  { id: 'machine-gun-right', kind: 'machine-gun', region: 'right', x: 0.72, y: -0.08, maxHealth: 34, replacement: 'plasma-turret' },
  { id: 'missile-left', kind: 'missile', region: 'left', x: -0.58, y: 0.42, maxHealth: 38, replacement: 'rocket-pod' },
  { id: 'missile-right', kind: 'missile', region: 'right', x: 0.58, y: 0.42, maxHealth: 38, replacement: 'rocket-pod' },
  { id: 'light-laser-left', kind: 'light-laser', region: 'front', x: -0.32, y: -0.68, maxHealth: 28, replacement: 'light-laser' },
  { id: 'light-laser-right', kind: 'light-laser', region: 'front', x: 0.32, y: -0.68, maxHealth: 28, replacement: 'light-laser' },
  { id: 'plasma-cannon-left', kind: 'plasma-cannon', region: 'left', x: -0.9, y: 0.18, maxHealth: 48, replacement: 'reinforced-plasma' },
  { id: 'plasma-cannon-right', kind: 'plasma-cannon', region: 'right', x: 0.9, y: 0.18, maxHealth: 48, replacement: 'reinforced-plasma' },
  { id: 'main-energy-cannon', kind: 'energy-cannon', region: 'front', x: 0, y: -0.92, maxHealth: 58, replacement: 'overload-cannon' },
  { id: 'auxiliary-system', kind: 'support-system', region: 'core', x: 0, y: 0.48, maxHealth: 42, replacement: 'adaptive-system' }
];

const SHIELD_TEMPLATES = [
  { id: 'front', maxHealth: 110, rechargeDelay: 13 },
  { id: 'left', maxHealth: 82, rechargeDelay: 11 },
  { id: 'right', maxHealth: 82, rechargeDelay: 11 },
  { id: 'rear', maxHealth: 72, rechargeDelay: 9 }
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
      replacementInstalled: false
    }));
    this.shields = SHIELD_TEMPLATES.map((shield) => ({
      ...shield,
      health: shield.maxHealth,
      rechargeTimer: 0,
      disabled: false,
      repairGlow: 0
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

    module.health = Math.max(0, module.health - amount);
    module.repairGlow = 0;
    const ratio = module.health / module.maxHealth;

    if (module.health <= 0) {
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

  damageShield(region, amount) {
    const shield = this.shieldById.get(region) || null;
    if (!shield || amount <= 0 || shield.health <= 0) return { absorbed: 0, remaining: amount };

    const absorbed = Math.min(shield.health, amount);
    shield.health -= absorbed;
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
      }
    }

    // Residual damage and repair visuals must fade even after a replacement returns online.
    for (const module of this.modules) {
      const decay = dt * 0.12;
      if (module.smoke > 0) module.smoke = Math.max(0, module.smoke - decay);
      if (module.fire > 0) module.fire = Math.max(0, module.fire - decay * 0.7);
      if (module.sparks > 0) module.sparks = Math.max(0, module.sparks - decay * 1.4);
      if (module.repairGlow > 0) module.repairGlow = Math.max(0, module.repairGlow - dt * 0.48);
    }
    for (const shield of this.shields) {
      if (shield.repairGlow > 0) shield.repairGlow = Math.max(0, shield.repairGlow - dt * 0.42);
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
      if (module.state === 'destroyed') {
        module.replacementInstalled = true;
        module.kind = module.replacement;
        module.state = 'operational';
        module.health = module.maxHealth * 0.72;
        module.smoke = 0.35;
        module.fire = 0;
        module.sparks = 0.45;
      } else if (module.state === 'disabled' || module.state === 'damaged') {
        module.repairGlow = 1;
        module.health = clamp(module.maxHealth * 0.48, 1, module.maxHealth);
        module.state = 'damaged';
        module.smoke = Math.max(module.smoke, 0.4);
        module.fire = Math.min(module.fire, 0.18);
        module.sparks = Math.max(module.sparks, 0.35);
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
