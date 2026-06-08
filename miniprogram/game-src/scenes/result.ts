import type { Room } from '@shared/types/room';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { FLIP_INTERVAL_MS } from '@shared/constants/result';
import {
  cardNumberAtSortIndex,
  evaluateSortedCards,
} from '@shared/services/sync/roomUtils';
import { drawFlipRevealCard, drawRoomHeader, drawTopicCard } from '../canvas/drawCommon';
import { drawBackground, getBackButtonRect, getScreen } from '../canvas/screen';
import { fonts, theme } from '../canvas/theme';
import { drawButton, drawLabel, hit, type ButtonSpec, type Rect } from '../canvas/ui';
import { clearSession } from '../lib/storage';
import { roomSync } from '../lib/sync';
import { resetGameScene } from './game';
import { goLobby } from './router';
import { getRoomState } from './roomState';
import { teardownRoom } from './room';

const CELL_W = 88;
const CELL_H = 112;
const CELL_GAP = 10;
const FLIP_DURATION_MS = 420;
const CRACK_DURATION_MS = 280;

type Phase = 'flipping' | 'done';

let phase: Phase = 'flipping';
let revealedCount = 0;
let crackedIndices = new Set<number>();
let flipTimer: number | null = null;
let resultKey = '';
let buttons: ButtonSpec[] = [];
let cardRects: Rect[] = [];
let revealStartTimes: number[] = [];
let crackStartTimes: number[] = [];

function resetAnimation(room: Room): void {
  const key = `${room.roomId}:${room.sortOrder.join(',')}`;
  if (key === resultKey) return;
  resultKey = key;
  phase = 'flipping';
  revealedCount = 0;
  crackedIndices = new Set();
  revealStartTimes = room.sortOrder.map(() => 0);
  crackStartTimes = room.sortOrder.map(() => 0);
  if (flipTimer !== null) {
    clearTimeout(flipTimer);
    flipTimer = null;
  }
  scheduleNextFlip(room);
}

function scheduleNextFlip(room: Room): void {
  if (phase !== 'flipping') return;

  if (revealedCount >= room.sortOrder.length) {
    phase = 'done';
    return;
  }

  flipTimer = setTimeout(() => {
    const index = revealedCount;
    revealStartTimes[index] = Date.now();
    if (index > 0) {
      const prev = cardNumberAtSortIndex(room, index - 1);
      const cur = cardNumberAtSortIndex(room, index);
      if (prev !== null && cur !== null && cur <= prev) {
        crackedIndices = new Set(crackedIndices).add(index);
        crackStartTimes[index] = Date.now();
      }
    }
    revealedCount += 1;
    scheduleNextFlip(room);
  }, FLIP_INTERVAL_MS) as unknown as number;
}

function flipProgressFor(index: number, now: number): number {
  if (index >= revealedCount) return 0;
  const started = revealStartTimes[index];
  if (!started) return 1;
  return Math.min(1, (now - started) / FLIP_DURATION_MS);
}

function crackProgressFor(index: number, now: number): number {
  if (!crackedIndices.has(index)) return 1;
  const started = crackStartTimes[index];
  if (!started) return 1;
  return Math.min(1, (now - started) / CRACK_DURATION_MS);
}

