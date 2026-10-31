// New DREADNOUGHT debut cinematic. This controller is deliberately independent
// from Enemy AI and Game camera code: the cinematic owns presentation until handoff.
export const BOSS_CINEMATIC_PHASES = Object.freeze([
  { id: 'hud-fade', duration: 5 },
  { id: 'loading', duration: 10 },
  { id: 'pilot-intro', duration: 9 },
  { id: 'anomaly-scan', duration: 9 },
  { id: 'distant-contact', duration: 21 },
  { id: 'boss-identification', duration: 4 },
  { id: 'arena-reveal', duration: 3.5 },
  { id: 'handoff', duration: 2.5 },
  { id: 'complete', duration: 0 }
]);

// Dialogue is scheduled per line rather than divided evenly across broad phases.
// This keeps the 4.5-second reading rhythm stable if a phase is later extended.
export const BOSS_CINEMATIC_DIALOGUE = Object.freeze({
  'pilot-intro': Object.freeze([
    { at: 0.5, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Setor nove limpo. Nenhuma unidade hostil no radar.' },
    { at: 4.8, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Leituras estáveis... vou recalcular a rota. Por enquanto, tudo parece tranquilo.' }
  ]),
  'anomaly-scan': Object.freeze([
    { at: 0.35, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Espera. Estou captando uma distorção à frente. Isso não parece interferência comum.' },
    { at: 3.55, speaker: 'SISTEMA // VANGUARD', actor: 'system', text: 'Leitura confirmada. Assinatura desconhecida. Intensidade em rápida elevação.' },
    { at: 6.45, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Central, estão recebendo isso? A assinatura está crescendo rápido demais!' }
  ]),
  'distant-contact': Object.freeze([
    { at: 0.4, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Contato visual... Isso é uma nave? É enorme!' },
    { at: 4.9, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'Sem aproximação. Mantendo distância e travando os sistemas defensivos.' },
    { at: 9.4, speaker: 'DREADNOUGHT', actor: 'boss', text: 'Identificação confirmada: Vanguard. Você chegou mais longe do que o previsto.' },
    { at: 14, speaker: 'DREADNOUGHT', actor: 'boss', text: 'A avaliação terminou. Agora, testemunhe o poder da minha frota.' }
  ]),
  'boss-identification': Object.freeze([
    { at: 0.2, speaker: 'PILOTO // VANGUARD', actor: 'pilot', text: 'DREADNOUGHT... então você estava por trás de tudo. Sistemas defensivos, preparar!' }
  ])
});

// Restrained motion values for the dialogue-card signal details.
// The card remains readable and avoids expensive canvas blur/shadow animation.
export function getBossDialogueVisualState(actor, elapsed = 0) {
  const time = Math.max(0, Number(elapsed) || 0);
  const palette = actor === 'boss'
    ? { accent: '#ff829a', header: 'rgba(255, 130, 154, 0.13)', tag: '#ff9caf' }
    : actor === 'system'
      ? { accent: '#9be8b8', header: 'rgba(155, 232, 184, 0.12)', tag: '#a9eac2' }
      : { accent: '#579eac', header: 'rgba(87, 158, 172, 0.075)', tag: '#8db8c0' };
  return {
    ...palette,
    pulse: 0.5 + Math.sin(time * 3.2) * 0.5,
    scan: (time * 0.22) % 1
  };
}

// Wrap dialogue without silently discarding words on narrow mobile screens.
export function wrapBossCinematicDialogue(text, measureText, maxWidth, maxRows = 4) {
  if (typeof measureText !== 'function' || !Number.isFinite(maxWidth) || maxWidth <= 0) return [];
  const rows = [];
  let row = '';
  for (const word of String(text ?? '').split(/\s+/).filter(Boolean)) {
    const candidate = row ? `${row} ${word}` : word;
    if (row && measureText(candidate) > maxWidth) {
      rows.push(row);
      row = word;
    } else {
      row = candidate;
    }
  }
  if (row) rows.push(row);
  return rows.slice(0, Math.max(1, Math.floor(maxRows)));
}

export const BOSS_CINEMATIC_ALERTS = Object.freeze({
  anomaly: Object.freeze({
    phase: 'anomaly-scan',
    at: 1.8,
    title: 'ANOMALIA DETECTADA',
    detail: 'ASSINATURA DESCONHECIDA · NÍVEL DE AMEAÇA ELEVADO',
    kind: 'anomaly',
    icon: '!',
    accent: '#f2b85f'
  }),
  identity: Object.freeze({
    phase: 'boss-identification',
    at: 0,
    title: 'DREADNOUGHT',
    detail: 'NAVE DE GUERRA COLOSSAL · AMEAÇA CONFIRMADA',
    kind: 'boss',
    icon: '◆',
    accent: '#ff718d'
  })
});

// The capital ship becomes visible gradually over the first 7.5 seconds of its approach.
export function getBossCinematicBossOpacity(state) {
  if (!state) return 0;
  if (state.phase === 'distant-contact') {
    return Math.max(0, Math.min(1, (state.phaseElapsed - 0.45) / 7.5));
  }
  return ['boss-identification', 'arena-reveal', 'handoff', 'complete'].includes(state.phase) ? 1 : 0;
}

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
    bossStartX: null,
    bossStartY: null,
    bossTargetX: null,
    bossTargetY: null,
    anomalyReactionShown: false,
    bossReactionShown: false,
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
  if (!active) return null;
  const elapsed = Math.max(0, state.phaseElapsed - active.at);
  const text = active.text;
  let budget = elapsed * 38;
  let visibleLength = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const cost = character === '.' || character === '…' || character === '!' || character === '?'
      ? 3.2
      : character === ',' || character === ':' || character === ';' ? 2.1 : 1;
    if (budget < cost) break;
    budget -= cost;
    visibleLength += 1;
  }
  return { ...active, visibleText: text.slice(0, visibleLength), typingComplete: visibleLength >= text.length };
}

export function getBossCinematicAlert(state) {
  if (!state) return null;
  for (const alert of Object.values(BOSS_CINEMATIC_ALERTS)) {
    if (alert.phase === state.phase && state.phaseElapsed + 1e-9 >= alert.at) return alert;
  }
  return null;
}

export const BOSS_CINEMATIC_TOTAL_DURATION = BOSS_CINEMATIC_PHASES
  .reduce((total, phase) => total + phase.duration, 0);
