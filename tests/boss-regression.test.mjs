import test from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, orientedEllipseOverlapsCircle } from '../src/combat/collision.js';
import { BossSystems } from '../src/enemies/boss-systems.js';
import { Enemy } from '../src/enemies/enemy.js';
import { BOSS_TEST_MODE, WaveManager } from '../src/core/wave-manager.js';

test('circle collision preserves strict overlap boundary',()=>{
 assert.equal(circlesOverlap({x:0,y:0,radius:5},{x:8,y:0,radius:4}),true);
 assert.equal(circlesOverlap({x:0,y:0,radius:5},{x:9,y:0,radius:4}),false);
});
test('oriented hull collision follows the long axis and ship rotation',()=>{
 const hull={x:0,y:0};
 assert.equal(orientedEllipseOverlapsCircle(hull,{x:0,y:205,radius:3},142,218,0),true);
 assert.equal(orientedEllipseOverlapsCircle(hull,{x:155,y:0,radius:3},142,218,0),false);
 assert.equal(orientedEllipseOverlapsCircle(hull,{x:205,y:0,radius:3},142,218,Math.PI/2),true);
 assert.equal(orientedEllipseOverlapsCircle(hull,{x:0,y:205,radius:3},142,218,Math.PI/2),false);
});
test('boss owns ten unique weapon modules and four regional shields',()=>{
 const systems=new BossSystems();
 assert.equal(systems.modules.length,10);
 assert.equal(new Set(systems.modules.map(m=>m.id)).size,10);
 assert.deepEqual(systems.shields.map(s=>s.id),['front','left','right','rear']);
});
test('regional shield absorbs damage and becomes disabled at zero',()=>{
 const systems=new BossSystems(), result=systems.damageShield('front',140);
 assert.equal(result.absorbed,110);assert.equal(result.remaining,30);
 assert.equal(systems.shieldById.get('front').disabled,true);
});
test('modules transition from damaged to disabled and destroyed',()=>{
 const systems=new BossSystems(),m=systems.getModule('machine-gun-left');
 systems.damageModule(m.id,14);assert.equal(m.state,'damaged');
 systems.damageModule(m.id,13);assert.equal(m.state,'disabled');
 systems.damageModule(m.id,20);assert.equal(m.state,'destroyed');
});
test('overload replaces catastrophic mounts and rebuilds recoverable wreckage once',()=>{
 const systems=new BossSystems(),a=systems.getModule('machine-gun-left'),b=systems.getModule('machine-gun-right');
 systems.damageModule(a.id,100);systems.damageModule(b.id,34);
 assert.equal(a.catastrophic,true);assert.equal(systems.beginOverloadRebuild(),true);
 assert.equal(a.kind,'plasma-turret');assert.equal(a.replacementInstalled,true);assert.equal(a.state,'damaged');
 assert.equal(b.kind,'machine-gun');assert.equal(b.state,'damaged');
 assert.equal(systems.beginOverloadRebuild(),false);
 systems.update(4.6);assert.equal(systems.rebuildComplete,true);assert.equal(a.transitionType,'');
});
test('regional shields recharge when auxiliary system is operational',()=>{
 const systems=new BossSystems();systems.damageShield('front',110);systems.update(13);
 assert.equal(systems.shieldById.get('front').disabled,false);
 assert.ok(Math.abs(systems.shieldById.get('front').health - 60.5) < 1e-9);
});
test('destroyed auxiliary system prevents regional shield regeneration',()=>{
 const systems=new BossSystems();systems.damageShield('front',110);
 systems.damageModule('auxiliary-system',100);systems.update(20);
 assert.equal(systems.shieldById.get('front').disabled,true);
});
test('heavy boss enters, retains its expanded footprint and fires from surviving modules',()=>{
 const boss=new Enemy(500,0,10,'boss');assert.equal(boss.radius,100);assert.equal(boss.collisionRadius,145);
 let volley=null;
 for(let frame=0;frame<900&&!volley;frame++){const shots=boss.update(1/60,500,900,1000,1200,[],[],0);if(Array.isArray(shots)&&shots.length)volley=shots;}
 assert.ok(volley,'boss should fire after entrance and initial cooldown');
 assert.ok(volley.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
});


test('normal wave progression starts with five enemies and reserves the Dreadnought for wave 10',()=>{
 assert.equal(BOSS_TEST_MODE,false);
 const waves=new WaveManager();
 assert.equal(waves.wave,1);
 assert.equal(waves.enemyCount,5);
 waves.wave=9;
 waves.state='intermission';
 waves.timer=0;
 waves.update(0.01,0);
 assert.equal(waves.wave,10);
 assert.equal(waves.enemyCount,1);
 waves.state='intermission';
 waves.timer=0;
 waves.update(0.01,0);
 assert.equal(waves.wave,11);
 assert.equal(waves.enemyCount,18);
});

test('elite variants are limited to Sentinel, Guardian and Artillery; Interceptor stays basic',()=>{
 const interceptor=new Enemy(100,100,1,'interceptor',true);
 assert.equal(interceptor.isElite,false);
 assert.equal(interceptor.maxHealth,1);
 for(const type of ['sentinel','guardian','artillery']){
  const elite=new Enemy(100,100,12,type,true);
  assert.equal(elite.isElite,true,`${type} should support an Elite variant`);
 }
});
