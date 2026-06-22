/** 联机同步服务地址（Expo: EXPO_PUBLIC_SYNC_URL · H5: VITE_SYNC_URL） */
function readSyncUrlEnv(): string {
  try {
    const vite = import.meta.env?.VITE_SYNC_URL;
    if (typeof vite === 'string' && vite.trim()) return vite.trim();
  } catch {
    // 非 ESM / 非 Vite 环境
  }
  const expo = process.env.EXPO_PUBLIC_SYNC_URL?.trim();
  return expo ?? '';
}

export function getSyncBaseUrl(): string | null {
  const url = readSyncUrlEnv();
  return url ? url.replace(/\/$/, '') : null;
}

export function isRemoteSyncEnabled(): boolean {
  return getSyncBaseUrl() !== null;
}

export function getSyncWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/i, 'ws') + '/ws';
}
