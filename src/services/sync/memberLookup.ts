import type { Room, User } from '../../types/room';

/** 大厅侧：是否已在该房间（用于跳过重复 join） */
export function findExistingMember(
  room: Room,
  name: string,
  userId?: string,
): User | null {
  if (userId) {
    const byId =
      room.players.find((u) => u.id === userId) ??
      room.spectators.find((u) => u.id === userId);
    if (byId) return byId;
  }

  if (room.status !== 'waiting') return null;

  const trimmed = name.trim();
  if (!trimmed) return null;

  const matches = [...room.players, ...room.spectators].filter(
    (u) => u.name === trimmed,
  );
  return matches.length === 1 ? matches[0] : null;
}
