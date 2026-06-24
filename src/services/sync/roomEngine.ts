import { canStartHardMode, MAX_PLAYERS } from '../../constants/game';
import {
  CreateRoomInput,
  CreateRoomResult,
  GameDifficulty,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
} from '../../types/room';
import { AVATAR_COUNT } from '../../constants/avatars';
import { pickRandomTopic } from '../../constants/topics';
import { normalizeRoomId } from './roomKeys';
import {
  applySortOrder,
  cloneRoom,
  createUser,
  dealCardsToPlayers,
  defaultSortOrder,
  generateRoomId,
  guestsByJoinOrder,
  isGameInProgress,
  isRoomFull,
  promoteNextHost,
  resetRoomForNextRound,
  validateSortOrder,
  findUserInRoom,
} from './roomUtils';
import { GameActionError } from './RoomSyncService';

/** 房间业务逻辑 — 单机 Mock 与联机 Server 共用 */
export class RoomEngine {
  constructor(private readonly rooms: Map<string, Room>) {}

  createRoom(input: CreateRoomInput): CreateRoomResult {
    const roomId = generateRoomId();
    const host = createUser(input.name, input.avatarId, 'Host');

    const room: Room = {
      roomId,
      status: 'waiting',
      difficulty: null,
      topic: '',
      topicLowLabel: '',
      topicHighLabel: '',
      hostId: host.id,
      players: [host],
      spectators: [],
      sortOrder: [],
    };

    this.rooms.set(roomId, room);
    return { room: cloneRoom(room), self: { ...host } };
  }

  joinRoom(input: JoinRoomInput): JoinRoomResult | JoinRoomError {
    const id = normalizeRoomId(input.roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }

    const rejoined = this.tryRejoin(room, input);
    if (rejoined) return rejoined;

    const asSpectator = isGameInProgress(room) || isRoomFull(room);
    const user = createUser(
      input.name,
      input.avatarId,
      asSpectator ? 'Spectator' : 'Guest',
    );

    if (asSpectator) {
      room.spectators.push(user);
      const message = isGameInProgress(room) ? '游戏进行中' : '房间已满员';
      return {
        room: cloneRoom(room),
        self: { ...user },
        as: 'spectator',
        message,
      };
    }

    room.players.push(user);
    return {
      room: cloneRoom(room),
      self: { ...user },
      as: 'player',
    };
  }

  /** 已在房间的玩家再次「加入」→ 复用原座位，不新建 Guest */
  private tryRejoin(room: Room, input: JoinRoomInput): JoinRoomResult | null {
    if (input.userId) {
      const existing = findUserInRoom(room, input.userId);
      if (existing) {
        existing.user.name = input.name;
        existing.user.avatarId = input.avatarId;
        return {
          room: cloneRoom(room),
          self: { ...existing.user },
          as: existing.list === 'spectators' ? 'spectator' : 'player',
        };
      }
    }

    if (room.status === 'waiting') {
      const name = input.name.trim();
      const matches = [...room.players, ...room.spectators].filter(
        (u) => u.name === name,
      );
      if (matches.length === 1) {
        const user = matches[0];
        user.name = name;
        user.avatarId = input.avatarId;
        const as: JoinRoomResult['as'] = room.players.some((u) => u.id === user.id)
          ? 'player'
          : 'spectator';
        return {
          room: cloneRoom(room),
          self: { ...user },
          as,
        };
      }
    }

    return null;
  }

  leaveRoom(roomId: string, userId: string): 'updated' | 'deleted' | false {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) return false;

    const playerIdx = room.players.findIndex((u) => u.id === userId);
    if (playerIdx >= 0) {
      const leaving = room.players[playerIdx];
      room.players.splice(playerIdx, 1);

      if (leaving.id === room.hostId) {
        if (guestsByJoinOrder(room).length > 0) {
          promoteNextHost(room);
          return 'updated';
        }
        this.rooms.delete(id);
        return 'deleted';
      }
    } else {
      const specIdx = room.spectators.findIndex((u) => u.id === userId);
      if (specIdx >= 0) {
        room.spectators.splice(specIdx, 1);
      } else {
        return false;
      }
    }

    return 'updated';
  }

  getRoom(roomId: string): Room | null {
    const room = this.rooms.get(normalizeRoomId(roomId));
    return room ? cloneRoom(room) : null;
  }

  addMockGuests(roomId: string, count: number): Room | null {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room || room.status !== 'waiting') return null;

    const slots = MAX_PLAYERS - room.players.length;
    const toAdd = Math.min(count, slots);
    if (toAdd <= 0) return cloneRoom(room);

    const base = Date.now();
    for (let i = 0; i < toAdd; i++) {
      room.players.push(
        createUser(
          `模拟玩家${room.players.length}`,
          ((room.players.length + i) % AVATAR_COUNT) + 1,
          'Guest',
          base + i + 1,
        ),
      );
    }

    return cloneRoom(room);
  }

  startGame(
    roomId: string,
    userId: string,
    difficulty: GameDifficulty = 'easy',
  ): Room | GameActionError {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }
    if (room.status !== 'waiting') {
      return { code: 'INVALID_STATUS', message: '当前状态无法开始游戏' };
    }
    if (room.hostId !== userId) {
      return { code: 'NOT_HOST', message: '只有房主可以开始游戏' };
    }
    if (room.players.length < 2) {
      return {
        code: 'NOT_ENOUGH_PLAYERS',
        message: '至少需要 2 名玩家才能开始',
      };
    }
    if (difficulty === 'hard' && !canStartHardMode(room.players.length)) {
      return {
        code: 'TOO_MANY_FOR_HARD',
        message: '困难模式最多支持5人',
      };
    }

    const topic = pickRandomTopic();
    room.difficulty = difficulty;
    room.topic = topic.title;
    room.topicLowLabel = topic.lowLabel;
    room.topicHighLabel = topic.highLabel;
    dealCardsToPlayers(room.players, difficulty);
    room.sortOrder = defaultSortOrder(room);
    applySortOrder(room);
    room.status = 'gaming';
    return cloneRoom(room);
  }

  updateSortOrder(
    roomId: string,
    userId: string,
    order: string[],
  ): Room | GameActionError {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }
    if (room.status !== 'gaming') {
      return { code: 'INVALID_STATUS', message: '当前无法调整排序' };
    }
    if (room.hostId !== userId) {
      return { code: 'NOT_HOST', message: '只有房主可以排序' };
    }
    if (!validateSortOrder(room, order)) {
      return { code: 'INVALID_SORT', message: '排序必须包含所有玩家' };
    }

    room.sortOrder = [...order];
    applySortOrder(room);
    return cloneRoom(room);
  }

  submitSort(roomId: string, userId: string): Room | GameActionError {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }
    if (room.status !== 'gaming') {
      return { code: 'INVALID_STATUS', message: '当前无法提交排序' };
    }
    if (room.hostId !== userId) {
      return { code: 'NOT_HOST', message: '只有房主可以提交' };
    }
    if (!validateSortOrder(room, room.sortOrder)) {
      return { code: 'INVALID_SORT', message: '排序必须包含所有玩家' };
    }

    room.status = 'verifying';
    return cloneRoom(room);
  }

  playAgain(roomId: string, userId: string): Room | GameActionError {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }
    if (room.status !== 'verifying') {
      return { code: 'INVALID_STATUS', message: '当前无法再来一局' };
    }
    if (!findUserInRoom(room, userId)) {
      return { code: 'ROOM_NOT_FOUND', message: '你不在该房间中' };
    }

    resetRoomForNextRound(room);
    return cloneRoom(room);
  }
}
