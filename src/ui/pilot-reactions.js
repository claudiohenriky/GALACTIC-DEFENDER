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

export function getPilotReactionPosition({ x, y, bubble = null, width, height, radius = 16, offset = 30 }) {
  const bubbleCenterX = bubble ? bubble.x + bubble.width / 2 : x - 1;
  const bubbleCenterY = bubble ? bubble.y + bubble.height / 2 : y + 1;
  const horizontal = bubbleCenterX >= x ? -1 : 1;
  const vertical = bubbleCenterY >= y ? -1 : 1;
  const candidates = [
    { x: x + horizontal * offset, y: y + vertical * offset },
    { x: x + horizontal * offset, y: y - vertical * offset },
    { x: x - horizontal * offset, y: y + vertical * offset },
    { x: x - horizontal * offset, y: y - vertical * offset },
    { x: x + horizontal * offset, y },
    { x: x - horizontal * offset, y },
    { x, y: y - offset },
    { x, y: y + offset }
  ];
  const overlapsBubble = (point) => bubble &&
    point.x + radius > bubble.x - 7 &&
    point.x - radius < bubble.x + bubble.width + 7 &&
    point.y + radius > bubble.y - 7 &&
    point.y - radius < bubble.y + bubble.height + 7;
  const insideViewport = (point) => point.x >= radius + 5 && point.x <= width - radius - 5 &&
    point.y >= radius + 5 && point.y <= height - radius - 5;
  const chosen = candidates.find((point) => insideViewport(point) && !overlapsBubble(point));
  if (chosen) return chosen;
  const fallback = {
    x: Math.max(radius + 5, Math.min(width - radius - 5, x + horizontal * offset)),
    y: Math.max(radius + 5, Math.min(height - radius - 5, y - vertical * offset))
  };
  return overlapsBubble(fallback) ? null : fallback;
}

export function drawPilotReaction(ctx, state, x, y) {
  if (!ctx || !state || state.remaining <= 0 || !state.symbol) return;
  const danger = state.symbol === '❗';
  const accent = danger ? '#ff9878' : '#7de8ff';
  const glow = danger ? '#ff654d' : '#35c8f4';
  const radius = 15;
  const life = state.duration > 0 ? state.remaining / state.duration : 1;
  const scale = 0.94 + Math.min(1, life) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.min(1, state.remaining / 0.2);
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(5, 13, 28, 0.97)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.globalAlpha *= 0.38;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#eaf8ff';
  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, -Math.PI * 0.78, Math.PI * 0.62);
  ctx.stroke();
  ctx.globalAlpha = Math.min(1, state.remaining / 0.2);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (danger) {
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 7, 1.9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.quadraticCurveTo(-2, -10, 4, -7);
    ctx.quadraticCurveTo(10, -4, 4, 1);
    ctx.quadraticCurveTo(0, 3, 0, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 9, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}