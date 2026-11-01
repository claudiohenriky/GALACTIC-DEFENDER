import test from 'node:test';
import assert from 'node:assert/strict';
import { Mission, MISSION_ROTATION } from '../src/missions/missions.js';

function withStorage(run, initial = null) {
  const values = new Map();
  if (initial !== null) values.set('gd-missions-v2', JSON.stringify(initial));
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value))
  };
  try { return run(values); }
  finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

test('mission rotation contains six distinct objectives', () => {
  assert.equal(MISSION_ROTATION.length, 6);
  assert.deepEqual(new Set(MISSION_ROTATION.map(item => item.type)).size, 6);
});

test('kill, survival, and wave objectives complete and rotate', () => withStorage(() => {
  const mission = new Mission();
  for (let i = 0; i < 4; i++) assert.equal(mission.registerKill(), null);
  const first = mission.registerKill();
  assert.equal(first.id, 'first-contact');
  assert.equal(first.completionNumber, 1);
  assert.equal(mission.current.id, 'survivor');

  assert.equal(mission.update(44.5, 1), null);
  const survivor = mission.update(0.5, 1);
  assert.equal(survivor.id, 'survivor');
  assert.equal(mission.current.id, 'sector-breaker');

  assert.equal(mission.update(0.1, 3), null);
  const wave = mission.update(0.1, 4);
  assert.equal(wave.id, 'sector-breaker');
  assert.equal(mission.current.id, 'elite-hunter');
}));

test('elite, boss, and ability objectives only count their matching events', () => withStorage(() => {
  const mission = new Mission();
  for (let i = 0; i < 3; i++) mission.registerKill();
  assert.equal(mission.current.type, 'elite-kills');
  assert.equal(mission.registerKill(), null);
  assert.equal(mission.registerKill({ isElite: true }), null);
  assert.equal(mission.registerKill({ isElite: true }), null);
  assert.equal(mission.current.type, 'abilities');

  assert.equal(mission.registerAbilityUse(), null);
  assert.equal(mission.registerAbilityUse(), null);
  assert.equal(mission.registerAbilityUse().id, 'system-operator');
  assert.equal(mission.current.type, 'boss');
  assert.equal(mission.registerKill(), null);
  assert.equal(mission.registerKill({ isBoss: true }).id, 'dreadnought-hunter');
}));

test('mission progress and rotation persist after creating a new instance', () => withStorage(() => {
  let mission = new Mission();
  mission.registerKill();
  mission.registerKill();
  mission = new Mission();
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(mission.progress, 2);
  for (let i = 0; i < 3; i++) mission.registerKill();
  mission = new Mission();
  assert.equal(mission.current.id, 'survivor');
  assert.equal(mission.completedCount, 1);
}));

test('survival progress persists with fractional elapsed time', () => withStorage(() => {
  let mission = new Mission({} );
  for (let i = 0; i < 5; i++) mission.registerKill();
  mission.update(12.7, 1);
  mission = new Mission();
  assert.equal(mission.current.id, 'survivor');
  assert.equal(mission.progress, 12);
  assert.equal(mission.getDisplayProgress(), '12s / 45s');
}));

test('cycle difficulty increases targets without changing boss target', () => withStorage(() => {
  const mission = new Mission();
  for (let i = 0; i < 18; i++) {
    const target = mission.current.target;
    if (mission.current.type === 'survive') mission.update(target, 1);
    else if (mission.current.type === 'wave') mission.update(0.1, target);
    else if (mission.current.type === 'elite-kills') {
      for (let n = 0; n < target; n++) mission.registerKill({ isElite: true });
    } else if (mission.current.type === 'abilities') {
      for (let n = 0; n < target; n++) mission.registerAbilityUse();
    } else if (mission.current.type === 'boss') mission.registerKill({ isBoss: true });
    else for (let n = 0; n < target; n++) mission.registerKill();
  }
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(mission.current.target, 7);
}));

test('corrupted storage safely falls back to the first mission', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => '{bad json', setItem: () => {} };
  try {
    const mission = new Mission();
    assert.equal(mission.current.id, 'first-contact');
    assert.equal(mission.progress, 0);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});
