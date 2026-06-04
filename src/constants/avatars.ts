/** 28 个默认头像（emoji） */
export const AVATAR_EMOJIS: string[] = [
  '😀', '😎', '🤩', '🥳', '😺', '🐶', '🐼', '🦊',
  '🐸', '🐙', '🦄', '🐲', '🌸', '🌈', '⭐', '🔥',
  '💎', '🎭', '🎪', '🎯', '🏆', '🎸', '🚀', '🍕',
  '🍉', '🧁', '🎲', '👑',
];

export function getAvatarEmoji(avatarId: number): string {
  const index = Math.min(AVATAR_EMOJIS.length, Math.max(1, avatarId)) - 1;
  return AVATAR_EMOJIS[index];
}
