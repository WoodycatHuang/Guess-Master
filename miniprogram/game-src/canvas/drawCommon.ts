import { fonts, theme } from './theme';
import { getContentTop } from './screen';
import { drawButton, drawLabel, drawPanel, type ButtonSpec, type Rect } from './ui';

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
    borderColor?: string;
  },
): void {
  const {
    index,
    avatarEmoji,
    name,
    cardNumber,
    flipProgress,
    cracked,
    crackProgress,
    borderColor,
  } = opts;
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
    drawCardFace(ctx, rect, 'back', avatarEmoji, name, cardNumber, false, borderColor);
  } else if (isRevealed) {
    ctx.scale(1, 1);
    drawCardFace(ctx, rect, 'front', avatarEmoji, name, cardNumber, cracked, borderColor);
  } else if (flipT < 0.5) {
    const sx = Math.max(0.04, (1 - flipT * 2) * popScale);
    ctx.scale(sx, popScale);
    drawCardFace(ctx, rect, 'back', avatarEmoji, name, cardNumber, false, borderColor);
  } else {
    const sx = Math.max(0.04, (flipT - 0.5) * 2 * popScale);
    ctx.scale(sx, popScale);
    drawCardFace(ctx, rect, 'front', avatarEmoji, name, cardNumber, cracked, borderColor);
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
  borderColor?: string,
): void {
  const hw = rect.w / 2;
  const hh = rect.h / 2;

  ctx.fillStyle = face === 'back' ? theme.bgInput : '#141622';
  ctx.strokeStyle = cracked
    ? theme.fail
    : borderColor ?? (face === 'front' ? theme.green : theme.border);
  ctx.lineWidth = cracked || face === 'front' ? 3 : 2;
  ctx.fillRect(-hw, -hh, rect.w, rect.h);
  ctx.strokeRect(-hw, -hh, rect.w, rect.h);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (face === 'back') {
    const emojiSize = Math.max(22, Math.round(rect.w * 0.36));
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(avatarEmoji, 0, -14);
    ctx.font = fonts.small;
    ctx.fillStyle = theme.gray;
    const displayName = name.length > 5 ? `${name.slice(0, 4)}…` : name;
    ctx.fillText(displayName, 0, 22);
    return;
  }

  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = cracked ? theme.fail : theme.green;
  ctx.fillText(String(cardNumber), 0, 0);
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
  opts?: { active?: boolean; cracked?: boolean; footer?: string; borderColor?: string },
): void {
  ctx.fillStyle = opts?.active ? '#1A2A18' : theme.bgPanel;
  ctx.strokeStyle = opts?.cracked
    ? theme.fail
    : opts?.active
      ? theme.green
      : theme.border;
  ctx.lineWidth = opts?.active || opts?.cracked ? 3 : 2;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const cell = Math.min(AVATAR_CELL_SIZE, rect.w - 8, rect.h - (opts?.footer ? 44 : 26));
  const ax = rect.x + (rect.w - cell) / 2;
  const ay = rect.y + 6;

  drawAvatarCell(ctx, ax, ay, cell, avatarEmoji, {
    highlighted: Boolean(opts?.active),
  });

  if (opts?.borderColor && !opts?.cracked) {
    ctx.strokeStyle = opts.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(ax, ay, cell, cell);
  }

  if (opts?.cracked) {
    ctx.strokeStyle = theme.fail;
    ctx.lineWidth = 3;
    ctx.strokeRect(ax, ay, cell, cell);
  }

  ctx.font = fonts.small;
  ctx.fillStyle = theme.gray;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const displayName = name.length > 5 ? `${name.slice(0, 4)}…` : name;
  ctx.fillText(displayName, rect.x + rect.w / 2, ay + cell + 6);

  if (opts?.footer) {
    ctx.font = opts.footer.length > 3 ? fonts.title : fonts.body;
    ctx.fillStyle = opts.cracked ? theme.fail : theme.green;
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.footer, rect.x + rect.w / 2, rect.y + rect.h - 12);
  }
}

export function drawNumberCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  number: number,
  borderColor: string,
): void {
  ctx.fillStyle = theme.bgInput;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  ctx.font = `bold ${Math.max(14, Math.round(size * 0.38))}px monospace`;
  ctx.fillStyle = theme.green;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), x + size / 2, y + size / 2);
}

export function drawOwnedCardPair(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  card1: number,
  card2: number,
  cellSize = AVATAR_CELL_SIZE,
): number {
  const gap = 12;
  const totalW = cellSize * 2 + gap;
  let x = centerX - totalW / 2;
  drawNumberCard(ctx, x, topY, cellSize, card1, theme.cardPrimary);
  x += cellSize + gap;
  drawNumberCard(ctx, x, topY, cellSize, card2, theme.cardSecondary);
  return topY + cellSize;
}

export interface DifficultyPickerLayout {
  easy: Rect;
  hard: Rect;
  cancel: Rect;
}

export function drawDifficultyPicker(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: { hardEnabled: boolean },
): DifficultyPickerLayout {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, width, height);

  const pad = theme.pad;
  const panelW = width - pad * 2;
  const panelH = opts.hardEnabled ? 248 : 272;
  const panel: Rect = {
    x: pad,
    y: Math.round((height - panelH) / 2),
    w: panelW,
    h: panelH,
  };
  drawPanel(ctx, panel);

  drawLabel(
    ctx,
    '选择难度',
    panel.x + panel.w / 2,
    panel.y + 16,
    theme.green,
    fonts.title,
    'center',
  );

  const innerX = panel.x + 16;
  const innerW = panel.w - 32;
  const btnH = 48;
  let btnY = panel.y + 56;

  const easy: Rect = { x: innerX, y: btnY, w: innerW, h: btnH };
  drawButton(ctx, {
    id: 'easy',
    label: '简单模式 · 每人1张牌',
    ...easy,
    variant: 'primary',
  });

  btnY += btnH + 12;
  const hard: Rect = { x: innerX, y: btnY, w: innerW, h: btnH };
  drawButton(ctx, {
    id: 'hard',
    label: opts.hardEnabled ? '困难模式 · 每人2张牌' : '困难模式（最多5人）',
    ...hard,
    variant: 'secondary',
    disabled: !opts.hardEnabled,
  });

  if (!opts.hardEnabled) {
    drawLabel(
      ctx,
      '6人及以上无法开启困难模式',
      panel.x + panel.w / 2,
      btnY + btnH + 8,
      theme.muted,
      fonts.small,
      'center',
    );
    btnY += 20;
  }

  btnY += btnH + 12;
  const cancel: Rect = { x: innerX, y: btnY, w: innerW, h: btnH };
  drawButton(ctx, {
    id: 'cancel',
    label: '取消',
    ...cancel,
    variant: 'secondary',
  });

  return { easy, hard, cancel };
}
