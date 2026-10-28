const MISSION_ROTATION = [
  { id: 'first-contact', name: 'Primeiro contato', description: 'Destrua 5 inimigos', type: 'kills', target: 5, difficulty: 'FÁCIL', xp: 40, score: 150 },
  { id: 'survivor', name: 'Sobrevivente', description: 'Sobreviva por 45 segundos', type: 'survive', target: 45, difficulty: 'MÉDIA', xp: 70, score: 300 },
  { id: 'sector-breaker', name: 'Quebra-setor', description: 'Alcance a onda 4', type: 'wave', target: 4, difficulty: 'DIFÍCIL', xp: 110, score: 500 }
];
export class Mission {
  constructor() { this.rotationIndex=0; this.completedCount=0; this.elapsed=0; this.current={...MISSION_ROTATION[0]}; this.progress=0; this.completed=false; }
  registerKill() { if(this.current.type==='kills') this.progress=Math.min(this.current.target,this.progress+1); return this.checkCompletion(); }
  update(dt,wave) {
    if(this.current.type==='survive'){this.elapsed+=dt;this.progress=Math.min(this.current.target,Math.floor(this.elapsed));}
    else if(this.current.type==='wave') this.progress=Math.min(this.current.target,wave);
    return this.checkCompletion();
  }
  checkCompletion() {
    if(this.completed||this.progress<this.current.target)return null;
    this.completed=true;this.completedCount++;
    const result={...this.current,completionNumber:this.completedCount};
    this.rotationIndex=(this.rotationIndex+1)%MISSION_ROTATION.length;
    const next={...MISSION_ROTATION[this.rotationIndex]},cycle=Math.floor(this.completedCount/MISSION_ROTATION.length);
    if(next.type==='kills')next.target+=cycle*2;
    if(next.type==='survive')next.target+=cycle*10;
    if(next.type==='wave')next.target+=cycle;
    this.current=next;this.progress=0;this.elapsed=0;this.completed=false;
    return result;
  }
  getDisplayProgress(){return this.current.type==='survive'? `${this.progress}s / ${this.current.target}s`:`${this.progress} / ${this.current.target}`;}
}
