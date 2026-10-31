import { Player } from '../player/player.js?v=0.45.0-motion-core';
import { selectGuardianProtectionTargets } from '../ai/guardian-protection.js?v=0.50.0-ai-balance';
import { Enemy } from '../enemies/enemy.js?v=0.53.0-stage-6-7';
import { EliteTacticalCoordinator } from '../ai/elite-tactics.js?v=0.45.0-elite-flanking';
import { EnemyTacticalCoordinator } from '../ai/enemy-tactics.js?v=0.45.0-common-reposition';
import { Projectile } from '../combat/projectile.js?v=0.44.0';
import { GuidedMissile } from '../combat/guided-missile.js?v=0.44.0';
import { EnemyProjectile } from '../combat/enemy-projectile.js?v=0.44.0';
import { circlesOverlap, circleOverlapsSegment, orientedEllipseOverlapsCircle } from '../combat/collision.js?v=0.44.0-boss-hull-ellipse';
import { getBossBeamSegment, getBossPlasmaSegment, isBossPlasmaTelegraphActive } from '../enemies/boss-systems.js?v=0.53.0-stage-6-7';
import { Progression } from '../progression/progression.js?v=0.44.0';
import { Mission } from '../missions/missions.js?v=0.44.0';
import { BOSS_TEST_MODE, WaveManager } from './wave-manager.js?v=0.46.1-wave-nine-test-start';
import { updateHud } from '../ui/hud.js?v=0.44.0-cannon-telegraph';
import { gameAudio } from '../audio/game-audio.js?v=0.44.0';
import { AchievementTracker } from '../progression/achievements.js?v=0.44.0';
import { createBossCinematic, advanceBossCinematic, getBossCinematicDialogue, getBossCinematicAlert } from './boss-cinematic.js?v=0.54.0-clean-cinematic';
import { getBossCinematicCameraFrame } from './boss-cinematic-camera.js?v=0.54.0-clean-cinematic';
import { prepareBossForCombatHandoff } from './boss-cinematic-camera.js?v=0.54.0-clean-cinematic';
import { createPilotReactionState, triggerPilotReaction, updatePilotReaction, signalPilotThreat, drawPilotReaction, getPilotReactionPosition } from '../ui/pilot-reactions.js?v=0.53.2-reaction-polish';

