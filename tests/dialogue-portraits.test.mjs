import test from 'node:test';
import assert from 'node:assert/strict';
import { drawDialoguePortrait, getDialogueActorLabel } from '../src/ui/dialogue-portraits.js';
import {
  createPilotReactionState,
  triggerElitePilotReaction,
  updatePilotReaction
} from '../src/ui/pilot-reactions.js';

test('every dialogue actor has a distinct readable identity label', () => {
  assert.equal(getDialogueActorLabel('pilot'), 'PILOTO');
  assert.equal(getDialogueActorLabel('system'), 'SISTEMA');
  assert.equal(getDialogueActorLabel('boss'), 'DREADNOUGHT');
  assert.equal(getDialogueActorLabel('artillery'), 'ARTILHEIRO ELITE');
  assert.equal(getDialogueActorLabel('sentinel'), 'SENTINELA ELITE');
  assert.equal(getDialogueActorLabel('guardian'), 'GUARDIÃO ELITE');
  assert.equal(getDialogueActorLabel('devastator'), 'DEVASTADOR ELITE');
  assert.equal(getDialogueActorLabel('unknown'), 'COMUNICAÇÃO');
});

test('speaker portrait renderer draws a bounded portrait for every actor profile', () => {
  const actors = ['pilot', 'system', 'boss', 'artillery', 'sentinel', 'guardian', 'devastator'];
  for (const actor of actors) {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (_target, property) => (...args) => calls.push([property, ...args]),
      set: (_target, property, value) => { calls.push([property, value]); return true; }
    });
    assert.doesNotThrow(() => drawDialoguePortrait(ctx, actor, 8, 12, 28, 0.5));
    assert.ok(calls.some(([name]) => name === 'fillRect'), actor);
    assert.ok(calls.some(([name]) => name === 'strokeRect'), actor);
    assert.ok(calls.some(([name]) => name === 'restore'), actor);
  }
});

test('portrait renderer safely ignores invalid canvas input', () => {
  assert.doesNotThrow(() => drawDialoguePortrait(null, 'pilot', 0, 0, 24));
  assert.doesNotThrow(() => drawDialoguePortrait({}, 'pilot', 0, 0, 0));
});

test('Elite first-contact dialogue stores its own speaker identity and only triggers once per class', () => {
  const state = createPilotReactionState();
  const seen = new Set();
  assert.equal(triggerElitePilotReaction(state, seen, 'devastator', 'Canhão de cerco pronto.', 6), true);
  assert.equal(state.actor, 'devastator');
  assert.equal(state.message, 'Canhão de cerco pronto.');
  assert.equal(triggerElitePilotReaction(state, seen, 'devastator', 'Outra fala.', 6), false);
  updatePilotReaction(state, 6);
  assert.equal(state.actor, 'pilot');
  assert.equal(state.message, '');
});
