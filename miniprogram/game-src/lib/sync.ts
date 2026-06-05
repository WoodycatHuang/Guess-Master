import { localMockSync } from '@shared/services/sync/LocalMockSyncService';

/** 演示模式：本地房间引擎。备案后在此切换 wx.request 远程同步 */
export const roomSync = localMockSync;

export function isRemoteSyncEnabled(): boolean {
  return false;
}