export function renderResult(): void {
  const { ctx, width } = getScreen();
  const now = Date.now();
  drawBackground(ctx, width, getScreen().height);

  const room = roomSync.getRoom(getRoomState().roomId);
  const self = getRoomState().self;
  if (!room || !self) {
    drawLabel(ctx, '加载中…', width / 2, getScreen().height / 2, theme.muted, fonts.body, 'center');
    return;
  }

  resetAnimation(room);
  const outcome = evaluateSortedCards(room);
  const success = phase === 'done' && outcome.success;

  const pad = theme.pad;
  const contentW = width - pad * 2;
  let y = drawRoomHeader(ctx, width, room.roomId, '返回大厅');

  y = drawTopicCard(ctx, pad, y, contentW, room.topic, room.topicLowLabel, room.topicHighLabel) + 16;

  drawLabel(
    ctx,
    phase === 'flipping' ? '正在按顺序翻牌…' : '验证完成',
    pad,
    y,
    theme.green,
    fonts.title,
  );
  y += 28;
  drawLabel(
    ctx,
    phase === 'flipping'
      ? '从左到右依次翻开，数字必须严格递增'
      : success
        ? '所有数字按从小到大排列'
        : '出现逆序，有牌已裂开',
    pad,
    y,
    theme.muted,
    fonts.small,
  );
  y += 28;

  cardRects = [];
  let cx = pad;
  room.sortOrder.forEach((userId, index) => {
    const user = room.players.find((u) => u.id === userId);
    if (!user) return;
    const rect: Rect = { x: cx, y: y + 18, w: CELL_W, h: CELL_H };
    cardRects.push(rect);
    drawFlipRevealCard(ctx, rect, {
      index,
      avatarEmoji: getAvatarEmoji(user.avatarId),
      name: user.name,
      cardNumber: user.cardNumber ?? 0,
      flipProgress: flipProgressFor(index, now),
      cracked: crackedIndices.has(index),
      crackProgress: crackProgressFor(index, now),
    });
    cx += CELL_W + CELL_GAP;
  });
  y += CELL_H + 38;

  if (phase === 'done') {
    const banner: Rect = { x: pad, y, w: contentW, h: 120 };
    ctx.fillStyle = success ? 'rgba(0, 255, 255, 0.06)' : 'rgba(255, 0, 85, 0.08)';
    ctx.strokeStyle = success ? '#00FFFF' : theme.fail;
    ctx.lineWidth = 3;
    ctx.fillRect(banner.x, banner.y, banner.w, banner.h);
    ctx.strokeRect(banner.x, banner.y, banner.w, banner.h);
    drawLabel(ctx, success ? '🎉' : '💔', width / 2, y + 8, theme.green, fonts.title, 'center');
    drawLabel(
      ctx,
      success ? 'SUCCESS' : 'FAIL',
      width / 2,
      y + 36,
      success ? '#00FFFF' : theme.fail,
      'bold 20px monospace',
      'center',
    );
    drawLabel(
      ctx,
      success ? '挑战成功' : '挑战失败',
      width / 2,
      y + 64,
      success ? '#00FFFF' : theme.fail,
      fonts.body,
      'center',
    );
    y += 132;

    buttons = [
      {
        id: 'again',
        label: '再来一局',
        x: pad,
        y,
        w: contentW,
        h: 48,
        variant: 'primary',
      },
    ];
    y += 56;
    if (self.id !== room.hostId) {
      drawLabel(ctx, '点击后回到等待页，需房主再次开始游戏', width / 2, y, theme.muted, fonts.small, 'center');
      y += 24;
    }
    buttons.push({
      id: 'leave',
      label: '返回大厅',
      x: pad,
      y,
      w: contentW,
      h: 48,
      variant: 'secondary',
    });
    for (const btn of buttons) {
      drawButton(ctx, btn);
    }
  } else {
    buttons = [];
    drawLabel(
      ctx,
      `${revealedCount}/${room.sortOrder.length} REVEALED`,
      width / 2,
      y,
      theme.green,
      fonts.sub,
      'center',
    );
  }
}

export async function onResultTouch(x: number, y: number): Promise<void> {
  const { width } = getScreen();
  const self = getRoomState().self;
  const room = roomSync.getRoom(getRoomState().roomId);

  if (hit(getBackButtonRect(width), x, y)) {
    await roomSync.leaveRoom(getRoomState().roomId, self?.id ?? '');
    clearSession();
    teardownRoom();
    goLobby();
    return;
  }

  if (phase !== 'done' || !room || !self) return;

  for (const btn of buttons) {
    if (!hit(btn, x, y)) continue;
    if (btn.id === 'again') {
      const result = await roomSync.playAgain(room.roomId, self.id);
      if (result && 'code' in result) {
        wx.showToast({ title: result.message, icon: 'none' });
      } else {
        resetResultScene();
        resetGameScene();
      }
      return;
    }
    if (btn.id === 'leave') {
      await roomSync.leaveRoom(room.roomId, self.id);
      clearSession();
      teardownRoom();
      goLobby();
      return;
    }
  }
}

export function resetResultScene(): void {
  phase = 'flipping';
  revealedCount = 0;
  crackedIndices = new Set();
  resultKey = '';
  buttons = [];
  revealStartTimes = [];
  crackStartTimes = [];
  if (flipTimer !== null) {
    clearTimeout(flipTimer);
    flipTimer = null;
  }
}
