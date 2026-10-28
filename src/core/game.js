import { Player } from '../player/player.js?v=0.9.1';
import { Enemy } from '../enemies/enemy.js?v=0.9.1';
import { Projectile } from '../combat/projectile.js?v=0.9.1';
import { EnemyProjectile } from '../combat/enemy-projectile.js?v=0.9.1';
import { Progression } from '../progression/progression.js?v=0.9.1';
import { Mission } from '../missions/missions.js?v=0.9.1';
import { WaveManager } from './wave-manager.js?v=0.9.1';
import { updateHud } from '../ui/hud.js?v=0.9.1';

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
    this.mission = new Mission(10);
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
    this.status = 'ready';
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.lastTime = 0;
    this.animationId = 0;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
    this.hudUpdateInterval = 0.1;
    this.hudUpdateTimer = 0;
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
    this.player = new Player(this.width, this.height);
    this.progression = new Progression();
    this.mission = new Mission(10);
    this.waveManager.reset();
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.levelUpParticles = [];
    this.damageSparks = [];
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
    this.hudUpdateTimer = 0;
    document.querySelector('#level-up-toast').classList.remove('level-up-active');
    document.querySelector('#damage-feedback').classList.remove('damage-active');
    this.status = 'ready';
    this.clearInput();
    document.querySelector('#mission-progress').textContent = '0/10';
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

  triggerLevelUp(levelsGained) {
    this.levelUpToastTimer = 1.35;
    const toast = document.querySelector('#level-up-toast');
    toast.textContent = levelsGained > 1 ? `✦ NÍVEIS +${levelsGained}` : '✦ NÍVEL AUMENTADO';
    toast.classList.remove('level-up-active');
    void toast.offsetWidth;
    toast.classList.add('level-up-active');

    for (let i = 0; i < 22; i += 1) {
      const angle = (Math.PI * 2 * i) / 22 + rand(-0.15, 0.15);
      const speed = rand(32, 105);
      const life = rand(0.45, 0.95);
      this.levelUpParticles.push({
        x: this.player.x + rand(-7, 7),
        y: this.player.y + rand(-7, 7),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: rand(2, 4.5)
      });
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
    feedback.classList.remove('damage-active');
    void feedback.offsetWidth;
    feedback.classList.add('damage-active');
  }

  setAimFromPointer(event) {
    if (event.pointerType !== 'mouse') return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.aim.x = Math.max(0, Math.min(this.width, event.clientX - rect.left));
    this.aim.y = Math.max(0, Math.min(this.height, event.clientY - rect.top));
    this.aim.active = true;
  }

  getAimAngle() {
    if (!this.aim.active) return -Math.PI / 2;
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
    const dt = Math.min((time - this.lastTime) / 1000 || 0, .035);
    this.lastTime = time;
    this.update(dt);
    this.renderFrame(dt);
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= this.hudUpdateInterval) {
      this.hudUpdateTimer %= this.hudUpdateInterval;
      updateHud(this);
    }

    if (this.status === 'running') {
      this.animationId = requestAnimationFrame((next) => this.loop(next));
    }
  }

  update(dt) {
    this.stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > 1) {
        star.y = 0;
        star.x = Math.random();
      }
    });

    this.player.update(dt, this.keys, this.width, this.height, this.joystick);
    this.levelUpToastTimer = Math.max(0, this.levelUpToastTimer - dt);
    const previousDamageFeedbackTimer = this.damageFeedbackTimer;
    this.damageFeedbackTimer = Math.max(0, this.damageFeedbackTimer - dt);
    if (previousDamageFeedbackTimer > 0 && this.damageFeedbackTimer === 0) {
      document.querySelector('#damage-feedback').classList.remove('damage-active');
    }
    this.damageSparks.forEach((spark) => {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.life -= dt;
    });
    this.damageSparks = this.damageSparks.filter((spark) => spark.life > 0);
    this.levelUpParticles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    });
    this.levelUpParticles = this.levelUpParticles.filter((particle) => particle.life > 0);

    this.shotClock -= dt;
    if (this.keys.has('space') && this.shotClock <= 0) {
      const angle = this.getAimAngle();
      const muzzleDistance = 17;
      const muzzleX = this.player.x + Math.cos(angle) * muzzleDistance;
      const muzzleY = this.player.y + Math.sin(angle) * muzzleDistance;
      this.projectiles.push(new Projectile(muzzleX, muzzleY, angle));
      this.shotClock = .22;
    }

    // WaveManager decides when an enemy should spawn and when the next wave begins.
    if (this.waveManager.update(dt, this.enemies.length)) {
      const margin = Math.min(20, this.width / 2);
      const spawnX = rand(margin, Math.max(margin, this.width - margin));
      const type = this.waveManager.wave >= 2 && Math.random() < 0.3 ? 'sentinel' : 'chaser';
      this.enemies.push(new Enemy(spawnX, -20, this.waveManager.wave, type));
    }

    this.projectiles.forEach((shot) => shot.update(dt));
    this.enemyProjectiles.forEach((shot) => shot.update(dt));
    this.enemies.forEach((enemy) => {
      const shot = enemy.update(dt, this.player.x, this.player.y, this.width, this.height);
      if (shot) this.enemyProjectiles.push(new EnemyProjectile(shot.x, shot.y, shot.targetX, shot.targetY, shot));
    });

    // Resolve projectile hits once, awarding score, XP, and mission progress.
    for (const shot of this.projectiles) {
      if (!shot.active) continue;
      for (const enemy of this.enemies) {
        if (enemy.active && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius + shot.radius) {
          shot.active = false;
          enemy.health = Math.max(0, enemy.health - (shot.damage ?? 1));
          if (enemy.health <= 0) {
            enemy.active = false;
            this.score += 100;
            this.destroyed += 1;
            const levelsGained = this.progression.addXp(25);
            if (levelsGained > 0) this.triggerLevelUp(levelsGained);
            this.mission.registerKill();
          }
          break;
        }
      }
    }

    // An enemy that reaches or collides with the player is resolved only once.
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < enemy.radius + this.player.radius) {
        enemy.active = false;
        if (this.player.takeDamage(18)) this.triggerDamageFeedback(18);
      }
    }

    // Enemy shots deal damage on direct impact and respect the player's invulnerability window.
    for (const shot of this.enemyProjectiles) {
      if (!shot.active) continue;
      if (Math.hypot(this.player.x - shot.x, this.player.y - shot.y) < this.player.radius + shot.radius) {
        shot.active = false;
        if (this.player.takeDamage(shot.damage)) this.triggerDamageFeedback(shot.damage);
      }
    }

    this.projectiles = this.projectiles.filter((shot) =>
      shot.active && shot.x > -20 && shot.x < this.width + 20 && shot.y > -20 && shot.y < this.height + 20
    );
    this.enemyProjectiles = this.enemyProjectiles.filter((shot) =>
      shot.active && shot.x > -20 && shot.x < this.width + 20 && shot.y > -20 && shot.y < this.height + 20
    );
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    if (this.player.health <= 0) this.endGame();
  }

  endGame() {
    this.status = 'gameover';
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
    this.player.draw(ctx, playerVisible);

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
