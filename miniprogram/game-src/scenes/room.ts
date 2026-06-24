import type { User } from '@shared/types/room';
import { canStartHardMode } from '@shared/constants/game';
import { getAvatarEmoji } from '@shared/constants/avatars';
import type { GameDifficulty } from '@shared/types/room';
import { drawBackground, getBackButtonRect, getContentTop, getScreen } from '../canvas/screen';
import { fonts, theme } from '../canvas/theme';
import { drawButton, drawLabel, drawPanel, hit, type ButtonSpec, type Rect } from '../canvas/ui';
import {
  drawDifficultyPicker,
  drawRoomIdHero,
  drawPlayerGrid,
  type DifficultyPickerLayout,
} from '../canvas/drawCommon';
import { pulsePaint, requestPaint } from '../lib/renderScheduler';
import { clearSession, persistSelf } from '../lib/storage';
import { roomSync } from '../lib/sync';
import { goLobby } from './router';
import { clearRoomState, getRoomState, setRoomState, type RoomSceneState } from './roomState';

export type { RoomSceneState };
let unsubscribe: (() => void) | null = null;
let buttons: ButtonSpec[] = [];
let roomIdCopyRect: Rect | null = null;
let backButtonRect: Rect | null = null;
let startHintUntil = 0;

const START_HINT = '至少2个人才可以开始';
const START_HINT_MS = 2800;

let difficultyPickerOpen = false;
let difficultyPickerLayout: DifficultyPickerLayout | null = null;

export function initRoom(
  roomId: string,
  self: User,
  entryMessage?: string,
): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  setRoomState({ roomId, self, entryMessage });
  persistSelf(self.id, roomId);

  unsubscribe = roomSync.subscribe(roomId, (room) => {
    requestPaint();
    const current = getRoomState();
    if (!room || !current.self) return;
    const updated =
      room.players.find((u) => u.id === current.self!.id) ??
      room.spectators.find((u) => u.id === current.self!.id);
    if (updated) setRoomState({ ...current, self: { ...updated } });
  });
}

export function teardownRoom(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  clearRoomState();
  startHintUntil = 0;
  difficultyPickerOpen = false;
  difficultyPickerLayout = null;
}

export function renderRoom(): void {
  const { ctx, width, height } = getScreen();
  drawBackground(ctx, width, height);

  const room = roomSync.getRoom(getRoomState().roomId);
  if (!room || !getRoomState().self) {
    drawLabel(ctx, '加载房间…', width / 2, height / 2, theme.muted, fonts.body, 'center');
    return;
  }

  const pad = theme.pad;
  const top = getContentTop();

  backButtonRect = getBackButtonRect(width);
  drawLabel(ctx, '退回大厅', pad, top + 8, theme.green, fonts.small, 'left');

  const hero = drawRoomIdHero(ctx, width, room.roomId, top + 44);
  roomIdCopyRect = hero.rect;
  let y = hero.nextY;

  if (getRoomState().entryMessage) {
    const banner: Rect = { x: pad, y, w: width - pad * 2, h: 56 };
    drawPanel(ctx, banner);
    drawLabel(ctx, getRoomState().entryMessage!, banner.x + 12, banner.y + 10, theme.fail, fonts.small);
    drawLabel(ctx, '你正在旁观', banner.x + 12, banner.y + 30, theme.muted, fonts.small);
    y += 68;
  }

  const self = getRoomState().self!;
  const isHost = self.id === room.hostId;
  const isSpectator = self.role === 'Spectator';
  drawLabel(
    ctx,
    isSpectator ? '观战中' : '等待开始',
    pad,
    y,
    theme.green,
    fonts.title,
  );
  y += 32;
  drawLabel(
    ctx,
    `${room.players.length}/10 玩家`,
    pad,
    y,
    theme.gray,
    fonts.sub,
  );
  y += 28;

  const contentW = width - pad * 2;
  const sorted = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);
  y = drawPlayerGrid(
    ctx,
    pad,
    y,
    contentW,
    sorted.map((u) => ({
      avatarEmoji: getAvatarEmoji(u.avatarId),
      name: u.name,
      isHost: u.id === room.hostId,
      isSelf: u.id === self.id,
    })),
  );

  y += 8;
  if (!isHost && !isSpectator) {
    drawLabel(ctx, '等待房主开启游戏…', pad, y, theme.muted, fonts.body);
    y += 28;
  }

  buttons = [];
  const btnGap = 12;
  const btnH = 48;
  const rowW = width - pad * 2;
  const halfBtnW = Math.floor((rowW - btnGap) / 2);

  if (isHost && !isSpectator) {
    const canStart = room.players.length >= 2;
    buttons.push({
      id: 'share',
      label: '邀请好友',
      x: pad,
      y,
      w: halfBtnW,
      h: btnH,
      variant: 'green',
    });
    buttons.push({
      id: 'start',
      label: '开始',
      x: pad + halfBtnW + btnGap,
      y,
      w: halfBtnW,
      h: btnH,
      variant: 'green',
      disabled: !canStart,
    });
  } else {
    buttons.push({
      id: 'share',
      label: '邀请好友',
      x: pad,
      y,
      w: rowW,
      h: btnH,
      variant: 'green',
    });
  }

  for (const btn of buttons) {
    drawButton(ctx, btn);
  }

  y += btnH + btnGap;

  if (isHost && !isSpectator && room.players.length < 10) {
    const mockBtn: ButtonSpec = {
      id: 'mock',
      label: '+ 添加模拟玩家',
      x: pad,
      y,
      w: rowW,
      h: btnH,
      variant: 'secondary',
    };
    buttons.push(mockBtn);
    drawButton(ctx, mockBtn);
  }

  if (isHost && !isSpectator && startHintUntil > Date.now()) {
    const startBtn = buttons.find((b) => b.id === 'start');
    if (startBtn) {
      drawLabel(
        ctx,
        START_HINT,
        startBtn.x + startBtn.w / 2,
        startBtn.y + startBtn.h + 10,
        theme.fail,
        fonts.small,
        'center',
      );
    }
  }

  if (difficultyPickerOpen) {
    difficultyPickerLayout = drawDifficultyPicker(ctx, width, height, {
      hardEnabled: canStartHardMode(room.players.length),
    });
  } else {
    difficultyPickerLayout = null;
  }
}

