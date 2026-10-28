export class Progression {
  constructor() { this.level = 1; this.xp = 0; this.nextLevelXp = 100; }
  addXp(amount) {
    this.xp += amount;
    let levelsGained = 0;
    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level += 1;
      levelsGained += 1;
      this.nextLevelXp = Math.round(this.nextLevelXp * 1.35);
    }
    return levelsGained;
  }
  getRank() {
    if (this.level >= 10) return 'ELITE';
    if (this.level >= 5) return 'VETERANO';
    if (this.level >= 3) return 'PILOTO';
    return 'RECRUTA';
  }
}
