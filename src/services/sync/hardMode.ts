import type { Room } from '../../types/room';

/** 服务端已正确开启困难模式（每人 2 张牌 + sortOrder 含 #1/#2 槽位） */
export function isHardModeRoom(room: Room): boolean {
  if (room.difficulty !== 'hard') return false;
  if (room.sortOrder.length !== room.players.length * 2) return false;
  return room.players.every((p) => p.cardNumber2 != null);
}

export const HARD_MODE_SERVER_HINT =
  '困难模式需要新版联机服务。请另开终端运行 npm run sync-server，并把 web/.env.development 改为 VITE_SYNC_URL=http://127.0.0.1:8787 后重启 H5；或更新 api.guessmaster.cn 上的服务端代码。';
