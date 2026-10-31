import test from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, orientedEllipseOverlapsCircle } from '../src/combat/collision.js';
import { BossSystems, getBossBeamSegment, getBossPlasmaSegment, isBossPlasmaTelegraphActive, getBossMissileProfile, selectBossAttack, selectBossMissileLauncher } from '../src/enemies/boss-systems.js';
import { Enemy } from '../src/enemies/enemy.js';
import { EnemyProjectile } from '../src/combat/enemy-projectile.js';
import { getGuardianProtectionPriority, selectGuardianProtectionTargets } from '../src/ai/guardian-protection.js';
import { ENEMY_MOTION_PROFILES } from '../src/movement/motion.js';
import { BOSS_TEST_MODE, WaveManager } from '../src/core/wave-manager.js';
import { getBossCombatTargetY } from '../src/core/boss-positioning.js';
import { prepareBossForCombatHandoff } from '../src/core/boss-cinematic-camera.js';
import { createPilotReactionState, triggerPilotReaction, updatePilotReaction, signalPilotThreat, getPilotReactionPosition } from '../src/ui/pilot-reactions.js';

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
test('boss owns twelve unique weapon modules, two plasma cannons and two long-range ion emitters',()=>{
 const systems=new BossSystems();
 assert.equal(systems.modules.length,12);
 assert.equal(new Set(systems.modules.map(m=>m.id)).size,12);
 const plasma=systems.modules.filter(m=>m.kind.includes('plasma'));
 assert.equal(plasma.length,2);
 assert.equal(plasma.filter(m=>m.region==='left').length,1);
 assert.equal(plasma.filter(m=>m.region==='right').length,1);
 assert.ok(plasma.every(m=>m.firingRange===500 && m.plasmaWarningDuration===1.5));
 assert.equal(systems.getModule('long-range-ion-left').kind,'light-laser');
 assert.equal(systems.getModule('long-range-ion-right').kind,'light-laser');
 assert.equal(systems.getModule('long-range-ion-left').firingRange,1050);
 assert.equal(systems.getModule('long-range-ion-right').firingRange,1050);
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
 assert.equal(selectBossAttack(systems.modules,680,32,8,2),'light-laser');
 systems.getModule('machine-gun-right').state='disabled';
 assert.equal(selectBossAttack(systems.modules,950,32,8,2),'light-laser');
 systems.getModule('light-laser-left').state='disabled';
 systems.getModule('light-laser-right').state='disabled';
 systems.getModule('long-range-ion-right').state='disabled';
 assert.equal(selectBossAttack(systems.modules,950,32,8,2),null);
});


