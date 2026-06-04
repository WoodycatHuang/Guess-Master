import { MAX_PLAYERS } from '../../constants/game';
import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
} from '../../types/room';
import { pickRandomTopic } from '../../constants/topics';
import { normalizeRoomId } from './roomKeys';
import { getListenersMap, getRoomsMap } from './roomStore';
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
import {
  GameActionError,
  RoomListener,
  RoomSyncService,
} from './RoomSyncService';

class LocalMockSyncService implements RoomSyncService {
  private get rooms() {
    return getRoomsMap();
  }

  private get listeners() {
    return getListenersMap();
  }

  createRoom(input: CreateRoomInput): CreateRoomResult {
    const roomId = generateRoomId();
    const host = createUser(input.name, input.avatarId, 'Host');

    const room: Room = {
      roomId,
      status: 'waiting',
      topic: '',
      hostId: host.id,
      players: [host],
      spectators: [],
      sortOrder: [],
    };

    this.rooms.set(roomId, room);
    this.emitUpdate(roomId);
    return { room: cloneRoom(room), self: { ...host } };
  }

  joinRoom(input: JoinRoomInput): JoinRoomResult | JoinRoomError {
    const id = normalizeRoomId(input.roomId);
    const room = this.rooms.get(id);
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }

    const asSpectator = isGameInProgress(room) || isRoomFull(room);

    const user = createUser(
      input.name,
      input.avatarId,
      asSpectator ? 'Spectator' : 'Guest',
    );

    if (asSpectator) {
      room.spectators.push(user);
      this.emitUpdate(room.roomId);

      const message = isGameInProgress(room)
        ? '游戏进行中'
        : '房间已满员';

      return {
        room: cloneRoom(room),
        self: { ...user },
        as: 'spectator',
        message,
      };
    }

    room.players.push(user);
    this.emitUpdate(room.roomId);

    return {
      room: cloneRoom(room),
      self: { ...user },
      as: 'player',
    };
  }

  leaveRoom(roomId: string, userId: string): boolean {
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
          this.emitUpdate(id);
          return true;
        }
        this.rooms.delete(id);
        this.emitDeleted(id);
        return true;
      }
    } else {
      const specIdx = room.spectators.findIndex((u) => u.id === userId);
      if (specIdx >= 0) {
        room.spectators.splice(specIdx, 1);
      } else {
        return false;
      }
    }

    this.emitUpdate(id);
    return true;
  }

  getRoom(roomId: string): Room | null {
    const room = this.rooms.get(normalizeRoomId(roomId));
    return room ? cloneRoom(room) : null;
  }

  subscribe(roomId: string, listener: RoomListener): () => void {
    const id = normalizeRoomId(roomId);
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(listener);

    listener(this.getRoom(id));

    return () => {
      this.listeners.get(id)?.delete(listener);
    };
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
          ((room.players.length + i) % 28) + 1,
          'Guest',
          base + i + 1,
        ),
      );
    }

    this.emitUpdate(id);
    return cloneRoom(room);
  }

  startGame(roomId: string, userId: string): Room | GameActionError {
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

    room.topic = pickRandomTopic();
    dealCardsToPlayers(room.players);
    room.sortOrder = defaultSortOrder(room);
    applySortOrder(room);
    room.status = 'gaming';
    this.emitUpdate(id);
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
    this.emitUpdate(id);
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
    this.emitUpdate(id);
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
    this.emitUpdate(id);
    return cloneRoom(room);
  }

  /** M1 调试用：手动切换房间状态，供验证旁观规则 */
  _debugSetStatus(roomId: string, status: Room['status']): Room | null {
    const id = normalizeRoomId(roomId);
    const room = this.rooms.get(id);
    if (!room) return null;
    room.status = status;
    this.emitUpdate(id);
    return cloneRoom(room);
  }

  /** 房间数据更新 — 找不到房间时不广播 null，避免 UI 误判「已解散」 */
  private emitUpdate(roomId: string): void {
    const id = normalizeRoomId(roomId);
    const snapshot = this.getRoom(id);
    if (!snapshot) return;
    this.listeners.get(id)?.forEach((fn) => fn(snapshot));
  }

  /** 房间真正删除时广播 null */
  private emitDeleted(roomId: string): void {
    const id = normalizeRoomId(roomId);
    this.listeners.get(id)?.forEach((fn) => fn(null));
  }
}

export const roomSync = new LocalMockSyncService();
