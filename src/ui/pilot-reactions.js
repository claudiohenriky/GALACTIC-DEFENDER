// Compact diegetic reactions stay beside the pilot ship without obscuring its silhouette.
export function createPilotReactionState() {
  return { symbol: '', remaining: 0, duration: 0 };
}

export function triggerPilotReaction(state, symbol, duration = 1.25) {
  if (!state || !['❓', '❗', '❓❗'].includes(symbol)) return false;
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

export function getPilotReactionPosition({ x, y, bubble = null, width, height, radius = 12, offset = 23 }) {
  const bubbleCenterX = bubble ? bubble.x + bubble.width / 2 : x - 1;
  const horizontal = bubbleCenterX >= x ? -1 : 1;
  const candidates = [
    { x: x + horizontal * offset, y: y - 2 },
    { x: x - horizontal * offset, y: y - 2 },
    { x: x + horizontal * offset, y: y + offset * 0.55 },
    { x: x - horizontal * offset, y: y + offset * 0.55 },
    { x: x + horizontal * offset, y: y - offset * 0.55 },
    { x: x - horizontal * offset, y: y - offset * 0.55 }
  ];
  const overlapsBubble = (point) => bubble &&
    point.x + radius > bubble.x - 5 &&
    point.x - radius < bubble.x + bubble.width + 5 &&
    point.y + radius > bubble.y - 5 &&
    point.y - radius < bubble.y + bubble.height + 5;
  const insideViewport = (point) => point.x >= radius + 5 && point.x <= width - radius - 5 &&
    point.y >= radius + 5 && point.y <= height - radius - 5;
  const chosen = candidates.find((point) => insideViewport(point) && !overlapsBubble(point));
  if (chosen) return chosen;
  const fallback = {
    x: Math.max(radius + 5, Math.min(width - radius - 5, x + horizontal * offset)),
    y: Math.max(radius + 5, Math.min(height - radius - 5, y - 2))
  };
  return overlapsBubble(fallback) ? null : fallback;
}

export function drawPilotReaction(ctx, state, x, y) {
  if (!ctx || !state || state.remaining <= 0 || !state.symbol) return;
  const question = state.symbol === '❓';
  const danger = state.symbol === '❗' || state.symbol === '❓❗';
  const accent = '#ff806d';
  const glow = '#ff493d';
  const elapsed = Math.max(0, state.duration - state.remaining);
  const pulse = 0.5 + Math.sin(elapsed * 4.8) * 0.5;
  const alpha = Math.min(1, state.remaining / 0.16);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 7 + pulse * 4;
  if (!question) {
    const radius = state.symbol === '❓❗' ? 15 : 13;
    ctx.fillStyle = 'rgba(25, 5, 12, 0.94)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.35;
    ctx.strokeStyle = accent;
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4f1';
  ctx.font = question ? '900 25px system-ui, sans-serif'
    : state.symbol === '❓❗' ? '900 11px system-ui, sans-serif' : '900 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.symbol, 0, 0.5);
  ctx.restore();
}
