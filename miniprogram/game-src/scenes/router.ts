import type { User } from '@shared/types/room';
import { requestPaint } from '../lib/renderScheduler';
import { initLobby } from './lobby';
import { initRoom, teardownRoom } from './room';

export type SceneId = 'lobby' | 'room';

let scene: SceneId = 'lobby';

export function getScene(): SceneId {
  return scene;
}

export function goLobby(): void {
  teardownRoom();
  scene = 'lobby';
  initLobby();
  requestPaint();
}

export function goRoom(roomId: string, self: User, entryMessage?: string): void {
  scene = 'room';
  initRoom(roomId, self, entryMessage);
  requestPaint();
}

export function bootLobby(launchRoomId?: string): void {
  scene = 'lobby';
  initLobby(launchRoomId);
  requestPaint();
}
