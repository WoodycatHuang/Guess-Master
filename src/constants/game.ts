/** 含 Host 在内，最多 10 名玩家 */
export const MAX_PLAYERS = 10;

/** 困难模式（每人 2 张牌）最多支持 5 名玩家 */
export const MAX_HARD_MODE_PLAYERS = 5;

/** 可选默认头像数量 */
export const AVATAR_COUNT = 25;

export function canStartHardMode(playerCount: number): boolean {
  return playerCount <= MAX_HARD_MODE_PLAYERS;
}
