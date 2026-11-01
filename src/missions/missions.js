export const MISSION_ROTATION = [
  { id: 'first-contact', name: 'Primeiro contato', description: 'Destrua 5 inimigos', type: 'kills', target: 5, difficulty: 'FÁCIL', xp: 40, score: 150 },
  { id: 'survivor', name: 'Sobrevivente', description: 'Sobreviva por 45 segundos', type: 'survive', target: 45, difficulty: 'MÉDIA', xp: 70, score: 300 },
  { id: 'sector-breaker', name: 'Quebra-setor', description: 'Alcance a onda 4', type: 'wave', target: 4, difficulty: 'DIFÍCIL', xp: 110, score: 500 },
  { id: 'elite-hunter', name: 'Caçador de elite', description: 'Elimine 2 tropas de Elite', type: 'elite-kills', target: 2, difficulty: 'MÉDIA', xp: 90, score: 350 },
  { id: 'system-operator', name: 'Operador de sistemas', description: 'Use 3 habilidades especiais', type: 'abilities', target: 3, difficulty: 'FÁCIL', xp: 60, score: 250 },
  { id: 'dreadnought-hunter', name: 'Caçador de encouraçados', description: 'Derrote um chefe', type: 'boss', target: 1, difficulty: 'DIFÍCIL', xp: 180, score: 1000 }
];

const integer = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
};

function createMission(rotationIndex, completedCount) {
  const base = MISSION_ROTATION[rotationIndex];
  const cycle = Math.floor(completedCount / MISSION_ROTATION.length);
  const mission = { ...base };
  if (mission.type === 'kills') mission.target += cycle * 2;
  else if (mission.type === 'survive') mission.target += cycle * 10;
  else if (mission.type === 'wave') mission.target += cycle;
  else if (mission.type === 'elite-kills' || mission.type === 'abilities') mission.target += cycle;
  return mission;
}


export class Mission {
  constructor() {
    this.completedCount = 0;
    this.rotationIndex = 0;
    this.current = createMission(this.rotationIndex, this.completedCount);
    this.progress = 0;
    this.elapsed = 0;
    this.completed = false;
  }

  registerKill({ isElite = false, isBoss = false } = {}) {
    if (this.current.type === 'kills' || (this.current.type === 'elite-kills' && isElite && !isBoss) ||
        (this.current.type === 'boss' && isBoss)) {
      this.progress = Math.min(this.current.target, this.progress + 1);
      const completion = this.checkCompletion();
      return completion;
    }
    return null;
  }

  registerAbilityUse() {
    if (this.current.type !== 'abilities') return null;
    this.progress = Math.min(this.current.target, this.progress + 1);
    const completion = this.checkCompletion();
    return completion;
  }

  update(dt, wave) {
    if (this.current.type === 'survive') {
      const delta = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.25)) : 0;
      this.elapsed = Math.min(this.current.target, this.elapsed + delta);
      this.progress = Math.min(this.current.target, Math.floor(this.elapsed));
    } else if (this.current.type === 'wave') {
      this.progress = Math.min(this.current.target, integer(wave));
    }
    const completion = this.checkCompletion();
    return completion;
  }

  checkCompletion() {
    if (this.completed || this.progress < this.current.target) return null;
    this.completed = true;
    const result = { ...this.current, completionNumber: this.completedCount + 1 };
    this.completedCount += 1;
    this.rotationIndex = this.completedCount % MISSION_ROTATION.length;
    this.current = createMission(this.rotationIndex, this.completedCount);
    this.progress = 0;
    this.elapsed = 0;
    this.completed = false;
    return result;
  }

  getDisplayProgress() {
    return this.current.type === 'survive'
      ? `${this.progress}s / ${this.current.target}s`
      : `${this.progress} / ${this.current.target}`;
  }
}
