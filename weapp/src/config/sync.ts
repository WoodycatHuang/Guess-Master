/** 联机服务器 — 由 .env 注入 TARO_APP_SYNC_URL */
export const SYNC_BASE_URL = process.env.TARO_APP_SYNC_URL ?? '';

export function getSyncBaseUrl(): string | null {
  const url = SYNC_BASE_URL.trim();
  return url ? url.replace(/\/$/, '') : null;
}

export function getSyncWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/i, 'ws') + '/ws';
}

export function isRemoteSyncEnabled(): boolean {
  return getSyncBaseUrl() !== null;
}
