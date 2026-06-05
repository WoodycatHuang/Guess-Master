import { fonts, theme } from './theme';
import { drawLabel, drawPanel, type Rect } from './ui';

export function drawRoomHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  roomId: string,
  backLabel: string,
): number {
  const pad = theme.pad;
  let y = pad + 8;
  drawLabel(ctx, `ROOM ${roomId}`, pad, y, theme.gray, fonts.sub);
  drawLabel(ctx, backLabel, width - pad, y, theme.green, fonts.small, 'right');
  return y + 36;
}

export function drawTopicCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  title: string,
  lowLabel: string,
  highLabel: string,
): number {
  const h = 120;
  const rect: Rect = { x, y, w, h };
  drawPanel(ctx, rect);
  drawLabel(ctx, 'TOPIC // 本轮题目', x + 12, y + 10, theme.muted, fonts.small);
  ctx.font = fonts.body;
  ctx.fillStyle = theme.green;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapText(ctx, title, w - 24);
  const titleY = y + 52 - ((lines.length - 1) * 12) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, titleY + i * 24);
  });
  drawLabel(ctx, lowLabel, x + 12, y + h - 28, theme.gray, fonts.small);
  drawLabel(ctx, highLabel, x + w - 12, y + h - 28, theme.gray, fonts.small, 'right');
  return y + h;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const chars = [...text];
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function drawFlipRevealCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  opts: {
    index: number;
    avatarEmoji: string;
    name: string;
    cardNumber: number;
    flipProgress: number;
    cracked: boolean;
    crackProgress: number;
  },
): void {
  const { index, avatarEmoji, name, cardNumber, flipProgress, cracked, crackProgress } = opts;
  const flipT = easeOutCubic(clamp(flipProgress, 0, 1));
  const isRevealing = flipProgress > 0 && flipProgress < 1;
  const isRevealed = flipProgress >= 1;
  const showFront = isRevealing ? flipT >= 0.5 : isRevealed;
  const popScale = isRevealed ? 1 : 0.88 + flipT * 0.12;

  drawLabel(
    ctx,
    String(index + 1),
    rect.x + rect.w / 2,
    rect.y - 18,
    theme.muted,
    fonts.small,
    'center',
  );

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (cracked && isRevealed && crackProgress < 1) {
    const shake = Math.sin(crackProgress * Math.PI * 4) * (1 - crackProgress) * 8;
    const rot = shake * 0.05;
    ctx.translate(shake, 0);
    ctx.rotate(rot);
  }

  if (!isRevealing && !isRevealed) {
    ctx.scale(popScale, popScale);
    drawCardFace(ctx, rect, 'back', avatarEmoji, name, cardNumber, false);
  } else if (isRevealed) {
    ctx.scale(1, 1);
    drawCardFace(ctx, rect, 'front', avatarEmoji, name, cardNumber, cracked);
  } else if (flipT < 0.5) {
    const sx = Math.max(0.04, (1 - flipT * 2) * popScale);
    ctx.scale(sx, popScale);
    drawCardFace(ctx, rect, 'back', avatarEmoji, name, cardNumber, false);
  } else {
    const sx = Math.max(0.04, (flipT - 0.5) * 2 * popScale);
    ctx.scale(sx, popScale);
    drawCardFace(ctx, rect, 'front', avatarEmoji, name, cardNumber, cracked);
  }

  if (cracked && isRevealed) {
    const pulse = crackProgress < 1 ? 1 - crackProgress * 0.65 : 0.35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
    ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.font = fonts.small;
    ctx.fillStyle = theme.fail;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.rotate(-0.21);
    ctx.fillText('裂开', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function drawCardFace(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  face: 'back' | 'front',
  avatarEmoji: string,
  name: string,
  cardNumber: number,
  cracked: boolean,
): void {
  const hw = rect.w / 2;
  const hh = rect.h / 2;

  ctx.fillStyle = face === 'back' ? theme.bgInput : '#141622';
  ctx.strokeStyle = cracked ? theme.fail : face === 'front' ? theme.green : theme.border;
  ctx.lineWidth = cracked || face === 'front' ? 3 : 2;
  ctx.fillRect(-hw, -hh, rect.w, rect.h);
  ctx.strokeRect(-hw, -hh, rect.w, rect.h);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (face === 'back') {
    ctx.font = fonts.emoji;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(avatarEmoji, 0, -14);
    ctx.font = fonts.small;
    ctx.fillStyle = theme.gray;
    const displayName = name.length > 5 ? `${name.slice(0, 4)}…` : name;
    ctx.fillText(displayName, 0, 22);
    return;
  }

  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = theme.green;
  ctx.fillText(String(cardNumber), 0, cracked ? -8 : 0);
  if (cracked) {
    ctx.font = fonts.emoji;
    ctx.fillText('💥', 0, 24);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function drawPlayerChip(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  avatarEmoji: string,
  name: string,
  opts?: { active?: boolean; cracked?: boolean; footer?: string },
): void {
  ctx.fillStyle = opts?.active ? '#1A2A18' : theme.bgInput;
  ctx.strokeStyle = opts?.cracked
    ? theme.fail
    : opts?.active
      ? theme.green
      : theme.border;
  ctx.lineWidth = opts?.active || opts?.cracked ? 3 : 2;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.font = fonts.emoji;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(avatarEmoji, rect.x + rect.w / 2, rect.y + rect.h * 0.38);

  ctx.font = fonts.small;
  ctx.fillStyle = theme.gray;
  const displayName = name.length > 5 ? `${name.slice(0, 4)}…` : name;
  ctx.fillText(displayName, rect.x + rect.w / 2, rect.y + rect.h * 0.68);

  if (opts?.footer) {
    ctx.font = opts.footer.length > 3 ? fonts.title : fonts.body;
    ctx.fillStyle = opts.cracked ? theme.fail : theme.green;
    ctx.fillText(opts.footer, rect.x + rect.w / 2, rect.y + rect.h * 0.88);
  }
}
