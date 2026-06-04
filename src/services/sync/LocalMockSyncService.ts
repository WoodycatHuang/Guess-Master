import { MAX_PLAYERS } from '../../constants/game';
import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  User,
} from '../../types/room';
import {
  cloneRoom,
  createUser,
  generateRoomId,
  guestsByJoinOrder,
  isGameInProgress,
  isRoomFull,
  promoteNextHost,
} from './roomUtils';
import { RoomListener, RoomSyncService } from './RoomSyncService';

class LocalMockSyncService implements RoomSyncService {
  private rooms = new Map<string, Room>();
  private listeners = new Map<string, Set<RoomListener>>();

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
    this.emit(roomId);
    return { room: cloneRoom(room), self: { ...host } };
  }

  joinRoom(input: JoinRoomInput): JoinRoomResult | JoinRoomError {
    const room = this.rooms.get(input.roomId.toUpperCase());
    if (!room) {
      return { code: 'ROOM_NOT_FOUND', message: '房间不存在' };
    }

    const asSpectator =
      isGameInProgress(room) || isRoomFull(room);

    const user = createUser(
      input.name,
      input.avatarId,
      asSpectator ? 'Spectator' : 'Guest',
    );

    if (asSpectator) {
      room.spectators.push(user);
      this.emit(room.roomId);

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
    this.emit(room.roomId);

    return {
      room: cloneRoom(room),
      self: { ...user },
      as: 'player',
    };
  }

  leaveRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIdx = room.players.findIndex((u) => u.id === userId);
    if (playerIdx >= 0) {
      const leaving = room.players[playerIdx];
      room.players.splice(playerIdx, 1);

      if (leaving.id === room.hostId) {
        if (guestsByJoinOrder(room).length > 0) {
          promoteNextHost(room);
        } else {
          this.rooms.delete(roomId);
          this.emit(roomId, null);
          return true;
        }
      }
    } else {
      const specIdx = room.spectators.findIndex((u) => u.id === userId);
      if (specIdx >= 0) {
        room.spectators.splice(specIdx, 1);
      } else {
        return false;
      }
    }

    this.emit(roomId);
    return true;
  }

  getRoom(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    return room ? cloneRoom(room) : null;
  }

  subscribe(roomId: string, listener: RoomListener): () => void {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(listener);

    listener(this.getRoom(roomId));

    return () => {
      this.listeners.get(roomId)?.delete(listener);
    };
  }

  addMockGuests(roomId: string, count: number): Room | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'waiting') return null;

    const slots = MAX_PLAYERS - room.players.length;
    const toAdd = Math.min(count, slots);
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

    this.emit(roomId);
    return cloneRoom(room);
  }

  /** M1 调试用：手动切换房间状态，供验证旁观规则 */
  _debugSetStatus(roomId: string, status: Room['status']): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.status = status;
    this.emit(roomId);
    return cloneRoom(room);
  }

  private emit(roomId: string, room: Room | null = null): void {
    const snapshot =
      room === null ? null : this.getRoom(roomId);
    this.listeners.get(roomId)?.forEach((fn) => fn(snapshot));
  }
}

export const roomSync = new LocalMockSyncService();
