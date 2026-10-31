export const BOSS_CINEMATIC_PHASES = Object.freeze([
  { id: 'hud-fade', duration: 5 }, { id: 'loading', duration: 10 },
  { id: 'pilot-intro', duration: 10 }, { id: 'anomaly-scan', duration: 10 },
  { id: 'distant-contact', duration: 19.5 }, { id: 'boss-identification', duration: 4.5 },
  { id: 'handoff', duration: 2.5 }, { id: 'complete', duration: 0 }
]);
export const BOSS_CINEMATIC_DIALOGUE = Object.freeze({
  'pilot-intro': Object.freeze([
    { at: 0.5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Setor nove limpo. Finalmente, alguns segundos sem alarmes.' },
    { at: 5.1, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Não gosto desse silêncio. Normalmente é quando os sensores escondem alguma coisa.' }
  ]),
  'anomaly-scan': Object.freeze([
    { at: 0.35, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Espera... isso não é interferência comum. Tem alguma coisa respondendo aos sensores.' },
    { at: 5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'A assinatura está aumentando. Sistemas, tente identificar a origem. Agora.' }
  ]),
  'distant-contact': Object.freeze([
    { at: 0.35, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Contato visual... aquilo não é uma escolta. É uma fortaleza inteira.' },
    { at: 5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Mantenha a calma. Primeiro vamos descobrir o que está apontado para nós.' },
    { at: 10, speaker: 'DREADNOUGHT // COMANDO CENTRAL', actor: 'boss', text: 'Intruso detectado. Você ultrapassou um limite que não deveria conhecer.' },
    { at: 15, speaker: 'DREADNOUGHT // COMANDO CENTRAL', actor: 'boss', text: 'Sua resistência foi registrada. Não confunda isso com uma chance de vitória.' }
  ]),
  'boss-identification': Object.freeze([
    { at: 0.2, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'DREADNOUGHT... então era isso que estava escondido no setor. Todos os sistemas defensivos, agora.' }
  ])
});
export const BOSS_CINEMATIC_ALERTS = Object.freeze({
  anomaly: Object.freeze({ phase: 'anomaly-scan', at: 1.8, title: 'ANOMALIA DETECTADA', detail: 'ASSINATURA DESCONHECIDA · NÍVEL DE AMEAÇA ELEVADO' }),
  identity: Object.freeze({ phase: 'boss-identification', at: 0, title: 'DREADNOUGHT', detail: 'NAVE DE GUERRA COLOSSAL · AMEAÇA CONFIRMADA' })
});
export function createBossCinematic() {
  return { phaseIndex: 0, phase: BOSS_CINEMATIC_PHASES[0].id, phaseElapsed: 0, elapsed: 0,
    phaseDuration: BOSS_CINEMATIC_PHASES[0].duration, pilotHudOpacity: 1, cameraOwner: 'cinematic',
    boss: null, bossSpawned: false, handoffComplete: false };
}
export function advanceBossCinematic(state, deltaSeconds) {
  if (!state || state.phase === 'complete') return state;
  const dt = Math.max(0, Math.min(0.05, Number(deltaSeconds) || 0));
  state.elapsed += dt; state.phaseElapsed += dt;
  while (state.phase !== 'complete' && state.phaseElapsed + 1e-9 >= state.phaseDuration) {
    const overflow = Math.max(0, state.phaseElapsed - state.phaseDuration);
    state.phaseIndex = Math.min(BOSS_CINEMATIC_PHASES.length - 1, state.phaseIndex + 1);
    const next = BOSS_CINEMATIC_PHASES[state.phaseIndex];
    state.phase = next.id; state.phaseDuration = next.duration; state.phaseElapsed = overflow;
    if (state.phase === 'complete') state.phaseElapsed = 0;
  }
  if (state.phase === 'hud-fade') state.pilotHudOpacity = Math.max(0, 1 - state.phaseElapsed / state.phaseDuration);
  else if (state.phase === 'handoff') state.pilotHudOpacity = Math.min(1, state.phaseElapsed / state.phaseDuration);
  else if (state.phase !== 'complete') state.pilotHudOpacity = 0;
  if (state.phase === 'complete') { state.pilotHudOpacity = 1; state.cameraOwner = 'game'; state.handoffComplete = true; }
  return state;
}
export function getBossCinematicDialogue(state) {
  if (!state) return null;
  const cues = BOSS_CINEMATIC_DIALOGUE[state.phase]; if (!cues?.length) return null;
  let active = null;
  for (const cue of cues) { if (state.phaseElapsed + 1e-9 < cue.at) break; active = cue; }
  return active;
}
export function getBossCinematicDialogueText(state, charactersPerSecond = 27) {
  const cue = getBossCinematicDialogue(state); if (!cue) return '';
  const elapsed = Math.max(0, state.phaseElapsed - cue.at);
  return cue.text.slice(0, Math.min(cue.text.length, Math.floor(elapsed * Math.max(1, charactersPerSecond))));
}
export function getBossCinematicAlert(state) {
  if (!state) return null;
  for (const alert of Object.values(BOSS_CINEMATIC_ALERTS)) if (alert.phase === state.phase && state.phaseElapsed >= alert.at) return alert;
  return null;
}
export const BOSS_CINEMATIC_TOTAL_DURATION = BOSS_CINEMATIC_PHASES.reduce((total, phase) => total + phase.duration, 0);
