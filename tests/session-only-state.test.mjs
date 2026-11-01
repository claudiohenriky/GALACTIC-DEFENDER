import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { SkillTree } from '../src/progression/skill-tree.js';
import { Mission } from '../src/missions/missions.js';
import { AchievementTracker } from '../src/progression/achievements.js';
import { Progression } from '../src/progression/progression.js';
import { clearLegacyGameStorage } from '../src/core/session-reset.js';

function withStorage(storage, run) {
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  globalThis.localStorage = storage;
  globalThis.sessionStorage = storage;
  try { return run(); }
  finally {
    if (previousLocal === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocal;
    if (previousSession === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousSession;
  }
}

test('new game systems never read or write browser storage', () => withStorage({
  getItem() { throw new Error('reads are disabled'); },
  setItem() { throw new Error('writes are disabled'); }
}, () => {
  const tree = new SkillTree();
  const mission = new Mission();
  const achievements = new AchievementTracker();
  const progression = new Progression();
  assert.equal(tree.researchPoints, 1);
  assert.equal(mission.current.id, 'first-contact');
  assert.equal(achievements.stats.kills, 0);
  assert.equal(progression.level, 1);
  assert.deepEqual(progression.unlockedTitles, ['recruit']);
}));

test('mission progress, research, achievements, and pilot titles reset in a new session', () => {
  const mission = new Mission();
  mission.registerKill();
  mission.registerKill();
  const tree = new SkillTree();
  tree.purchaseNode('integrity-1');
  const achievements = new AchievementTracker();
  achievements.record('kills');
  const progression = new Progression();
  progression.addXp(140);
  progression.recordMissionCompletion(3);

  assert.equal(new Mission().progress, 0);
  assert.equal(new Mission().completedCount, 0);
  assert.equal(new SkillTree().researchPoints, 1);
  assert.equal(new SkillTree().purchased.size, 0);
  assert.equal(new AchievementTracker().stats.kills, 0);
  assert.equal(new Progression().level, 1);
  assert.deepEqual(new Progression().unlockedTitles, ['recruit']);
});

test('legacy gd- keys are removed while unrelated browser data is preserved', () => {
  const makeStorage = () => {
    const values = new Map([
      ['gd-missions-v2', 'old-progress'],
      ['gd-setting-fps-setting', 'on'],
      ['other-app-preference', 'keep']
    ]);
    return {
      get length() { return values.size; },
      key(index) { return [...values.keys()][index] ?? null; },
      removeItem(key) { values.delete(key); },
      getItem(key) { return values.get(key) ?? null; }
    };
  };
  const local = makeStorage();
  const session = makeStorage();
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  globalThis.localStorage = local;
  globalThis.sessionStorage = session;
  try {
    clearLegacyGameStorage();
    assert.equal(local.getItem('gd-missions-v2'), null);
    assert.equal(local.getItem('gd-setting-fps-setting'), null);
    assert.equal(local.getItem('other-app-preference'), 'keep');
    assert.equal(session.getItem('gd-missions-v2'), null);
    assert.equal(session.getItem('other-app-preference'), 'keep');
  } finally {
    if (previousLocal === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocal;
    if (previousSession === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousSession;
  }
});

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectJavaScriptFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}

test('runtime modules never read or write persistent browser state', async () => {
  const files = [
    new URL('../main.js', import.meta.url).pathname,
    ...await collectJavaScriptFiles(new URL('../src/', import.meta.url).pathname)
  ];
  for (const path of files) {
    const source = await readFile(path, 'utf8');
    assert.doesNotMatch(source, /(localStorage|sessionStorage)\.(getItem|setItem|clear)\s*\(/, path);
    assert.doesNotMatch(source, /indexedDB\.open\s*\(/, path);
  }
  const entry = await readFile(new URL('../main.js', import.meta.url), 'utf8');
  assert.ok(entry.includes("friendShipUnlockCode = 'ORBITAL-ALLY'"));
  assert.ok(entry.includes("replace(/[\\s#]/g"));
});
