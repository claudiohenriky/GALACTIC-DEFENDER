import { Player } from '../player/player.js';
import { Enemy } from '../enemies/enemy.js';
import { Projectile } from '../combat/projectile.js';
import { Progression } from '../progression/progression.js';
import { Mission } from '../missions/missions.js';
import { WaveManager } from './wave-manager.js';
import { updateHud } from '../ui/hud.js';

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
    this.stars = Array.from({ length: 95 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: rand(.5, 1.8),
      speed: rand(.012, .06),
      alpha: rand(.2, .9)
    }));
    this.keys = new Set();
    this.status = 'ready';
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.lastTime = 0;
    this.animationId = 0;
    this.levelUpParticles = [];
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
    this.bindOverlayElements();
  }

  bindOverlayElements() {
    this.startOverlay = document.querySelector('#start-overlay');
    this.pauseOverlay = document.querySelector('#pause-overlay');
    this.gameoverOverlay = document.querySelector('#gameover-overlay');
  }

  resize() {
    const previousLandscape = this.width > this.height;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const isLandscape = this.width > this.height;
    if (previousLandscape !== isLandscape) {
      this.player.y = this.height * (isLandscape ? 0.66 : 0.78);
      this.player.x = this.width / 2;
    }
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.player.fitToArena(this.width, this.height);
    this.renderFrame(0);
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'gameover') this.reset();
    this.status = 'running';
    this.hideOverlays();
    this.lastTime = performance.now();
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
    this.score = 0;
    this.destroyed = 0;
    this.shotClock = 0;
    this.levelUpParticles = [];
    this.levelUpToastTimer = 0;
    this.damageFeedbackTimer = 0;
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

    if (event.code === 'Enter' && this.status === 'ready') this.start();
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
    this.damageFeedbackTimer = 0.85;
    const feedback = document.querySelector('#damage-feedback');
    feedback.textContent = `INTEGRIDADE -${amount}`;
    feedback.classList.remove('damage-active');
    void feedback.offsetWidth;
    feedback.classList.add('damage-active');
  }

  clearInput() {
    this.keys.clear();
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
    updateHud(this);

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

    this.player.update(dt, this.keys, this.width, this.height);
    this.levelUpToastTimer = Math.max(0, this.levelUpToastTimer - dt);
    this.damageFeedbackTimer = Math.max(0, this.damageFeedbackTimer - dt);
    if (this.damageFeedbackTimer === 0) document.querySelector('#damage-feedback').classList.remove('damage-active');
    this.levelUpParticles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    });
    this.levelUpParticles = this.levelUpParticles.filter((particle) => particle.life > 0);

    this.shotClock -= dt;
    if (this.keys.has('space') && this.shotClock <= 0) {
      this.projectiles.push(new Projectile(this.player.x, this.player.y - 16));
      this.shotClock = .22;
    }

    // WaveManager decides when an enemy should spawn and when the next wave begins.
    if (this.waveManager.update(dt, this.enemies.length)) {
      const margin = Math.min(20, this.width / 2);
      const spawnX = rand(margin, Math.max(margin, this.width - margin));
      this.enemies.push(new Enemy(spawnX, -20, this.waveManager.wave));
    }

    this.projectiles.forEach((shot) => shot.update(dt));
    this.enemies.forEach((enemy) => enemy.update(dt, this.height));

    // Resolve projectile hits once, awarding score, XP, and mission progress.
    for (const shot of this.projectiles) {
      if (!shot.active) continue;
      for (const enemy of this.enemies) {
        if (enemy.active && Math.hypot(shot.x - enemy.x, shot.y - enemy.y) < enemy.radius + shot.radius) {
          shot.active = false;
          enemy.active = false;
          this.score += 100;
          this.destroyed += 1;
          const levelsGained = this.progression.addXp(25);
          if (levelsGained > 0) this.triggerLevelUp(levelsGained);
          this.mission.registerKill();
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
      } else if (enemy.y > this.height + 30) {
        enemy.active = false;
        if (this.player.takeDamage(8)) this.triggerDamageFeedback(8);
      }
    }

    this.projectiles = this.projectiles.filter((shot) => shot.active && shot.y > -20);
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
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, '#071126');
    bg.addColorStop(1, '#050813');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    this.stars.forEach((star) => {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#a9d7ff';
      ctx.fillRect(star.x * this.width, star.y * this.height, star.size, star.size);
    });

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1a3450';
    ctx.globalAlpha = .45;
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
    this.projectiles.forEach((shot) => shot.draw(ctx));
    this.enemies.forEach((enemy) => enemy.draw(ctx));

    // Blink during the brief invulnerability window after taking damage.
    const playerVisible = this.player.invulnerabilityTimer <= 0 ||
      Math.floor(this.player.invulnerabilityTimer * 12) % 2 === 0;
    this.player.draw(ctx, playerVisible);

    // Short-lived gold particles make level gains visible without blocking play.
    this.levelUpParticles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.translate(particle.x, particle.y);
      ctx.rotate((1 - particle.life / particle.maxLife) * Math.PI);
      ctx.fillStyle = '#ffe68a';
      ctx.shadowColor = '#ffc94d';
      ctx.shadowBlur = 10;
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
