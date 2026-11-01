import test from 'node:test';
import assert from 'node:assert/strict';
import { Mission, MISSION_ROTATION } from '../src/missions/missions.js';

function completeCurrent(mission) {
  const type = mission.current.type;
  const target = mission.current.target;
  if (type === 'survive') {
    for (let i = 0; i < target * 4; i++) mission.update(0.25, 1);
    return;
  }
  if (type === 'wave') { mission.update(0.01, target); return; }
  if (type === 'elite-kills') {
    for (let i = 0; i < target; i++) mission.registerKill({ isElite: true });
    return;
  }
  if (type === 'abilities') {
    for (let i = 0; i < target; i++) mission.registerAbilityUse();
    return;
  }
  if (type === 'boss') { mission.registerKill({ isBoss: true }); return; }
  for (let i = 0; i < target; i++) mission.registerKill();
}

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

  for (let i = 0; i < 179; i++) assert.equal(mission.update(0.25, 1), null);
  const survivor = mission.update(0.25, 1);
  assert.equal(survivor.id, 'survivor');
  assert.equal(mission.current.id, 'sector-breaker');

  assert.equal(mission.update(0.1, 3), null);
  const wave = mission.update(0.1, 4);
  assert.equal(wave.id, 'sector-breaker');
  assert.equal(mission.current.id, 'elite-hunter');
}));

test('elite, boss, and ability objectives only count their matching events', () => withStorage(() => {
  const mission = new Mission();
  for (let i = 0; i < 3; i++) completeCurrent(mission);
  assert.equal(mission.current.type, 'elite-kills');
  assert.equal(mission.registerKill(), null);
  assert.equal(mission.registerKill({ isElite: true }), null);
  assert.equal(mission.registerKill({ isElite: true }).id, 'elite-hunter');
  assert.equal(mission.current.type, 'abilities');

  assert.equal(mission.registerAbilityUse(), null);
  assert.equal(mission.registerAbilityUse(), null);
  assert.equal(mission.registerAbilityUse().id, 'system-operator');
  assert.equal(mission.current.type, 'boss');
  assert.equal(mission.registerKill(), null);
  assert.equal(mission.registerKill({ isBoss: true }).id, 'dreadnought-hunter');
}));

test('mission progress and rotation reset when a new session starts', () => withStorage(() => {
  let mission = new Mission();
  mission.registerKill();
  mission.registerKill();
  mission = new Mission();
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(mission.progress, 0);
  assert.equal(mission.completedCount, 0);
}));

test('survival progress is session-only and resets on a new instance', () => withStorage(() => {
  let mission = new Mission();
  for (let i = 0; i < 5; i++) mission.registerKill();
  for (let i = 0; i < 50; i++) mission.update(0.25, 1);
  mission.update(0.2, 1);
  mission = new Mission();
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(mission.progress, 0);
  assert.equal(mission.getDisplayProgress(), '0 / 5');
}));

test('cycle difficulty increases targets without changing boss target', () => withStorage(() => {
  const mission = new Mission();
  for (let i = 0; i < 5; i++) completeCurrent(mission);
  assert.equal(mission.current.type, 'boss');
  assert.equal(mission.current.target, 1);
  completeCurrent(mission);
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(mission.current.target, 7);
}));

test('legacy saved mission data is ignored and the first mission starts clean', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify({ completedCount: 5, progress: 4, elapsed: 40 }), setItem: () => {} };
  try {
    const mission = new Mission();
    assert.equal(mission.current.id, 'first-contact');
    assert.equal(mission.progress, 0);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test('game wires Elite, boss, and special-ability events into mission progress', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  assert.match(source, /registerKill\(\{ isElite: Boolean\(enemy\.isElite\), isBoss: enemy\.type === 'boss' \}\)/);
  assert.equal((source.match(/registerAbilityUse\(\)/g) || []).length, 3);
});
