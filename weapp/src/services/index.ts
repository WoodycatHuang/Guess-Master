import { localMockSync } from '@shared/services/sync/LocalMockSyncService';
import { getSyncBaseUrl, isRemoteSyncEnabled } from '../config/sync';
import { createRemoteSyncService } from './remoteSync';

const baseUrl = getSyncBaseUrl();
export const roomSync = baseUrl ? createRemoteSyncService(baseUrl) : localMockSync;
export { isRemoteSyncEnabled, getSyncBaseUrl };
