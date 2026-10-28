export class Mission {
  constructor(target = 10) { this.target = target; this.progress = 0; this.completed = false; }
  registerKill() { if (this.completed) return; this.progress = Math.min(this.target, this.progress + 1); if (this.progress >= this.target) this.completed = true; }
}
