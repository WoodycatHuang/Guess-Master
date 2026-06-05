import type { Room, User } from '@shared/types/room';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { drawPlayerChip, drawRoomHeader, drawTopicCard } from '../canvas/drawCommon';
import { drawBackground, getScreen } from '../canvas/screen';
import { fonts, theme } from '../canvas/theme';
import { drawButton, drawLabel, drawPanel, hit, type ButtonSpec, type Rect } from '../canvas/ui';
import { clearSession, persistSelf } from '../lib/storage';
import { roomSync } from '../lib/sync';
import { goLobby } from './router';
import { getRoomState } from './roomState';
import { teardownRoom } from './room';

const CELL_W = 72;
const CELL_H = 92;
const CELL_GAP = 8;
const LONG_PRESS_MS = 120;
const DRAG_THRESHOLD = 8;

interface DragState {
  fromIndex: number;
  x: number;
  y: number;
}

let sortItems: string[] = [];
let playersKey = '';
let drag: DragState | null = null;
let pendingPress: { index: number; x: number; y: number; timer: number } | null = null;
let sortStripRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
let cellRects: Rect[] = [];
let submitBtn: ButtonSpec | null = null;

function findPlayer(room: Room, userId: string): User | undefined {
  return room.players.find((u) => u.id === userId);
}

function syncSortItems(room: Room): void {
  const key = room.players.map((p) => p.id).join('|');
  if (key !== playersKey) {
    playersKey = key;
    sortItems = [...room.sortOrder];
  }
}

function cellRectAt(index: number): Rect {
  const pad = theme.pad;
  const x = pad + index * (CELL_W + CELL_GAP);
  return {
    x,
    y: sortStripRect.y,
    w: CELL_W,
    h: CELL_H,
  };
}

function indexAtPoint(x: number, y: number): number | null {
  for (let i = 0; i < cellRects.length; i++) {
    if (hit(cellRects[i], x, y)) return i;
  }
  return null;
}

function reorder(from: number, to: number): void {
  if (from === to || from < 0 || to < 0 || from >= sortItems.length || to >= sortItems.length) {
    return;
  }
  const next = [...sortItems];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  sortItems = next;
}

export function renderGame(): void {
  const { ctx, width, height } = getScreen();
  drawBackground(ctx, width, height);

  const room = roomSync.getRoom(getRoomState().roomId);
  const self = getRoomState().self;
  if (!room || !self) {
    drawLabel(ctx, '加载中…', width / 2, height / 2, theme.muted, fonts.body, 'center');
    return;
  }

  syncSortItems(room);

  const pad = theme.pad;
  const contentW = width - pad * 2;
  let y = drawRoomHeader(ctx, width, room.roomId, '退回大厅');

  const isHost = self.id === room.hostId;
  const isPlayer = self.role === 'Host' || self.role === 'Guest';
  const isSpectator = self.role === 'Spectator';
  const myCard = findPlayer(room, self.id)?.cardNumber ?? null;

  if (isPlayer) {
    drawLabel(
      ctx,
      '请尽量不要使用形容词，而是使用名词/名字来描述你的卡牌',
      pad,
      y,
      theme.muted,
      fonts.small,
      'center',
    );
    y += 28;
  }

  y = drawTopicCard(ctx, pad, y, contentW, room.topic, room.topicLowLabel, room.topicHighLabel) + 16;

  if (isPlayer && myCard !== null) {
    const cardBox: Rect = { x: pad, y, w: contentW, h: 120 };
    drawPanel(ctx, cardBox);
    drawLabel(ctx, 'YOUR CARD', width / 2, y + 12, theme.gray, fonts.small, 'center');
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = theme.green;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(myCard), width / 2, y + 58);
    drawLabel(ctx, '只有你能看到这张牌', width / 2, y + 92, theme.muted, fonts.small, 'center');
    y += 132;
  }

  if (!isHost && isPlayer) {
    const wait: Rect = { x: pad, y, w: contentW, h: 72 };
    drawPanel(ctx, wait);
    drawLabel(ctx, '房主正在努力排序中…', pad, y + 26, theme.gray, fonts.body, 'center');
    y += 84;
  }

  if (isSpectator) {
    const wait: Rect = { x: pad, y, w: contentW, h: 72 };
    drawPanel(ctx, wait);
    drawLabel(ctx, '游戏进行中，请观战', pad, y + 26, theme.gray, fonts.body, 'center');
  }

  if (isHost) {
    const dockTop = height - 248;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, dockTop - 8, width, height - dockTop + 8);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, dockTop - 8);
    ctx.lineTo(width, dockTop - 8);
    ctx.stroke();

    let dy = dockTop;
    drawLabel(ctx, '排序区', pad, dy, theme.green, fonts.title);
    dy += 28;
    drawLabel(
      ctx,
      '按手牌数字从小到大，从左到右排列。长按头像拖动。',
      pad,
      dy,
      theme.muted,
      fonts.small,
    );
    dy += 24;

    sortStripRect = { x: pad, y: dy, w: contentW, h: CELL_H };
    cellRects = sortItems.map((_, i) => cellRectAt(i));

    sortItems.forEach((userId, index) => {
      if (drag?.fromIndex === index) return;
      const user = findPlayer(room, userId);
      if (!user) return;
      drawPlayerChip(ctx, cellRects[index], getAvatarEmoji(user.avatarId), user.name);
    });

    if (drag) {
      const user = findPlayer(room, sortItems[drag.fromIndex]);
      if (user) {
        const ghost: Rect = {
          x: drag.x - CELL_W / 2,
          y: drag.y - CELL_H / 2,
          w: CELL_W,
          h: CELL_H,
        };
        drawPlayerChip(ctx, ghost, getAvatarEmoji(user.avatarId), user.name, { active: true });
      }
    }

    dy += CELL_H + 12;
    submitBtn = {
      id: 'submit',
      label: '排序完成，准备开车',
      x: pad,
      y: dy,
      w: contentW,
      h: 48,
      variant: 'primary',
    };
    drawButton(ctx, submitBtn);
  } else {
    submitBtn = null;
  }
}

