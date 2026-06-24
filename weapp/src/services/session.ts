import Taro from '@tarojs/taro';

const PROFILE_KEY = 'guess_master_profile';

export interface LobbyProfile {
  nickname: string;
  avatarId: number;
}

export function loadProfile(): LobbyProfile {
  try {
    const raw = Taro.getStorageSync(PROFILE_KEY);
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
  Taro.setStorageSync(PROFILE_KEY, profile);
}

export function persistSelf(userId: string, roomId: string): void {
  Taro.setStorageSync('guess_master_session', { userId, roomId });
}

export function loadSession(): { userId: string; roomId: string } | null {
  try {
    const raw = Taro.getStorageSync('guess_master_session');
    if (raw?.userId && raw?.roomId) {
      return { userId: raw.userId, roomId: raw.roomId };
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearSession(): void {
  Taro.removeStorageSync('guess_master_session');
}
