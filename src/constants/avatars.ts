/** 26 个 emoji 头像 — PM 选定，备案合规 */
export const AVATAR_EMOJIS: string[] = [
  '😀', // 01 大笑
  '😎', // 02 酷
  '🤩', // 03 哇
  '🤯', // 11 震惊
  '🤓', // 12 书呆子
  '🤠', // 15 牛仔
  '🥳', // 16 派对
  '😺', // 17 猫脸
  '🐶', // 18 狗脸
  '🧙', // 51 魔法师
  '🧚', // 52 仙女
  '👨‍🏭', // 49 工人
  '🧑‍🚀', // 50 航天员
  '👸', // 55 公主
  '🎅', // 56 圣诞老人
  '🧑‍🎤', // 58 音乐人
  '🕵️', // 43 侦探
  '👨‍🎨', // 33 画家
  '🐱', // 61 猫
  '🐶', // 62 狗
  '🦊', // 63 狐狸
  '🐻', // 64 熊
  '🦉', // 74 猫头鹰
  '🐙', // 77 章鱼
  '🐸', // 72 青蛙
];

export const AVATAR_COUNT = AVATAR_EMOJIS.length;

export function getAvatarEmoji(avatarId: number): string {
  const index = Math.min(AVATAR_COUNT, Math.max(1, avatarId)) - 1;
  return AVATAR_EMOJIS[index] ?? AVATAR_EMOJIS[0];
}
