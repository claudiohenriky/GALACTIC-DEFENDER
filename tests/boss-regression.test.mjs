import test from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, orientedEllipseOverlapsCircle } from '../src/combat/collision.js';
import { BossSystems, getBossBeamSegment, getBossMissileProfile, selectBossAttack, selectBossMissileLauncher } from '../src/enemies/boss-systems.js';
import { Enemy } from '../src/enemies/enemy.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';
import { BOSS_TEST_MODE, WaveManager } from '../src/core/wave-manager.js';
import { advanceWaveTenTransition, createWaveTenTransition, WAVE_TEN_TRANSITION_DURATION } from '../src/core/wave-ten-transition.js';

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
 assert.equal(result.absorbed,88);assert.equal(result.remaining,52);
 assert.equal(systems.shieldById.get('front').disabled,true);
});
test('precise hardpoint hits leak a controlled portion through active regional shields',()=>{
 const systems=new BossSystems();
 const result=systems.damageShield('front',10,0.42);
 assert.ok(Math.abs(result.absorbed-5.8)<1e-9);
 assert.ok(Math.abs(result.remaining-4.2)<1e-9);
 assert.ok(Math.abs(systems.shieldById.get('front').health-82.2)<1e-9);
});
test('ordinary hull hits remain fully absorbed while a regional shield is active',()=>{
 const systems=new BossSystems();
 const result=systems.damageShield('front',10);
 assert.equal(result.absorbed,10);assert.equal(result.remaining,0);
 assert.equal(systems.shieldById.get('front').health,78);
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
 const systems=new BossSystems();systems.damageShield('front',88);systems.update(16);
 assert.equal(systems.shieldById.get('front').disabled,false);
 assert.ok(Math.abs(systems.shieldById.get('front').health - 48.4) < 1e-9);
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


test('DREADNOUGHT missiles use phase-scaled speed and damage with a slower launch cadence',()=>{
 const phaseOne=getBossMissileProfile(1);
 const phaseTwo=getBossMissileProfile(2);
 const phaseThree=getBossMissileProfile(3);
 assert.deepEqual(phaseOne,{speed:185,damage:12,turnRate:1.36,cooldown:5.2});
 assert.deepEqual(phaseTwo,{speed:205,damage:13,turnRate:1.42,cooldown:4.8});
 assert.deepEqual(phaseThree,{speed:225,damage:15,turnRate:1.48,cooldown:4.4});
 assert.ok(phaseOne.speed>118 && phaseOne.damage>9 && phaseOne.cooldown>2.35);
});

test('DREADNOUGHT missile launcher selection alternates wings and respects target side and range',()=>{
 const systems=new BossSystems();
 const left=systems.getModule('missile-left');
 const right=systems.getModule('missile-right');
 assert.equal(selectBossMissileLauncher(systems.modules,600,0,8,-1),left);
 assert.equal(selectBossMissileLauncher(systems.modules,600,0,8,1),right);
 assert.equal(selectBossMissileLauncher(systems.modules,600,-35,8,1),left);
 right.state='disabled';
 assert.equal(selectBossMissileLauncher(systems.modules,600,0,8,1),left);
 assert.equal(selectBossMissileLauncher(systems.modules,800,0,8,-1),null);
});

test('DREADNOUGHT launches only one missile per salvo and applies a dedicated cooldown',()=>{
 const boss=new Enemy(500,300,10,'boss');
 boss.bossEntranceTimer=0;
 boss.fireCooldown=0;
 boss.facingRotation=Math.PI/2;
 const targetX=500,targetY=900;
 const first=boss.update(1/60,targetX,targetY,1000,1200,[],[],0,0,0);
 assert.ok(Array.isArray(first));
 assert.equal(first.length,1,'only one wing may launch in a salvo');
 assert.equal(first[0].speed,185);
 assert.equal(first[0].damage,12);
 assert.equal(boss.bossMissileCooldown,5.2);
 const next=boss.update(1/60,targetX,targetY,1000,1200,[],[],0,0,0);
 assert.equal(next,null,'missiles must not launch again during the dedicated cooldown');
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


test('wave 9 to 10 transition waits ten seconds, then runs the cinematic phases in order',()=>{
 const transition=createWaveTenTransition();
 const advance=(seconds)=>{let remaining=seconds;while(remaining>0){const step=Math.min(0.05,remaining);advanceWaveTenTransition(transition,step);remaining-=step;}};
 assert.equal(transition.phase,'loading');
 assert.equal(transition.phaseDuration,10);
 advance(9.9);assert.equal(transition.phase,'loading');
 advance(0.1);assert.equal(transition.phase,'pilot-report');
 advance(3.2);assert.equal(transition.phase,'pilot-warning');
 advance(3);assert.equal(transition.phase,'boss-entry');
 advance(4.8);assert.equal(transition.phase,'boss-taunt');
 advance(4.2);assert.equal(transition.phase,'complete');
 assert.equal(WAVE_TEN_TRANSITION_DURATION,25.2);
});

test('wave 10 transition ignores negative and oversized frame deltas safely',()=>{
 const transition=createWaveTenTransition();
 advanceWaveTenTransition(transition,-1);assert.equal(transition.elapsed,0);
 advanceWaveTenTransition(transition,1);assert.equal(transition.elapsed,0.05);
 assert.equal(transition.phase,'loading');
});


test('basic Sentinel has reduced mobility while Elite remains a distinct faster variant',()=>{
 const basic=new Enemy(100,100,1,'sentinel');
 const elite=new Enemy(100,100,1,'sentinel',true);
 assert.equal(basic.isElite,false);
 assert.equal(basic.speed,40);
 assert.equal(ENEMY_MOTION_PROFILES.sentinel.maxSpeed,112);
 assert.equal(ENEMY_MOTION_PROFILES.sentinel.acceleration,240);
 assert.ok(ENEMY_MOTION_PROFILES.sentinelElite.maxSpeed>ENEMY_MOTION_PROFILES.sentinel.maxSpeed);
 assert.ok(ENEMY_MOTION_PROFILES.sentinelElite.acceleration>ENEMY_MOTION_PROFILES.sentinel.acceleration);
 assert.equal(elite.isElite,true);
});

test('test-only wave start sets the requested wave without changing normal reset defaults',()=>{
 const waves=new WaveManager();
 assert.equal(waves.wave,1);
 assert.equal(waves.enemyCount,5);
 waves.startAtWaveForTesting(9);
 assert.equal(waves.wave,9);
 assert.equal(waves.enemyCount,18);
 assert.equal(waves.spawnedCount,0);
 assert.equal(waves.state,'spawning');
 waves.reset();
 assert.equal(waves.wave,1);
 assert.equal(waves.enemyCount,5);
});


test('combat rebalance lowers basic enemy mobility and keeps Elite variants distinct',()=>{
 const sentinel=new Enemy(100,100,1,'sentinel');
 const artillery=new Enemy(100,100,1,'artillery');
 const artilleryElite=new Enemy(100,100,1,'artillery',true);
 const guardian=new Enemy(100,100,1,'guardian');
 const interceptor=new Enemy(100,100,1,'interceptor');
 assert.equal(sentinel.speed,35.6);
 assert.equal(ENEMY_MOTION_PROFILES.sentinel.maxSpeed,88);
 assert.equal(ENEMY_MOTION_PROFILES.sentinel.acceleration,180);
 assert.equal(artillery.speed,29.6);
 assert.equal(ENEMY_MOTION_PROFILES.artillery.maxSpeed,88);
 assert.equal(ENEMY_MOTION_PROFILES.artillery.acceleration,170);
 assert.ok(ENEMY_MOTION_PROFILES.artilleryElite.maxSpeed>ENEMY_MOTION_PROFILES.artillery.maxSpeed);
 assert.ok(ENEMY_MOTION_PROFILES.artilleryElite.acceleration>ENEMY_MOTION_PROFILES.artillery.acceleration);
 assert.equal(ENEMY_MOTION_PROFILES.guardian.maxSpeed,90);
 assert.ok(interceptor.speed<100);
 assert.equal(guardian.isElite,false);
});

test('DREADNOUGHT does not trigger a lateral dodge in response to player projectiles',()=>{
 const boss=new Enemy(300,250,10,'boss');
 boss.bossEntranceTimer=0;
 boss.facingRotation=Math.PI/2;
 boss.update(0.1,300,650,1000,1000,[{active:true,x:300,y:400,vx:0,vy:-200,radius:3}],[],0,0,0);
 assert.equal(boss.dodgeTimer,0);
});

test('DREADNOUGHT missile mounts retain a long-range firing lane',()=>{
 const systems=new BossSystems();
 const missile=systems.getModule('missile-left');
 assert.equal(missile.firingRange,980);
 assert.equal(selectBossAttack([missile],900,-120,8,1),'missile');
});