async function startWithDifficulty(difficulty: GameDifficulty): Promise<void> {
  difficultyPickerOpen = false;
  difficultyPickerLayout = null;
  const self = getRoomState().self;
  if (!self) return;
  const result = await roomSync.startGame(getRoomState().roomId, self.id, difficulty);
  if (result && 'code' in result) {
    wx.showToast({ title: result.message, icon: 'none' });
  }
}

export async function onRoomTouch(x: number, y: number): Promise<void> {
  const { width } = getScreen();

  if (difficultyPickerOpen && difficultyPickerLayout) {
    const { easy, hard, cancel } = difficultyPickerLayout;
    if (hit(easy, x, y)) {
      await startWithDifficulty('easy');
      return;
    }
    if (hit(hard, x, y)) {
      const room = roomSync.getRoom(getRoomState().roomId);
      if (!room || !canStartHardMode(room.players.length)) {
        wx.showToast({ title: '困难模式最多支持5人', icon: 'none' });
        return;
      }
      await startWithDifficulty('hard');
      return;
    }
    if (hit(cancel, x, y)) {
      difficultyPickerOpen = false;
      difficultyPickerLayout = null;
      return;
    }
    return;
  }

  if (backButtonRect && hit(backButtonRect, x, y)) {
    await roomSync.leaveRoom(getRoomState().roomId, getRoomState().self?.id ?? '');
    clearSession();
    teardownRoom();
    goLobby();
    return;
  }

  if (roomIdCopyRect && hit(roomIdCopyRect, x, y)) {
    const roomId = getRoomState().roomId;
    wx.setClipboardData({
      data: roomId,
      success: () => {
        wx.showToast({ title: '已复制房间号', icon: 'success' });
      },
    });
    return;
  }

  for (const btn of buttons) {
    if (!hit(btn, x, y)) continue;

    if (btn.id === 'start') {
      if (btn.disabled) {
        startHintUntil = Date.now() + START_HINT_MS;
        return;
      }
      difficultyPickerOpen = true;
      return;
    }

    if (btn.id === 'mock') {
      const room = roomSync.getRoom(getRoomState().roomId);
      if (!room || room.players.length >= 10) {
        wx.showToast({ title: '房间已满', icon: 'none' });
        return;
      }
      const updated = await roomSync.addMockGuests(getRoomState().roomId, 1);
      if (!updated) {
        wx.showToast({ title: '添加失败', icon: 'none' });
      }
      return;
    }

    if (btn.disabled) continue;

    if (btn.id === 'share') {
      wx.shareAppMessage({
        title: `来一起玩脑波专家！房间号 ${getRoomState().roomId}`,
        query: `roomId=${encodeURIComponent(getRoomState().roomId)}`,
        imageUrl: 'assets/share-500x400.png',
      });
      return;
    }
  }
}

export function getRoomShareConfig(): WechatMinigame.ShareAppMessageOption {
  const { roomId } = getRoomState();
  return {
    title: `来一起玩脑波专家！房间号 ${roomId}`,
    query: `roomId=${encodeURIComponent(roomId)}`,
    imageUrl: 'assets/share-500x400.png',
  };
}

export { getRoomState } from './roomState';
