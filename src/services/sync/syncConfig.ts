/** 联机同步服务地址，例如 http://192.168.1.8:8787 */
export function getSyncBaseUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_SYNC_URL?.trim();
  return url ? url.replace(/\/$/, '') : null;
}

export function isRemoteSyncEnabled(): boolean {
  return getSyncBaseUrl() !== null;
}

export function getSyncWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/i, 'ws') + '/ws';
}
