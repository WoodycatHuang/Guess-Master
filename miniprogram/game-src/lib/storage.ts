export interface LobbyProfile {
  nickname: string;
  avatarId: number;
}

const PROFILE_KEY = 'guess_master_profile';
const SESSION_KEY = 'guess_master_session';

export function loadProfile(): LobbyProfile {
  try {
    const raw = wx.getStorageSync(PROFILE_KEY) as Partial<LobbyProfile> | undefined;
    if (raw && typeof raw === 'object') {
      return {
        nickname: String(raw.nickname ?? ''),
        avatarId: Number(raw.avatarId) || 1,
      };
    }
  } catch {
    // ignore
  }
  return { nickname: '', avatarId: 1 };
}

export function saveProfile(profile: LobbyProfile): void {
  wx.setStorageSync(PROFILE_KEY, profile);
}

export function persistSelf(userId: string, roomId: string): void {
  wx.setStorageSync(SESSION_KEY, { userId, roomId });
}

export function loadSession(): { userId: string; roomId: string } | null {
  try {
    const raw = wx.getStorageSync(SESSION_KEY) as
      | { userId?: string; roomId?: string }
      | undefined;
    if (raw?.userId && raw?.roomId) {
      return { userId: raw.userId, roomId: raw.roomId };
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearSession(): void {
  wx.removeStorageSync(SESSION_KEY);
}

export function parseLaunchQuery(
  query?: Record<string, string>,
): { roomId?: string } {
  if (!query?.roomId) return {};
  return { roomId: query.roomId.toUpperCase() };
}
