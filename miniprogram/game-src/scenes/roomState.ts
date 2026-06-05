import type { User } from '@shared/types/room';

export interface RoomSceneState {
  roomId: string;
  self: User | null;
  entryMessage?: string;
}

let state: RoomSceneState = { roomId: '', self: null };

export function getRoomState(): RoomSceneState {
  return state;
}

export function setRoomState(next: RoomSceneState): void {
  state = next;
}

export function clearRoomState(): void {
  state = { roomId: '', self: null };
}
