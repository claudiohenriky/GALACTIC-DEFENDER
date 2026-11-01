export const PILOT_TITLES=[
 {id:'recruit',name:'Recruta',missions:0},
 {id:'scout',name:'Explorador Estelar',missions:1},
 {id:'guardian',name:'Guardião Cósmico',missions:3},
 {id:'ace',name:'Ás Galáctico',missions:6},
 {id:'legend',name:'Lenda da Galáxia',missions:12}
];
export class Progression {
 constructor(){this.level=1;this.xp=0;this.nextLevelXp=100;this.unlockedTitles=['recruit'];}
 addXp(amount){const gained=Math.max(0,Math.floor(Number(amount)||0));this.xp+=gained;let levelsGained=0;while(this.xp>=this.nextLevelXp){this.xp-=this.nextLevelXp;this.level++;levelsGained++;this.nextLevelXp=100+(this.level-1)*35;}return levelsGained;}
 recordMissionCompletion(total){const unlocked=PILOT_TITLES.filter(title=>total>=title.missions&&!this.unlockedTitles.includes(title.id));if(unlocked.length)this.unlockedTitles=[...this.unlockedTitles,...unlocked.map(title=>title.id)];return unlocked;}
 getTitle(){return [...PILOT_TITLES].reverse().find(title=>this.unlockedTitles.includes(title.id))??PILOT_TITLES[0];}
 getRank(){if(this.level>=10)return 'ELITE';if(this.level>=5)return 'VETERANO';if(this.level>=3)return 'PILOTO';return 'RECRUTA';}
}
