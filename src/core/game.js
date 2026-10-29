import { Player } from '../player/player.js?v=0.19.0';
import { Enemy } from '../enemies/enemy.js?v=0.19.0';
import { Projectile } from '../combat/projectile.js?v=0.19.0';
import { EnemyProjectile } from '../combat/enemy-projectile.js?v=0.19.0';
import { Progression } from '../progression/progression.js?v=0.19.0';
import { Mission } from '../missions/missions.js?v=0.19.0';
import { WaveManager } from './wave-manager.js?v=0.19.0';
import { updateHud } from '../ui/hud.js?v=0.19.0';
import { gameAudio } from '../audio/game-audio.js?v=0.19.0';
import { AchievementTracker } from '../progression/achievements.js?v=0.19.0';

const rand = (min, max) => Math.random() * (max - min) + min;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.player = new Player(this.width, this.height);

    this.progression = new Progression();
    this.achievements = new AchievementTracker();
    this.mission = new Mission();
    this.waveManager = new WaveManager();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.stars = Array.from({ length: 95 }, () => ({
      x: Math.random(),
      y: Math.random(),
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
    this.lastTime = 0;
    this.animationId = 0;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.shieldBreakEffects = [];
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
    this.backgroundCanvas = document.createElement('canvas');
    this.bindOverlayElements();
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
    // The canvas may be measured while its parent menu hides it (1x1 px).
    // Place the ship at a proper gameplay position once real dimensions are available.
    if (wasUninitialized || previousLandscape !== isLandscape) {
      this.player.y = this.height * (isLandscape ? 0.66 : 0.78);
      this.player.x = this.width / 2;
    }
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.pixelRatio = ratio;
    this.cacheBackground();
    this.player.fitToArena(this.width, this.height);
    this.renderFrame(0);
  }

  cacheBackground() {
    const ratio = this.pixelRatio || 1;
    const canvas = this.backgroundCanvas;
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
    this.player = new Player(this.width, this.height);
    this.progression = new Progression();
    this.mission = new Mission();
    this.waveManager.reset();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.shieldBreakEffects = [];
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
    updateHud(this);
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
    for (let i = 0; i < 22; i += 1) {
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
      { type: 'integrity', icon: '⬡', title: 'Estrutura reforçada', description: '+10% de integridade máxima', category: 'ATRIBUTO' }
    ];
    const specials = [
      { type: 'doubleShot', icon: '✣', title: 'Tiro múltiplo', description: 'Adiciona projéteis laterais', category: 'HABILIDADE ESPECIAL' },
      { type: 'laser', icon: 'ϟ', title: 'Laser perfurante', description: 'Projéteis atravessam inimigos', category: 'HABILIDADE ESPECIAL' },
      { type: 'shield', icon: '◈', title: 'Escudo de energia', description: 'Barreira regenerativa com explosão ao quebrar', category: 'HABILIDADE ESPECIAL' },
      { type: 'repair', icon: '✚', title: 'Reparo de emergência', description: 'Recupera 30% da integridade máxima', category: 'HABILIDADE ESPECIAL' }
    ];
    const options = [...(current.category === 'special' ? specials : attributes)];
    for (let i = options.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    this.currentUpgradeOptions = options.slice(0, 3);
    const overlay = document.querySelector('#upgrade-overlay');
    overlay.classList.remove('hidden');
    document.querySelector('#upgrade-title').innerHTML = current.category === 'special' ? 'Escolha uma<br><span>habilidade especial.</span>' : 'Escolha uma<br><span>melhoria.</span>';
    document.querySelector('#upgrade-level-label').textContent = `NÍVEL ${current.level} · ${current.category === 'special' ? 'HABILIDADE ESPECIAL' : 'ATRIBUTOS DA NAVE'}`;
    [...overlay.querySelectorAll('[data-upgrade]')].forEach((button, index) => {
      const card = this.currentUpgradeOptions[index];
      button.dataset.upgrade = card.type;
      button.className = 'upgrade-card';
      button.setAttribute('aria-label', `${card.title}. ${card.description}`);
      button.innerHTML = `<span class="upgrade-card-icon" aria-hidden="true">${card.icon}</span><span class="upgrade-card-category">${card.category}</span><strong>${card.title}</strong><small>${card.description}</small>`;
    });
    overlay.classList.toggle('is-special-choice', current.category === 'special');
  }

  chooseUpgrade(type) {
    if (this.status !== 'upgrade' || !this.pendingUpgradeChoices.length) return;
    if (!this.currentUpgradeOptions.some((option) => option.type === type)) return;
    if (type === 'damage') this.player.weaponDamage = Math.min(2.5, this.player.weaponDamage * 1.10);
    if (type === 'speed') this.player.speed = Math.min(this.player.baseSpeed * 1.5, this.player.speed * 1.06);
    if (type === 'integrity') this.player.maxHealth = Math.min(this.player.baseMaxHealth * 1.6, this.player.maxHealth * 1.10);
    if (type === 'doubleShot') this.player.doubleShotLevel = Math.min(2, this.player.doubleShotLevel + 1);
    if (type === 'laser') this.player.laserLevel = Math.min(3, this.player.laserLevel + 1);
    if (type === 'shield') this.player.upgradeShield();
    if (type === 'repair') this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * 0.30);
    this.pendingUpgradeChoices.shift();
    updateHud(this);
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
    // Brief red electrical sparks around the ship communicate a hit without obscuring play.
    for (let i = 0; i < 9; i += 1) {
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
    const feedback = document.querySelector('#damage-feedback');
    feedback.textContent = `INTEGRIDADE -${amount}`;
    this.restartFeedbackAnimation(feedback, 'damage-active');
  }

  resolveIncomingDamage(amount) {
    const shieldBefore = this.player.shieldHealth;
    const tookDamage = this.player.takeDamage(amount);
    if (shieldBefore > 0 && this.player.shieldHealth === 0) {
      this.triggerShieldBreak();
    } else if (tookDamage) {
      this.triggerDamageFeedback(amount);
      gameAudio.playDamage();
    }
  }

  triggerShieldBreak() {
    const x = this.player.x;
    const y = this.player.y;
    const radius = 96;
    const life = 0.58;
    this.shieldBreakEffects.push({ x, y, radius, life, maxLife: life });
    // Compare squared distances to avoid square roots during area-damage checks.
    const radiusSquared = radius * radius;
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (enemy.active && dx * dx + dy * dy <= radiusSquared) {
        this.damageEnemy(enemy, 2);
      }
    }
  }

  damageEnemy(enemy, amount) {
    if (!enemy.active) return;
    enemy.health = Math.max(0, enemy.health - amount);
    if (enemy.health > 0) return;
    enemy.active = false;
    this.score += enemy.type === 'boss' ? 1000 : 100;
    this.destroyed += 1;
    const newlyUnlocked = this.achievements.record('kills');
    if (enemy.type === 'boss') newlyUnlocked.push(...this.achievements.record('bosses'));
    const xpRewards = { chaser: 20, interceptor: 15, sentinel: 35, boss: 180 };
    const xpGained = xpRewards[enemy.type] ?? 20;
    const levelsGained = this.progression.addXp(xpGained);
    if (enemy.type === 'boss') this.showRewardBanner('CHEFE DERROTADO', `+${xpGained} XP · +1.000 PTS`, 'boss');
    if (levelsGained > 0) this.triggerLevelUp(levelsGained);
    const missionCompletion = this.mission.registerKill();
    if (missionCompletion) this.handleMissionCompletion(missionCompletion, newlyUnlocked);
    else if (newlyUnlocked.length) this.showRewardBanner('CONQUISTA DESBLOQUEADA', newlyUnlocked.map(item => item.name).join(' · '), 'achievement');
  }

  drawShield(ctx) {
    const player = this.player;
    if (player.shieldLevel <= 0) return;

    const ratio = player.shieldMaxHealth > 0
      ? player.shieldHealth / player.shieldMaxHealth
      : 0;

    // One state save/restore covers both the barrier and its status bar.
    // Drawing in world coordinates avoids a per-frame translate for this small effect.
    ctx.save();

    if (player.shieldHealth > 0) {
      // Keep the shield glow lightweight: no shadowBlur or particle system.
      const pulse = 0.5 + Math.sin(player.flamePhase * 4) * 0.06;
      const weak = ratio <= 0.34;
      const mainColor = weak ? '#ffc477' : '#79dcff';
      const edgeColor = weak ? '#ff9d62' : '#43bfff';

      ctx.globalAlpha = 0.12 + pulse * 0.16;
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 24, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.72 + pulse * 0.35;
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 23, 27, 0, 0, Math.PI * 2);
      ctx.stroke();

      // The inset contour preserves depth without blur filters.
      ctx.globalAlpha = 0.35 + pulse * 0.2;
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, 19, 23, 0, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }

    const barWidth = 38;
    const barHeight = 4;
    let barY = player.y - 35;
    if (barY < 8) barY = player.y + 34;
    const barX = player.x - barWidth / 2;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#071526';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#69cfff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = ratio > 0.34 ? '#4acbff' : '#ffbd69';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barWidth - 2) * ratio), barHeight - 2);
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9f0ff';
    ctx.fillText(player.shieldHealth > 0 ? 'ESCUDO' : `RECARGA ${Math.ceil(player.shieldRechargeTimer)}s`, player.x, barY - 3);
    ctx.restore();
  }

  setAimFromPointer(event) {
    if (event.pointerType !== 'mouse') return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.aim.x = Math.max(0, Math.min(this.width, event.clientX - rect.left));
    this.aim.y = Math.max(0, Math.min(this.height, event.clientY - rect.top));
    this.aim.active = true;
  }

  setAimFromTouch(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.touchAim.x = Math.max(0, Math.min(this.width, (event.clientX - rect.left) * this.width / rect.width));
    this.touchAim.y = Math.max(0, Math.min(this.height, (event.clientY - rect.top) * this.height / rect.height));
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

  update(dt) {
    this.stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
      }
    });

    const mobileMode = document.documentElement.dataset.platform === 'mobile';
    const aimAngle = this.getAimAngle(mobileMode);
    this.player.update(dt, this.keys, this.width, this.height, this.joystick, aimAngle, !mobileMode);
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
        const projectile = new Projectile(muzzleX, muzzleY, projectileAngle);
        projectile.damage = this.player.weaponDamage * (1 + this.player.laserLevel * 0.25);
        projectile.piercing = this.player.laserLevel > 0;
        this.projectiles.push(projectile);
      }
      gameAudio.playPlayerShot();
      this.shotClock = .22;
    }

    // WaveManager decides when an enemy should spawn and when the next wave begins.
    if (this.waveManager.update(dt, this.enemies.length)) {
      const margin = Math.min(20, this.width / 2);
      const spawnX = rand(margin, Math.max(margin, this.width - margin));
      const roll = Math.random();
      const bossWave = this.waveManager.wave % 5 === 0;
      const type = bossWave ? 'boss' : this.waveManager.wave >= 2 && roll < 0.25
        ? 'sentinel'
        : this.waveManager.wave >= 2 && roll < 0.43 ? 'interceptor' : 'chaser';
      this.enemies.push(new Enemy(spawnX, -20, this.waveManager.wave, type));
    }

    this.projectiles.forEach((shot) => shot.update(dt));
    this.enemyProjectiles.forEach((shot) => shot.update(dt));
    this.enemies.forEach((enemy) => {
      const shot = enemy.update(dt, this.player.x, this.player.y, this.width, this.height);
      if (shot) {
        this.enemyProjectiles.push(new EnemyProjectile(shot.x, shot.y, shot.targetX, shot.targetY, shot));
        gameAudio.playEnemyShot(shot.color);
      }
    });

    // Resolve projectile hits once, awarding score, XP, and mission progress.
    for (const shot of this.projectiles) {
      if (!shot.active) continue;
      for (const enemy of this.enemies) {
        const dx = shot.x - enemy.x;
        const dy = shot.y - enemy.y;
        const combinedRadius = enemy.radius + shot.radius;
        if (enemy.active && !shot.hitEnemies.has(enemy) && dx * dx + dy * dy < combinedRadius * combinedRadius) {
          shot.hitEnemies.add(enemy);
          if (!shot.piercing) shot.active = false;
          this.damageEnemy(enemy, shot.damage ?? 1);
          if (!shot.piercing) break;
        }
      }
    }

    // An enemy that reaches or collides with the player is resolved only once.
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const combinedRadius = enemy.radius + this.player.radius;
      if (dx * dx + dy * dy < combinedRadius * combinedRadius) {
        enemy.active = false;
        this.resolveIncomingDamage(18);
      }
    }

    // Enemy shots deal damage on direct impact and respect the player's invulnerability window.
    for (const shot of this.enemyProjectiles) {
      if (!shot.active) continue;
      const dx = this.player.x - shot.x;
      const dy = this.player.y - shot.y;
      const combinedRadius = this.player.radius + shot.radius;
      if (dx * dx + dy * dy < combinedRadius * combinedRadius) {
        shot.active = false;
        this.resolveIncomingDamage(shot.damage);
      }
    }

    this.handleMissionCompletion(this.mission.update(dt, this.waveManager.wave));

    // Compact entity lists in place instead of allocating replacement arrays each frame.
    let projectileWriteIndex = 0;
    for (let index = 0; index < this.projectiles.length; index += 1) {
      const shot = this.projectiles[index];
      if (
        shot.active &&
        shot.x > -20 && shot.x < this.width + 20 &&
        shot.y > -20 && shot.y < this.height + 20
      ) {
        this.projectiles[projectileWriteIndex++] = shot;
      }
    }
    this.projectiles.length = projectileWriteIndex;

    let enemyProjectileWriteIndex = 0;
    for (let index = 0; index < this.enemyProjectiles.length; index += 1) {
      const shot = this.enemyProjectiles[index];
      if (
        shot.active &&
        shot.x > -20 && shot.x < this.width + 20 &&
        shot.y > -20 && shot.y < this.height + 20
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
    if (this.backgroundCanvas.width && this.backgroundCanvas.height) {
      ctx.drawImage(this.backgroundCanvas, 0, 0, this.width, this.height);
    }

    this.stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#a9d7ff';
      ctx.fillRect(star.x * this.width, star.y * this.height, star.size, star.size);
    });

    ctx.globalAlpha = 1;
    this.projectiles.forEach((shot) => shot.draw(ctx));
    this.enemyProjectiles.forEach((shot) => shot.draw(ctx));
    this.enemies.forEach((enemy) => enemy.draw(ctx));

    // Blink during the brief invulnerability window after taking damage.
    const playerVisible = this.player.invulnerabilityTimer <= 0 ||
      Math.floor(this.player.invulnerabilityTimer * 12) % 2 === 0;
    this.drawShield(ctx);
    this.player.draw(ctx, playerVisible);

    // Lightweight dual-ring shockwave without per-frame shadow blur.
    this.shieldBreakEffects.forEach((effect) => {
      const progress = 1 - effect.life / effect.maxLife;
      const fade = Math.max(0, effect.life / effect.maxLife);
      ctx.save();
      ctx.globalAlpha = fade * 0.78;
      ctx.strokeStyle = '#8be5ff';
      ctx.lineWidth = 2.5 * (1 - progress) + 0.7;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = fade * 0.42;
      ctx.strokeStyle = '#d5f7ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * progress * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Red circuit sparks and a brief edge flash make incoming damage easier to notice.
    this.damageSparks.forEach((spark) => {
      const fade = Math.max(0, spark.life / spark.maxLife);
      ctx.save();
      ctx.translate(spark.x, spark.y);
      ctx.rotate(Math.atan2(spark.vy, spark.vx));
      ctx.globalAlpha = fade;
      ctx.strokeStyle = fade > 0.55 ? '#ffdce3' : '#ff526f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-spark.length * 0.6, 0);
      ctx.lineTo(-spark.length * 0.15, -2);
      ctx.lineTo(spark.length, 0);
      ctx.stroke();
      ctx.restore();
    });
    if (this.damageFeedbackTimer > 0) {
      const flash = this.damageFeedbackTimer / 0.48;
      ctx.save();
      ctx.globalAlpha = flash * 0.16;
      ctx.strokeStyle = '#ff526f';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, this.width - 8, this.height - 8);
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
    this.levelUpParticles.forEach((particle) => {
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
    });
  }
}
