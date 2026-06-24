import { localMockSync } from '@shared/services/sync/LocalMockSyncService';
import { RoomSyncService } from '@shared/services/sync/RoomSyncService';
import { createRemoteSyncService } from './remoteSync';
import { getGmRuntime } from './runtime';
import { getSyncBaseUrl, isRemoteSyncEnabled } from './syncConfig';

function createRoomSync(): RoomSyncService {
  const baseUrl = getSyncBaseUrl();
  return baseUrl ? createRemoteSyncService(baseUrl) : localMockSync;
}

/** 跨热重载复用同一 sync 实例，避免 WebSocket / 轮询泄漏 */
export function getRoomSync(): RoomSyncService {
  const rt = getGmRuntime();
  if (!rt.roomSync) {
    rt.roomSync = createRoomSync();
  }
  return rt.roomSync;
}

export const roomSync = getRoomSync();
export { isRemoteSyncEnabled };
