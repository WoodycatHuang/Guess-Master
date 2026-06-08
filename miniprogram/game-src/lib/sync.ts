import { localMockSync } from '@shared/services/sync/LocalMockSyncService';
import { createRemoteSyncService } from './remoteSync';
import { getSyncBaseUrl, isRemoteSyncEnabled } from './syncConfig';

const baseUrl = getSyncBaseUrl();
export const roomSync = baseUrl ? createRemoteSyncService(baseUrl) : localMockSync;

export { isRemoteSyncEnabled };
