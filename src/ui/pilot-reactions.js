// Compact diegetic threat indicators stay near the pilot without covering the ship or HUD.
export function createPilotReactionState() {
  return { symbol: '', remaining: 0, duration: 0, message: '' };
}

export function triggerPilotReaction(state, symbol, duration = 1.25, message = '') {
  if (!state || !['❓', '❗', '❓❗'].includes(symbol)) return false;
  state.symbol = symbol;
  state.duration = Math.max(0.1, Number(duration) || 1.25);
  state.remaining = state.duration;
  state.message = typeof message === 'string' ? message.trim().slice(0, 72) : '';
  return true;
}

export function updatePilotReaction(state, dt) {
  if (!state || state.remaining <= 0) return;
  state.remaining = Math.max(0, state.remaining - Math.max(0, Number(dt) || 0));
  if (state.remaining === 0) {
    state.symbol = '';
    state.duration = 0;
    state.message = '';
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

export function getPilotReactionPosition({ x, y, bubble = null, width, height, radius = 9, offset = 27 }) {
  const bubbleCenterX = bubble ? bubble.x + bubble.width / 2 : x - 1;
  const horizontal = bubbleCenterX >= x ? -1 : 1;
  const candidates = [
    { x: x + horizontal * offset, y: y - 1 },
    { x: x - horizontal * offset, y: y - 1 },
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
    y: Math.max(radius + 5, Math.min(height - radius - 5, y - 1))
  };
  return overlapsBubble(fallback) ? null : fallback;
}

function traceAlertFrame(ctx, width, height, cut = 4) {
  ctx.beginPath();
  ctx.moveTo(-width / 2 + cut, -height / 2);
  ctx.lineTo(width / 2 - cut, -height / 2);
  ctx.lineTo(width / 2, -height / 2 + cut);
  ctx.lineTo(width / 2, height / 2 - cut);
  ctx.lineTo(width / 2 - cut, height / 2);
  ctx.lineTo(-width / 2 + cut, height / 2);
  ctx.lineTo(-width / 2, height / 2 - cut);
  ctx.lineTo(-width / 2, -height / 2 + cut);
  ctx.closePath();
}

function drawQuestionGlyph(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.2, -3.5);
  ctx.bezierCurveTo(-3.2, -7.2, 3.6, -7.7, 3.8, -3.5);
  ctx.bezierCurveTo(3.9, -1.2, 0.7, -0.8, 0.2, 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0.1, 4.4, 0.85, 0, Math.PI * 2);
  ctx.fill();
}

function drawDangerGlyph(ctx) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(0, -6.4);
  ctx.lineTo(0, 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 5, 1.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawEliteMark(ctx) {
  ctx.save();
  ctx.translate(8.5, -6.2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-2, -2, 4, 4);
  ctx.restore();
}

function wrapReactionMessage(message, maxChars = 26) {
  const words = String(message || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawReactionMessage(ctx, state, x, y, alpha) {
  const canvasWidth = ctx.canvas?.width, canvasHeight = ctx.canvas?.height;
  if (!state.message || !Number.isFinite(canvasWidth) || !Number.isFinite(canvasHeight)) return;
  const lines = wrapReactionMessage(state.message), width = 184, height = 15 + lines.length * 12;
  const left = x < canvasWidth * 0.62
    ? Math.max(6, Math.min(canvasWidth - width - 6, x + 14))
    : Math.max(6, Math.min(canvasWidth - width - 6, x - width - 14));
  const top = Math.max(6, Math.min(canvasHeight - height - 6, y - height - 13));
  ctx.save();
  ctx.globalAlpha = alpha * 0.96;
  ctx.fillStyle = 'rgba(3, 13, 25, 0.94)';
  ctx.strokeStyle = '#8fdcff'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + 6, top); ctx.lineTo(left + width - 6, top);
  ctx.lineTo(left + width, top + 6); ctx.lineTo(left + width, top + height - 6);
  ctx.lineTo(left + width - 6, top + height); ctx.lineTo(left + 6, top + height);
  ctx.lineTo(left, top + height - 6); ctx.lineTo(left, top + 6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e4f6ff'; ctx.font = '600 9px ui-monospace, monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  lines.forEach((line, index) => ctx.fillText(line, left + 9, top + 9 + index * 12));
  ctx.restore();
}

export function drawPilotReaction(ctx, state, x, y) {
  if (!ctx || !state || state.remaining <= 0 || !state.symbol) return;
  const question = state.symbol === '❓';
  const danger = state.symbol === '❗' || state.symbol === '❓❗';
  const elite = state.symbol === '❓❗';
  const elapsed = Math.max(0, state.duration - state.remaining);
  const fadeIn = Math.min(1, elapsed / 0.12);
  const fadeOut = Math.min(1, state.remaining / 0.18);
  const pulse = 0.5 + Math.sin(elapsed * 5.2) * 0.5;
  const alpha = fadeIn * fadeOut;
  const scale = (0.84 + Math.min(1, elapsed / 0.16) * 0.16) * (0.985 + pulse * 0.025);
  const accent = elite ? '#d5fbff' : danger ? '#a8f1ff' : '#79dced';
  const glow = danger ? '#48c9ef' : '#2aa8d0';
  const frameWidth = elite ? 24 : 20;
  const frameHeight = elite ? 25 : 22;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 3.5 + pulse * 2.2;
  ctx.fillStyle = 'rgba(4, 17, 32, 0.82)';
  traceAlertFrame(ctx, frameWidth, frameHeight, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.05 + pulse * 0.22;
  ctx.strokeStyle = accent;
  traceAlertFrame(ctx, frameWidth, frameHeight, 4);
  ctx.stroke();

  // Tiny side ticks make the alert read like a ship sensor, not a floating emoji.
  ctx.globalAlpha = alpha * (0.3 + pulse * 0.28);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-frameWidth / 2 - 3, -3);
  ctx.lineTo(-frameWidth / 2 - 1, -3);
  ctx.moveTo(frameWidth / 2 + 1, 3);
  ctx.lineTo(frameWidth / 2 + 3, 3);
  ctx.stroke();

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = question ? 1.8 : 2.6;
  if (question) drawQuestionGlyph(ctx);
  else drawDangerGlyph(ctx);
  if (elite) {
    ctx.lineWidth = 1;
    drawEliteMark(ctx);
  }
  ctx.restore();
  drawReactionMessage(ctx, state, x, y, alpha);
}
