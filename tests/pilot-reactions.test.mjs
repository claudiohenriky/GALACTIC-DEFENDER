import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createPilotReactionState,
  triggerPilotReaction,
  updatePilotReaction,
  signalPilotThreat,
  drawPilotReaction,
  getPilotReactionPosition
} from '../src/ui/pilot-reactions.js';

test('pilot threat warning triggers once per attack telegraph transition', () => {
  const state = createPilotReactionState();
  const attack = {};

  assert.equal(signalPilotThreat(state, attack, true), true);
  assert.equal(state.symbol, '❗');
  assert.equal(signalPilotThreat(state, attack, true), false);
  assert.equal(state.remaining, 1.2);

  assert.equal(signalPilotThreat(state, attack, false), false);
  assert.equal(signalPilotThreat(state, attack, true), true);
  assert.equal(state.symbol, '❗');
});

test('pilot reactions preserve question, danger, and combined Elite indicators', () => {
  const state = createPilotReactionState();
  assert.equal(triggerPilotReaction(state, '❓', 1.5), true);
  assert.equal(state.symbol, '❓');
  assert.equal(triggerPilotReaction(state, '❗', 1.2), true);
  assert.equal(state.symbol, '❗');
  assert.equal(triggerPilotReaction(state, '❓❗', 2.2), true);
  assert.equal(state.symbol, '❓❗');
  updatePilotReaction(state, 2.2);
  assert.equal(state.remaining, 0);
  assert.equal(state.symbol, '');
});


test('pilot reaction stays close to the side of the ship and clear of its dialogue card', () => {
  const position = getPilotReactionPosition({
    x: 400, y: 300, width: 900, height: 420,
    bubble: { x: 180, y: 230, width: 190, height: 70 }
  });
  assert.ok(position);
  assert.ok(Math.abs(position.x - 423) < 1e-9);
  assert.ok(Math.abs(position.y - 298) < 1e-9);
});

test('pilot reaction renderer accepts the state and screen position without throwing', () => {
  const state = createPilotReactionState();
  triggerPilotReaction(state, '❓', 1);
  const context = new Proxy({}, {
    get: (_target, property) => typeof property === 'string' ? () => {} : undefined,
    set: () => true
  });
  assert.doesNotThrow(() => drawPilotReaction(context, state, 40, 50));
});

test('game renders pilot reactions through the imported renderer with the state argument', async () => {
  const source = await readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  assert.equal(source.includes('this.drawPilotReaction('), false);
  assert.equal(
    source.match(/drawPilotReaction\(ctx, this\.pilotReaction, reactionPosition\.x, reactionPosition\.y\)/g)?.length,
    2
  );
});
