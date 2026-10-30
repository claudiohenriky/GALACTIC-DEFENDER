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
    // Give the pilot time to orient themselves before the first enemy appears.
    this.timer = 2.5;
  }

  update(dt, activeEnemyCount) {
    if (this.state === 'intermission') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.wave += 1;
        const bossWave = this.wave >= 10 && this.wave % 5 === 0;
        this.enemyCount = bossWave ? 1 : Math.min(5 + (this.wave - 1) * 2, 18);
        this.spawnedCount = 0;
        this.state = 'spawning';
        this.timer = bossWave ? 3.2 : 1.8;
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
      // Keep the first waves readable; difficulty can still rise in later waves.
      this.timer = Math.max(0.65, 1.25 - (this.wave - 1) * 0.035);
      return true;
    }

    return false;
  }


  /** Start directly at the boss encounter for isolated preview validation only. */
  startBossTest() {
    this.wave = 10;
    this.enemyCount = 1;
    this.spawnedCount = 0;
    this.state = 'spawning';
    this.timer = 0.8;
  }

  getLabel() {
    if (this.state === 'intermission') return 'INTERVALO';
    return `ONDA ${String(this.wave).padStart(2, '0')}`;
  }
}
