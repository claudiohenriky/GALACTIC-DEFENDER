// Controls enemy waves independently from the main game loop.
export class WaveManager {
  constructor() {
    this.intermissionDuration = 2.5;
    this.reset();
  }

  reset() {
    this.wave = 1;
    this.enemyCount = 5;
    this.spawnedCount = 0;
    this.state = 'spawning';
    // Give the player time to orient themselves before the first hostile appears.
    this.timer = 2.2;
  }

  update(dt, activeEnemyCount) {
    if (this.state === 'intermission') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.wave += 1;
        this.enemyCount = Math.min(5 + (this.wave - 1) * 2, 18);
        this.spawnedCount = 0;
        this.state = 'spawning';
        this.timer = 1.6;
      }
      return false;
    }

    // Do not begin the next break until every enemy in this wave is resolved.
    if (this.spawnedCount >= this.enemyCount && activeEnemyCount === 0) {
      this.state = 'intermission';
      this.timer = this.intermissionDuration;
      return false;
    }

    this.timer -= dt;
    if (this.timer <= 0 && this.spawnedCount < this.enemyCount) {
      this.spawnedCount += 1;
      // Keep the opening wave readable; later waves gradually become faster.
      this.timer = Math.max(0.75, 1.25 - (this.wave - 1) * 0.025);
      return true;
    }

    return false;
  }

  getLabel() {
    if (this.state === 'intermission') return 'INTERVALO';
    return `ONDA ${String(this.wave).padStart(2, '0')}`;
  }
}
