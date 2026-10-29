const STORAGE_KEY = 'gd-achievements-v1';
const DEFINITIONS = [
  { id: 'first-blood', name: 'Primeira eliminação', description: 'Derrote seu primeiro inimigo.', test: s => s.kills >= 1 },
  { id: 'hunter-25', name: 'Caçador espacial', description: 'Derrote 25 inimigos.', test: s => s.kills >= 25 },
  { id: 'ace-100', name: 'Ás de combate', description: 'Derrote 100 inimigos.', test: s => s.kills >= 100 },
  { id: 'boss-down', name: 'Queda do colosso', description: 'Derrote seu primeiro chefe.', test: s => s.bosses >= 1 },
  { id: 'boss-veteran', name: 'Caçador de chefes', description: 'Derrote cinco chefes.', test: s => s.bosses >= 5 },
  { id: 'mission-one', name: 'Missão cumprida', description: 'Conclua sua primeira missão.', test: s => s.missions >= 1 },
  { id: 'mission-ten', name: 'Piloto dedicado', description: 'Conclua dez missões.', test: s => s.missions >= 10 },
  { id: 'wave-five', name: 'Defesa da fronteira', description: 'Alcance a onda 5 em uma partida.', test: s => s.bestWave >= 5 },
  { id: 'wave-ten', name: 'Além da fronteira', description: 'Alcance a onda 10 em uma partida.', test: s => s.bestWave >= 10 },
  { id: 'score-five-k', name: 'Pontuação de elite', description: 'Alcance 5.000 pontos em uma partida.', test: s => s.bestScore >= 5000 }
];
export class AchievementTracker {
  constructor() { this.stats = this.load(); this.unlocked = new Set(this.stats.unlocked); this.evaluate(); }
  load() {
    const defaults = { kills: 0, bosses: 0, missions: 0, bestScore: 0, bestWave: 1, unlocked: [] };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...defaults, ...saved, unlocked: Array.isArray(saved.unlocked) ? saved.unlocked : [] };
    } catch { return defaults; }
  }
  save() {
    this.stats.unlocked = [...this.unlocked];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats)); } catch { /* Storage may be unavailable. */ }
  }
  record(event) {
    if (event !== 'kills' && event !== 'bosses' && event !== 'missions') return [];
    this.stats[event] += 1;
    const newlyUnlocked = this.evaluate();
    this.save();
    return newlyUnlocked;
  }
  recordRun(score, wave) {
    this.stats.bestScore = Math.max(this.stats.bestScore, Number(score) || 0);
    this.stats.bestWave = Math.max(this.stats.bestWave, Number(wave) || 1);
    const newlyUnlocked = this.evaluate();
    this.save();
    return newlyUnlocked;
  }
  evaluate() {
    const newlyUnlocked = [];
    for (const item of DEFINITIONS) {
      if (item.test(this.stats) && !this.unlocked.has(item.id)) {
        this.unlocked.add(item.id);
        newlyUnlocked.push({ id: item.id, name: item.name, description: item.description });
      }
    }
    this.stats.unlocked = [...this.unlocked];
    return newlyUnlocked;
  }
  getAchievements() { return DEFINITIONS.map(({ id, name, description }) => ({ id, name, description, unlocked: this.unlocked.has(id) })); }
}
