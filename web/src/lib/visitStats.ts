import { getSyncBaseUrl } from '@shared/services/sync';

const DEVICE_KEY = 'guess-master-device-id';
const VISIT_SENT_KEY = 'guess-master-visit-sent';

function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

/** 每台设备 lifetime 只上报一次；失败则下次打开重试 */
export async function recordVisitOnce(): Promise<void> {
  if (localStorage.getItem(VISIT_SENT_KEY)) return;

  const base = getSyncBaseUrl();
  if (!base) return;

  try {
    const res = await fetch(`${base}/stats/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() }),
    });
    if (res.ok) {
      localStorage.setItem(VISIT_SENT_KEY, '1');
    }
  } catch {
    // 统计失败不影响游戏
  }
}
