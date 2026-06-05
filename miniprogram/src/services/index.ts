import { localMockSync } from '@shared/services/sync/LocalMockSyncService';
import { getSyncBaseUrl, isRemoteSyncEnabled } from '../config/sync';
import { createRemoteSyncService } from './remoteSync';

const remote = createRemoteSyncService(getSyncBaseUrl());

export const roomSync = remote ?? localMockSync;
export { isRemoteSyncEnabled, getSyncBaseUrl };
