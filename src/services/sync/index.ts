import { createRemoteSyncService } from './RemoteSyncService';
import { localMockSync } from './LocalMockSyncService';
import { isRemoteSyncEnabled } from './syncConfig';

export type { RoomSyncService, RoomListener } from './RoomSyncService';
export { isRemoteSyncEnabled, getSyncBaseUrl } from './syncConfig';

const remote = createRemoteSyncService();

export const roomSync = remote ?? localMockSync;

export const syncMode = remote ? ('remote' as const) : ('local' as const);
