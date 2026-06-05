/** 联机服务器地址 — 备案通过后填 https://api.你的域名.cn */
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
