import test from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, orientedEllipseOverlapsCircle } from '../src/combat/collision.js';
import { BossSystems, getBossBeamSegment, selectBossAttack } from '../src/enemies/boss-systems.js';
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
test('boss owns twelve unique weapon modules, including four plasma cannons, and four regional shields',()=>{
 const systems=new BossSystems();
 assert.equal(systems.modules.length,12);
 assert.equal(new Set(systems.modules.map(m=>m.id)).size,12);
 const plasma=systems.modules.filter(m=>m.kind.includes('plasma'));
 assert.equal(plasma.length,4);
 assert.equal(plasma.filter(m=>m.region==='left').length,2);
 assert.equal(plasma.filter(m=>m.region==='right').length,2);
 assert.ok(plasma.every(m=>m.firingRange===500 && m.plasmaWarningDuration===1.5));
 assert.equal(systems.getModule('machine-gun-left').crossSide,true);
 assert.equal(systems.getModule('machine-gun-right').crossSide,true);
 assert.ok(systems.modules.filter(m=>m.region==='left'||m.region==='right').every(m=>m.firingRange>0));
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



test('boss attack selection prefers the appropriate family and respects module state, range and side',()=>{
 const systems=new BossSystems();
 for(const module of systems.modules) if(module.kind.includes('plasma')) module.plasmaChargeTimer=0;
 assert.equal(selectBossAttack(systems.modules,450,-32,8,2),'plasma');
 assert.equal(selectBossAttack(systems.modules,680,32,8,2),'missile');
 systems.getModule('missile-right').state='destroyed';
 assert.equal(selectBossAttack(systems.modules,680,32,8,2),'machine-gun');
 systems.getModule('machine-gun-right').state='disabled';
 assert.equal(selectBossAttack(systems.modules,950,32,8,2),null);
});

test('main cannon beam geometry starts at the open bow and follows its locked angle',()=>{
 const boss=new Enemy(500,400,10,'boss');
 const cannon=boss.bossSystems.getModule('main-energy-cannon');
 cannon.energyAimAngle=Math.PI/2;
 const beam=getBossBeamSegment(boss,cannon);
 assert.ok(Math.abs(beam.startX-boss.x)<1e-8);
 assert.ok(Math.abs(beam.startY-boss.y-boss.radius*1.82)<1e-8);
 assert.ok(Math.abs(beam.endX-beam.startX)<1e-8);
 assert.ok(Math.abs(beam.endY-beam.startY-1250)<1e-8);
 assert.equal(beam.width,46);
});

test('main cannon aligns, warns, fires briefly, locks aim and enters recovery',()=>{
 const boss=new Enemy(500,300,10,'boss');
 boss.health=boss.maxHealth*0.6;
 boss.bossEntranceTimer=0;
 const cannon=boss.bossSystems.getModule('main-energy-cannon');
 cannon.energyState='charging';
 cannon.energyChargeTimer=0;
 const seen=new Set();
 let lockedAngle=null;
 let previousState=cannon.energyState;
 for(let frame=0;frame<900;frame++){
  const targetX=frame<180?760:250;
  boss.update(1/60,targetX,900,1000,1200,[],[],0,0,0);
  seen.add(cannon.energyState);
  if(cannon.energyState==='warning'&&previousState!=='warning') lockedAngle=cannon.energyAimAngle;
  if(cannon.energyState==='warning'||cannon.energyState==='firing'){
   const delta=Math.atan2(Math.sin(boss.facingRotation-lockedAngle),Math.cos(boss.facingRotation-lockedAngle));
   assert.ok(Math.abs(delta)<1e-8,'boss facing must remain locked through warning and firing');
  }
  previousState=cannon.energyState;
 }
 for(const state of ['aligning','warning','firing','cooldown']) assert.ok(seen.has(state),`missing ${state} state`);
});

test('destroyed main cannon cannot enter the attack cycle',()=>{
 const boss=new Enemy(500,300,10,'boss');
 boss.health=boss.maxHealth*0.6;
 boss.bossEntranceTimer=0;
 const cannon=boss.bossSystems.getModule('main-energy-cannon');
 boss.bossSystems.damageModule(cannon.id,999);
 boss.update(1/60,500,900,1000,1200,[],[],0,0,0);
 assert.equal(cannon.energyState,'offline');
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
