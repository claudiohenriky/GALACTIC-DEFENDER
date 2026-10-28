// Lightweight procedural audio for GALACTIC-DEFENDER. No external assets or network requests.
class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.enabled = true;
    this.notes = [110, 146.83, 164.81, 130.81, 98, 146.83, 174.61, 130.81];
  }

  ensureContext() {
    if (this.context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? 0.48 : 0;
    this.master.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
  }

  async start() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.context) return;
    try { if (this.context.state === 'suspended') await this.context.resume(); } catch { return; }
    if (!this.musicTimer) {
      this.playMusicStep();
      this.musicTimer = window.setInterval(() => this.playMusicStep(), 420);
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.48 : 0, this.context.currentTime, 0.04);
    }
    if (!this.enabled) {
      if (this.musicTimer) window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (this.context && this.context.state === 'running') {
      this.start();
    }
  }

  tone(frequency, duration, type, volume, endFrequency = frequency, destination = this.master) {
    if (!this.enabled || !this.context || !destination) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(30, frequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.025);
  }

  playMusicStep() {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const note = this.notes[this.musicStep % this.notes.length];
    this.tone(note, 0.36, 'triangle', 0.045, note * 1.008, this.musicGain);
    if (this.musicStep % 4 === 0) this.tone(note / 2, 0.38, 'sine', 0.035, note / 2.02, this.musicGain);
    this.musicStep += 1;
  }

  playPlayerShot() {
    this.tone(760, 0.085, 'sawtooth', 0.055, 250);
  }

  playEnemyShot(color = '') {
    const sentinel = color === '#ffe0a8';
    this.tone(sentinel ? 250 : 390, 0.13, 'square', sentinel ? 0.045 : 0.028, sentinel ? 110 : 170);
  }

  playDamage() {
    this.tone(180, 0.22, 'sawtooth', 0.075, 55);
  }
}

export const gameAudio = new GameAudio();
