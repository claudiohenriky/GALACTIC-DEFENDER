const smoothstep = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function getBossCinematicCameraFrame({
  phase, phaseElapsed = 0, phaseDuration = 1, player, boss = null,
  width, height, minZoom = 1 / 2.4, worldWidth = width * 2.4, worldHeight = height * 2.4
}) {
  const revealProgress = phase === 'distant-contact'
    ? smoothstep(phaseElapsed / Math.max(0.001, phaseDuration))
    : phase === 'boss-identification' || phase === 'handoff' || phase === 'complete' ? 1 : 0;
  const closeZoom = phase === 'pilot-intro' ? 0.9
    : phase === 'anomaly-scan' ? 0.82
      : phase === 'distant-contact' ? 0.82 - (0.82 - minZoom) * revealProgress
        : phase === 'hud-fade' || phase === 'loading' ? 0.9 : minZoom;
  const zoom = Math.max(minZoom, closeZoom);
  const showBoth = Boolean(boss && (phase === 'distant-contact' || phase === 'boss-identification' || phase === 'handoff' || phase === 'complete'));
  // Keep the pair centered as the zoom changes; never anchor the framing to one actor.
  // Blend from the pilot to the pair across the existing reveal; never snap sideways at phase entry.
  const pairFocusX = showBoth ? (player.x + boss.x) * 0.5 : player.x;
  const focusX = player.x + (pairFocusX - player.x) * revealProgress;
  const focusY = showBoth
    ? (boss.y - (boss.collisionRadius || 145) * 1.5 + player.y + (player.radius || 12)) / 2
    : player.y - height * (phase === 'pilot-intro' ? 0.12 : 0.08);
  const halfViewWidth = width / (2 * zoom);
  const halfViewHeight = height / (2 * zoom);
  const minX = halfViewWidth - width / 2;
  const minY = halfViewHeight - height / 2;
  const maxX = Math.max(minX, worldWidth - halfViewWidth - width / 2);
  const maxY = Math.max(minY, worldHeight - halfViewHeight - height / 2);
  const targetLeft = focusX - halfViewWidth;
  const targetTop = focusY - halfViewHeight;
  const x = Math.max(minX, Math.min(maxX, targetLeft + halfViewWidth - width / 2));
  const y = Math.max(minY, Math.min(maxY, targetTop + halfViewHeight - height / 2));
  return { zoom, x, y };
}

export function prepareBossForCombatHandoff(boss, targetY = boss?.y) {
  if (!boss) return null;
  boss.y = targetY;
  boss.bossMoveTargetY = targetY;
  boss.bossMoveTargetX = boss.x;
  boss.bossMovementState = 'patrol';
  boss.bossMovementTimer = 0;
  boss.bossEntranceTimer = 0;
  boss.velocityX = 0;
  boss.velocityY = 0;
  return boss;
}
