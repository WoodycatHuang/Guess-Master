import type { User } from '@shared/types/room';
import { initLobby } from './lobby';
import { initRoom, teardownRoom } from './room';

export type SceneId = 'lobby' | 'room';

let scene: SceneId = 'lobby';
let launchRoomId: string | undefined;

export function setLaunchQuery(query?: Record<string, string>): void {
  if (query?.roomId) {
    launchRoomId = query.roomId.toUpperCase();
  }
}

export function getScene(): SceneId {
  return scene;
}

export function goLobby(): void {
  teardownRoom();
  scene = 'lobby';
  initLobby(launchRoomId);
  launchRoomId = undefined;
}

export function goRoom(roomId: string, self: User, entryMessage?: string): void {
  scene = 'room';
  initRoom(roomId, self, entryMessage);
}

export function boot(): void {
  initLobby(launchRoomId);
}
