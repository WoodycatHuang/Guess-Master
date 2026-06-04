/** 25 个默认头像（5×5 网格） */
export const AVATAR_EMOJIS: string[] = [
  '😎', '🥳', '😈', '👻', '💀',
  '🤖', '👽', '🐱', '🐶', '🐰',
  '🐻', '🐼', '🦊', '🐸', '🐨',
  '🐯', '🦉', '🐙', '🦄', '👸',
  '🥷', '🧛', '🎭', '🎸', '🎮',
];

export const AVATAR_COUNT = AVATAR_EMOJIS.length;

export function getAvatarEmoji(avatarId: number): string {
  const index = Math.min(AVATAR_COUNT, Math.max(1, avatarId)) - 1;
  return AVATAR_EMOJIS[index];
}
