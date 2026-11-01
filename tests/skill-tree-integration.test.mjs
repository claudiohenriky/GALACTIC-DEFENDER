import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('game integrates permanent skill-tree bonuses and mission research', async () => {
  const source = await readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  assert.match(source, /this\.skillTree = new SkillTree\(\)/);
  assert.match(source, /applyPermanentSkillBonuses\(\)/);
  assert.match(source, /this\.skillTree\.awardMissionCompletion\(\)/);
});

test('run specializations are gated by their unlocked base abilities', async () => {
  const source = await readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  assert.match(source, /this\.player\.guidedMissileLevel > 0/);
  assert.match(source, /this\.player\.shieldLevel > 0/);
  assert.match(source, /this\.player\.doubleShotLevel > 0/);
  assert.match(source, /option\.type === 'shieldCapacity' \|\| option\.type === 'shieldRecharge'/);
  assert.doesNotMatch(source, /option\.type\.startsWith\('shield'\)/);
  assert.match(source, /guidedMissileFragmentation/);
});

test('skill-tree menu is connected to the session-only research interface', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const main = await readFile(new URL('../main.js', import.meta.url), 'utf8');
  assert.match(html, /id="menu-skill-tree-button"/);
  assert.match(html, /id="skill-tree-panel"/);
  assert.match(main, /renderSkillTree\(\)/);
  assert.match(main, /purchaseNode\(button\.dataset\.skillNode\)/);
});
