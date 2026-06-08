import { fonts, theme } from './theme';
import { getContentTop } from './screen';
import { drawLabel, drawPanel, type Rect } from './ui';

/** 与大厅头像选择格一致 */
export const AVATAR_CELL_SIZE = 56;
export const AVATAR_CELL_GAP = 8;

export function calcAvatarCellSize(innerW: number, cols: number): number {
  return Math.min(
    AVATAR_CELL_SIZE,
    Math.floor((innerW - (cols - 1) * AVATAR_CELL_GAP) / cols),
  );
}

export function drawAvatarCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  emoji: string,
  opts?: { highlighted?: boolean },
): void {
  ctx.fillStyle = theme.bgInput;
  ctx.strokeStyle = opts?.highlighted ? theme.green : theme.border;
  ctx.lineWidth = opts?.highlighted ? 3 : 2;
  ctx.fillRect(x, y, cell, cell);
  ctx.strokeRect(x, y, cell, cell);

  const emojiSize = Math.round(cell * 0.52);
  ctx.font = `${emojiSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(emoji, x + cell / 2, y + cell / 2);
}

function truncateName(name: string, maxWidth: number, ctx: CanvasRenderingContext2D): string {
  ctx.font = fonts.small;
  if (ctx.measureText(name).width <= maxWidth) return name;
  let trimmed = name;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

export interface PlayerCardOpts {
  isHost?: boolean;
  isSelf?: boolean;
  cellSize?: number;
}

/** 玩家卡片：头像格 + 下方昵称，房主带 HOST 标记 */
export function drawPlayerCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  avatarEmoji: string,
  name: string,
  opts?: PlayerCardOpts,
): void {
  drawPanel(ctx, rect);

  const cell = Math.min(opts?.cellSize ?? AVATAR_CELL_SIZE, rect.w - 16);
  const badgeH = 16;
  const topPad = 10;
  let avatarY = rect.y + topPad + badgeH + 4;

  if (opts?.isHost) {
    const badgeW = 44;
    const bx = rect.x + (rect.w - badgeW) / 2;
    const by = rect.y + topPad;
    ctx.fillStyle = theme.green;
    ctx.fillRect(bx, by, badgeW, badgeH);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = theme.bg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HOST', bx + badgeW / 2, by + badgeH / 2);
  } else {
    avatarY = rect.y + topPad + badgeH + 4;
  }

  const ax = rect.x + (rect.w - cell) / 2;
  drawAvatarCell(ctx, ax, avatarY, cell, avatarEmoji, { highlighted: opts?.isSelf });

  let displayName = name;
  if (opts?.isSelf) displayName = `${name}（你）`;

  const nameY = avatarY + cell + 8;
  const label = truncateName(displayName, rect.w - 8, ctx);
  drawLabel(ctx, label, rect.x + rect.w / 2, nameY, theme.gray, fonts.small, 'center');
}

export interface PlayerGridItem {
  avatarEmoji: string;
  name: string;
  isHost: boolean;
  isSelf: boolean;
}

/** 网格排列玩家卡片，返回内容区底部 y */
export function drawPlayerGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  players: PlayerGridItem[],
): number {
  if (players.length === 0) return y;

  const gap = 12;
  const cols = width >= 300 ? 4 : 3;
  const cardW = Math.floor((width - (cols - 1) * gap) / cols);
  const cell = Math.min(AVATAR_CELL_SIZE, cardW - 16);
  const cardH = 10 + 16 + 4 + cell + 8 + 20 + 10;

  players.forEach((player, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    drawPlayerCard(
      ctx,
      { x: cx, y: cy, w: cardW, h: cardH },
      player.avatarEmoji,
      player.name,
      { isHost: player.isHost, isSelf: player.isSelf, cellSize: cell },
    );
  });

  const rows = Math.ceil(players.length / cols);
  return y + rows * (cardH + gap);
}

export function drawRoomHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  roomId: string,
  backLabel: string,
  startY?: number,
): number {
  const pad = theme.pad;
  let y = startY ?? getContentTop();
  drawLabel(ctx, backLabel, pad, y + 8, theme.green, fonts.small, 'left');
  drawLabel(ctx, `ROOM ${roomId}`, width - pad, y + 8, theme.gray, fonts.sub, 'right');
  return y + 44;
}

/** 等待页：大号房间号 + 点击复制 */
export function drawRoomIdHero(
  ctx: CanvasRenderingContext2D,
  width: number,
  roomId: string,
  startY: number,
): { rect: Rect; nextY: number } {
  const pad = theme.pad;
  const rect: Rect = { x: pad, y: startY, w: width - pad * 2, h: 96 };
  drawPanel(ctx, rect);

  drawLabel(ctx, 'ROOM ID', rect.x + 16, rect.y + 12, theme.muted, fonts.small);
  ctx.font = fonts.roomId;
  ctx.fillStyle = theme.green;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(roomId, rect.x + rect.w / 2, rect.y + 50);
  drawLabel(
    ctx,
    '点击复制房间号',
    rect.x + rect.w / 2,
    rect.y + rect.h - 22,
    theme.gray,
    fonts.small,
    'center',
  );

  return { rect, nextY: rect.y + rect.h + 16 };
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
