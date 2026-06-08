import { Room } from '../../types/room';
import { RoomListener } from './RoomSyncService';

type GuessMasterGlobal = typeof globalThis & {
  __guessMasterRooms?: Map<string, Room>;
  __guessMasterListeners?: Map<string, Set<RoomListener>>;
};

function getGlobalStore(): GuessMasterGlobal {
  if (typeof globalThis !== 'undefined') {
    return globalThis as GuessMasterGlobal;
  }
  if (typeof global !== 'undefined') {
    return global as GuessMasterGlobal;
  }
  if (typeof wx !== 'undefined') {
    return wx as unknown as GuessMasterGlobal;
  }
  return {} as GuessMasterGlobal;
}

const globalStore = getGlobalStore();

/** 内存房间表 — 挂到 globalThis，避免热更新清空导致房间「假解散」 */
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
