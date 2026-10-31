// Procedural audiovisual system: no external assets, network requests or large audio buffers.
class GameAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.voiceGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicMode = 'combat';
    this.enabled = true;
    this.volume = 0.75;
    this.channelVolumes = { music: 0.58, effects: 0.82, voice: 0.78 };
    this.lastVoiceTick = 0;
    this.lastVoiceLength = 0;
    this.lastVoiceKey = '';
    this.notes = [110, 146.83, 164.81, 130.81, 98, 146.83, 174.61, 130.81];
    this.bossNotes = [82.41, 98, 110, 73.42, 87.31, 98, 65.41, 82.41];
    this.voiceProfiles = {
      pilot: { base: 330, wave: 'triangle', tick: 255, end: 205 },
      system: { base: 620, wave: 'square', tick: 520, end: 410 },
      boss: { base: 92, wave: 'sawtooth', tick: 112, end: 72 },
      artillery: { base: 440, wave: 'sawtooth', tick: 360, end: 250 },
      sentinel: { base: 290, wave: 'square', tick: 235, end: 165 },
      guardian: { base: 245, wave: 'triangle', tick: 210, end: 155 },
      devastator: { base: 78, wave: 'sawtooth', tick: 95, end: 58 }
    };
  }

  ensureContext() {
    if (this.context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? 0.48 * this.volume : 0;
    this.master.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.voiceGain = this.context.createGain();
    this.musicGain.gain.value = this.channelVolumes.music;
    this.effectsGain.gain.value = this.channelVolumes.effects;
    this.voiceGain.gain.value = this.channelVolumes.voice;
    this.musicGain.connect(this.master);
    this.effectsGain.connect(this.master);
    this.voiceGain.connect(this.master);
  }

  async start() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.context) return;
    try { if (this.context.state === 'suspended') await this.context.resume(); } catch { return; }
    if (!this.musicTimer) {
      this.playMusicStep();
      this.musicTimer = window.setInterval(() => this.playMusicStep(), 480);
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.48 * this.volume : 0, this.context.currentTime, 0.04);
    }
    if (!this.enabled) {
      if (this.musicTimer) window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    } else if (this.context && this.context.state === 'running') {
      this.start();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.enabled ? 0.48 * this.volume : 0, this.context.currentTime, 0.04);
    }
  }

  setChannelVolume(channel, volume) {
    if (!Object.hasOwn(this.channelVolumes, channel)) return;
    this.channelVolumes[channel] = Math.max(0, Math.min(1, Number(volume) || 0));
    const node = channel === 'music' ? this.musicGain : channel === 'effects' ? this.effectsGain : this.voiceGain;
    if (node && this.context) node.gain.setTargetAtTime(this.channelVolumes[channel], this.context.currentTime, 0.05);
  }

  setMusicMode(mode = 'combat') {
    this.musicMode = mode === 'boss' ? 'boss' : 'combat';
    this.musicStep = 0;
  }

  tone(frequency, duration, type, volume, endFrequency = frequency, destination = this.effectsGain) {
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
    const sequence = this.musicMode === 'boss' ? this.bossNotes : this.notes;
    const note = sequence[this.musicStep % sequence.length];
    this.tone(note, 0.42, 'triangle', 0.043, note * 1.006, this.musicGain);
    this.tone(note * 1.5, 0.78, 'sine', 0.014, note * 1.49, this.musicGain);
    if (this.musicStep % 2 === 0) this.tone(note / 2, 0.72, 'sine', 0.028, note / 2.01, this.musicGain);
    if (this.musicStep % 4 === 0) this.tone(note * 2, 0.2, 'triangle', 0.012, note * 2.04, this.musicGain);
    this.musicStep += 1;
  }

  playPlayerShot() { this.tone(760, 0.085, 'sawtooth', 0.055, 250); }

  playEnemyShot(color = '') {
    const sentinel = color === '#ffe0a8';
    this.tone(sentinel ? 250 : 390, 0.13, 'square', sentinel ? 0.045 : 0.028, sentinel ? 110 : 170);
  }

  playDamage() {
    this.tone(180, 0.22, 'sawtooth', 0.12, 55);
    this.tone(92, 0.19, 'triangle', 0.055, 42);
  }

  playShieldHit() {
    this.tone(540, 0.11, 'sine', 0.06, 210);
    this.tone(880, 0.07, 'triangle', 0.025, 420);
  }

  playMissileLaunch() {
    this.tone(210, 0.2, 'sawtooth', 0.045, 720);
    this.tone(95, 0.24, 'triangle', 0.04, 55);
  }

  playExplosion(heavy = false) {
    this.tone(heavy ? 105 : 155, heavy ? 0.42 : 0.24, 'sawtooth', heavy ? 0.09 : 0.055, 38);
    this.tone(heavy ? 58 : 82, heavy ? 0.48 : 0.28, 'triangle', heavy ? 0.07 : 0.035, 30);
  }

  playEliteArrival(type = 'sentinel') {
    const profile = this.voiceProfiles[type] || this.voiceProfiles.sentinel;
    this.tone(profile.base * 0.72, 0.34, 'sawtooth', 0.065, profile.base * 1.45);
    this.tone(profile.base * 1.8, 0.22, 'sine', 0.035, profile.base * 0.8);
    this.tone(68, 0.3, 'triangle', 0.055, 34);
  }

  playBossWarning() {
    this.tone(72, 0.62, 'sawtooth', 0.08, 42);
    this.tone(144, 0.42, 'triangle', 0.045, 58);
  }

  playDialogueLine(actor = 'pilot') {
    if (!this.enabled || !this.context || !this.voiceGain) return;
    const profile = this.voiceProfiles[actor] || this.voiceProfiles.pilot;
    this.tone(profile.base, 0.11, profile.wave, 0.065, profile.end, this.voiceGain);
    this.tone(profile.base * 1.48, 0.075, 'sine', 0.025, profile.base * 0.9, this.voiceGain);
    this.lastVoiceTick = 0;
    this.lastVoiceLength = 0;
    this.lastVoiceKey = '';
  }

  playDialogueTick(actor = 'pilot', visibleLength = 0, lineKey = '') {
    if (!this.enabled || !this.context || !this.voiceGain) return;
    if (lineKey !== this.lastVoiceKey) {
      this.lastVoiceKey = lineKey;
      this.lastVoiceLength = 0;
      this.lastVoiceTick = 0;
    }
    const length = Math.max(0, Math.floor(visibleLength));
    if (length < 2 || length - this.lastVoiceLength < 3) return;
    const now = this.context.currentTime;
    if (this.lastVoiceTick && now - this.lastVoiceTick < 0.075) return;
    const profile = this.voiceProfiles[actor] || this.voiceProfiles.pilot;
    const syllable = (length % 2) === 0 ? 1 : 0.84;
    this.tone(profile.tick * syllable, 0.045, profile.wave, 0.018, profile.end, this.voiceGain);
    this.lastVoiceTick = now;
    this.lastVoiceLength = length;
  }

  playUiConfirm() {
    this.tone(620, 0.08, 'triangle', 0.035, 920);
  }
}

export const gameAudio = new GameAudio();
