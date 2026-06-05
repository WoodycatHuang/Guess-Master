import type { User } from '@shared/types/room';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { drawBackground, getScreen } from '../canvas/screen';
import { fonts, theme } from '../canvas/theme';
import { drawButton, drawLabel, drawPanel, hit, type ButtonSpec, type Rect } from '../canvas/ui';
import { clearSession, persistSelf } from '../lib/storage';
import { isRemoteSyncEnabled, roomSync } from '../lib/sync';
import { goLobby } from './router';
import { clearRoomState, getRoomState, setRoomState, type RoomSceneState } from './roomState';

export type { RoomSceneState };
let unsubscribe: (() => void) | null = null;
let buttons: ButtonSpec[] = [];

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
  let y = pad + 8;
  drawLabel(ctx, `ROOM ${room.roomId}`, pad, y, theme.gray, fonts.sub);
  drawLabel(ctx, '退回大厅', width - pad, y, theme.green, fonts.small, 'right');
  y += 36;

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

  const sorted = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);
  for (const u of sorted) {
    const row: Rect = { x: pad, y, w: width - pad * 2, h: 52 };
    drawPanel(ctx, row);
    ctx.font = fonts.emoji;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(getAvatarEmoji(u.avatarId), row.x + 12, row.y + row.h / 2);
    let label = u.name;
    if (u.id === self.id) label += '（你）';
    if (u.id === room.hostId) label += ' · 房主';
    drawLabel(ctx, label, row.x + 48, row.y + 16, theme.gray, fonts.body);
    y += 60;
  }

  buttons = [];
  const btnW = width - pad * 2;

  if (!isRemoteSyncEnabled() && isHost && room.players.length < 2) {
    buttons.push({
      id: 'mock',
      label: '添加测试玩家',
      x: pad,
      y,
      w: btnW,
      h: 44,
      variant: 'secondary',
    });
    y += 52;
  }

  if (isHost && !isSpectator) {
    const canStart = room.players.length >= 2;
    buttons.push({
      id: 'start',
      label: canStart ? '开始游戏' : '至少 2 人才能开始',
      x: pad,
      y,
      w: btnW,
      h: 48,
      variant: canStart ? 'primary' : 'secondary',
      disabled: !canStart,
    });
    y += 56;
  }

  buttons.push({
    id: 'share',
    label: '邀请好友',
    x: pad,
    y,
    w: btnW,
    h: 48,
    variant: 'primary',
  });

  for (const btn of buttons) {
    drawButton(ctx, btn);
  }
}

export async function onRoomTouch(x: number, y: number): Promise<void> {
  const { width } = getScreen();
  if (y <= 40 && x >= width - 100) {
    await roomSync.leaveRoom(getRoomState().roomId, getRoomState().self?.id ?? '');
    clearSession();
    teardownRoom();
    goLobby();
    return;
  }

  for (const btn of buttons) {
    if (btn.disabled) continue;
    if (!hit(btn, x, y)) continue;

    if (btn.id === 'mock') {
      await roomSync.addMockGuests(getRoomState().roomId, 2);
      return;
    }
    if (btn.id === 'start' && getRoomState().self) {
      const result = await roomSync.startGame(getRoomState().roomId, getRoomState().self!.id);
      if (result && 'code' in result) {
        wx.showToast({ title: result.message, icon: 'none' });
      }
      return;
    }
    if (btn.id === 'share') {
      wx.shareAppMessage({
        title: `来一起玩脑波专家！房间号 ${getRoomState().roomId}`,
        query: `roomId=${getRoomState().roomId}`,
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
    query: `roomId=${roomId}`,
    imageUrl: 'assets/share-500x400.png',
  };
}

export { getRoomState } from './roomState';