test('DREADNOUGHT missiles use phase-scaled speed and damage with a slower launch cadence',()=>{
 const phaseOne=getBossMissileProfile(1);
 const phaseTwo=getBossMissileProfile(2);
 const phaseThree=getBossMissileProfile(3);
 assert.deepEqual(phaseOne,{speed:280,damage:10,turnRate:0.38,cooldown:6.0,lifetime:4.2,curveAmplitude:0.08,curveFrequency:2.4});
 assert.deepEqual(phaseTwo,{speed:300,damage:11,turnRate:0.42,cooldown:5.7,lifetime:4.2,curveAmplitude:0.09,curveFrequency:2.6});
 assert.deepEqual(phaseThree,{speed:320,damage:12,turnRate:0.46,cooldown:5.4,lifetime:4.2,curveAmplitude:0.10,curveFrequency:2.8});
 assert.ok(phaseOne.speed>118 && phaseOne.damage>=10 && phaseOne.cooldown>5);
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
 assert.equal(selectBossMissileLauncher(systems.modules,1000,0,8,-1),null);
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
 assert.equal(first[0].speed,280);
 assert.equal(first[0].damage,10);
 assert.equal(first[0].guidedStyle,true);
 assert.equal(first[0].turnRate,0.38);
 assert.equal(first[0].lifetime,4.2);
 assert.equal(first[0].curveAmplitude,0.08);
 assert.equal(first[0].curveFrequency,2.4);
 assert.equal(boss.bossMissileCooldown,6.0);
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

test('normal wave progression reserves bosses for every fifteenth wave',()=>{
 assert.equal(BOSS_TEST_MODE,false);
 const waves=new WaveManager();
 assert.equal(waves.wave,1);
 assert.equal(waves.enemyCount,5);
 waves.wave=14;
 waves.state='intermission';
 waves.timer=0;
 waves.update(0.01,0);
 assert.equal(waves.wave,15);
 assert.equal(waves.enemyCount,1);
 waves.state='intermission';
 waves.timer=0;
 waves.update(0.01,0);
 assert.equal(waves.wave,16);
 assert.equal(waves.enemyCount,18);
});

test('elite variants are limited to Sentinel, Guardian, Artillery and Devastator; Interceptor stays basic',()=>{
 const interceptor=new Enemy(100,100,1,'interceptor',true);
 assert.equal(interceptor.isElite,false);
 assert.equal(interceptor.maxHealth,1);
 for(const type of ['sentinel','guardian','artillery','devastator']){
  const elite=new Enemy(100,100,12,type,true);
  assert.equal(elite.isElite,true,`${type} should support an Elite variant`);
 }
});


test('waves 10 and 20 are normal; waves 15 and 30 spawn the recurring boss',()=>{
 const waves=new WaveManager();
 waves.startAtWaveForTesting(10); assert.equal(waves.enemyCount,18);
 waves.startAtWaveForTesting(15); assert.equal(waves.enemyCount,1);
 waves.startAtWaveForTesting(20); assert.equal(waves.enemyCount,18);
 waves.startAtWaveForTesting(30); assert.equal(waves.enemyCount,1);
});

test('guided DREADNOUGHT missiles have bounded steering, a visible dart profile and finite lifetime',()=>{
 const target={x:1000,y:0};
 const missile=new EnemyProjectile(0,0,1000,0,{speed:300,homing:true,target,turnRate:0.4,guidedStyle:true,lifetime:4.2,curveAmplitude:0.08,curveFrequency:2.4});
 target.x=0; target.y=1000;
 missile.update(0.1);
 const angle=Math.atan2(missile.vy,missile.vx);
 assert.ok(Math.abs(angle)<0.05,'steering must remain a small correction, not a hard lock');
 for(let i=0;i<42;i++) missile.update(0.1);
 assert.equal(missile.active,false,'missile expires instead of accumulating indefinitely');
});

test('Sentinel projectile scans are throttled between checks when no dodge is active',()=>{
 const sentinel=new Enemy(300,300,8,'sentinel');
 let iterations=0;
 const projectiles=new Proxy([],{
  get(target,property,receiver){
   if(property===Symbol.iterator) iterations+=1;
   return Reflect.get(target,property,receiver);
  }
 });
 sentinel.update(1/60,500,700,1000,1200,projectiles,[],0,0,0);
 assert.equal(iterations,1);
 sentinel.update(1/60,500,700,1000,1200,projectiles,[],0,0,0);
 sentinel.update(1/60,500,700,1000,1200,projectiles,[],0,0,0);
 assert.equal(iterations,1,'intermediate frames reuse the recent no-threat result');
 for(let frame=0;frame<13;frame++) sentinel.update(1/60,500,700,1000,1200,projectiles,[],0,0,0);
 assert.ok(iterations>=2,'a fresh scan occurs after the 0.20-second interval');
});

test('new cinematic handoff clears the constructor entrance timer before normal AI resumes',()=>{
 const boss=new Enemy(640,120,10,'boss');
 assert.ok(boss.bossEntranceTimer>0);
 prepareBossForCombatHandoff(boss,980);
 assert.equal(boss.bossEntranceTimer,0);
 assert.equal(boss.y,980);
 assert.equal(boss.bossMoveTargetY,980);
 assert.equal(boss.bossMoveTargetX,boss.x);
 assert.equal(boss.bossMovementState,'patrol');
 assert.equal(boss.bossMovementTimer,0);
 assert.equal(boss.velocityX,0);
 assert.equal(boss.velocityY,0);
});

test('DREADNOUGHT phase attack priorities create distinct but readable weapon rotations',()=>{
 const systems=new BossSystems();
 for(const module of systems.modules) module.plasmaChargeTimer=0;
 assert.equal(selectBossAttack(systems.modules,450,-32,8,1),'plasma');
 assert.equal(selectBossAttack(systems.modules,450,-32,8,2),'plasma');
 assert.equal(selectBossAttack(systems.modules,450,-32,8,3),'missile');
 assert.equal(selectBossAttack(systems.modules,680,32,8,2),'missile');
});

test('DREADNOUGHT plasma telegraph matches the weapon muzzle and activates only during its final charge window',()=>{
 const boss=new Enemy(500,300,10,'boss');
 boss.bossEntranceTimer=0;
 boss.fireCooldown=1.2;
 boss.facingRotation=Math.PI/2;
 const module=boss.bossSystems.getModule('plasma-cannon-left-forward');
 module.plasmaChargeTimer=1.1;
 const segment=getBossPlasmaSegment(boss,module);
 assert.ok(Number.isFinite(segment.startX)&&Number.isFinite(segment.endY));
 assert.equal(isBossPlasmaTelegraphActive(boss,module,segment.startX+100,segment.startY+40),true);
 assert.equal(isBossPlasmaTelegraphActive(boss,module,boss.x,boss.y),true,'a centered target should be inside both weapon wings');
 module.plasmaChargeTimer=2.1;
 assert.equal(isBossPlasmaTelegraphActive(boss,module,segment.startX+100,segment.startY+40),false);
 module.plasmaChargeTimer=0;
 assert.equal(isBossPlasmaTelegraphActive(boss,module,segment.startX+100,segment.startY+40),true);
});




test('DREADNOUGHT ignores player projectile near-misses instead of performing troop-style dodges', () => {
  const boss = new Enemy(500, 300, 10, 'boss'); boss.bossEntranceTimer = 0; boss.bossRepositionCooldown = 10; boss.facingRotation = Math.PI / 2; boss.fireCooldown = 10;
  const playerShot = { x: 500, y: 450, vx: 0, vy: -280, radius: 3, active: true };
  boss.update(1 / 60, 500, 900, 1000, 1200, [playerShot], [], 0, 0, 0);
  assert.equal(boss.dodgeTimer, 0); assert.equal(boss.dodgeScanTimer, 0);
});

test('DREADNOUGHT reposition and stabilization windows are shorter without retreat vectors', () => {
  const boss = new Enemy(500, 300, 10, 'boss'); boss.bossEntranceTimer = 0; boss.bossMovementState = 'reposition'; boss.bossMovementTimer = 0.01; boss.bossRepositionCooldown = 10; boss.bossMoveTargetX = 700; boss.bossMoveTargetY = 700;
  boss.update(0.02, 500, 900, 1200, 1600, [], [], 0, 0, 0);
  assert.equal(boss.bossMovementState, 'stabilize'); assert.equal(boss.bossMovementTimer, 0.45);
  boss.update(0.46, 500, 900, 1200, 1600, [], [], 0, 0, 0); assert.equal(boss.bossMovementState, 'patrol');
});

test('DREADNOUGHT accelerates its attack cadence across all three phases', () => {
  const expected = [1.65, 1.45, 1.28];
  for (let phase = 1; phase <= 3; phase += 1) {
    const boss = new Enemy(500, 300, 10, 'boss'); boss.bossEntranceTimer = 0; boss.bossPhase = phase; boss.health = boss.maxHealth * (phase === 1 ? 1 : phase === 2 ? 0.5 : 0.2); boss.bossPhaseTransition = 0; boss.fireCooldown = 0; boss.facingRotation = Math.PI / 2;
    const volley = boss.update(1 / 60, 500, 900, 1000, 1200, [], [], 0, 0, 0);
    assert.ok(Array.isArray(volley) && volley.length > 0, 'phase should fire'); assert.equal(boss.fireCooldown, expected[phase - 1]);
  }
});

test('DREADNOUGHT prioritizes guided missiles at long range in every phase', () => {
  const systems = new BossSystems();
  for (const phase of [1, 2, 3]) assert.equal(selectBossAttack(systems.modules, 900, 32, 8, phase), 'missile');
  assert.equal(systems.getModule('missile-left').firingRange, 980); assert.equal(systems.getModule('missile-right').firingRange, 980);
});

test('DREADNOUGHT plasma shots retain their high-speed heavy-impact profile', () => {
  const boss = new Enemy(500, 300, 10, 'boss'); boss.bossEntranceTimer = 0; boss.fireCooldown = 0; boss.facingRotation = Math.PI / 2;
  for (const module of boss.bossSystems.modules) if (module.kind.includes('plasma')) module.plasmaChargeTimer = 0;
  const volley = boss.update(1 / 60, 500, 700, 1000, 1200, [], [], 0, 0, 0);
  assert.ok(Array.isArray(volley)); assert.ok(volley.some(shot => shot.plasmaImpact && shot.speed === 760 && shot.damage === 68));
});
