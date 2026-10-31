const PHASE_CAMERA = {
  loading: { zoom: 0.72, focusOffset: 0.12 },
  'pilot-report': { zoom: 0.9, focusOffset: 0.08 },
  'pilot-warning': { zoom: 0.76, focusOffset: 0.22 },
  'boss-entry': { zoom: 0.52, focusOffset: 0.34 },
  'boss-taunt': { zoom: 0.49, focusOffset: 0.34 },
  complete: { zoom: 0.49, focusOffset: 0.34 }
};

// Returns a camera target in the same offset coordinates used by Game.updateCamera.
// The simulation world and collision geometry remain untouched.
export function getBossCameraFrame({ phase, player, boss = null, width, height, minZoom = 0.4 }) {
  const profile = PHASE_CAMERA[phase] ?? PHASE_CAMERA.loading;
  const focusY = boss && (phase === 'boss-entry' || phase === 'boss-taunt' || phase === 'complete')
    ? (player.y + boss.y) / 2
    : player.y - height * profile.focusOffset;
  return {
    zoom: Math.max(minZoom, profile.zoom),
    x: player.x - width / 2,
    y: focusY - height / 2
  };
}
