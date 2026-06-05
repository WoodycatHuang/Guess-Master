import { AVATAR_EMOJIS } from '@shared/constants/avatars';
import { drawBackground, drawHeader, getScreen } from '../canvas/screen';
import { fonts, theme } from '../canvas/theme';
import {
  drawButton,
  drawInput,
  drawLabel,
  drawPanel,
  hit,
  type ButtonSpec,
  type Rect,
} from '../canvas/ui';
import { loadProfile, saveProfile } from '../lib/storage';
import { isRemoteSyncEnabled, roomSync } from '../lib/sync';
import { goRoom } from './router';

export interface LobbyState {
  nickname: string;
  avatarId: number;
  roomIdInput: string;
  focus: 'none' | 'nickname' | 'roomId';
  busy: boolean;
}

let state: LobbyState = {
  nickname: '',
  avatarId: 1,
  roomIdInput: '',
  focus: 'none',
  busy: false,
};

let nickRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
let roomRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
let avatarRects: Array<Rect & { id: number }> = [];
let buttons: ButtonSpec[] = [];

export function initLobby(launchRoomId?: string): void {
  const profile = loadProfile();
  state = {
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    roomIdInput: launchRoomId ?? '',
    focus: 'none',
    busy: false,
  };
}

export function renderLobby(): void {
  const { ctx, width, height } = getScreen();
  drawBackground(ctx, width, height);

  const pad = theme.pad;
  let y = drawHeader(ctx, width, pad + 8);

  const panel: Rect = { x: pad, y, w: width - pad * 2, h: height - y - pad };
  drawPanel(ctx, panel);

  const innerX = panel.x + 16;
  const innerW = panel.w - 32;
  let iy = panel.y + 20;

  drawLabel(ctx, '你的昵称', innerX, iy, theme.gray, fonts.small);
  iy += 20;
  nickRect = { x: innerX, y: iy, w: innerW, h: 44 };
  drawInput(ctx, nickRect, state.nickname, '点击输入昵称', state.focus === 'nickname');
  iy += 56;

  drawLabel(ctx, '选择头像', innerX, iy, theme.gray, fonts.small);
  iy += 22;

  const cols = 5;
  const cell = Math.min(56, (innerW - (cols - 1) * 8) / cols);
  avatarRects = [];
  for (let i = 0; i < AVATAR_EMOJIS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const id = i + 1;
    const ax = innerX + col * (cell + 8);
    const ay = iy + row * (cell + 8);
    const rect = { x: ax, y: ay, w: cell, h: cell, id };
    avatarRects.push(rect);

    const selected = state.avatarId === id;
    ctx.fillStyle = theme.bgInput;
    ctx.strokeStyle = selected ? theme.green : theme.border;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.fillRect(ax, ay, cell, cell);
    ctx.strokeRect(ax, ay, cell, cell);
    ctx.font = fonts.emoji;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(AVATAR_EMOJIS[i], ax + cell / 2, ay + cell / 2);
  }
  iy += Math.ceil(AVATAR_EMOJIS.length / cols) * (cell + 8) + 12;

  drawLabel(ctx, 'ROOM ID', innerX, iy, theme.gray, fonts.small);
  iy += 20;
  roomRect = { x: innerX, y: iy, w: innerW * 0.55, h: 44 };
  drawInput(ctx, roomRect, state.roomIdInput, '房间号', state.focus === 'roomId');

  const joinBtn: ButtonSpec = {
    id: 'join',
    label: '加入',
    x: innerX + innerW * 0.58,
    y: iy,
    w: innerW * 0.42,
    h: 44,
    variant: 'secondary',
    disabled: state.busy,
  };
  drawButton(ctx, joinBtn);
  iy += 56;

  const createBtn: ButtonSpec = {
    id: 'create',
    label: '创建房间',
    x: innerX,
    y: iy,
    w: innerW,
    h: 48,
    variant: 'primary',
    disabled: state.busy,
  };
  drawButton(ctx, createBtn);
  iy += 60;

  const hint = isRemoteSyncEnabled()
    ? '已连接联机服务器'
    : '演示模式：单机可测，真联机需配置服务器';
  drawLabel(ctx, hint, innerX, iy, theme.muted, fonts.small, 'center');

  buttons = [joinBtn, createBtn];
}

function profile() {
  saveProfile({ nickname: state.nickname.trim(), avatarId: state.avatarId });
  return { name: state.nickname.trim(), avatarId: state.avatarId };
}

function promptNickname(): Promise<string | null> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '输入昵称',
      editable: true,
      placeholderText: '你的昵称',
      content: state.nickname,
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          resolve(res.content.trim());
        } else {
          resolve(null);
        }
      },
    });
  });
}

function promptRoomId(): Promise<string | null> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '输入房间号',
      editable: true,
      placeholderText: '6 位房间号',
      content: state.roomIdInput,
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          resolve(res.content.trim().toUpperCase());
        } else {
          resolve(null);
        }
      },
    });
  });
}

async function ensureNickname(): Promise<boolean> {
  if (state.nickname.trim()) return true;
  const name = await promptNickname();
  if (!name) {
    wx.showToast({ title: '请输入昵称', icon: 'none' });
    return false;
  }
  state.nickname = name;
  saveProfile({ nickname: name, avatarId: state.avatarId });
  return true;
}

async function handleCreate(): Promise<void> {
  if (state.busy) return;
  if (!(await ensureNickname())) return;
  state.busy = true;
  try {
    const result = await roomSync.createRoom(profile());
    goRoom(result.room.roomId, result.self);
  } catch (e) {
    wx.showToast({
      title: e instanceof Error ? e.message : '创建失败',
      icon: 'none',
    });
  } finally {
    state.busy = false;
  }
}

async function handleJoin(): Promise<void> {
  if (state.busy) return;
  if (!(await ensureNickname())) return;
  if (!state.roomIdInput.trim()) {
    const id = await promptRoomId();
    if (!id) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    state.roomIdInput = id;
  }
  state.busy = true;
  try {
    const result = await roomSync.joinRoom({
      ...profile(),
      roomId: state.roomIdInput.trim(),
    });
    if ('code' in result) {
      const hint = !isRemoteSyncEnabled()
        ? '（演示模式，请配置服务器）'
        : '';
      wx.showToast({ title: result.message + hint, icon: 'none' });
      return;
    }
    goRoom(result.room.roomId, result.self, result.message);
  } catch (e) {
    wx.showToast({
      title: e instanceof Error ? e.message : '加入失败',
      icon: 'none',
    });
  } finally {
    state.busy = false;
  }
}

export async function onLobbyTouch(x: number, y: number): Promise<void> {
  if (hit(nickRect, x, y)) {
    const name = await promptNickname();
    if (name) {
      state.nickname = name;
      saveProfile({ nickname: name, avatarId: state.avatarId });
    }
    return;
  }

  if (hit(roomRect, x, y)) {
    const id = await promptRoomId();
    if (id) state.roomIdInput = id;
    return;
  }

  for (const rect of avatarRects) {
    if (hit(rect, x, y)) {
      state.avatarId = rect.id;
      saveProfile({ nickname: state.nickname, avatarId: rect.id });
      return;
    }
  }

  for (const btn of buttons) {
    if (btn.disabled) continue;
    if (hit(btn, x, y)) {
      if (btn.id === 'create') void handleCreate();
      if (btn.id === 'join') void handleJoin();
      return;
    }
  }
}

export function getLobbyState(): LobbyState {
  return state;
}
