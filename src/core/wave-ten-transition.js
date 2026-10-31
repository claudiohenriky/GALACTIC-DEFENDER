const TRANSITION_PHASES = [
  { phase: 'loading', duration: 10 },
  { phase: 'pilot-report', duration: 3.2 },
  { phase: 'pilot-warning', duration: 3 },
  { phase: 'boss-entry', duration: 4.8 },
  { phase: 'boss-taunt', duration: 4.2 },
  { phase: 'complete', duration: 0 }
];

export function createWaveTenTransition() {
  return {
    phase: TRANSITION_PHASES[0].phase,
    phaseIndex: 0,
    phaseDuration: TRANSITION_PHASES[0].duration,
    phaseElapsed: 0,
    elapsed: 0,
    cameraZoom: 1.18,
    boss: null
  };
}

export function advanceWaveTenTransition(state, dt) {
  if (!state || state.phase === 'complete') return state;
  const safeDelta = Math.max(0, Math.min(0.05, Number(dt) || 0));
  state.elapsed += safeDelta;
  state.phaseElapsed += safeDelta;
  if (state.phaseElapsed + 1e-9 >= state.phaseDuration) {
    state.phaseIndex = Math.min(TRANSITION_PHASES.length - 1, state.phaseIndex + 1);
    const next = TRANSITION_PHASES[state.phaseIndex];
    state.phase = next.phase;
    state.phaseDuration = next.duration;
    state.phaseElapsed = 0;
  }
  return state;
}

export const WAVE_TEN_TRANSITION_DURATION = TRANSITION_PHASES.reduce((sum, phase) => sum + phase.duration, 0);


// The cinematic controls the boss position until the reveal. Release its internal
// entrance timer at handoff so its normal AI cannot replay the entrance afterward.
export function finalizeWaveTenTransition(state) {
  const boss = state?.boss ?? null;
  if (boss) boss.bossEntranceTimer = 0;
  return boss;
}
