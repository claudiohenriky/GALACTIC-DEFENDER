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
  assert.ok(Math.abs(position.x - 427) < 1e-9);
  assert.ok(Math.abs(position.y - 299) < 1e-9);
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


test('question indicator uses a compact cyan vector frame instead of a text emoji', () => {
  const state = createPilotReactionState();
  triggerPilotReaction(state, '❓', 2);
  const calls = [];
  const context = new Proxy({}, {
    get: (_target, property) => (...args) => calls.push([property, ...args]),
    set: (_target, property, value) => { calls.push([property, value]); return true; }
  });
  drawPilotReaction(context, state, 40, 50);
  assert.equal(calls.some(([name]) => name === 'fillText'), false);
  assert.ok(calls.some(([name]) => name === 'lineTo'));
  assert.ok(calls.some(([name]) => name === 'bezierCurveTo'));
  assert.ok(calls.some(([name, color]) => name === 'strokeStyle' && color === '#79dced'));
  assert.ok(calls.some(([name]) => name === 'stroke'));
});

test('danger and Elite indicators use the same cyan sensor language with stronger emphasis', () => {
  const render = (symbol) => {
    const calls = [];
    const context = new Proxy({}, {
      get: (_target, property) => (...args) => calls.push([property, ...args]),
      set: (target, property, value) => { calls.push([property, value]); return true; }
    });
    const state = createPilotReactionState();
    triggerPilotReaction(state, symbol, 2);
    drawPilotReaction(context, state, 40, 50);
    return calls;
  };
  const danger = render('❗');
  const elite = render('❓❗');
  assert.ok(danger.some(([name]) => name === 'strokeRect'));
  assert.ok(elite.some(([name]) => name === 'rotate'));
  assert.ok(elite.some(([name]) => name === 'strokeRect'));
  assert.equal(danger.some(([name]) => name === 'fillText'), false);
  assert.equal(elite.some(([name]) => name === 'fillText'), false);
});

test('game renders pilot reactions through the imported renderer with the state argument', async () => {
  const source = await readFile(new URL('../src/core/game.js', import.meta.url), 'utf8');
  assert.equal(source.includes('this.drawPilotReaction('), false);
  assert.equal(
    source.match(/drawPilotReaction\(ctx, this\.pilotReaction, reactionPosition\.x, reactionPosition\.y\)/g)?.length,
    2
  );
});