const rand = (min, max) => Math.random() * (max - min) + min;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    // The simulation world is larger than the visible canvas; the camera follows the pilot.
    this.arenaScale = 2.4;
    this.cameraMinZoom = 1 / this.arenaScale;
    this.worldWidth = this.width * this.arenaScale;
    this.worldHeight = this.height * this.arenaScale;
    this.cameraX = 0;
    this.cameraY = 0;
    this.player = new Player(this.worldWidth, this.worldHeight);
    this.selectedShip = 'vanguard';
    this.player.shipClass = this.selectedShip;

    this.progression = new Progression();
    this.achievements = new AchievementTracker();
    this.mission = new Mission();
    this.waveManager = new WaveManager();
    this.bossCinematic = null;
    this.bossEncounterDialogue = null;
    this.bossEncounterDialogueTimer = 0;
    this.bossEncounterCount = 0;
    this.testStartWave = null;
    this.enemies = []
    // The visible viewport moves through a larger world; boss zoom remains a separate camera effect.
    this.cameraZoom = 1;
    this.bossEncounterSeen = false;
    this.eliteAlertsShown = new Set();
    this.pilotReaction = createPilotReactionState();
    this.cinematicHudRoot = this.canvas.closest('.game-layout');
    this.cinematicHudElements = Array.from(this.cinematicHudRoot?.querySelectorAll('.side-panel, .arena-status, .arena-footer, .in-game-hud, #boss-hud, #overload-panel, #fps-counter, #level-up-toast, #guided-missile-button, #shield-pulse-button, #continuous-laser-button, #reward-banner, #damage-feedback, #touch-controls, .fullscreen-button, .orientation-hint') ?? []);
    this.guardianAssignmentTimer = 0;
    this.eliteTactics = new EliteTacticalCoordinator();
    this.enemyTactics = new EnemyTacticalCoordinator();
    this.projectiles = [];
    this.guidedMissiles = [];
    this.guidedMissileTargetReservations = new Set();
    this.guidedMissileCooldown = 0;
    this.guidedMissileCooldownMax = 12;
    this.pendingGuidedMissileLaunch = null;
    this.guidedMissileEffects = [];
    this.enemyProjectiles = [];
    this.stars = Array.from({ length: 95 }, () => ({
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
      size: rand(.5, 1.8),
      speed: rand(.012, .06),
      alpha: rand(.2, .9)
    }));
    this.keys = new Set();
    this.joystick = { x: 0, y: 0 };
    // Mouse aim is optional: until a mouse moves over the arena, shots keep their original upward direction.
    this.aim = { x: this.width / 2, y: 0, active: false };
    // Mobile drag sets a manual facing direction whenever no enemy is available.
    this.touchAim = { x: this.width / 2, y: 0, active: false, pointerId: null };
    this.status = 'ready';
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.continuousLaserHeld = false; this.continuousLaserCooldown = 0; this.continuousLaserDamageClock = 0; this.continuousLaserClash = null;
    this.lastTime = 0;
    this.animationId = 0;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.damageImpactPulse = null;
    this.shieldBreakEffects = [];
    this.shieldThreatScanTimer = 0;
    this.shieldThreatArcs = Array.from({ length: 8 }, () => 0);
    this.shieldPulseCooldown = 0;
    this.shieldPulseCooldownMax = 18;
    this.shieldPulseWave = null;
    this.overload = 0;
    this.overloadLockTimer = 0;
    this.overloadMax = 100;
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
    this.pendingUpgradeChoices = [];
    this.hudUpdateInterval = 0.1;
    this.hudUpdateTimer = 0;
    // Profiling is opt-in so normal gameplay pays no per-frame timing cost.
    this.performanceProfileEnabled = new URLSearchParams(window.location.search).get('profile') === '1';
    this.performanceProfileSamples = [];
    this.performanceProfileStartedAt = 0;
    this.performanceProfilePreviousFrameAt = 0;
    this.fpsDisplayEnabled = false;
    this.fpsFrameCount = 0;
    this.fpsSampleStartedAt = 0;
    this.fpsCounterElement = document.querySelector('#fps-counter');
    this.backgroundCanvas = document.createElement('canvas');
    this.bindOverlayElements();
  }

  setFpsDisplayEnabled(enabled) {
    this.fpsDisplayEnabled = Boolean(enabled);
    if (!this.fpsCounterElement) this.fpsCounterElement = document.querySelector('#fps-counter');
    this.fpsCounterElement?.classList.toggle('hidden', !this.fpsDisplayEnabled);
    if (!this.fpsDisplayEnabled && this.fpsCounterElement) this.fpsCounterElement.textContent = 'FPS -- · -- ms';
    this.fpsFrameCount = 0;
    this.fpsSampleStartedAt = 0;
  }

  updateFpsCounter(timestamp) {
    if (!this.fpsDisplayEnabled || !this.fpsCounterElement) return;
    this.fpsFrameCount += 1;
    if (!this.fpsSampleStartedAt) this.fpsSampleStartedAt = timestamp;
    const elapsed = timestamp - this.fpsSampleStartedAt;
    if (elapsed < 500) return;
    const fps = this.fpsFrameCount * 1000 / elapsed;
    const frameMs = elapsed / this.fpsFrameCount;
    this.fpsCounterElement.textContent = `FPS ${Math.round(fps)} · ${frameMs.toFixed(1)} ms`;
    this.fpsFrameCount = 0;
    this.fpsSampleStartedAt = timestamp;
  }

  bindOverlayElements() {
    this.startOverlay = document.querySelector('#start-overlay');
    this.pauseOverlay = document.querySelector('#pause-overlay');
    this.gameoverOverlay = document.querySelector('#gameover-overlay');
  }

  resize() {
    const wasUninitialized = this.width <= 1 || this.height <= 1;
    const previousLandscape = this.width > this.height;
    const rect = this.canvas.getBoundingClientRect();
    const maxRatio = window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2;
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const isLandscape = this.width > this.height;
    this.worldWidth = this.width * this.arenaScale;
    this.worldHeight = this.height * this.arenaScale;
    // The canvas may be measured while its parent menu hides it (1x1 px).
    // Reposition only when the real viewport appears or its orientation changes.
    if ((wasUninitialized || previousLandscape !== isLandscape) && !this.bossCinematic) {
      this.player.y = this.worldHeight * (isLandscape ? 0.66 : 0.78);
      this.player.x = this.worldWidth / 2;
    }
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.pixelRatio = ratio;
    this.cacheBackground();
    if (!this.bossCinematic) {
      this.player.fitToArena(this.worldWidth, this.worldHeight);
      this.updateCamera(0, true);
    }
    this.renderFrame(0);
  }

  cacheBackground() {
    const ratio = this.pixelRatio || 1;
    const canvas = this.backgroundCanvas;
    // Cache only one viewport-sized background; the world is larger, but must not multiply offscreen memory.
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, '#071126');
    bg.addColorStop(1, '#050813');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = '#1a3450';
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'gameover') this.reset();
    this.status = 'running';
    this.hideOverlays();
    this.lastTime = performance.now();
    this.hudUpdateTimer = 0;
    if (this.performanceProfileEnabled) {
      this.performanceProfileSamples = [];
      this.performanceProfilePreviousFrameAt = 0;
    }
    cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame((time) => this.loop(time));
    updateHud(this);
    this.updateGuidedMissileButton();
    this.updateShieldPulseButton();
  }

  resume() {
    if (this.status === 'paused') this.start();
  }

  restart() {
    this.reset();
    this.start();
  }

  reset() {
    // Preserve the best run even when the player returns to the menu before game over.
    if (this.achievements && this.waveManager) {
      this.achievements.recordRun(this.score, this.waveManager.wave);
    }
    this.player = new Player(this.worldWidth, this.worldHeight);
    this.cameraZoom = 1;
    this.bossEncounterSeen = false;
    this.bossCinematic = null;
    this.setCinematicHudOpacity(1, false);
    this.cameraX = 0;
    this.cameraY = 0;
    this.updateCamera(0, true);
    this.player.shipClass = this.selectedShip || 'vanguard';
    this.progression = new Progression();
    this.mission = new Mission();
    this.waveManager.reset();
    if (Number.isInteger(this.testStartWave) && this.testStartWave > 1) this.waveManager.startAtWaveForTesting(this.testStartWave);
    this.bossCinematic = null;
    this.setCinematicHudOpacity(1, false);
    this.bossEncounterDialogue = null;
    this.bossEncounterDialogueTimer = 0;
    this.bossEncounterCount = 0;
    this.enemies = [];
    this.eliteAlertsShown = new Set();
    this.guardianAssignmentTimer = 0;
    this.projectiles = [];
    this.guidedMissiles = [];
    this.guidedMissileTargetReservations.clear();
    this.guidedMissileCooldown = 0;
    this.guidedMissileCooldownMax = 12;
    this.pendingGuidedMissileLaunch = null;
    this.guidedMissileEffects = [];
    this.enemyProjectiles = [];
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.continuousLaserHeld = false; this.continuousLaserCooldown = 0; this.continuousLaserDamageClock = 0; this.continuousLaserClash = null;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.damageImpactPulse = null;
    this.shieldBreakEffects = [];
    this.shieldThreatScanTimer = 0;
    this.shieldThreatArcs.fill(0);
    this.shieldPulseCooldown = 0;
    this.shieldPulseCooldownMax = 18;
    this.shieldPulseWave = null;
    this.overload = 0;
    this.overloadLockTimer = 0;
    this.overloadMax = 100;
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
    this.pendingUpgradeChoices = [];
    this.currentUpgradeOptions = [];
    this.hudUpdateTimer = 0;
    document.querySelector('#upgrade-overlay').classList.add('hidden');
    document.querySelector('#level-up-toast').classList.remove('level-up-active');
    document.querySelector('#damage-feedback').classList.remove('damage-active');
    this.status = 'ready';
    this.clearInput();
    // A new run must not inherit pointer targets or a held touch-drag from the previous run.
    this.aim.active = false;
    this.touchAim.active = false;
    this.touchAim.pointerId = null;
    updateHud(this);
    this.updateShieldPulseButton();
    this.updateGuidedMissileButton();
    this.updateOverloadHud();
    this.renderFrame(0);
  }

  hideOverlays() {
    this.startOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');
  }

  handleKeyDown(event) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }

    const key = this.normalizeKey(event.code, event.key);
    this.keys.add(key);
    if (event.repeat) return;
    if (event.code === 'KeyL' && this.status === 'running') { this.continuousLaserHeld = true; return; }
    if (event.code === 'KeyE' && this.status === 'running') {
      this.activateGuidedMissile();
      return;
    }
    if (event.code === 'KeyQ' && this.status === 'running') {
      this.activateShieldPulse();
      return;
    }

    if (event.code === 'KeyP' && this.status === 'running') {
      this.status = 'paused';
      this.clearInput();
      this.pauseOverlay.classList.remove('hidden');
      cancelAnimationFrame(this.animationId);
    } else if (event.code === 'KeyP' && this.status === 'paused') {
      this.resume();
    }

  }

  handleKeyUp(event) {
    this.keys.delete(this.normalizeKey(event.code, event.key));
    if (event.code === 'KeyL') this.continuousLaserHeld = false;
  }

  normalizeKey(code, key = '') {
    const keyMap = {
      KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
      ArrowUp: 'arrowup', ArrowDown: 'arrowdown',
      ArrowLeft: 'arrowleft', ArrowRight: 'arrowright',
      Space: 'space'
    };
    return keyMap[code] ?? key.toLowerCase();
  }

  restartFeedbackAnimation(element, className) {
    // Cancel any running CSS animation and restart it without forcing a synchronous layout.
    element.classList.remove(className);
    element.getAnimations().forEach((animation) => animation.cancel());
    element.classList.add(className);
  }

  triggerLevelUp(levelsGained) {
    const firstLevel = this.progression.level - levelsGained + 1;
    for (let level = firstLevel; level <= this.progression.level; level += 1) {
      if (level > 1 && level % 5 === 0) this.pendingUpgradeChoices.push({ level, category: 'special' });
      else if (level >= 3 && level % 2 === 1) this.pendingUpgradeChoices.push({ level, category: 'attribute' });
    }
    this.levelUpToastTimer = 1.35;
    const toast = document.querySelector('#level-up-toast');
    toast.textContent = levelsGained > 1 ? `✦ NÍVEIS +${levelsGained}` : '✦ NÍVEL AUMENTADO';
    this.restartFeedbackAnimation(toast, 'level-up-active');
    for (let i = 0; i < 22 && this.levelUpParticles.length < 66; i += 1) {
      const angle = (Math.PI * 2 * i) / 22 + rand(-0.15, 0.15);
      const speed = rand(32, 105);
      const life = rand(0.45, 0.95);
      this.levelUpParticles.push({ x: this.player.x + rand(-7, 7), y: this.player.y + rand(-7, 7), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: rand(2, 4.5) });
    }
    if (this.pendingUpgradeChoices.length > 0 && this.status !== 'upgrade') {
      this.status = 'upgrade';
      cancelAnimationFrame(this.animationId);
      this.renderUpgradeChoice();
    }
  }

  renderUpgradeChoice() {
    const current = this.pendingUpgradeChoices[0];
    if (!current) return;
    const attributes = [
      { type: 'damage', icon: '✦', title: 'Arma reforçada', description: '+10% de dano da arma', category: 'ATRIBUTO' },
      { type: 'speed', icon: '➤', title: 'Propulsão aprimorada', description: '+6% de velocidade', category: 'ATRIBUTO' },
      { type: 'integrity', icon: '⬡', title: 'Estrutura reforçada', description: '+10% de integridade máxima', category: 'ATRIBUTO' },
      { type: 'cadence', icon: '»', title: 'Cadência aprimorada', description: 'Dispara 10% mais rápido · máx. 5 níveis', category: 'ATRIBUTO' },
      { type: 'projectileSpeed', icon: '➶', title: 'Projéteis acelerados', description: '+15% de velocidade dos tiros · máx. 3 níveis', category: 'ATRIBUTO' },
      { type: 'propulsionControl', icon: '⌁', title: 'Controle de propulsão', description: '+8% de aceleração · máx. 3 níveis', category: 'ATRIBUTO' }
    ];
    const specials = [
      { type: 'doubleShot', icon: '✣', title: 'Tiro múltiplo', description: 'Adiciona projéteis laterais', category: 'HABILIDADE ESPECIAL', rarity: 'common', weight: 60 },
      { type: 'continuousLaser', icon: 'ϟ', title: 'Laser Contínuo', description: 'Feixe sustentado para disputar Attack Clash · máx. 3 níveis', category: 'HABILIDADE ESPECIAL', rarity: 'epic', weight: 18 },
      { type: 'laser', icon: 'ϟ', title: 'Tiros Perfurantes de Plasma', description: 'Disparos de plasma atravessam vários inimigos', category: 'HABILIDADE ESPECIAL', rarity: 'rare', weight: 30 },
      { type: 'shield', icon: '◈', title: 'Escudo de energia', description: 'Barreira regenerativa com explosão ao quebrar', category: 'HABILIDADE ESPECIAL', rarity: 'rare', weight: 30 },
      { type: 'repair', icon: '✚', title: 'Reparo de emergência', description: 'Recupera 30% da integridade máxima', category: 'HABILIDADE ESPECIAL', rarity: 'common', weight: 60 },
      { type: 'guidedMissile', icon: '➤', title: 'Míssil teleguiado', description: 'Persegue inimigos ativos · máx. 3 níveis', category: 'HABILIDADE ESPECIAL', rarity: 'epic', weight: 12 }
    ];
    const availableOptions = current.category === 'special'
      ? specials.filter((option) => option.type !== 'guidedMissile' || this.player.guidedMissileLevel < 3)
      : attributes.filter((option) => {
        if (option.type === 'cadence') return this.player.fireRateLevel < 5;
        if (option.type === 'projectileSpeed') return this.player.projectileSpeedLevel < 3;
        if (option.type === 'propulsionControl') return this.player.propulsionControlLevel < 3;
        return true;
      });
    const options = [...availableOptions];
    if (current.category === 'special') {
      // Keep the intended rarity weights after the missile card was confirmed selectable.
      const weightedOptions = [];
      while (options.length && weightedOptions.length < 3) {
        const totalWeight = options.reduce((total, option) => total + option.weight, 0);
        let roll = Math.random() * totalWeight;
        let selectedIndex = options.length - 1;
        for (let index = 0; index < options.length; index += 1) {
          roll -= options[index].weight;
          if (roll <= 0) { selectedIndex = index; break; }
        }
        weightedOptions.push(options.splice(selectedIndex, 1)[0]);
      }
      this.currentUpgradeOptions = weightedOptions;
    } else {
      for (let i = options.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      this.currentUpgradeOptions = options.slice(0, 3);
    }
    const overlay = document.querySelector('#upgrade-overlay');
    overlay.classList.remove('hidden');
    document.querySelector('#upgrade-title').innerHTML = current.category === 'special' ? 'Escolha uma<br><span>habilidade especial.</span>' : 'Escolha uma<br><span>melhoria.</span>';
    document.querySelector('#upgrade-level-label').textContent = `NÍVEL ${current.level} · ${current.category === 'special' ? 'HABILIDADE ESPECIAL' : 'ATRIBUTOS DA NAVE'}`;
    [...overlay.querySelectorAll('[data-upgrade]')].forEach((button, index) => {
      const card = this.currentUpgradeOptions[index];
      button.dataset.upgrade = card.type;
      button.className = 'upgrade-card' + (card.rarity ? ' rarity-' + card.rarity : '');
      button.setAttribute('aria-label', `${card.title}. ${card.description}`);
      const rarityText = { common: 'COMUM', rare: 'RARO', epic: 'ÉPICO', legendary: 'LENDÁRIO' };
      const rarityLabel = card.rarity ? '<span class="upgrade-card-rarity rarity-' + card.rarity + '">' + rarityText[card.rarity] + '</span>' : '';
      button.innerHTML = '<span class="upgrade-card-icon" aria-hidden="true">' + card.icon + '</span><span class="upgrade-card-category">' + card.category + '</span>' + rarityLabel + '<strong>' + card.title + '</strong><small>' + card.description + '</small>';
    });
    overlay.classList.toggle('is-special-choice', current.category === 'special');
  }

  chooseUpgrade(type) {
    if (this.status !== 'upgrade' || !this.pendingUpgradeChoices.length) return;
    if (!this.currentUpgradeOptions.some((option) => option.type === type)) return;
    if (type === 'damage') this.player.weaponDamage = Math.min(2.5, this.player.weaponDamage * 1.10);
    if (type === 'speed') this.player.speed = Math.min(this.player.baseSpeed * 1.5, this.player.speed * 1.06);
    if (type === 'integrity') this.player.maxHealth = Math.min(this.player.baseMaxHealth * 1.6, this.player.maxHealth * 1.10);
    if (type === 'cadence') this.player.fireRateLevel = Math.min(5, this.player.fireRateLevel + 1);
    if (type === 'projectileSpeed') this.player.projectileSpeedLevel = Math.min(3, this.player.projectileSpeedLevel + 1);
    if (type === 'propulsionControl') this.player.propulsionControlLevel = Math.min(3, this.player.propulsionControlLevel + 1);
    if (type === 'doubleShot') this.player.doubleShotLevel = Math.min(2, this.player.doubleShotLevel + 1);
    if (type === 'laser') this.player.laserLevel = Math.min(3, this.player.laserLevel + 1);
    if (type === 'continuousLaser') { this.player.continuousLaserLevel = Math.min(3, this.player.continuousLaserLevel + 1); this.updateContinuousLaserButton(); }
    if (type === 'guidedMissile') {
      this.player.guidedMissileLevel = Math.min(3, this.player.guidedMissileLevel + 1);
      this.updateGuidedMissileButton();
    }
    if (type === 'shield') this.player.upgradeShield();
    if (type === 'repair') this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * 0.30);
    this.pendingUpgradeChoices.shift();
    updateHud(this);
    this.updateGuidedMissileButton();
    this.updateShieldPulseButton();
    if (this.pendingUpgradeChoices.length) { this.renderUpgradeChoice(); return; }
    document.querySelector('#upgrade-overlay').classList.add('hidden');
    document.querySelector('#upgrade-overlay').classList.remove('is-special-choice');
    this.currentUpgradeOptions = [];
    this.status = 'running';
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }

  showRewardBanner(heading, detail, kind = 'mission') {
    const banner = document.querySelector('#reward-banner');
    banner.className = `reward-banner reward-banner-${kind}`;
    document.querySelector('#reward-banner-heading').textContent = heading;
    document.querySelector('#reward-banner-detail').textContent = detail;
    this.restartFeedbackAnimation(banner, 'reward-banner-active');
  }

  handleMissionCompletion(completion, killAchievements = []) {
    if (!completion) return;
    this.score += completion.score;
    const levelsGained = this.progression.addXp(completion.xp);
    if (levelsGained > 0) this.triggerLevelUp(levelsGained);
    let total = 0;
    try { total = Number(localStorage.getItem('gd-missions-completed') || 0) + 1; localStorage.setItem('gd-missions-completed', String(total)); } catch { total = completion.completionNumber; }
    const unlockedTitles = this.progression.recordMissionCompletion(total);
    const unlockedAchievements = [...killAchievements, ...this.achievements.record('missions')];
    const toast = document.querySelector('#mission-toast');
    toast.textContent = `MISSÃO CONCLUÍDA · +${completion.xp} XP · +${completion.score} PTS`;
    this.restartFeedbackAnimation(toast, 'mission-toast-active');
    const titleText = unlockedTitles.length ? ` · TÍTULO: ${unlockedTitles[unlockedTitles.length - 1].name}` : '';
    const achievementText = unlockedAchievements.length ? ` · CONQUISTA${unlockedAchievements.length > 1 ? 'S' : ''}: ${unlockedAchievements.map(item => item.name).join(', ')}` : '';
    this.showRewardBanner('MISSÃO CONCLUÍDA', `${completion.name} · +${completion.xp} XP · +${completion.score} PTS${titleText}${achievementText}`);
    if (unlockedTitles.length) {
      document.querySelector('#title-unlock-label').textContent = `NOVO TÍTULO: ${unlockedTitles[unlockedTitles.length - 1].name}`;
      document.querySelector('#title-unlock-toast').classList.remove('hidden');
    }
  }

  triggerDamageFeedback(amount) {
    this.damageFeedbackTimer = 0.48;
    this.damageImpactPulse = { x: this.player.x, y: this.player.y, life: 0.3, maxLife: 0.3 };
    // Brief red electrical sparks around the ship communicate a hit without obscuring play.
    for (let i = 0; i < 9 && this.damageSparks.length < 36; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(22, 68);
      const life = rand(0.32, 0.55);
      this.damageSparks.push({
        x: this.player.x + Math.cos(angle) * rand(7, 15),
        y: this.player.y + Math.sin(angle) * rand(7, 15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        length: rand(7, 13)
      });
    }
    // Sparks are reserved for low hull integrity, not every hit; cap them aggressively.
    const integrityRatio = this.player.health / Math.max(1, this.player.maxHealth);
    if (integrityRatio <= 0.35 && this.damageSparks.length < 36) {
      for (let i = 0; i < 2 && this.damageSparks.length < 36; i += 1) {
        const angle = rand(0, Math.PI * 2), speed = rand(22, 42), life = rand(0.16, 0.28);
        this.damageSparks.push({ x: this.player.x + Math.cos(angle) * 9, y: this.player.y + Math.sin(angle) * 9, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, length: rand(3, 6), size: rand(1, 1.6), color: '#ff9d45' });
      }
    }
    const feedback = document.querySelector('#damage-feedback');
    feedback.textContent = `INTEGRIDADE -${amount}`;
    this.restartFeedbackAnimation(feedback, 'damage-active');
  }

  triggerSystemDisruption(duration = 1.4) {
    this.player.applySystemDisruption(duration);
    // Keep the status message visible for the full recovery window; the canvas
    // border flash remains capped separately so a longer disruption stays subtle.
    this.damageFeedbackTimer = Math.max(this.damageFeedbackTimer, duration);
    const feedback = document.querySelector('#damage-feedback');
    if (!feedback) return;
    feedback.textContent = 'SISTEMAS DESESTABILIZADOS';
    this.restartFeedbackAnimation(feedback, 'damage-active');
  }

  resolvePlasmaImpact(shot) {
    const player = this.player;
    const shieldWasActive = player.shieldHealth > 0;
    if (shieldWasActive) {
      player.shieldHealth = 0;
      player.shieldRechargeTimer = player.shieldRechargeDuration;
      this.triggerShieldBreak();
    } else if (player.invulnerabilityTimer <= 0 && player.health > 0) {
      player.health = Math.max(0, player.health - shot.damage);
      player.invulnerabilityTimer = player.invulnerabilityDuration;
      this.triggerDamageFeedback(shot.damage);
      gameAudio.playDamage();
    }
    const dx = player.x - shot.x, dy = player.y - shot.y;
    const length = Math.hypot(dx, dy) || 1;
    // The DREADNOUGHT plasma lance is a heavy anti-ship hit: shields absorb
    // the hull damage but cannot prevent the powerful displacement.
    const impulse = shieldWasActive ? 1050 : 1450;
    player.knockbackX += dx / length * impulse;
    player.knockbackY += dy / length * impulse;
    this.triggerSystemDisruption(1.45);
  }

  resolveIncomingDamage(amount, sourceX = this.player.x, sourceY = this.player.y, heavyImpact = false) {
    const shieldBefore = this.player.shieldHealth;
    const tookDamage = this.player.takeDamage(amount);
    if (shieldBefore > 0 && this.player.shieldHealth === 0) {
      this.triggerShieldBreak();
    } else if (tookDamage) {
      const dx = this.player.x - sourceX, dy = this.player.y - sourceY;
      const length = Math.hypot(dx, dy) || 1;
      const impulse = heavyImpact ? 390 : 190;
      this.player.knockbackX += dx / length * impulse;
      this.player.knockbackY += dy / length * impulse;
      this.triggerDamageFeedback(amount);
      gameAudio.playDamage();
    } else if (shieldBefore > 0 && this.player.shieldHealth < shieldBefore) {
      const dx = this.player.x - sourceX, dy = this.player.y - sourceY;
      const length = Math.hypot(dx, dy) || 1;
      const impulse = heavyImpact ? 210 : 85;
      this.player.knockbackX += dx / length * impulse;
      this.player.knockbackY += dy / length * impulse;
      // Reinforce the predicted sector with a distinct contact pulse when the
      // shield actually absorbs the hit; this is presentation only.
      const angle = Math.atan2(sourceY - this.player.y, sourceX - this.player.x);
      const sector = ((Math.round((angle + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
      this.shieldThreatArcs[sector] = Math.max(this.shieldThreatArcs[sector], heavyImpact ? 0.52 : 0.42);
    }
  }

  triggerShieldBreak() {
    const x = this.player.x;
    const y = this.player.y;
    const radius = 96;
    const life = 0.58;
    if (this.shieldBreakEffects.length >= 4) this.shieldBreakEffects.shift();
    this.shieldBreakEffects.push({ x, y, radius, life, maxLife: life, kind: 'break' });
    // Compare squared distances to avoid square roots during area-damage checks.
    const radiusSquared = radius * radius;
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (enemy.active && !enemy.bossDying && dx * dx + dy * dy <= radiusSquared) {
        // Make the shockwave's impact visible on durable bosses as well as small enemies.
        this.damageEnemy(enemy, enemy.type === 'boss' ? 12 : 2);
      }
    }
  }

  activateShieldPulse() {
    const profileStartedAt = this.performanceProfileEnabled ? performance.now() : 0;
    if (this.status !== 'running' || this.player.shieldLevel <= 0 || this.player.shieldHealth > 0 ||
        this.shieldPulseCooldown > 0 || this.overloadLockTimer > 0 || this.shieldPulseWave) return false;

    const directionX = Math.cos(this.player.rotation);
    const directionY = Math.sin(this.player.rotation);
    const level = this.player.shieldLevel;
    const overloaded = this.overload >= 70;
    const originX = this.player.x + directionX * 24;
    const originY = this.player.y + directionY * 24;
    this.shieldPulseWave = {
      originX, originY, x: originX, y: originY,
      directionX, directionY, traveled: 0, previousRadius: 0, speed: 400,
      maxDistance: 480, halfAngle: Math.PI / 2, bandWidth: 34,
      life: 1.22, maxLife: 1.22, damage: (level >= 3 ? 5 : 3) * (overloaded ? 0.7 : 1),
      repulsion: 95 + level * 85, hitEnemies: new Set()
    };
    this.shieldPulseCooldownMax = Math.max(15, 21 - level * 2);
    this.shieldPulseCooldown = this.shieldPulseCooldownMax;
    this.addOverload(28);
    this.updateShieldPulseButton();
    if (this.performanceProfileEnabled) console.info('[GALACTIC-DEFENDER activation]', { ability: 'rupture-pulse', durationMs: Number((performance.now() - profileStartedAt).toFixed(2)), enemiesChecked: this.enemies.length, projectilesChecked: this.enemyProjectiles.length });
    return true;
  }

  updateShieldPulseWave(dt) {
    const wave = this.shieldPulseWave;
    if (!wave) return;
    wave.life -= dt;
    wave.previousRadius = wave.traveled;
    wave.traveled = Math.min(wave.maxDistance, wave.traveled + wave.speed * dt);
    wave.x = wave.originX + wave.directionX * wave.traveled;
    wave.y = wave.originY + wave.directionY * wave.traveled;
    const minRadius = Math.max(0, wave.previousRadius - wave.bandWidth);
    const maxRadius = wave.traveled + wave.bandWidth;
    const minRadiusSquared = minRadius * minRadius;
    const maxRadiusSquared = maxRadius * maxRadius;
    const cosHalfAngle = Math.cos(wave.halfAngle);

    // Test only the newly swept semicircular band; use squared distance and dot products.
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.bossDying || wave.hitEnemies.has(enemy)) continue;
      const dx = enemy.x - wave.originX, dy = enemy.y - wave.originY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < minRadiusSquared || distanceSquared > maxRadiusSquared) continue;
      const forwardDot = dx * wave.directionX + dy * wave.directionY;
      if (forwardDot < 0 || forwardDot * forwardDot < distanceSquared * cosHalfAngle * cosHalfAngle) continue;
      wave.hitEnemies.add(enemy);
      const boss = enemy.type === 'boss' || enemy.type === 'megaboss';
      const distance = Math.sqrt(distanceSquared) || 1;
      const push = wave.repulsion * (boss ? 0.28 : 1);
      const disruptionImpulse = push * 1.45;
      enemy.applyDisruption(
        dx / distance * disruptionImpulse,
        dy / distance * disruptionImpulse,
        boss ? 0.58 : 0.86
      );
      this.damageEnemy(enemy, boss ? wave.damage * 0.6 : wave.damage);
    }

    for (const shot of this.enemyProjectiles) {
      if (!shot.active) continue;
      const dx = shot.x - wave.originX, dy = shot.y - wave.originY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < minRadiusSquared || distanceSquared > maxRadiusSquared) continue;
      const forwardDot = dx * wave.directionX + dy * wave.directionY;
      if (forwardDot >= 0 && forwardDot * forwardDot >= distanceSquared * cosHalfAngle * cosHalfAngle) shot.active = false;
    }

    if (wave.life <= 0 || wave.traveled >= wave.maxDistance) this.shieldPulseWave = null;
  }

  updateShieldPulseButton() {
    const button = document.querySelector('#shield-pulse-button');
    if (!button) return;
    const unlocked = this.player.shieldLevel > 0;
    const broken = this.player.shieldHealth <= 0;
    const ready = this.shieldPulseCooldown <= 0 && this.overloadLockTimer <= 0 && !this.shieldPulseWave;
    button.classList.toggle('hidden', !unlocked);
    button.disabled = !unlocked || !broken || this.status !== 'running' || !ready;
    const label = document.querySelector('#shield-pulse-status');
    const fill = document.querySelector('#shield-pulse-cooldown-fill');
    let statusText = this.status !== 'running' ? 'DISPONÍVEL NA PARTIDA'
      : !broken ? 'EXIGE ESCUDO QUEBRADO'
      : this.overloadLockTimer > 0 ? 'SISTEMA SOBRECARREGADO'
      : this.shieldPulseWave ? 'PULSO EM CURSO'
      : this.shieldPulseCooldown > 0 ? `RECARGA · ${Math.ceil(this.shieldPulseCooldown)}s`
      : 'PRONTO · TOQUE / Q';
    if (label && label.textContent !== statusText) label.textContent = statusText;
    if (fill) {
      const width = this.shieldPulseCooldown <= 0 ? '0%' : `${Math.min(1, this.shieldPulseCooldown / this.shieldPulseCooldownMax) * 100}%`;
      if (fill.style.width !== width) fill.style.width = width;
    }
    button.setAttribute('aria-label', ready && broken ? 'Ativar Pulso de Ruptura' : 'Pulso de Ruptura indisponível');
  }

  activateContinuousLaser() { if (this.status !== 'running' || this.player.continuousLaserLevel <= 0 || this.continuousLaserCooldown > 0 || this.overloadLockTimer > 0 || this.continuousLaserClash) return false; this.continuousLaserHeld = true; this.updateContinuousLaserButton(); return true; }
  releaseContinuousLaser() { this.continuousLaserHeld = false; this.updateContinuousLaserButton(); }
  updateContinuousLaserButton() {
    const button = document.querySelector('#continuous-laser-button'); if (!button) return;
    const unlocked = this.player.continuousLaserLevel > 0, ready = this.continuousLaserCooldown <= 0 && this.overloadLockTimer <= 0 && !this.continuousLaserClash;
    button.classList.toggle('hidden', !unlocked); button.disabled = !unlocked || this.status !== 'running' || !ready;
    const label = document.querySelector('#continuous-laser-status');
    if (label) label.textContent = this.status !== 'running' ? 'DISPONÍVEL NA PARTIDA' : this.overloadLockTimer > 0 ? 'SISTEMA SOBRECARREGADO' : this.continuousLaserClash ? 'ATTACK CLASH · ESCOLHA' : this.continuousLaserCooldown > 0 ? 'RECARGA · ' + Math.ceil(this.continuousLaserCooldown) + 's' : this.continuousLaserHeld ? 'FEIXE ATIVO · SOLTE' : 'SEGURE · TECLA L';
    button.setAttribute('aria-label', this.continuousLaserHeld ? 'Soltar laser contínuo' : 'Ativar laser contínuo');
  }
  resolveContinuousLaserClash(outcome) {
    if (!this.continuousLaserClash) return;
    document.querySelector('#laser-clash-overlay')?.classList.add('hidden'); this.continuousLaserClash = null; this.continuousLaserHeld = false;
    if (outcome === 'victory') {
      // Find the nearest live target in one pass without allocating, filtering or sorting arrays.
      let target = null;
      let nearestDistanceSquared = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < nearestDistanceSquared) {
          nearestDistanceSquared = distanceSquared;
          target = enemy;
        }
      }
      if (target) this.damageEnemy(target, (target.type === 'boss' || target.type === 'megaboss' ? 16 : 5) + this.player.continuousLaserLevel * 3);
      this.addOverload(18); this.continuousLaserCooldown = 2.5;
    } else if (outcome === 'draw') { this.addOverload(8); this.continuousLaserCooldown = 1.2; } else this.continuousLaserCooldown = 4;
    this.status = 'running'; this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((time) => this.loop(time));
    this.updateContinuousLaserButton();
  }
  updateContinuousLaser(dt) {
    this.continuousLaserCooldown = Math.max(0, this.continuousLaserCooldown - dt); this.continuousLaserDamageClock = Math.max(0, this.continuousLaserDamageClock - dt);
    if (!this.continuousLaserHeld || this.player.continuousLaserLevel <= 0 || this.overloadLockTimer > 0 || this.continuousLaserClash) return;
    const dx = Math.cos(this.player.rotation), dy = Math.sin(this.player.rotation), sx = this.player.x + dx * 18, sy = this.player.y + dy * 18, ex = sx + dx * 460, ey = sy + dy * 460;
    for (const shot of this.enemyProjectiles) {
      // The segment helper expects the full combined radius, not only the beam width.
      const clashRadius = (shot.radius ?? 0) + 7;
      if (!shot.active || !circleOverlapsSegment(shot, sx, sy, ex, ey, clashRadius)) continue;
      shot.active = false; this.continuousLaserClash = { x: shot.x, y: shot.y }; this.continuousLaserHeld = false; this.status = 'paused';
      document.querySelector('#laser-clash-overlay')?.classList.remove('hidden'); this.updateContinuousLaserButton(); return;
    }
    if (this.continuousLaserDamageClock <= 0) {
      const weakened = this.overload >= 70;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.bossDying) continue;
        // Include both the target hit radius and the beam's half-width so visible
        // edge intersections are not missed for large bosses or smaller enemies.
        const hitRadius = (enemy.collisionRadius ?? enemy.radius ?? 0) + 13;
        if (!circleOverlapsSegment(enemy, sx, sy, ex, ey, hitRadius)) continue;
        const boss = enemy.type === 'boss' || enemy.type === 'megaboss';
        this.damageEnemy(enemy, (boss ? 8 : 13) * (1 + this.player.continuousLaserLevel * .22) * (weakened ? .72 : 1));
      }
      this.continuousLaserDamageClock = .22;
    }
    this.addOverload((8 + this.player.continuousLaserLevel * 2) * dt); if (this.overloadLockTimer > 0) this.releaseContinuousLaser();
  }

  addOverload(amount) {
    if (amount <= 0 || this.overloadLockTimer > 0) return;
    this.overload = Math.min(this.overloadMax, this.overload + amount);
    if (this.overload >= this.overloadMax) {
      this.overloadLockTimer = 3.5;
      this.overload = this.overloadMax;
      this.restartFeedbackAnimation(document.querySelector('#overload-status'), 'overload-critical');
    }
    this.updateOverloadHud();
  }

  updateOverloadHud() {
    const element = document.querySelector('#overload-status');
    if (!element) return;
    const percent = Math.round(this.overload);
    const state = this.overloadLockTimer > 0 ? 'BLOQUEIO'
      : this.overload >= 70 ? 'SOBRECARGA'
      : this.overload >= 35 ? 'AQUECENDO' : 'ESTÁVEL';
    const shortState = this.overloadLockTimer > 0 ? 'CRÍTICO' : this.overload >= 70 ? 'QUENTE' : this.overload >= 35 ? 'AQUECENDO' : 'ESTÁVEL';
    const statusText = `${percent}% · ${shortState}`;
    if (element.textContent !== statusText) element.textContent = statusText;
    const visualState = this.overloadLockTimer > 0 ? 'critical' : this.overload >= 70 ? 'overloaded' : 'stable';
    if (element.dataset.state !== visualState) element.dataset.state = visualState;
    const panel = document.querySelector('#overload-panel');
    if (panel && panel.dataset.state !== visualState) panel.dataset.state = visualState;
    const fill = document.querySelector('#overload-meter-fill');
    if (fill) {
      const height = `${percent}%`;
      if (fill.style.height !== height) fill.style.height = height;
      if (fill.style.width !== '100%') fill.style.width = '100%';
      if (fill.dataset.state !== visualState) fill.dataset.state = visualState;
    }
  }

  createGuidedMissileFromWing(side, target, level) {
    const shipDrawAngle = this.player.rotation + Math.PI / 2;
    const bank = this.player.bank || 0;
    const localX = side * 17, localY = 5;
    const transformedX = localX * (1 - Math.abs(bank) * 0.08) + localY * (bank * 0.32);
    const launchX = this.player.x + transformedX * Math.cos(shipDrawAngle) - localY * Math.sin(shipDrawAngle);
    const launchY = this.player.y + transformedX * Math.sin(shipDrawAngle) + localY * Math.cos(shipDrawAngle);
    const fallbackAngle = Number.isFinite(this.player.rotation) ? this.player.rotation : -Math.PI / 2;
    const initialAngle = target && target.active ? Math.atan2(target.y - launchY, target.x - launchX) : fallbackAngle;
    const missile = new GuidedMissile(launchX, launchY, target, level, initialAngle, side);
    if (this.overload >= 70) missile.damage *= 0.72;
    this.guidedMissiles.push(missile);
  }

  activateGuidedMissile() {
    const profileStartedAt = this.performanceProfileEnabled ? performance.now() : 0;
    if (this.status !== 'running' || this.player.guidedMissileLevel <= 0 || this.guidedMissileCooldown > 0 || this.overloadLockTimer > 0) return false;
    // Only the two closest targets are needed; avoid allocating and sorting the full enemy list.
    let firstTarget = null, secondTarget = null;
    let firstDistance = Infinity, secondDistance = Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.player.x, dy = enemy.y - this.player.y;
      const distance = dx * dx + dy * dy;
      if (distance < firstDistance) {
        secondTarget = firstTarget; secondDistance = firstDistance;
        firstTarget = enemy; firstDistance = distance;
      } else if (distance < secondDistance) {
        secondTarget = enemy; secondDistance = distance;
      }
    }
    const targets = [firstTarget, secondTarget].filter(Boolean);
    const level = this.player.guidedMissileLevel;
    const missileCount = level >= 2 ? 2 : 1;
    // Launch from the right wing first; at level 2+, launch the left missile 0.2s later.
    const rightTarget = targets[0] || null;
    this.createGuidedMissileFromWing(1, rightTarget, level);
    if (missileCount === 2) {
      this.pendingGuidedMissileLaunch = {
        timer: 0.2,
        side: -1,
        target: targets[1] || (targets.length === 1 ? targets[0] : null),
        level
      };
    }
    this.guidedMissileCooldownMax = level >= 3 ? 9 : level >= 2 ? 10 : 12;
    this.guidedMissileCooldown = this.guidedMissileCooldownMax;
    this.addOverload(20);
    this.updateGuidedMissileButton();
    if (this.performanceProfileEnabled) console.info('[GALACTIC-DEFENDER activation]', { ability: 'guided-missile', durationMs: Number((performance.now() - profileStartedAt).toFixed(2)), activeTargetsConsidered: targets.length });
    return true;
  }

  updateGuidedMissileButton() {
    const button = document.querySelector('#guided-missile-button');
    if (!button) return;
    const unlocked = this.player.guidedMissileLevel > 0;
    this.player.guidedMissileCooldown = this.guidedMissileCooldown;
    const ready = this.guidedMissileCooldown <= 0 && this.overloadLockTimer <= 0;
    button.classList.toggle('hidden', !unlocked);
    button.disabled = !unlocked || this.status !== 'running' || !ready;
    const label = document.querySelector('#guided-missile-status');
    const fill = document.querySelector('#guided-missile-cooldown-fill');
    const statusText = this.status !== 'running' ? 'DISPONÍVEL NA PARTIDA'
      : this.overloadLockTimer > 0 ? 'SISTEMA SOBRECARREGADO'
      : this.guidedMissileCooldown > 0 ? 'RECARGA · ' + Math.ceil(this.guidedMissileCooldown) + 's'
      : this.overload >= 70 ? 'POTÊNCIA REDUZIDA · E'
      : 'PRONTO · TOQUE / E';
    if (label && label.textContent !== statusText) label.textContent = statusText;
    if (fill) fill.style.width = this.guidedMissileCooldown <= 0 ? '0%' : (Math.min(1, this.guidedMissileCooldown / this.guidedMissileCooldownMax) * 100) + '%';
    button.setAttribute('aria-label', ready ? 'Ativar mísseis teleguiados' : 'Mísseis teleguiados indisponíveis');
  }

  explodeGuidedMissile(missile) {
    const radius = missile.blastRadius;
    if (this.guidedMissileEffects.length >= 6) this.guidedMissileEffects.shift();
    this.guidedMissileEffects.push({ x: missile.x, y: missile.y, radius, life: 0.48, maxLife: 0.48 });
    const radiusSquared = radius * radius;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - missile.x, dy = enemy.y - missile.y;
      if (dx * dx + dy * dy <= radiusSquared) {
        this.damageEnemy(enemy, enemy === missile.target ? missile.damage : missile.damage * 0.7);
      }
    }

    // Level 3 splits into three weaker, short-lived fragments; fragments cannot split again.
    if (missile.level >= 3 && this.guidedMissiles.length < 6) {
      const targets = [];
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - missile.x, dy = enemy.y - missile.y;
        const distance = dx * dx + dy * dy;
        let insertAt = targets.findIndex((item) => distance < item.distance);
        if (insertAt < 0) insertAt = targets.length;
        if (insertAt < 3) targets.splice(insertAt, 0, { enemy, distance });
        if (targets.length > 3) targets.pop();
      }
      for (let index = 0; index < 3 && this.guidedMissiles.length < 6; index += 1) {
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / 3);
        const target = targets[index]?.enemy || null;
        const fragment = new GuidedMissile(
          missile.x + Math.cos(angle) * 12,
          missile.y + Math.sin(angle) * 12,
          target, 1, angle, index - 1
        );
        fragment.damage = missile.damage * 0.38;
        fragment.blastRadius = 28;
        fragment.speed = 275;
        fragment.life = 2.2;
        this.guidedMissiles.push(fragment);
      }
    }
  }

  damageEnemy(enemy, amount, impactX = null, impactY = null) {
    if (!enemy.active || enemy.bossDying || amount <= 0) return;

    // The dreadnought resolves regional shields and independent weapon modules before hull damage.
    if (enemy.type === 'boss' && enemy.bossSystems) {
      let remainingDamage = amount;
      let hitModule = null;
      // Projectile callers provide the collision point. Area/special attacks do not
      // always have a single impact point, so resolve them from the pilot's position
      // instead of letting those attacks bypass the dreadnought's regional defenses.
      const hitX = Number.isFinite(impactX) ? impactX : this.player.x;
      const hitY = Number.isFinite(impactY) ? impactY : this.player.y;
      const dx = hitX - enemy.x;
      const dy = hitY - enemy.y;
      const rotation = -(enemy.facingRotation + Math.PI / 2);
      const localX = dx * Math.cos(rotation) - dy * Math.sin(rotation);
      const localY = dx * Math.sin(rotation) + dy * Math.cos(rotation);
      const radius = Math.max(1, enemy.radius);
      const region = localY < -radius * 0.34 ? 'front'
        : localY > radius * 0.48 ? 'rear'
          : localX < 0 ? 'left' : 'right';
      let nearestDistance = Infinity;
      for (const module of enemy.bossSystems.modules) {
        const mx = module.x * radius;
        const my = module.y * radius;
        const distanceSquared = (localX - mx) ** 2 + (localY - my) ** 2;
        if (distanceSquared < nearestDistance) {
          nearestDistance = distanceSquared;
          hitModule = module;
        }
      }
      const directModuleHit = Boolean(hitModule && hitModule.state !== 'destroyed' && nearestDistance <= (radius * 0.42) ** 2);
      // Precise hardpoint hits damage the weapon while the regional shield absorbs the rest.
      const moduleBypassRatio = directModuleHit ? 0.42 : 0;
      const shieldResult = enemy.bossSystems.damageShield(region, remainingDamage, moduleBypassRatio);
      remainingDamage = shieldResult.remaining;
      if (remainingDamage > 0 && directModuleHit) {
        enemy.bossSystems.damageModule(hitModule.id, remainingDamage);
      }
      if (remainingDamage <= 0) return;
      amount = remainingDamage;
    }
    // A protected ally's incoming damage is absorbed by its assigned Elite Guardian's shared barrier.
    for (const guardian of this.enemies) {
      if (!guardian.active || !guardian.isElite || guardian.type !== 'guardian' || guardian.guardianCoverShield <= 0 || !(guardian.protectedAllies || []).includes(enemy)) continue;
      const absorbed = Math.min(guardian.guardianCoverShield, amount);
      guardian.guardianCoverShield -= absorbed;
      amount -= absorbed;
      if (amount <= 0) return;
      break;
    }
    // Elite shields absorb incoming damage first; excess damage carries through to hull integrity.
    if (enemy.isElite && enemy.eliteShield > 0) {
      const absorbed = Math.min(enemy.eliteShield, amount);
      enemy.eliteShield -= absorbed;
      if (absorbed > 0) enemy.eliteShieldFlash = 0.42;
      amount -= absorbed;
      if (amount <= 0) return;
    }
    enemy.health = Math.max(0, enemy.health - amount);

    // One overload transformation: the ship ejects/replaces destroyed modules and returns at 50% hull.
    if (enemy.type === 'boss' && enemy.bossSystems && !enemy.bossSystems.overloadUsed &&
        enemy.health / Math.max(1, enemy.maxHealth) <= 0.33) {
      enemy.bossPhase = 3;
      enemy.bossPhaseTransition = 4.5;
      enemy.health = Math.max(1, Math.round(enemy.maxHealth * 0.5));
      enemy.bossSystems.beginOverloadRebuild();
      enemy.fireCooldown = Math.max(enemy.fireCooldown, 4.5);
      return;
    }
    if (enemy.health > 0) return;
    if (enemy.type === 'boss') {
      // Keep the dreadnought in the world for its one-shot destruction sequence.
      enemy.bossDying = true;
      enemy.bossDeathTimer = 0;
      enemy.fireCooldown = Infinity;
      enemy.dodgeTimer = 0;
      return;
    }
    enemy.active = false;
    this.awardEnemyKill(enemy);
  }

  awardEnemyKill(enemy) {
    if (enemy.rewardGranted) return;
    enemy.rewardGranted = true;
    this.score += enemy.type === 'boss' ? 1000 : enemy.isElite ? 150 : enemy.type === 'artillery' ? 150 : 100;
    this.destroyed += 1;
    const newlyUnlocked = this.achievements.record('kills');
    if (enemy.type === 'boss') newlyUnlocked.push(...this.achievements.record('bosses'));
    const xpRewards = { chaser: 20, interceptor: 15, sentinel: 35, guardian: 45, artillery: 55, boss: 180 };
    const xpGained = xpRewards[enemy.type] ?? 20;
    const levelsGained = this.progression.addXp(xpGained);
    if (enemy.type === 'boss') this.showRewardBanner('CHEFE DERROTADO', `+${xpGained} XP · +1.000 PTS`, 'boss');
    if (levelsGained > 0) this.triggerLevelUp(levelsGained);
    const missionCompletion = this.mission.registerKill();
    if (missionCompletion) this.handleMissionCompletion(missionCompletion, newlyUnlocked);
    else if (newlyUnlocked.length) this.showRewardBanner('CONQUISTA DESBLOQUEADA', newlyUnlocked.map(item => item.name).join(' · '), 'achievement');
  }

  updateShieldThreats(dt) {
    const arcs = this.shieldThreatArcs;
    for (let i = 0; i < arcs.length; i += 1) arcs[i] = Math.max(0, arcs[i] - dt);
    if (this.player.shieldLevel <= 0 || this.player.shieldHealth <= 0) return;
    this.shieldThreatScanTimer -= dt;
    if (this.shieldThreatScanTimer > 0) return;
    this.shieldThreatScanTimer = 0.08;

    const px = this.player.x, py = this.player.y;
    const dangerRadius = this.player.radius + 18;
    const dangerRadiusSquared = dangerRadius * dangerRadius;
    for (const shot of this.enemyProjectiles) {
      if (!shot.active || !Number.isFinite(shot.vx) || !Number.isFinite(shot.vy)) continue;
      const rx = shot.x - px, ry = shot.y - py;
      const speedSquared = shot.vx * shot.vx + shot.vy * shot.vy;
      if (speedSquared < 1) continue;
      const closestTime = -(rx * shot.vx + ry * shot.vy) / speedSquared;
      if (closestTime < 0 || closestTime > 0.55) continue;
      const closestX = rx + shot.vx * closestTime;
      const closestY = ry + shot.vy * closestTime;
      if (closestX * closestX + closestY * closestY > dangerRadiusSquared) continue;

      // Aim the visual response at the predicted contact point, not the projectile's
      // current position. The defensive rule itself remains omnidirectional.
      const angle = Math.atan2(closestY, closestX);
      const sector = ((Math.round((angle + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
      const urgency = 1 - closestTime / 0.55;
      arcs[sector] = Math.max(arcs[sector], 0.28 + urgency * 0.18);
    }
  }

  drawShield(ctx) {
    const player = this.player;
    if (player.shieldLevel <= 0) return;
    const ratio = player.shieldMaxHealth > 0 ? player.shieldHealth / player.shieldMaxHealth : 0;
    ctx.save();

    // The shield remains logically active in 360 degrees. Only threat-facing
    // sectors are rendered, so the ship hull stays unobscured and no full bubble is drawn.
    if (player.shieldHealth > 0) {
      const weak = ratio <= 0.34;
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      for (let i = 0; i < this.shieldThreatArcs.length; i += 1) {
        const life = this.shieldThreatArcs[i];
        if (life <= 0) continue;
        const angle = -Math.PI + i * (Math.PI / 4);
        const progress = Math.max(0, Math.min(1, 1 - life / 0.46));
        const radius = player.radius + 2 + progress * 10;
        const spread = 0.16 + progress * 0.12;
        const alpha = Math.min(0.92, life / 0.16);
        ctx.globalAlpha = alpha * 0.24;
        ctx.strokeStyle = weak ? '#ffad68' : '#57cfff';
        ctx.lineWidth = 9 - progress * 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, radius, angle - spread, angle + spread);
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = weak ? '#ffbd82' : '#a8f5ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, radius, angle - spread, angle + spread);
        ctx.stroke();
        // Two short radial traces make the local barrier feel like it is forming
        // over the ship surface instead of simply blinking into existence.
        ctx.globalAlpha = alpha * 0.72;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(player.x + Math.cos(angle - spread) * (player.radius - 1), player.y + Math.sin(angle - spread) * (player.radius - 1));
        ctx.lineTo(player.x + Math.cos(angle - spread) * (radius + 2), player.y + Math.sin(angle - spread) * (radius + 2));
        ctx.moveTo(player.x + Math.cos(angle + spread) * (player.radius - 1), player.y + Math.sin(angle + spread) * (player.radius - 1));
        ctx.lineTo(player.x + Math.cos(angle + spread) * (radius + 2), player.y + Math.sin(angle + spread) * (radius + 2));
        ctx.stroke();
      }
    }

    const barWidth = 36, barHeight = 3;
    const barY = player.y - 35 < 8 ? player.y + 34 : player.y - 35;
    const barX = player.x - barWidth / 2;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#071526';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = ratio > 0.34 ? '#4acbff' : '#ffbd69';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barWidth - 2) * ratio), barHeight - 2);
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9f0ff';
    ctx.fillText(player.shieldHealth > 0 ? 'ESCUDO' : `RECARGA ${Math.ceil(player.shieldRechargeTimer)}s`, player.x, barY - 3);
    ctx.restore();
  }

  updateCamera(dt, snap = false) {
    const zoom = Math.max(this.cameraMinZoom, this.cameraZoom || 1);
    const halfViewWidth = this.width / (2 * zoom);
    const halfViewHeight = this.height / (2 * zoom);
    const minX = halfViewWidth - this.width / 2;
    const minY = halfViewHeight - this.height / 2;
    const maxX = Math.max(minX, this.worldWidth - halfViewWidth - this.width / 2);
    const maxY = Math.max(minY, this.worldHeight - halfViewHeight - this.height / 2);
    const boss = this.bossEncounterSeen
      ? this.enemies.find((enemy) => enemy.active && enemy.type === 'boss' && !enemy.bossDying)
      : null;
    // During the DREADNOUGHT encounter, bias the camera toward the space between
    // the pilot and the boss so the long hull stays visible without changing the arena.
    const focusY = boss
      ? (boss.y - boss.collisionRadius * 1.5 + this.player.y + (this.player.radius ?? 12)) / 2
      : this.player.y;
    const targetX = Math.max(minX, Math.min(maxX, this.player.x - this.width / 2));
    const targetY = Math.max(minY, Math.min(maxY, focusY - this.height / 2));
    if (snap) {
      this.cameraX = targetX;
      this.cameraY = targetY;
      return;
    }
    const follow = Math.min(1, Math.max(0, dt) * 5.5);
    this.cameraX += (targetX - this.cameraX) * follow;
    this.cameraY += (targetY - this.cameraY) * follow;
  }

  screenToWorld(screenX, screenY) {
    const zoom = Math.max(this.cameraMinZoom, this.cameraZoom || 1);
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    return {
      x: centerX + this.cameraX + (screenX - centerX) / zoom,
      y: centerY + this.cameraY + (screenY - centerY) / zoom
    };
  }

  setAimFromPointer(event) {
    if (event.pointerType !== 'mouse') return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const point = this.screenToWorld(
      (event.clientX - rect.left) * this.width / rect.width,
      (event.clientY - rect.top) * this.height / rect.height
    );
    this.aim.x = Math.max(0, Math.min(this.worldWidth, point.x));
    this.aim.y = Math.max(0, Math.min(this.worldHeight, point.y));
    this.aim.active = true;
  }

  setAimFromTouch(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const point = this.screenToWorld(
      (event.clientX - rect.left) * this.width / rect.width,
      (event.clientY - rect.top) * this.height / rect.height
    );
    this.touchAim.x = Math.max(0, Math.min(this.worldWidth, point.x));
    this.touchAim.y = Math.max(0, Math.min(this.worldHeight, point.y));
    this.touchAim.active = true;
  }

  getAimAngle(mobileMode = document.documentElement.dataset.platform === 'mobile') {
    if (mobileMode) {
      // Enemies always take priority; manual touch direction is used when the arena is clear.
      let target = null;
      let nearestDistance = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < nearestDistance) {
          nearestDistance = distanceSquared;
          target = enemy;
        }
      }
      if (target) return Math.atan2(target.y - this.player.y, target.x - this.player.x);
      // Manual touch aim is active only while the player is dragging; once released,
      // the ship smoothly returns to its default forward-facing direction.
      if (this.touchAim.pointerId !== null && this.touchAim.active) {
        return Math.atan2(this.touchAim.y - this.player.y, this.touchAim.x - this.player.x);
      }
      return -Math.PI / 2;
    }
    if (!this.aim.active) return this.player.rotation;
    return Math.atan2(this.aim.y - this.player.y, this.aim.x - this.player.x);
  }

  clearInput() {
    this.keys.clear();
    this.joystick.x = 0;
    this.joystick.y = 0;
  }

  renderIntro() {
    this.renderFrame(0);
  }

  loop(time) {
    if (this.status !== 'running') return;
    const frameStartedAt = this.performanceProfileEnabled ? performance.now() : 0;
    this.updateFpsCounter(time);
    const dt = Math.min((time - this.lastTime) / 1000 || 0, .035);
    this.lastTime = time;

    const updateStartedAt = this.performanceProfileEnabled ? performance.now() : 0;
    this.update(dt);
    const updateDuration = this.performanceProfileEnabled ? performance.now() - updateStartedAt : 0;

    const renderStartedAt = this.performanceProfileEnabled ? performance.now() : 0;
    this.renderFrame(dt);
    const renderDuration = this.performanceProfileEnabled ? performance.now() - renderStartedAt : 0;

    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= this.hudUpdateInterval) {
      this.hudUpdateTimer %= this.hudUpdateInterval;
      updateHud(this);
      this.updateGuidedMissileButton();
      this.updateShieldPulseButton();
      this.updateContinuousLaserButton();
      this.updateOverloadHud();
      const runAchievements = this.achievements.checkRunMilestones(this.score, this.waveManager.wave);
      if (runAchievements.length) this.showRewardBanner('CONQUISTA DESBLOQUEADA', runAchievements.map(item => item.name).join(' · '), 'achievement');
    }

    if (this.performanceProfileEnabled) {
      const frameDuration = performance.now() - frameStartedAt;
      this.performanceProfileSamples.push({
        frame: this.performanceProfilePreviousFrameAt ? time - this.performanceProfilePreviousFrameAt : 0,
        update: updateDuration,
        render: renderDuration,
        work: frameDuration
      });
      this.performanceProfilePreviousFrameAt = time;
      if (this.performanceProfileSamples.length >= 180) this.reportPerformanceProfile();
    }

    if (this.status === 'running') {
      this.animationId = requestAnimationFrame((next) => this.loop(next));
    }
  }

  reportPerformanceProfile() {
    const samples = this.performanceProfileSamples;
    if (!samples.length) return;
    const average = (key) => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
    const frameSamples = samples.filter((sample) => sample.frame > 0);
    const averageFrame = frameSamples.length
      ? frameSamples.reduce((sum, sample) => sum + sample.frame, 0) / frameSamples.length
      : 0;
    console.info('[GALACTIC-DEFENDER profile]', {
      samples: samples.length,
      averageFrameMs: Number(averageFrame.toFixed(2)),
      estimatedFps: averageFrame > 0 ? Number((1000 / averageFrame).toFixed(1)) : null,
      averageUpdateMs: Number(average('update').toFixed(2)),
      averageRenderMs: Number(average('render').toFixed(2)),
      averageGameWorkMs: Number(average('work').toFixed(2)),
      entities: {
        enemies: this.enemies.length,
        playerProjectiles: this.projectiles.length,
        enemyProjectiles: this.enemyProjectiles.length,
        levelParticles: this.levelUpParticles.length,
        damageSparks: this.damageSparks.length,
        shieldEffects: this.shieldBreakEffects.length
      }
    });
    this.performanceProfileSamples = [];
  }

  setCinematicHudOpacity(opacity, active = true) {
    if (!this.cinematicHudRoot) return;
    this.cinematicHudRoot.classList.toggle('cinematic-active', active);
    const value = Math.max(0, Math.min(1, opacity));
    for (const element of this.cinematicHudElements) {
      element.style.opacity = active ? String(value) : '';
      element.style.pointerEvents = active ? 'none' : '';
    }
  }

  beginBossCinematic() {
    this.clearInput();
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.knockbackX = 0;
    this.player.knockbackY = 0;
    this.continuousLaserHeld = false;
    this.projectiles.length = 0;
    this.enemyProjectiles.length = 0;
    this.guidedMissiles.length = 0;
    this.guidedMissileEffects.length = 0;
    this.enemies.length = 0;
    this.bossCinematic = createBossCinematic();
    this.bossCinematic.cameraZoom = this.cameraZoom || 1;
    this.setCinematicHudOpacity(1, true);
    this.bossEncounterDialogue = null;
    this.bossEncounterDialogueTimer = 0;
  }

  updateBossCinematic(dt) {
    const cinematic = this.bossCinematic;
    if (!cinematic) return;
    const previousPhase = cinematic.phase;
    advanceBossCinematic(cinematic, dt);

    if (!cinematic.bossSpawned && cinematic.phase === 'distant-contact') {
      // Spawn once at a fixed standoff. The boss is not updated by its AI until
      // the explicit handoff, so no second entrance controller can move it.
      const bossY = Math.max(160, this.player.y - this.height * 1.08);
      cinematic.boss = new Enemy(this.player.x, bossY, 10, 'boss');
      cinematic.boss.bossEntranceTimer = 0;
      cinematic.boss.facingRotation = Math.PI / 2;
      cinematic.boss.rotation = Math.PI / 2;
      cinematic.bossSpawned = true;
    }

    const cameraFrame = getBossCinematicCameraFrame({
      phase: cinematic.phase,
      phaseElapsed: cinematic.phaseElapsed,
      phaseDuration: cinematic.phaseDuration,
      player: this.player,
      boss: cinematic.boss,
      width: this.width,
      height: this.height,
      minZoom: this.cameraMinZoom,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight
    });
    const cameraBlend = Math.min(1, Math.max(0, dt) * 3.2);
    cinematic.cameraZoom += (cameraFrame.zoom - cinematic.cameraZoom) * cameraBlend;
    this.cameraX += (cameraFrame.x - this.cameraX) * cameraBlend;
    this.cameraY += (cameraFrame.y - this.cameraY) * cameraBlend;

    this.setCinematicHudOpacity(cinematic.pilotHudOpacity, true);

    if (cinematic.phase === 'complete') {
      const boss = cinematic.boss;
      if (boss) {
        prepareBossForCombatHandoff(boss, boss.y);
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.knockbackX = 0;
        this.player.knockbackY = 0;
        this.enemies = [boss];
        this.bossEncounterSeen = true;
        this.bossEncounterCount += 1;
        this.waveManager.enemyCount = 1;
        this.waveManager.spawnedCount = 1;
      }
      // Snap only once to the exact combat target. The camera helper uses the
      // same bounds/focus equation as updateCamera, avoiding a handoff jump.
      this.cameraZoom = this.cameraMinZoom;
      this.updateCamera(0, true);
      this.waveManager.timer = 1.0;
      this.clearInput();
      this.bossCinematic = null;
      this.setCinematicHudOpacity(1, false);
    }
  }

  drawCinematicDialogue(ctx, cue) {
    if (!cue) return;
    const cinematic = this.bossCinematic;
    const actor = cue.actor === 'boss' ? cinematic?.boss : this.player;
    const zoom = Math.max(this.cameraMinZoom, cinematic?.cameraZoom ?? this.cameraZoom);
    const anchorX = this.width / 2 + (actor.x - this.width / 2 - this.cameraX) * zoom;
    const anchorY = this.height / 2 + (actor.y - this.height / 2 - this.cameraY) * zoom;
    const boxWidth = Math.min(340, Math.max(190, this.width * 0.48), this.width - 24);
    const boxHeight = this.height < 390 ? 68 : 76;
    const placeRight = anchorX < this.width * 0.5;
    const x = Math.max(12, Math.min(this.width - boxWidth - 12,
      placeRight ? anchorX + 24 : anchorX - boxWidth - 24));
    const y = Math.max(12, Math.min(this.height - boxHeight - 14,
      anchorY > this.height * 0.52 ? anchorY - boxHeight - 26 : anchorY + 26));
    const accent = cue.actor === 'boss' ? '#ef829a' : '#68e5f2';
    ctx.save();
    ctx.fillStyle = 'rgba(3, 10, 23, 0.94)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + 0.7, y + 0.7, boxWidth - 1.4, boxHeight - 1.4);
    ctx.fillStyle = accent;
    ctx.textAlign = 'left';
    ctx.font = '900 9px ui-monospace, monospace';
    ctx.fillText(cue.speaker, x + 11, y + 17);
    ctx.fillStyle = '#f0f5ff';
    const fontSize = this.width < 520 ? 10 : 12;
    ctx.font = `${fontSize}px ui-monospace, monospace`;
    const maxWidth = boxWidth - 22;
    const words = cue.text.split(' ');
    const rows = [];
    let row = '';
    for (const word of words) {
      const candidate = row ? `${row} ${word}` : word;
      if (row && ctx.measureText(candidate).width > maxWidth) {
        rows.push(row);
        row = word;
      } else row = candidate;
    }
    if (row) rows.push(row);
    rows.slice(0, 3).forEach((line, index) => ctx.fillText(line, x + 11, y + 39 + index * (fontSize + 3)));
    ctx.restore();
  }

  drawCinematicAlert(ctx, alert) {
    if (!alert) return;
    const elapsed = this.bossCinematic.phaseElapsed - alert.at;
    const duration = 3.8;
    const progress = Math.max(0, Math.min(1, elapsed / 0.7));
    const eased = progress * progress * (3 - 2 * progress);
    const fadeOut = Math.max(0, Math.min(1, (duration - elapsed) / 0.55));
    const alpha = eased * fadeOut;
    const width = Math.min(this.width - 24, Math.max(168, Math.min(380, this.width * 0.48)));
    const height = 62;
    const x = this.width - width - 12;
    const y = -height + (this.height * 0.15 + height) * eased;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(4, 12, 25, 0.92)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = alert.title === 'DREADNOUGHT' ? '#ed8196' : '#efb45d';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.6, y + 0.6, width - 1.2, height - 1.2);
    ctx.textAlign = 'center';
    ctx.fillStyle = alert.title === 'DREADNOUGHT' ? '#ff9cac' : '#ffd18a';
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.fillText(alert.title, x + width / 2, y + 20);
    ctx.fillStyle = '#d8e4f2';
    const fontSize = this.width < 520 ? 6.5 : 8;
    ctx.font = `900 ${fontSize}px ui-monospace, monospace`;
    const words = alert.detail.split(' ');
    const rows = [];
    let row = '';
    const maxWidth = width - 18;
    for (const word of words) {
      const candidate = row ? `${row} ${word}` : word;
      if (row && ctx.measureText(candidate).width > maxWidth) {
        rows.push(row);
        row = word;
      } else row = candidate;
    }
    if (row) rows.push(row);
    rows.slice(0, 2).forEach((line, index) => ctx.fillText(line, x + width / 2, y + 39 + index * (fontSize + 3), maxWidth));
    ctx.restore();
  }

  renderBossCinematic(ctx) {
    const cinematic = this.bossCinematic;
    if (!cinematic) return;
    ctx.save();
    if (cinematic.phase === 'loading') {
      ctx.fillStyle = 'rgba(2, 7, 18, 0.965)';
      ctx.fillRect(0, 0, this.width, this.height);
      const facts = [
        'REGISTRO GALÁCTICO: a antiga rota comercial foi abandonada após sinais de combate.',
        'SENSORES: algumas assinaturas energéticas persistem mesmo após a retirada das tropas.',
        'ARQUIVO DE BORDO: o espaço profundo ainda contém regiões sem mapeamento.',
        'PROTOCOLO VANGUARD: escudos, navegação e armamentos estão sendo sincronizados.'
      ];
      const fact = facts[Math.min(facts.length - 1, Math.floor(cinematic.phaseElapsed / 2.5))];
      ctx.textAlign = 'center';
      ctx.fillStyle = '#75e7f3';
      ctx.font = '900 10px ui-monospace, monospace';
      ctx.fillText('GALACTIC DEFENDER // REGISTRO DE OPERAÇÃO', this.width / 2, this.height * 0.37);
      ctx.fillStyle = '#f1f6ff';
      ctx.font = `900 ${Math.max(17, Math.min(27, this.width * 0.046))}px ui-monospace, monospace`;
      ctx.fillText('SINCRONIZANDO SISTEMAS', this.width / 2, this.height * 0.47, this.width * 0.9);
      ctx.fillStyle = '#b9c9dc';
      ctx.font = ` ${this.width < 520 ? 9 : 11}px ui-monospace, monospace`;
      ctx.fillText(fact, this.width / 2, this.height * 0.56, this.width * 0.86);
      const barWidth = Math.min(this.width * 0.68, 420);
      const barX = (this.width - barWidth) / 2;
      const barY = this.height * 0.65;
      ctx.fillStyle = '#18263a';
      ctx.fillRect(barX, barY, barWidth, 6);
      ctx.fillStyle = '#65e6ef';
      ctx.fillRect(barX, barY, barWidth * Math.max(0, Math.min(1, cinematic.phaseElapsed / cinematic.phaseDuration)), 6);
      ctx.fillStyle = '#91a9c2';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText('CALIBRAÇÃO DE NAVEGAÇÃO E DEFESA', this.width / 2, barY + 22);
    } else {
      ctx.fillStyle = 'rgba(2, 8, 20, 0.19)';
      ctx.fillRect(0, 0, this.width, this.height);
      const cue = getBossCinematicDialogue(cinematic);
      this.drawCinematicDialogue(ctx, cue);
      this.drawCinematicAlert(ctx, getBossCinematicAlert(cinematic));
    }
    ctx.restore();
  }

  renderRecurringBossDialogue(ctx) {
    if (!this.bossEncounterDialogue || this.bossEncounterDialogueTimer <= 0 || this.bossCinematic) return;
    const lines = this.bossEncounterDialogue.lines;
    const elapsed = this.bossEncounterDialogue.duration - this.bossEncounterDialogueTimer;
    const cue = lines[elapsed < this.bossEncounterDialogue.lineInterval ? 0 : 1];
    if (!cue) return;
    const width = Math.min(this.width - 24, 390);
    const x = (this.width - width) / 2;
    const y = Math.max(14, this.height - 112);
    ctx.save();
    ctx.fillStyle = 'rgba(4, 12, 25, 0.92)';
    ctx.fillRect(x, y, width, 66);
    ctx.strokeStyle = '#68dfe9';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.6, y + 0.6, width - 1.2, 64.8);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#68dfe9';
    ctx.font = '900 9px ui-monospace, monospace';
    ctx.fillText('PILOTO // VANGUARD', x + 11, y + 17);
    ctx.fillStyle = '#f0f5ff';
    ctx.font = `${this.width < 520 ? 10 : 12}px ui-monospace, monospace`;
    ctx.fillText(cue, x + 11, y + 41, width - 22);
    ctx.restore();
  }

  update(dt) {
    updatePilotReaction(this.pilotReaction, dt);
    if (this.bossCinematic) {
      this.updateBossCinematic(dt);
      return;
    }
    if (this.bossEncounterDialogueTimer > 0) {
      this.bossEncounterDialogueTimer = Math.max(0, this.bossEncounterDialogueTimer - dt);
      if (this.bossEncounterDialogueTimer === 0) this.bossEncounterDialogue = null;
    }
    let bossPresent = false;
    for (let index = 0; index < this.enemies.length; index += 1) {
      const enemy = this.enemies[index];
      if (enemy.active && enemy.type === 'boss') { bossPresent = true; break; }
    }
    if (bossPresent) this.bossEncounterSeen = true;
    // The 2.4x world is fully visible at its calculated minimum zoom (1 / arenaScale).
    // Keep the tactical overview after the boss is defeated until the next run.
    const targetCameraZoom = this.bossEncounterSeen ? this.cameraMinZoom : 1;
    this.cameraZoom += (targetCameraZoom - this.cameraZoom) * Math.min(1, dt * 1.65);

    for (let index = 0; index < this.stars.length; index += 1) {
      const star = this.stars[index];
      star.y += star.speed * dt * this.worldHeight;
      if (star.y > this.worldHeight) {
        star.y = 0;
        star.x = Math.random() * this.worldWidth;
      }
    }

    const mobileMode = document.documentElement.dataset.platform === 'mobile';
    const aimAngle = this.getAimAngle(mobileMode);
    this.player.update(dt, this.keys, this.worldWidth, this.worldHeight, this.joystick, aimAngle, !mobileMode);
    this.updateCamera(dt);
    this.levelUpToastTimer = Math.max(0, this.levelUpToastTimer - dt);
    const previousDamageFeedbackTimer = this.damageFeedbackTimer;
    this.damageFeedbackTimer = Math.max(0, this.damageFeedbackTimer - dt);
    if (previousDamageFeedbackTimer > 0 && this.damageFeedbackTimer === 0) {
      document.querySelector('#damage-feedback').classList.remove('damage-active');
    }
    // Update and compact short-lived effects in place to avoid allocating new arrays every frame.
    let writeIndex = 0;
    for (let index = 0; index < this.damageSparks.length; index += 1) {
      const spark = this.damageSparks[index];
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life -= dt;
      if (spark.life > 0) this.damageSparks[writeIndex++] = spark;
    }
    this.damageSparks.length = writeIndex;
    if (this.damageImpactPulse) {
      this.damageImpactPulse.life = Math.max(0, this.damageImpactPulse.life - dt);
      if (this.damageImpactPulse.life === 0) this.damageImpactPulse = null;
    }

    writeIndex = 0;
    for (let index = 0; index < this.shieldBreakEffects.length; index += 1) {
      const effect = this.shieldBreakEffects[index];
      effect.life -= dt;
      if (effect.life > 0) this.shieldBreakEffects[writeIndex++] = effect;
    }
    this.shieldBreakEffects.length = writeIndex;

    writeIndex = 0;
    for (let index = 0; index < this.levelUpParticles.length; index += 1) {
      const particle = this.levelUpParticles[index];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life > 0) this.levelUpParticles[writeIndex++] = particle;
    }
    this.levelUpParticles.length = writeIndex;

    this.updateContinuousLaser(dt);
    this.shotClock -= dt;
    if (this.keys.has('space') && this.shotClock <= 0) {
      const angle = this.getAimAngle();
      const muzzleDistance = 17;
      const projectileCount = 1 + this.player.doubleShotLevel;
      const spread = 0.14;
      for (let index = 0; index < projectileCount; index += 1) {
        const offset = (index - (projectileCount - 1) / 2) * spread;
        const projectileAngle = angle + offset;
        const muzzleX = this.player.x + Math.cos(projectileAngle) * muzzleDistance;
        const muzzleY = this.player.y + Math.sin(projectileAngle) * muzzleDistance;
        const projectile = new Projectile(
          muzzleX,
          muzzleY,
          projectileAngle,
          1 + this.player.projectileSpeedLevel * 0.15
        );
        projectile.damage = this.player.weaponDamage * (1 + this.player.laserLevel * 0.25) * (this.overload >= 70 ? 0.72 : 1);
        projectile.piercing = this.player.laserLevel > 0;
        this.projectiles.push(projectile);
      }
      gameAudio.playPlayerShot();
      this.addOverload(this.player.laserLevel > 0 ? 2.8 + this.player.laserLevel * 0.8 : 0.15);
      this.shotClock = .22 / (1 + this.player.fireRateLevel * 0.1);
    }

    // The wave-9 clear is the only entry point for the experimental campaign transition.
    const previousWave = this.waveManager.wave;
    const previousWaveState = this.waveManager.state;
    const spawnRequested = this.waveManager.update(dt, this.enemies.length);
    if (previousWave === 9 && previousWaveState === 'intermission' && this.waveManager.wave === 10 && this.waveManager.state === 'spawning') {
      this.beginBossCinematic();
      return;
    }
    if (spawnRequested) {
      const bossWave = (BOSS_TEST_MODE && this.waveManager.wave === 1) || (this.waveManager.wave >= 10 && this.waveManager.wave % 10 === 0);
      const zoom = Math.max(this.cameraMinZoom, this.cameraZoom || 1);
      const viewLeft = this.width / 2 + this.cameraX - this.width / (2 * zoom);
      const viewTop = this.height / 2 + this.cameraY - this.height / (2 * zoom);
      const visibleWidth = this.width / zoom;
      const margin = Math.min(20, visibleWidth / 2);
      const spawnX = bossWave
        ? this.width / 2 + this.cameraX
        : rand(viewLeft + margin, Math.max(viewLeft + margin, viewLeft + visibleWidth - margin));
      const roll = Math.random();
      const type = bossWave ? 'boss'
        : this.waveManager.wave >= 4 && roll < 0.12 ? 'artillery'
          : this.waveManager.wave >= 3 && roll < (this.waveManager.wave >= 4 ? 0.24 : 0.12) ? 'guardian'
            : this.waveManager.wave >= 2 && roll < (this.waveManager.wave >= 4 ? 0.49 : this.waveManager.wave >= 3 ? 0.37 : 0.25) ? 'sentinel'
              : this.waveManager.wave >= 2 && roll < (this.waveManager.wave >= 4 ? 0.67 : this.waveManager.wave >= 3 ? 0.55 : 0.43) ? 'interceptor'
                : 'chaser';
      // Elite variants enter gradually; warn only when a class actually spawns for the first time in this run.
      const isElite = !bossWave && (
        (this.waveManager.wave >= 12 && type === 'artillery' && Math.random() < 0.45) ||
        (this.waveManager.wave >= 14 && type === 'sentinel' && Math.random() < 0.30) ||
        (this.waveManager.wave >= 16 && type === 'guardian' && Math.random() < 0.24)
      );
      const spawnY = bossWave ? viewTop - 180 : viewTop + 20;
      this.enemies.push(new Enemy(spawnX, spawnY, this.waveManager.wave, type, isElite));
      if (bossWave) {
        this.bossEncounterCount += 1;
        if (this.waveManager.wave >= 20) {
          const firstReturn = this.waveManager.wave === 20;
          this.bossEncounterDialogue = {
            duration: 9,
            lineInterval: 4.5,
            lines: firstReturn
              ? ['Espere... eu já enfrentei essa nave. Como ela voltou?','É a mesma assinatura. Desta vez, vou estar preparado.']
              : ['De novo você? Achei que tinha acabado com essa nave.','Não vou deixar essa batalha se repetir do mesmo jeito.']
          };
          this.bossEncounterDialogueTimer = this.bossEncounterDialogue.duration;
        }
      }
      if (isElite && !this.eliteAlertsShown.has(type)) {
        this.eliteAlertsShown.add(type);
        triggerPilotReaction(this.pilotReaction, '❓', 1.55);
        const alerts = {
          artillery: ['AMEAÇA DE ARTILHARIA DETECTADA', 'A nave detectou um Artilheiro de Elite. Blindagem e poder de fogo acima do padrão.'],
          sentinel: ['AMEAÇA TÁTICA DETECTADA', 'A nave detectou uma Sentinela de Elite. Disparos de plasma em salva dupla.'],
          guardian: ['UNIDADE DEFENSIVA DETECTADA', 'A nave detectou um Guardião de Elite. Blindagem reforçada e proteção de aliados.']
        };
        const [heading, detail] = alerts[type];
        this.showRewardBanner(heading, detail, 'elite');
      }
    }

    for (let index = 0; index < this.projectiles.length; index += 1) {
      this.projectiles[index].update(dt);
    }
    this.guidedMissileCooldown = Math.max(0, this.guidedMissileCooldown - dt);
    this.player.guidedMissileCooldown = this.guidedMissileCooldown;
    this.shieldPulseCooldown = Math.max(0, this.shieldPulseCooldown - dt);
    this.overloadLockTimer = Math.max(0, this.overloadLockTimer - dt);
    this.overload = Math.max(0, this.overload - dt * (this.overloadLockTimer > 0 ? 16 : this.overload >= 70 ? 6 : 10));
    if (this.overloadLockTimer === 0 && this.overload >= this.overloadMax) this.overload = 68;
    this.player.overloadSpeedFactor = this.overloadLockTimer > 0 ? 0.68 : this.overload >= 70 ? 0.82 : 1;
    this.updateShieldPulseWave(dt);
    if (this.overload >= 90 || this.overloadLockTimer > 0) {
      this.overheatCriticalTimer = (this.overheatCriticalTimer || 0) + dt;
      this.overheatSparkTimer = (this.overheatSparkTimer || 0) - dt;
      // Smoke begins only after sustained critical heat; keep particle count and frequency low.
      if (this.overheatCriticalTimer >= 1.5 && this.overheatSparkTimer <= 0 && this.damageSparks.length < 10) {
        this.overheatSparkTimer = 0.72;
        const angle = rand(0, Math.PI * 2), speed = rand(5, 12), life = rand(0.45, 0.7);
        this.damageSparks.push({ x: this.player.x + Math.cos(angle) * 8, y: this.player.y + Math.sin(angle) * 8, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: rand(2, 3.5), length: 0, color: '#778391', kind: 'smoke' });
      }
    } else {
      this.overheatCriticalTimer = 0;
      this.overheatSparkTimer = 0;
    }
    // Fire the second missile after a short delay so both launches are readable.
    if (this.pendingGuidedMissileLaunch) {
      this.pendingGuidedMissileLaunch.timer -= dt;
      if (this.pendingGuidedMissileLaunch.timer <= 0) {
        const pending = this.pendingGuidedMissileLaunch;
        this.pendingGuidedMissileLaunch = null;
        this.createGuidedMissileFromWing(pending.side, pending.target, pending.level);
      }
    }
    // Build target reservations once per frame instead of rescanning every missile for every candidate enemy.
    const reservedMissileTargets = this.guidedMissileTargetReservations;
    reservedMissileTargets.clear();
    for (const missile of this.guidedMissiles) {
      if (missile.active && missile.target?.active) reservedMissileTargets.add(missile.target);
    }
    for (let index = 0; index < this.guidedMissiles.length; index += 1) {
      this.guidedMissiles[index].update(dt, this.enemies, this.worldWidth, this.worldHeight, this.guidedMissiles, reservedMissileTargets);
    }
    let effectWriteIndex = 0;
    for (const effect of this.guidedMissileEffects) {
      effect.life -= dt;
      if (effect.life > 0) this.guidedMissileEffects[effectWriteIndex++] = effect;
    }
    this.guidedMissileEffects.length = effectWriteIndex;
    for (let index = 0; index < this.enemyProjectiles.length; index += 1) {
      this.enemyProjectiles[index].update(dt);
    }

    // Reassign formations at a low cadence to avoid sorting the enemy roster every frame.
    this.guardianAssignmentTimer = Math.max(0, this.guardianAssignmentTimer - dt);
    if (this.guardianAssignmentTimer <= 0) {
      this.guardianAssignmentTimer = 0.35;
      // Elite Guardians receive assignments first; protection priority is then
      // based on ally class/rank, with distance as the tie-breaker.
      const assignedAllies = new Set();
      for (let priorityPass = 0; priorityPass < 2; priorityPass += 1) {
        const elitePass = priorityPass === 0;
        for (const guardian of this.enemies) {
          if (!guardian.active || guardian.type !== 'guardian' || Boolean(guardian.isElite) !== elitePass) continue;
          guardian.protectedAllies = selectGuardianProtectionTargets(
            guardian, this.enemies, assignedAllies, 360
          );
          for (const ally of guardian.protectedAllies) assignedAllies.add(ally);
        }
      }
    }

    this.eliteTactics.update(dt, this.enemies, this.player, this.worldWidth, this.worldHeight);
    const eliteFlankActive = Boolean(this.eliteTactics.activeFlanker?.active && this.eliteTactics.activeFlanker.flankTimer > 0);
    this.enemyTactics.update(dt, this.enemies, this.player, this.worldWidth, this.worldHeight, eliteFlankActive);

    for (let index = 0; index < this.enemies.length; index += 1) {
      const enemy = this.enemies[index];
      const zoom = Math.max(this.cameraMinZoom, this.cameraZoom || 1);
      const cameraTop = this.height / 2 + this.cameraY - this.height / (2 * zoom);
      const shot = enemy.update(dt, this.player.x, this.player.y, this.worldWidth, this.worldHeight, this.projectiles, this.enemies, cameraTop, this.player.velocityX, this.player.velocityY);
      if (enemy.type === 'boss' && !enemy.bossDying) {
        const mainCannon = enemy.bossSystems?.getModule('main-energy-cannon');
        if (mainCannon) {
          const beam = getBossBeamSegment(enemy, mainCannon);
          const warningActive = mainCannon.energyState === 'warning';
          const threatensPilot = warningActive && circleOverlapsSegment(
            this.player, beam.startX, beam.startY, beam.endX, beam.endY,
            (this.player.radius ?? 0) + beam.width / 2
          );
          signalPilotThreat(this.pilotReaction, mainCannon, threatensPilot);
        }
        for (const module of enemy.bossSystems?.modules || []) {
          if (!module.kind.includes('plasma')) continue;
          const warningActive = isBossPlasmaTelegraphActive(enemy, module, this.player.x, this.player.y);
          const segment = warningActive ? getBossPlasmaSegment(enemy, module) : null;
          const threatensPilot = Boolean(segment && circleOverlapsSegment(
            this.player, segment.startX, segment.startY, segment.endX, segment.endY,
            (this.player.radius ?? 0) + segment.width / 2
          ));
          signalPilotThreat(this.pilotReaction, module, threatensPilot);
        }
        if (mainCannon?.energyState === 'firing' && !enemy.bossBeamHit) {
          const beam = getBossBeamSegment(enemy, mainCannon);
          const hitRadius = (this.player.radius ?? 0) + beam.width / 2;
          if (circleOverlapsSegment(this.player, beam.startX, beam.startY, beam.endX, beam.endY, hitRadius)) {
            enemy.bossBeamHit = true;
            this.resolveIncomingDamage(mainCannon.energyDamage ?? 34, beam.startX, beam.startY, true);
            this.triggerSystemDisruption(0.65);
          }
        }
      }
      if (enemy.type === 'boss' && enemy.bossDying) {
        if (enemy.bossDeathTimer >= enemy.bossDeathDuration) {
          enemy.active = false;
          this.awardEnemyKill(enemy);
        }
        continue;
      }
      if (shot) {
        const shots = Array.isArray(shot) ? shot : [shot];
        for (const projectileData of shots) {
          this.enemyProjectiles.push(new EnemyProjectile(
            projectileData.x, projectileData.y, projectileData.targetX, projectileData.targetY,
            { ...projectileData, target: projectileData.homing ? this.player : null }
          ));
        }
        gameAudio.playEnemyShot(shots[0].color);
      }
    }

    // Soft local separation prevents hostile ships from stacking while preserving their current tactics.
    for (let i = 0; i < this.enemies.length; i += 1) {
      const first = this.enemies[i];
      if (!first.active || first.bossDying) continue;
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const second = this.enemies[j];
        if (!second.active || second.bossDying) continue;
        const firstRadius = first.collisionRadius ?? first.radius;
        const secondRadius = second.collisionRadius ?? second.radius;
        const minimumDistance = firstRadius + secondRadius + 4;
        let dx = second.x - first.x;
        let dy = second.y - first.y;
        // Reject distant pairs on the cheap axis checks before multiplying.
        if (Math.abs(dx) >= minimumDistance || Math.abs(dy) >= minimumDistance) continue;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= minimumDistance * minimumDistance) continue;
        if (distanceSquared < 0.01) {
          const angle = first.phase - second.phase || 0.5;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distanceSquared = 1;
        }
        const distance = Math.sqrt(distanceSquared);
        const overlap = minimumDistance - distance;
        const separation = Math.min(3.5, overlap * 0.32);
        const totalRadius = Math.max(1, firstRadius + secondRadius);
        const firstShare = secondRadius / totalRadius;
        const secondShare = firstRadius / totalRadius;
        const pushX = dx / distance * separation;
        const pushY = dy / distance * separation;
        first.x -= pushX * firstShare;
        first.y -= pushY * firstShare;
        second.x += pushX * secondShare;
        second.y += pushY * secondShare;
        first.x = Math.max(firstRadius, Math.min(this.worldWidth - firstRadius, first.x));
        first.y = Math.max(firstRadius, Math.min(this.worldHeight - firstRadius, first.y));
        second.x = Math.max(secondRadius, Math.min(this.worldWidth - secondRadius, second.x));
        second.y = Math.max(secondRadius, Math.min(this.worldHeight - secondRadius, second.y));
      }
    }

    this.updateShieldThreats(dt);

    // Resolve projectile hits once, awarding score, XP, and mission progress.
    for (const shot of this.projectiles) {
      if (!shot.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.bossDying || shot.hitEnemies.has(enemy)) continue;
        // Cheap axis-aligned rejection avoids the squared-distance test for
        // pairs that cannot overlap; the exact circle test remains authoritative.
        const bossHull = enemy.type === 'boss';
        const combinedRadius = (shot.radius ?? 0) + (bossHull ? enemy.radius * 2.18 : enemy.collisionRadius ?? enemy.radius ?? 0);
        if (Math.abs(shot.x - enemy.x) >= combinedRadius || Math.abs(shot.y - enemy.y) >= combinedRadius) continue;
        const overlaps = bossHull
          ? orientedEllipseOverlapsCircle(enemy, shot, enemy.radius * 1.42, enemy.radius * 2.18, enemy.facingRotation + Math.PI / 2)
          : circlesOverlap(shot, enemy, shot.radius ?? 0, enemy.collisionRadius ?? enemy.radius ?? 0);
        if (overlaps) {
          shot.hitEnemies.add(enemy);
          if (!shot.piercing) shot.active = false;
          this.damageEnemy(enemy, shot.damage ?? 1, shot.x, shot.y);
          if (!shot.piercing) break;
        }
      }
    }

    // Attack Clash: direct player-shot/enemy-shot overlaps neutralize both projectiles.
    // This is intentionally separate from damage-to-enemy rules and requires no per-frame UI.
    for (const playerShot of this.projectiles) {
      if (!playerShot.active) continue;
      for (const enemyShot of this.enemyProjectiles) {
        if (!enemyShot.active) continue;
        const combinedRadius = (playerShot.radius ?? 0) + (enemyShot.radius ?? 0);
        if (Math.abs(playerShot.x - enemyShot.x) >= combinedRadius ||
            Math.abs(playerShot.y - enemyShot.y) >= combinedRadius) continue;
        if (circlesOverlap(playerShot, enemyShot)) {
          const playerPower = Math.max(1, Math.floor((playerShot.damage ?? 1) / 4));
          playerShot.active = false;
          if (playerPower >= (enemyShot.clashResistance ?? 1)) {
            enemyShot.active = false;
          } else {
            enemyShot.clashResistance -= playerPower;
          }
          break;
        }
      }
    }

    // Each guided missile detonates once and deals area damage to nearby enemies.
    for (const missile of this.guidedMissiles) {
      if (!missile.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.bossDying) continue;
        const bossHull = enemy.type === 'boss';
        const combinedRadius = (missile.radius ?? 0) + (bossHull ? enemy.radius * 2.18 : enemy.collisionRadius ?? enemy.radius ?? 0);
        if (Math.abs(missile.x - enemy.x) >= combinedRadius || Math.abs(missile.y - enemy.y) >= combinedRadius) continue;
        const overlaps = bossHull
          ? orientedEllipseOverlapsCircle(enemy, missile, enemy.radius * 1.42, enemy.radius * 2.18, enemy.facingRotation + Math.PI / 2)
          : circlesOverlap(missile, enemy, missile.radius ?? 0, enemy.collisionRadius ?? enemy.radius ?? 0);
        if (overlaps) {
          missile.active = false;
          this.explodeGuidedMissile(missile);
          break;
        }
      }
    }

    // Contact damage is throttled per enemy. A charged shield absorbs contact
    // without instantly destroying enemies or losing all charge in a few frames.
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.bossDying) continue;
      const bossHull = enemy.type === 'boss';
      const contactRadius = (this.player.radius ?? 0) + (bossHull ? enemy.radius * 2.18 : enemy.collisionRadius ?? enemy.radius ?? 0);
      if (Math.abs(this.player.x - enemy.x) >= contactRadius || Math.abs(this.player.y - enemy.y) >= contactRadius) continue;
      const touchingHull = bossHull
        ? orientedEllipseOverlapsCircle(enemy, this.player, enemy.radius * 1.42, enemy.radius * 2.18, enemy.facingRotation + Math.PI / 2)
        : circlesOverlap(this.player, enemy, this.player.radius ?? 0, enemy.collisionRadius ?? enemy.radius ?? 0);
      if (touchingHull && enemy.contactCooldown <= 0) {
        const shieldWasActive = this.player.shieldHealth > 0;
        enemy.contactCooldown = 0.75;
        // Ordinary enemies can be destroyed by an unshielded ram; bosses must never die from contact alone.
        if (!shieldWasActive && enemy.type !== 'boss' && enemy.type !== 'megaboss') enemy.active = false;
        this.resolveIncomingDamage(18, enemy.x, enemy.y, enemy.type === 'boss' || enemy.type === 'megaboss');
      }
    }

    // Enemy shots deal damage on direct impact and respect the player's invulnerability window.
    for (const shot of this.enemyProjectiles) {
      if (!shot.active) continue;
      const impactRadius = (this.player.radius ?? 0) + (shot.radius ?? 0);
      if (Math.abs(this.player.x - shot.x) >= impactRadius ||
          Math.abs(this.player.y - shot.y) >= impactRadius) continue;
      if (circlesOverlap(this.player, shot)) {
        shot.active = false;
        if (shot.plasmaImpact) this.resolvePlasmaImpact(shot);
        else this.resolveIncomingDamage(shot.damage, shot.x, shot.y, shot.heavyImpact || shot.damage >= 10);
      }
    }

    this.handleMissionCompletion(this.mission.update(dt, this.waveManager.wave));

    // Compact entity lists in place instead of allocating replacement arrays each frame.
    let projectileWriteIndex = 0;
    for (let index = 0; index < this.projectiles.length; index += 1) {
      const shot = this.projectiles[index];
      if (
        shot.active &&
        shot.x > -20 && shot.x < this.worldWidth + 20 &&
        shot.y > -20 && shot.y < this.worldHeight + 20
      ) {
        this.projectiles[projectileWriteIndex++] = shot;
      }
    }
    this.projectiles.length = projectileWriteIndex;

    let guidedMissileWriteIndex = 0;
    for (let index = 0; index < this.guidedMissiles.length; index += 1) {
      const missile = this.guidedMissiles[index];
      if (missile.active) this.guidedMissiles[guidedMissileWriteIndex++] = missile;
    }
    this.guidedMissiles.length = guidedMissileWriteIndex;

    let enemyProjectileWriteIndex = 0;
    for (let index = 0; index < this.enemyProjectiles.length; index += 1) {
      const shot = this.enemyProjectiles[index];
      if (
        shot.active &&
        shot.x > -20 && shot.x < this.worldWidth + 20 &&
        shot.y > -20 && shot.y < this.worldHeight + 20
      ) {
        this.enemyProjectiles[enemyProjectileWriteIndex++] = shot;
      }
    }
    this.enemyProjectiles.length = enemyProjectileWriteIndex;

    let enemyWriteIndex = 0;
    for (let index = 0; index < this.enemies.length; index += 1) {
      const enemy = this.enemies[index];
      if (enemy.active) this.enemies[enemyWriteIndex++] = enemy;
    }
    this.enemies.length = enemyWriteIndex;
    if (this.player.health <= 0) this.endGame();
  }

  endGame() {
    this.status = 'gameover';
    this.achievements.recordRun(this.score, this.waveManager.wave);
    document.querySelector('#final-score').textContent = `Pontuação: ${String(this.score).padStart(6, '0')}`;
    this.gameoverOverlay.classList.remove('hidden');
    cancelAnimationFrame(this.animationId);
  }

  renderFrame() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const cameraZoom = this.bossCinematic ? Math.max(this.cameraMinZoom, this.bossCinematic.cameraZoom) : Math.max(this.cameraMinZoom, Math.min(1, this.cameraZoom || 1));
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-this.width / 2 - this.cameraX, -this.height / 2 - this.cameraY);
    if (this.backgroundCanvas.width && this.backgroundCanvas.height) {
      const viewLeft = this.width / 2 + this.cameraX - this.width / (2 * cameraZoom);
      const viewTop = this.height / 2 + this.cameraY - this.height / (2 * cameraZoom);
      ctx.drawImage(this.backgroundCanvas, viewLeft, viewTop, this.width / cameraZoom, this.height / cameraZoom);
    }

    for (let index = 0; index < this.stars.length; index += 1) {
      const star = this.stars[index];
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#a9d7ff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    ctx.globalAlpha = 1;
    if (this.continuousLaserHeld && this.player.continuousLaserLevel > 0) { const dx=Math.cos(this.player.rotation),dy=Math.sin(this.player.rotation),sx=this.player.x+dx*18,sy=this.player.y+dy*18,ex=sx+dx*460,ey=sy+dy*460; ctx.save();ctx.lineCap='round';ctx.globalAlpha=.2;ctx.strokeStyle='#44dfff';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=.92;ctx.strokeStyle='#6eeeff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#eaffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.restore(); }
    for (let index = 0; index < this.projectiles.length; index += 1) this.projectiles[index].draw(ctx);
    for (let index = 0; index < this.enemyProjectiles.length; index += 1) this.enemyProjectiles[index].draw(ctx);
    for (let index = 0; index < this.enemies.length; index += 1) this.enemies[index].draw(ctx);
    if (this.bossCinematic?.boss) {
      const cinematic = this.bossCinematic;
      const revealAlpha = cinematic.phase === 'distant-contact'
        ? Math.max(0, Math.min(1, (cinematic.phaseElapsed - 0.35) / 2.1))
        : cinematic.phase === 'boss-identification' || cinematic.phase === 'handoff' ? 1 : 0;
      if (revealAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = revealAlpha;
        cinematic.boss.draw(ctx);
        ctx.restore();
      }
    }
    // Main-cannon telegraph and beam use the exact same world-space segment as collision.
    for (const boss of this.enemies) {
      if (!boss.active || boss.type !== 'boss' || boss.bossDying) continue;
      const cannon = boss.bossSystems?.getModule('main-energy-cannon');
      if (!cannon || (cannon.energyState !== 'warning' && cannon.energyState !== 'firing')) continue;
      const beam = getBossBeamSegment(boss, cannon);
      ctx.save();
      ctx.lineCap = 'round';
      if (cannon.energyState === 'warning') {
        const pulse = 0.72 + Math.sin(boss.phase * 18) * 0.18;
        ctx.globalAlpha = 0.12 * pulse;
        ctx.strokeStyle = '#ff4d32';
        ctx.lineWidth = beam.width * 0.72;
        ctx.beginPath(); ctx.moveTo(beam.startX, beam.startY); ctx.lineTo(beam.endX, beam.endY); ctx.stroke();
        ctx.globalAlpha = 0.82 * pulse;
        ctx.strokeStyle = '#ff9a55';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([18, 13]);
        ctx.beginPath(); ctx.moveTo(beam.startX, beam.startY); ctx.lineTo(beam.endX, beam.endY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ffb06a';
        ctx.beginPath(); ctx.arc(beam.endX, beam.endY, 7, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = 0.20;
        ctx.strokeStyle = '#ff3d2e';
        ctx.lineWidth = beam.width * 1.55;
        ctx.beginPath(); ctx.moveTo(beam.startX, beam.startY); ctx.lineTo(beam.endX, beam.endY); ctx.stroke();
        ctx.globalAlpha = 0.88;
        ctx.strokeStyle = '#ff6a3d';
        ctx.lineWidth = beam.width * 0.58;
        ctx.beginPath(); ctx.moveTo(beam.startX, beam.startY); ctx.lineTo(beam.endX, beam.endY); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff0c9';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(beam.startX, beam.startY); ctx.lineTo(beam.endX, beam.endY); ctx.stroke();
      }
      ctx.restore();
    }
    // Plasma telegraphs reuse the muzzle/trajectory geometry used by threat detection.
    for (const boss of this.enemies) {
      if (!boss.active || boss.type !== 'boss' || boss.bossDying) continue;
      for (const module of boss.bossSystems?.modules || []) {
        if (!isBossPlasmaTelegraphActive(boss, module, this.player.x, this.player.y)) continue;
        const segment = getBossPlasmaSegment(boss, module);
        if (!circleOverlapsSegment(this.player, segment.startX, segment.startY, segment.endX, segment.endY,
          (this.player.radius ?? 0) + segment.width / 2)) continue;
        const pulse = 0.72 + Math.sin(boss.phase * 16 + (module.x < 0 ? 0 : Math.PI)) * 0.16;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.12 * pulse;
        ctx.strokeStyle = '#ff9d48';
        ctx.lineWidth = segment.width;
        ctx.beginPath(); ctx.moveTo(segment.startX, segment.startY); ctx.lineTo(segment.endX, segment.endY); ctx.stroke();
        ctx.globalAlpha = 0.82 * pulse;
        ctx.strokeStyle = '#ffd08a';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 9]);
        ctx.beginPath(); ctx.moveTo(segment.startX, segment.startY); ctx.lineTo(segment.endX, segment.endY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffe2a8';
        ctx.beginPath(); ctx.arc(segment.startX, segment.startY, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // Elite Guardian's shared barrier is drawn around each of its assigned allies.
    for (const guardian of this.enemies) {
      if (!guardian.active || !guardian.isElite || guardian.type !== 'guardian' || guardian.guardianCoverShield <= 0) continue;
      const ratio = guardian.guardianCoverShield / Math.max(1, guardian.guardianCoverShieldMax);
      ctx.save();
      ctx.strokeStyle = '#83f0c5';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.18 + ratio * 0.38;
      for (const ally of guardian.protectedAllies || []) {
        if (!ally.active) continue;
        ctx.beginPath();
        ctx.arc(ally.x, ally.y, ally.radius + 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (let index = 0; index < this.guidedMissileEffects.length; index += 1) {
      const effect = this.guidedMissileEffects[index];
      const progress = 1 - effect.life / effect.maxLife;
      const fade = Math.max(0, effect.life / effect.maxLife);
      const radius = effect.radius * (0.35 + progress * 0.65);
      ctx.save();
      ctx.globalAlpha = fade * 0.18; ctx.fillStyle = '#ffb45e';
      ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = fade * 0.9; ctx.strokeStyle = '#ffb45e'; ctx.lineWidth = 3 * fade + 0.5;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = fade * 0.72; ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, radius * 0.68, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Blink during the brief invulnerability window after taking damage.
    const playerVisible = this.player.invulnerabilityTimer <= 0 ||
      Math.floor(this.player.invulnerabilityTimer * 12) % 2 === 0;
    this.drawShield(ctx);
    this.player.draw(ctx, playerVisible);
    if (!this.bossCinematic && this.pilotReaction.remaining > 0) {
      this.drawPilotReaction(ctx, this.player.x + (this.player.radius ?? 12) + 18, this.player.y - (this.player.radius ?? 12) - 18);
    }
    // Draw missiles after the ship so the hull cannot hide a launch from either wing.
    for (let index = 0; index < this.guidedMissiles.length; index += 1) this.guidedMissiles[index].draw(ctx);

    // Lightweight plasma-smoke rupture: preserve the semicircular rim, remove
    // the large translucent fill that covered the playfield and cost fill-rate.
    if (this.shieldPulseWave) {
      const wave = this.shieldPulseWave;
      const fade = Math.max(0, Math.min(1, wave.life / 0.24));
      const radius = Math.max(8, wave.traveled);
      const centerAngle = Math.atan2(wave.directionY, wave.directionX);
      ctx.save();
      ctx.translate(wave.originX, wave.originY);
      ctx.lineCap = 'round';

      // A soft, narrow cyan rim suggests drifting plasma without a filled wedge.
      ctx.globalAlpha = fade * 0.16;
      ctx.strokeStyle = '#39dfff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, radius, centerAngle - wave.halfAngle, centerAngle + wave.halfAngle);
      ctx.stroke();

      // Two slim neon contours create a smoky, energized edge at low rendering cost.
      ctx.globalAlpha = fade * 0.86;
      ctx.strokeStyle = '#8cf7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, centerAngle - wave.halfAngle, centerAngle + wave.halfAngle);
      ctx.stroke();

      ctx.globalAlpha = fade * 0.34;
      ctx.strokeStyle = '#7ba8ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, radius - 4), centerAngle - wave.halfAngle, centerAngle + wave.halfAngle);
      ctx.stroke();
      ctx.restore();
    }

    // Lightweight dual-ring shockwave without per-frame shadow blur.
    for (let index = 0; index < this.shieldBreakEffects.length; index += 1) {
      const effect = this.shieldBreakEffects[index];
      const progress = 1 - effect.life / effect.maxLife;
      const fade = Math.max(0, effect.life / effect.maxLife);
      ctx.save();
      ctx.globalAlpha = fade * (effect.kind === 'pulse' ? 0.9 : 0.72);
      ctx.strokeStyle = effect.kind === 'pulse' ? '#67f0cf' : '#8be5ff';
      ctx.lineWidth = 2.1 * (1 - progress) + 0.7;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Red circuit sparks and a brief edge flash make incoming damage easier to notice.
    // Indexed iteration avoids allocating a callback on every rendered frame.
    for (let index = 0; index < this.damageSparks.length; index += 1) {
      const spark = this.damageSparks[index];
      const fade = Math.max(0, spark.life / spark.maxLife);
      ctx.save();
      ctx.translate(spark.x, spark.y);
      ctx.globalAlpha = fade;
      if (spark.kind === 'smoke') {
        ctx.fillStyle = spark.color || '#788493';
        ctx.beginPath();
        ctx.arc(0, 0, spark.size * (1 + (1 - fade) * 0.7), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.rotate(Math.atan2(spark.vy, spark.vx));
      ctx.strokeStyle = spark.color || (fade > 0.55 ? '#ffdce3' : '#ff526f');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-spark.length * 0.6, 0);
      ctx.lineTo(-spark.length * 0.15, -2);
      ctx.lineTo(spark.length, 0);
      ctx.stroke();
      ctx.restore();
    }
    if (this.damageImpactPulse) {
      const pulse = this.damageImpactPulse;
      const progress = 1 - pulse.life / pulse.maxLife;
      const radius = (this.player.radius || 12) * (1.05 + progress * 1.45);
      ctx.save();
      ctx.globalAlpha = (pulse.life / pulse.maxLife) * 0.68;
      ctx.strokeStyle = '#ff9d45';
      ctx.lineWidth = 2.2 - progress * 0.8;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (this.damageFeedbackTimer > 0) {
      const flash = Math.min(1, this.damageFeedbackTimer / 0.48);
      ctx.save();
      ctx.globalAlpha = flash * 0.16;
      ctx.strokeStyle = '#ff526f';
      ctx.lineWidth = 3;
      const zoom = Math.max(this.cameraMinZoom, this.cameraZoom || 1);
      const viewLeft = this.width / 2 + this.cameraX - this.width / (2 * zoom);
      const viewTop = this.height / 2 + this.cameraY - this.height / (2 * zoom);
      ctx.strokeRect(viewLeft + 4 / zoom, viewTop + 4 / zoom, (this.width - 8) / zoom, (this.height - 8) / zoom);
      ctx.restore();
    }

    // Draw a restrained reticle only after mouse aiming has been activated.
    if (this.aim.active && this.status === 'running') {
      ctx.save();
      ctx.strokeStyle = '#8cf5c7';
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.aim.x, this.aim.y, 7, 0, Math.PI * 2);
      ctx.moveTo(this.aim.x - 11, this.aim.y);
      ctx.lineTo(this.aim.x - 4, this.aim.y);
      ctx.moveTo(this.aim.x + 4, this.aim.y);
      ctx.lineTo(this.aim.x + 11, this.aim.y);
      ctx.moveTo(this.aim.x, this.aim.y - 11);
      ctx.lineTo(this.aim.x, this.aim.y - 4);
      ctx.moveTo(this.aim.x, this.aim.y + 4);
      ctx.lineTo(this.aim.x, this.aim.y + 11);
      ctx.stroke();
      ctx.restore();
    }

    // Short-lived gold particles make level gains visible without blocking play.
    for (let index = 0; index < this.levelUpParticles.length; index += 1) {
      const particle = this.levelUpParticles[index];
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.translate(particle.x, particle.y);
      ctx.rotate((1 - particle.life / particle.maxLife) * Math.PI);
      ctx.fillStyle = '#ffe68a';
      ctx.beginPath();
      ctx.moveTo(0, -particle.size * 1.8);
      ctx.lineTo(particle.size * 0.45, -particle.size * 0.45);
      ctx.lineTo(particle.size * 1.8, 0);
      ctx.lineTo(particle.size * 0.45, particle.size * 0.45);
      ctx.lineTo(0, particle.size * 1.8);
      ctx.lineTo(-particle.size * 0.45, particle.size * 0.45);
      ctx.lineTo(-particle.size * 1.8, 0);
      ctx.lineTo(-particle.size * 0.45, -particle.size * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    this.renderBossCinematic(ctx);
    this.renderRecurringBossDialogue(ctx);
  }
}
