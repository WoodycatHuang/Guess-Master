import { Room } from '../../types/room';
import { RoomListener } from './RoomSyncService';

type GuessMasterGlobal = typeof globalThis & {
  __guessMasterRooms?: Map<string, Room>;
  __guessMasterListeners?: Map<string, Set<RoomListener>>;
};

const globalStore = globalThis as GuessMasterGlobal;

/** 内存房间表 — 挂到 globalThis，避免 Expo 热更新清空导致房间「假解散」 */
export function getRoomsMap(): Map<string, Room> {
  if (!globalStore.__guessMasterRooms) {
    globalStore.__guessMasterRooms = new Map();
  }
  return globalStore.__guessMasterRooms;
}

export function getListenersMap(): Map<string, Set<RoomListener>> {
  if (!globalStore.__guessMasterListeners) {
    globalStore.__guessMasterListeners = new Map();
  }
  return globalStore.__guessMasterListeners;
}