export function onGameTouchStart(x: number, y: number): void {
  const room = roomSync.getRoom(getRoomState().roomId);
  const self = getRoomState().self;
  if (!room || !self || self.id !== room.hostId) return;

  const index = indexAtPoint(x, y);
  if (index === null) return;

  clearPendingPress();
  pendingPress = {
    index,
    x,
    y,
    timer: setTimeout(() => {
      drag = { fromIndex: index, x, y };
      pendingPress = null;
    }, LONG_PRESS_MS) as unknown as number,
  };
}

export function onGameTouchMove(x: number, y: number): void {
  if (pendingPress) {
    const dx = x - pendingPress.x;
    const dy = y - pendingPress.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      const fromIndex = pendingPress.index;
      clearPendingPress();
      drag = { fromIndex, x, y };
    }
    return;
  }

  if (!drag) return;
  drag = { ...drag, x, y };

  const hover = indexAtPoint(x, y);
  if (hover !== null && hover !== drag.fromIndex) {
    reorder(drag.fromIndex, hover);
    drag = { ...drag, fromIndex: hover };
  }
}

export async function onGameTouchEnd(x: number, y: number): Promise<void> {
  const { width } = getScreen();
  const room = roomSync.getRoom(getRoomState().roomId);
  const self = getRoomState().self;

  clearPendingPress();

  if (y <= 40 && x >= width - 100) {
    await roomSync.leaveRoom(getRoomState().roomId, self?.id ?? '');
    clearSession();
    teardownRoom();
    goLobby();
    return;
  }

  if (drag) {
    drag = null;
    if (room && self) {
      const result = await roomSync.updateSortOrder(room.roomId, self.id, sortItems);
      if (result && 'code' in result) {
        wx.showToast({ title: result.message, icon: 'none' });
        sortItems = [...room.sortOrder];
      }
    }
    return;
  }

  if (submitBtn && hit(submitBtn, x, y) && room && self) {
    const result = await roomSync.submitSort(room.roomId, self.id);
    if (result && 'code' in result) {
      wx.showToast({ title: result.message, icon: 'none' });
    }
  }
}

function clearPendingPress(): void {
  if (pendingPress) {
    clearTimeout(pendingPress.timer);
    pendingPress = null;
  }
}

export function resetGameScene(): void {
  sortItems = [];
  playersKey = '';
  drag = null;
  clearPendingPress();
  submitBtn = null;
}
