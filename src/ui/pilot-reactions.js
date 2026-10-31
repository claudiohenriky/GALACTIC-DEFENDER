// Small diegetic reactions make the pilot's ship communicate surprise and danger.
export function createPilotReactionState() {
  return { symbol: '', remaining: 0, duration: 0 };
}

export function triggerPilotReaction(state, symbol, duration = 1.25) {
  if (!state || (symbol !== '❓' && symbol !== '❗')) return false;
  state.symbol = symbol;
  state.duration = Math.max(0.1, Number(duration) || 1.25);
  state.remaining = state.duration;
  return true;
}

export function updatePilotReaction(state, dt) {
  if (!state || state.remaining <= 0) return;
  state.remaining = Math.max(0, state.remaining - Math.max(0, Number(dt) || 0));
  if (state.remaining === 0) {
    state.symbol = '';
    state.duration = 0;
  }
}

// Threats are edge-triggered: a continuous telegraph produces one alert, not a flicker every frame.
export function signalPilotThreat(state, source, threatening) {
  if (!source) return false;
  const wasThreatening = Boolean(source.pilotWarningWasThreatening);
  source.pilotWarningWasThreatening = Boolean(threatening);
  if (threatening && !wasThreatening) return triggerPilotReaction(state, '❗', 1.2);
  return false;
}

export function drawPilotReaction(ctx, state, x, y) {
  if (!ctx || !state || state.remaining <= 0 || !state.symbol) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.remaining / 0.2);
  ctx.font = '900 23px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = state.symbol === '❗' ? '#ff9b72' : '#8beaff';
  ctx.shadowColor = state.symbol === '❗' ? '#ff704d' : '#69e8ff';
  ctx.shadowBlur = 5;
  ctx.fillText(state.symbol, x, y);
  ctx.restore();
}