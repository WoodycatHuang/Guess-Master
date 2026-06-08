/** 构建时由 scripts/build-game.mjs 从 .env.development 注入 */
declare const __SYNC_URL__: string;

export function getSyncBaseUrl(): string | null {
  const url = typeof __SYNC_URL__ !== 'undefined' ? __SYNC_URL__.trim() : '';
  return url ? url.replace(/\/$/, '') : null;
}

export function isRemoteSyncEnabled(): boolean {
  return getSyncBaseUrl() !== null;
}

export function getSyncWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/i, 'ws') + '/ws';
}
