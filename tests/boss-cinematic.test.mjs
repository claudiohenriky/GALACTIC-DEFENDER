import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_CINEMATIC_PHASES,
  BOSS_CINEMATIC_TOTAL_DURATION,
  advanceBossCinematic,
  createBossCinematic,
  getBossCinematicAlert,
  getBossCinematicDialogue
} from '../src/core/boss-cinematic.js';

function advance(state, seconds) {
  let remaining = seconds;
  while (remaining > 1e-9) {
    const step = Math.min(0.05, remaining);
    advanceBossCinematic(state, step);
    remaining -= step;
  }
}

test('new cinematic owns a deterministic sequence and lasts the planned duration', () => {
  const state = createBossCinematic();
  assert.equal(state.phase, 'hud-fade');
  assert.deepEqual(BOSS_CINEMATIC_PHASES.map((phase) => phase.id), [
    'hud-fade', 'loading', 'pilot-intro', 'anomaly-scan',
    'distant-contact', 'boss-identification', 'handoff', 'complete'
  ]);
  assert.equal(BOSS_CINEMATIC_TOTAL_DURATION, 56.5);
  advance(state, BOSS_CINEMATIC_TOTAL_DURATION);
  assert.equal(state.phase, 'complete');
  assert.equal(state.handoffComplete, true);
  assert.equal(state.cameraOwner, 'game');
  assert.equal(state.pilotHudOpacity, 1);
});

test('HUD fades out before loading and fades back only during combat handoff', () => {
  const state = createBossCinematic();
  advance(state, 2.5);
  assert.ok(Math.abs(state.pilotHudOpacity - 0.5) < 0.03);
  advance(state, 2.5);
  assert.equal(state.phase, 'loading');
  assert.equal(state.pilotHudOpacity, 0);
  advance(state, 49);
  assert.equal(state.phase, 'handoff');
  assert.ok(state.pilotHudOpacity < 0.001);
  advance(state, 1.25);
  assert.ok(Math.abs(state.pilotHudOpacity - 0.5) < 0.03);
});

test('dialogue advances at deliberate intervals and anomaly alert does not reveal identity', () => {
  const state = createBossCinematic();
  advance(state, 15.5);
  assert.equal(state.phase, 'pilot-intro');
  assert.equal(getBossCinematicDialogue(state).actor, 'pilot');
  advance(state, 9);
  assert.equal(state.phase, 'anomaly-scan');
  advance(state, 1.8);
  const alert = getBossCinematicAlert(state);
  assert.equal(alert.title, 'ANOMALIA DETECTADA');
  assert.equal(alert.detail, 'ASSINATURA DESCONHECIDA · NÍVEL DE AMEAÇA ELEVADO');
  assert.equal(alert.title.includes('DREADNOUGHT'), false);
});

test('dialogue uses a timed typewriter reveal and preserves the complete source line', () => {
  const state = createBossCinematic();
  advance(state, 15.6);
  const early = getBossCinematicDialogue(state);
  assert.ok(early.visibleText.length > 0);
  assert.ok(early.visibleText.length < early.text.length);
  assert.equal(early.typingComplete, false);
  advance(state, 3.4);
  const later = getBossCinematicDialogue(state);
  assert.ok(later.visibleText.length > early.visibleText.length);
});

test('pilot and DREADNOUGHT have distinct alert identities', () => {
  const state = createBossCinematic();
  advance(state, 25.8);
  const anomaly = getBossCinematicAlert(state);
  assert.equal(anomaly.kind, 'anomaly');
  assert.equal(anomaly.icon, '!');
  advance(state, 24.45);
  const identity = getBossCinematicAlert(state);
  assert.equal(identity.kind, 'boss');
  assert.equal(identity.icon, '◆');
});

test('boss identity appears only in the final identification phase', () => {
  const state = createBossCinematic();
  advance(state, 50.25);
  assert.equal(state.phase, 'boss-identification');
  const alert = getBossCinematicAlert(state);
  assert.equal(alert.title, 'DREADNOUGHT');
  assert.equal(getBossCinematicDialogue(state).actor, 'pilot');
});


test('pilot intro line completes before the phase advances', () => {
  const state = createBossCinematic();
  advance(state, 15.5);
  advance(state, 8.3);
  const dialogue = getBossCinematicDialogue(state);
  assert.equal(state.phase, 'pilot-intro');
  assert.match(dialogue.text, /parece tranquilo/i);
  assert.equal(dialogue.typingComplete, true);
});

test('anomaly and system dialogue cues leave enough time for each complete line', () => {
  const state = createBossCinematic();
  advance(state, 24);
  assert.equal(state.phase, 'anomaly-scan');
  advance(state, 3.1);
  const pilot = getBossCinematicDialogue(state);
  assert.equal(pilot.actor, 'pilot');
  assert.equal(pilot.typingComplete, true);
  advance(state, 0.5);
  const system = getBossCinematicDialogue(state);
  assert.equal(system.actor, 'system');
  assert.equal(system.typingComplete, false);
  advance(state, 2.6);
  assert.equal(getBossCinematicDialogue(state).actor, 'system');
  assert.equal(getBossCinematicDialogue(state).typingComplete, true);
  advance(state, 2.7);
  const finalPilot = getBossCinematicDialogue(state);
  assert.equal(finalPilot.actor, 'pilot');
  assert.equal(finalPilot.typingComplete, true);
});

test('alert cues tolerate floating-point boundaries at the scheduled frame', () => {
  const state = createBossCinematic();
  advance(state, 25.8);
  assert.equal(getBossCinematicAlert(state)?.kind, 'anomaly');
});
