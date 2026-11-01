import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillTree, SKILL_TREE_BRANCHES } from '../src/progression/skill-tree.js';

function withStorage(run) {
  const values = new Map();
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

test('skill tree starts with one research point and five branches', () => withStorage(() => {
  const tree = new SkillTree();
  assert.equal(tree.researchPoints, 1);
  assert.equal(tree.getBranches().length, 5);
  assert.equal(SKILL_TREE_BRANCHES.reduce((sum, branch) => sum + branch.nodes.length, 0), 15);
}));

test('nodes enforce prerequisites, costs, and one-time purchases', () => withStorage(() => {
  const tree = new SkillTree();
  assert.equal(tree.purchaseNode('integrity-2'), false);
  assert.equal(tree.purchaseNode('integrity-1'), true);
  assert.equal(tree.researchPoints, 0);
  assert.equal(tree.purchaseNode('integrity-1'), false);
  assert.equal(tree.getNodeStatus('integrity-2').unlocked, true);
}));

test('missions grant research points and every third completion grants a bonus', () => withStorage(() => {
  const tree = new SkillTree();
  assert.equal(tree.awardMissionCompletion(), 1);
  assert.equal(tree.awardMissionCompletion(), 1);
  assert.equal(tree.awardMissionCompletion(), 2);
  assert.equal(tree.researchPoints, 5);
}));

test('technology logistics grants an additional research point per mission', () => withStorage(() => {
  const tree = new SkillTree();
  tree.researchPoints = 100;
  for (const id of ['technology-1', 'technology-2', 'technology-3']) assert.equal(tree.purchaseNode(id), true);
  assert.equal(tree.awardMissionCompletion(), 2);
}));

test('permanent bonuses are applied to player attributes', () => withStorage(() => {
  const tree = new SkillTree();
  tree.researchPoints = 100;
  for (const id of ['integrity-1', 'mobility-1', 'arsenal-1', 'energy-1', 'technology-1']) tree.purchaseNode(id);
  const player = { baseMaxHealth: 100, baseSpeed: 250, movementAcceleration: 2400, shieldLevel: 0 };
  tree.applyToPlayer(player);
  assert.equal(player.maxHealth, 105);
  assert.equal(player.health, 105);
  assert.equal(player.speed, 257.5);
  assert.equal(player.weaponDamage, 1.04);
  assert.equal(player.permanentShieldBonus, 1);
  assert.equal(player.xpMultiplier, 1.05);
}));

test('legacy saved research is ignored and the tree starts clean', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify({ researchPoints: 999, purchased: ['integrity-1'], missionsCompleted: 99 }), setItem: () => {} };
  try {
    const tree = new SkillTree();
    assert.equal(tree.researchPoints, 1);
    assert.equal(tree.purchased.size, 0);
    assert.equal(tree.missionsCompleted, 0);
  }
  finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});
