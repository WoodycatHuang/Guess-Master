const KEY = 'guess-master';

export interface StoredProfile {
  nickname: string;
  avatarId: number;
  userId?: string;
  roomId?: string;
}

export function loadProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { nickname: '', avatarId: 1 };
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return { nickname: '', avatarId: 1 };
  }
}

export function saveProfile(profile: StoredProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearSession(): void {
  const { nickname, avatarId } = loadProfile();
  saveProfile({ nickname, avatarId });
}

export function persistSession(userId: string, roomId: string): void {
  const cur = loadProfile();
  saveProfile({ ...cur, userId, roomId });
}

export function getSessionUserId(): string | null {
  return loadProfile().userId ?? null;
}
