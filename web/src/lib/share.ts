/** 分享链接：生产环境固定 guessmaster.cn，开发用当前 origin */
export function getShareUrl(roomId: string): string {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return `${configured.replace(/\/$/, '')}/?room=${roomId}`;
  }
  if (import.meta.env.PROD) {
    return `https://guessmaster.cn/?room=${roomId}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/?room=${roomId}`;
  }
  return `https://guessmaster.cn/?room=${roomId}`;
}
