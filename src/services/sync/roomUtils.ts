import { MAX_PLAYERS } from '../../constants/game';
import { GameDifficulty, Room, User, UserRole } from '../../types/room';
import { makeSortSlot, parseSortSlot } from './sortSlots';

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function generateUserId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createUser(
  name: string,
  avatarId: number,
  role: UserRole,
  joinedAt = Date.now(),
): User {
  return {
    id: generateUserId(),
    name,
    avatarId,
    role,
    cardNumber: null,
    cardNumber2: null,
    positionIndex: null,
    joinedAt,
  };
}

export function cloneRoom(room: Room): Room {
  return {
    ...room,
    players: room.players.map((u) => ({ ...u })),
    spectators: room.spectators.map((u) => ({ ...u })),
    sortOrder: [...room.sortOrder],
  };
}

export function isRoomFull(room: Room): boolean {
  return room.players.length >= MAX_PLAYERS;
}

export function isGameInProgress(room: Room): boolean {
  return room.status === 'gaming' || room.status === 'verifying';
}

/** 按加入顺序返回 Guest 列表（不含 Host） */
export function guestsByJoinOrder(room: Room): User[] {
  return room.players
    .filter((u) => u.role === 'Guest')
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

/** Host 离开时，按规则提拔新 Host（加入顺序第 2 人 = 最早加入的 Guest） */
export function promoteNextHost(room: Room): string | null {
  const next = guestsByJoinOrder(room)[0];
  if (!next) return null;

  room.players.forEach((u) => {
    if (u.id === next.id) u.role = 'Host';
  });
  room.hostId = next.id;
  return next.id;
}

export function findUserInRoom(
  room: Room,
  userId: string,
): { user: User; list: 'players' | 'spectators' } | null {
  const inPlayers = room.players.find((u) => u.id === userId);
  if (inPlayers) return { user: inPlayers, list: 'players' };

  const inSpectators = room.spectators.find((u) => u.id === userId);
  if (inSpectators) return { user: inSpectators, list: 'spectators' };

  return null;
}

export function defaultSortOrder(room: Room): string[] {
  const sorted = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);
  if (room.difficulty === 'hard') {
    const order: string[] = [];
    for (const user of sorted) {
      order.push(makeSortSlot(user.id, 1), makeSortSlot(user.id, 2));
    }
    return order;
  }
  return sorted.map((u) => u.id);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 为每位玩家发 1–100 互不重复的数字牌 */
export function dealCardsToPlayers(
  players: User[],
  difficulty: GameDifficulty = 'easy',
): void {
  const cardCount = difficulty === 'hard' ? players.length * 2 : players.length;
  const pool = shuffle(Array.from({ length: 100 }, (_, i) => i + 1));
  if (cardCount > pool.length) {
    throw new Error('牌池不足以发牌');
  }
  players.forEach((player, index) => {
    if (difficulty === 'hard') {
      player.cardNumber = pool[index * 2];
      player.cardNumber2 = pool[index * 2 + 1];
    } else {
      player.cardNumber = pool[index];
      player.cardNumber2 = null;
    }
  });
}

export function applySortOrder(room: Room): void {
  room.sortOrder.forEach((token, index) => {
    const userId =
      room.difficulty === 'hard' ? parseSortSlot(token).userId : token;
    const player = room.players.find((u) => u.id === userId);
    if (player) player.positionIndex = index;
  });
}

export function validateSortOrder(room: Room, order: string[]): boolean {
  if (room.difficulty === 'hard') {
    if (order.length !== room.players.length * 2) return false;
    const expected = new Map<string, Set<1 | 2>>();
    for (const player of room.players) {
      expected.set(player.id, new Set([1, 2]));
    }
    for (const token of order) {
      const { userId, cardIndex } = parseSortSlot(token);
      const slots = expected.get(userId);
      if (!slots || !slots.has(cardIndex)) return false;
      slots.delete(cardIndex);
    }
    return [...expected.values()].every((slots) => slots.size === 0);
  }

  if (order.length !== room.players.length) return false;
  const playerIds = new Set(room.players.map((u) => u.id));
  const seen = new Set<string>();
  for (const id of order) {
    if (!playerIds.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

export function cardNumberAtSortIndex(room: Room, index: number): number | null {
  const token = room.sortOrder[index];
  if (!token) return null;
  if (room.difficulty === 'hard') {
    const { userId, cardIndex } = parseSortSlot(token);
    const user = room.players.find((u) => u.id === userId);
    if (!user) return null;
    return cardIndex === 2 ? user.cardNumber2 : user.cardNumber;
  }
  return room.players.find((u) => u.id === token)?.cardNumber ?? null;
}

/** 按 Host 排序从左到右检查是否严格递增（当前 > 前一个） */
export function evaluateSortedCards(room: Room): {
  success: boolean;
  crackIndex: number | null;
} {
  let prev: number | null = null;
  for (let i = 0; i < room.sortOrder.length; i++) {
    const num = cardNumberAtSortIndex(room, i);
    if (num == null) continue;
    if (prev !== null && num <= prev) {
      return { success: false, crackIndex: i };
    }
    prev = num;
  }
  return { success: true, crackIndex: null };
}

/** 「再来一局」：回到 waiting，清空本局题目与手牌 */
export function resetRoomForNextRound(room: Room): void {
  room.status = 'waiting';
  room.difficulty = null;
  room.topic = '';
  room.topicLowLabel = '';
  room.topicHighLabel = '';
  room.sortOrder = [];
  room.players.forEach((player) => {
    player.cardNumber = null;
    player.cardNumber2 = null;
    player.positionIndex = null;
  });
}
