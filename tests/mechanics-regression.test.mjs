import test from 'node:test';
import assert from 'node:assert/strict';
import { WaveManager } from '../src/core/wave-manager.js';
import { GuidedMissile } from '../src/combat/guided-missile.js';
import { EnemyProjectile } from '../src/combat/enemy-projectile.js';
import { Player } from '../src/player/player.js';
import { resolveAttackClash } from '../src/combat/attack-clash.js';

test('boss waves begin at wave 10 and recur every five waves',()=>{
 const waves=new WaveManager();
 waves.wave=9;waves.state='intermission';waves.timer=0.01;
 assert.equal(waves.update(0.02,0),false);
 assert.equal(waves.wave,10);assert.equal(waves.enemyCount,1);assert.equal(waves.timer,3.2);
 waves.wave=14;waves.state='intermission';waves.timer=0.01;waves.update(0.02,0);
 assert.equal(waves.wave,15);assert.equal(waves.enemyCount,1);
});
test('guided missiles choose an unreserved active target and avoid a dying boss',()=>{
 const first={x:30,y:0,active:true},second={x:80,y:0,active:true},dying={x:10,y:0,active:true,bossDying:true};
 const reserved=new Set([first]);
 const missile=new GuidedMissile(0,0,null,1,0);
 missile.update(0.06,[dying,first,second],500,500,[],reserved);
 assert.equal(missile.target,second);assert.equal(reserved.has(second),true);
});
test('guided missile expires and deactivates after its lifetime',()=>{
 const missile=new GuidedMissile(0,0,null,1,0);
 missile.update(6.1,[],500,500,[]);
 assert.equal(missile.active,false);
});
test('enemy projectile assigns increasing clash resistance to heavier ammunition',()=>{
 const light=new EnemyProjectile(0,0,10,0,{damage:3});
 const medium=new EnemyProjectile(0,0,10,0,{damage:9});
 const heavy=new EnemyProjectile(0,0,10,0,{damage:34,plasmaImpact:true,heavyImpact:true});
 assert.equal(light.clashResistance,1);assert.equal(medium.clashResistance,2);assert.equal(heavy.clashResistance,3);
});
test('Attack Clash requires repeated hits to neutralize heavy projectiles',()=>{
 const lightShot={x:0,y:0,radius:3,damage:4,active:true};
 const heavy={x:5,y:0,radius:5,clashResistance:3,active:true};
 assert.equal(resolveAttackClash({...lightShot},heavy),true);
 assert.equal(heavy.active,true);assert.equal(heavy.clashResistance,2);
 const second={x:0,y:0,radius:3,damage:4,active:true};
 assert.equal(resolveAttackClash(second,heavy),true);
 assert.equal(heavy.active,true);assert.equal(heavy.clashResistance,1);
 const third={x:0,y:0,radius:3,damage:4,active:true};
 assert.equal(resolveAttackClash(third,heavy),true);
 assert.equal(heavy.active,false);
});
test('Attack Clash leaves non-overlapping projectiles untouched',()=>{
 const playerShot={x:0,y:0,radius:2,damage:8,active:true};
 const enemyShot={x:30,y:0,radius:4,clashResistance:2,active:true};
 assert.equal(resolveAttackClash(playerShot,enemyShot),false);
 assert.equal(playerShot.active,true);assert.equal(enemyShot.active,true);
});
test('player shield absorbs hits before hull integrity and recharges',()=>{
 const player=new Player(360,780);player.upgradeShield();
 assert.equal(player.takeDamage(30),false);assert.equal(player.shieldHealth,2);assert.equal(player.health,100);
 player.takeDamage(30);player.takeDamage(30);
 assert.equal(player.shieldHealth,0);assert.equal(player.shieldRechargeTimer,7);
 player.update(7.1,new Set(),360,780);
 assert.equal(player.shieldHealth,3);
});
test('system disruption reduces propulsion authority and recovers',()=>{
 const disrupted=new Player(360,780),normal=new Player(360,780);
 disrupted.applySystemDisruption(1.4);
 disrupted.update(0.1,new Set(['ArrowUp']),360,780);
 normal.update(0.1,new Set(['ArrowUp']),360,780);
 assert.ok(disrupted.y>normal.y,'disrupted ship should travel a shorter distance');
 disrupted.update(2,new Set(),360,780);
 assert.equal(disrupted.systemDisruptionTimer,0);
});
