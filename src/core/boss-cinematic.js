// New DREADNOUGHT debut cinematic. This controller is deliberately independent
// from Enemy AI and Game camera code: the cinematic owns presentation until handoff.
export const BOSS_CINEMATIC_PHASES = Object.freeze([
  { id: 'hud-fade', duration: 5 },
  { id: 'loading', duration: 10 },
  { id: 'pilot-intro', duration: 9 },
  { id: 'anomaly-scan', duration: 9 },
  { id: 'distant-contact', duration: 17 },
  { id: 'boss-identification', duration: 4 },
  { id: 'handoff', duration: 2.5 },
  { id: 'complete', duration: 0 }
]);

// Dialogue is scheduled per line rather than divided evenly across broad phases.
// This keeps the 4.5-second reading rhythm stable if a phase is later extended.
export const BOSS_CINEMATIC_DIALOGUE = Object.freeze({
  'pilot-intro': Object.freeze([
    { at: 0.5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Setor nove está limpo. Nenhum contato hostil permanece nos sensores.' },
    { at: 5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Vamos respirar por alguns segundos e preparar a próxima rota.' }
  ]),
  'anomaly-scan': Object.freeze([
    { at: 0.35, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Espere... há alguma coisa interferindo nos meus sensores.' },
    { at: 4.85, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'A assinatura está crescendo. Não consigo identificar a origem.' }
  ]),
  'distant-contact': Object.freeze([
    { at: 0.4, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Contato visual... isso é muito maior do que qualquer unidade que enfrentamos.' },
    { at: 4.9, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Mantenha distância. Não sabemos do que essa nave é capaz.' },
    { at: 9.4, speaker: 'DREADNOUGHT', actor: 'boss', text: 'Sua resistência foi registrada.' },
    { at: 13.9, speaker: 'DREADNOUGHT', actor: 'boss', text: 'Agora, testemunhe o poder da minha frota.' }
  ]),
  'boss-identification': Object.freeze([
    { at: 0.2, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Identificação confirmada. DREADNOUGHT... preparando sistemas defensivos.' }
  ])
});

export const BOSS_CINEMATIC_ALERTS = Object.freeze({
  anomaly: Object.freeze({
    phase: 'anomaly-scan',
    at: 1.8,
    title: 'ANOMALIA DETECTADA',
    detail: 'ASSINATURA DESCONHECIDA · NÍVEL DE AMEAÇA ELEVADO'
  }),
  identity: Object.freeze({
    phase: 'boss-identification',
    at: 0,
    title: 'DREADNOUGHT',
    detail: 'NAVE DE GUERRA COLOSSAL · AMEAÇA CONFIRMADA'
  })
});

export function createBossCinematic() {
  return {
    phaseIndex: 0,
    phase: BOSS_CINEMATIC_PHASES[0].id,
    phaseElapsed: 0,
    elapsed: 0,
    phaseDuration: BOSS_CINEMATIC_PHASES[0].duration,
    pilotHudOpacity: 1,
    cameraOwner: 'cinematic',
    boss: null,
    bossSpawned: false,
    handoffComplete: false
  };
}

export function advanceBossCinematic(state, deltaSeconds) {
  if (!state || state.phase === 'complete') return state;
  const dt = Math.max(0, Math.min(0.05, Number(deltaSeconds) || 0));
  state.elapsed += dt;
  state.phaseElapsed += dt;

  // Consume phase boundaries deterministically. The game loop uses a small dt,
  // but this also makes the controller safe for tests and tab-resume frames.
  while (state.phase !== 'complete' && state.phaseElapsed + 1e-9 >= state.phaseDuration) {
    const overflow = Math.max(0, state.phaseElapsed - state.phaseDuration);
    state.phaseIndex = Math.min(BOSS_CINEMATIC_PHASES.length - 1, state.phaseIndex + 1);
    const next = BOSS_CINEMATIC_PHASES[state.phaseIndex];
    state.phase = next.id;
    state.phaseDuration = next.duration;
    state.phaseElapsed = overflow;
    if (state.phase === 'complete') state.phaseElapsed = 0;
  }

  if (state.phase === 'hud-fade') {
    state.pilotHudOpacity = Math.max(0, 1 - state.phaseElapsed / state.phaseDuration);
  } else if (state.phase === 'handoff') {
    state.pilotHudOpacity = Math.min(1, state.phaseElapsed / state.phaseDuration);
  } else if (state.phase !== 'complete') {
    state.pilotHudOpacity = 0;
  }

  if (state.phase === 'complete') {
    state.pilotHudOpacity = 1;
    state.cameraOwner = 'game';
    state.handoffComplete = true;
  }
  return state;
}

export function getBossCinematicDialogue(state) {
  if (!state) return null;
  const cues = BOSS_CINEMATIC_DIALOGUE[state.phase];
  if (!cues?.length) return null;
  let active = null;
  for (const cue of cues) {
    if (state.phaseElapsed + 1e-9 < cue.at) break;
    active = cue;
  }
  return active;
}

export function getBossCinematicAlert(state) {
  if (!state) return null;
  for (const alert of Object.values(BOSS_CINEMATIC_ALERTS)) {
    if (alert.phase === state.phase && state.phaseElapsed >= alert.at) return alert;
  }
  return null;
}

export const BOSS_CINEMATIC_TOTAL_DURATION = BOSS_CINEMATIC_PHASES
  .reduce((total, phase) => total + phase.duration, 0);
