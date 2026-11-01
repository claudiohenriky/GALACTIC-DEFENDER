// Original, lightweight pixel-inspired speaker portraits for every dialogue channel.
const PORTRAIT_PALETTES = Object.freeze({
  pilot: { bg: '#10263a', edge: '#8fe8ef', helmet: '#c8e5ee', face: '#e9c7a4', dark: '#193347', eye: '#18364a' },
  system: { bg: '#102b2b', edge: '#9be8b8', helmet: '#6cae9a', face: '#b9f2d4', dark: '#10231f', eye: '#d6ffe8' },
  boss: { bg: '#321a28', edge: '#ff829a', helmet: '#563040', face: '#26141e', dark: '#120b13', eye: '#ff718d' },
  artillery: { bg: '#1c2b27', edge: '#76dc98', helmet: '#243a31', face: '#101b18', dark: '#0c1513', eye: '#a4ffc0' },
  sentinel: { bg: '#261d39', edge: '#c9a5ff', helmet: '#49356a', face: '#171322', dark: '#100c18', eye: '#d8c1ff' },
  guardian: { bg: '#15352f', edge: '#a7f2ce', helmet: '#28614e', face: '#10251f', dark: '#0a1714', eye: '#c5ffe2' },
  devastator: { bg: '#26302d', edge: '#a7f2ce', helmet: '#566c62', face: '#18221e', dark: '#101613', eye: '#9df0b5' }
});

const ACTOR_LABELS = Object.freeze({
  pilot: 'PILOTO', system: 'SISTEMA', boss: 'DREADNOUGHT',
  artillery: 'ARTILHEIRO ELITE', sentinel: 'SENTINELA ELITE',
  guardian: 'GUARDIÃO ELITE', devastator: 'DEVASTADOR ELITE'
});

export function getDialogueActorLabel(actor) {
  return ACTOR_LABELS[actor] || 'COMUNICAÇÃO';
}

export function drawDialoguePortrait(ctx, actor, x, y, size = 24, elapsed = 0) {
  if (!ctx || !Number.isFinite(size) || size <= 0) return;
  const key = PORTRAIT_PALETTES[actor] ? actor : 'pilot';
  const palette = PORTRAIT_PALETTES[key];
  const pulse = 0.5 + Math.sin(Math.max(0, elapsed) * 7) * 0.5;
  const inset = Math.max(1, size * 0.08);
  const center = size / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);

  if (key === 'system') {
    ctx.fillStyle = palette.dark;
    ctx.fillRect(size * 0.19, size * 0.19, size * 0.62, size * 0.62);
    ctx.strokeStyle = palette.helmet;
    ctx.strokeRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
    ctx.fillStyle = palette.eye;
    ctx.fillRect(size * 0.34, size * 0.43, size * 0.32, size * 0.1);
    ctx.fillRect(size * 0.42, size * 0.61, size * 0.16, size * 0.045);
  } else if (key === 'boss') {
    ctx.fillStyle = palette.helmet;
    ctx.beginPath();
    ctx.moveTo(size * 0.13, size * 0.23);
    ctx.lineTo(size * 0.5, size * 0.08);
    ctx.lineTo(size * 0.87, size * 0.23);
    ctx.lineTo(size * 0.77, size * 0.78);
    ctx.lineTo(size * 0.5, size * 0.94);
    ctx.lineTo(size * 0.23, size * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.dark;
    ctx.fillRect(size * 0.2, size * 0.43, size * 0.6, size * 0.22);
    ctx.fillStyle = palette.eye;
    ctx.fillRect(size * 0.29, size * 0.49, size * 0.42, size * 0.07);
  } else if (key === 'artillery' || key === 'devastator') {
    ctx.fillStyle = palette.helmet;
    ctx.fillRect(size * 0.16, size * 0.19, size * 0.68, size * 0.63);
    ctx.fillRect(size * 0.08, size * 0.39, size * 0.14, size * 0.31);
    ctx.fillRect(size * 0.78, size * 0.39, size * 0.14, size * 0.31);
    ctx.fillStyle = palette.face;
    ctx.fillRect(size * 0.26, size * 0.39, size * 0.48, size * 0.25);
    ctx.fillStyle = palette.eye;
    ctx.fillRect(size * 0.28, size * 0.49, size * 0.44, size * 0.08);
    if (key === 'devastator') {
      ctx.fillStyle = palette.dark;
      ctx.fillRect(size * 0.34, size * 0.68, size * 0.32, size * 0.1);
    }
  } else {
    ctx.fillStyle = palette.helmet;
    ctx.beginPath();
    ctx.moveTo(size * 0.18, size * 0.78);
    ctx.lineTo(size * 0.21, size * 0.31);
    ctx.lineTo(size * 0.39, size * 0.12);
    ctx.lineTo(size * 0.68, size * 0.14);
    ctx.lineTo(size * 0.83, size * 0.34);
    ctx.lineTo(size * 0.81, size * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.face;
    ctx.fillRect(size * 0.3, size * 0.33, size * 0.4, size * 0.38);
    ctx.fillStyle = palette.eye;
    ctx.fillRect(size * 0.36, size * 0.48, size * 0.08, size * 0.06);
    ctx.fillRect(size * 0.56, size * 0.48, size * 0.08, size * 0.06);
    ctx.fillStyle = palette.dark;
    ctx.fillRect(size * 0.43, size * 0.63, size * 0.14, size * 0.035);
    if (key === 'guardian') {
      ctx.strokeStyle = palette.edge;
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.strokeRect(size * 0.08, size * 0.31, size * 0.84, size * 0.43);
    } else if (key === 'sentinel') {
      ctx.fillStyle = palette.dark;
      ctx.fillRect(size * 0.1, size * 0.25, size * 0.8, size * 0.12);
      ctx.fillStyle = palette.eye;
      ctx.fillRect(size * 0.27, size * 0.49, size * 0.46, size * 0.07);
    }
  }

  ctx.globalAlpha = 0.25 + pulse * 0.25;
  ctx.fillStyle = palette.edge;
  ctx.fillRect(size * 0.12, size * 0.88, size * 0.76, Math.max(1, size * 0.035));
  ctx.restore();
}
