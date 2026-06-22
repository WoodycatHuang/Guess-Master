import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  GameDifficulty,
  Room,
} from '../../types/room';
import { normalizeRoomId } from './roomKeys';
import { getListenersMap, getRoomsMap } from './roomStore';
import { RoomEngine } from './roomEngine';
import { GameActionError, RoomListener, RoomSyncService } from './RoomSyncService';

class LocalMockSyncService implements RoomSyncService {
  private readonly engine = new RoomEngine(getRoomsMap());

  private get listeners() {
    return getListenersMap();
  }

  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    const result = this.engine.createRoom(input);
    this.emitUpdate(result.room.roomId);
    return result;
  }

  async joinRoom(
    input: JoinRoomInput,
  ): Promise<JoinRoomResult | JoinRoomError> {
    const result = this.engine.joinRoom(input);
    if ('code' in result) return result;
    this.emitUpdate(result.room.roomId);
    return result;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const id = normalizeRoomId(roomId);
    const outcome = this.engine.leaveRoom(id, userId);
    if (outcome === 'deleted') {
      this.emitDeleted(id);
      return true;
    }
    if (outcome === 'updated') {
      this.emitUpdate(id);
      return true;
    }
    return false;
  }

  getRoom(roomId: string): Room | null {
    return this.engine.getRoom(roomId);
  }

  async fetchRoom(roomId: string): Promise<Room | null> {
    return this.getRoom(roomId);
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

  async addMockGuests(roomId: string, count: number): Promise<Room | null> {
    const id = normalizeRoomId(roomId);
    const result = this.engine.addMockGuests(id, count);
    if (result) this.emitUpdate(id);
    return result;
  }

  async startGame(
    roomId: string,
    userId: string,
    difficulty: GameDifficulty = 'easy',
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = this.engine.startGame(id, userId, difficulty);
    if (!('code' in result)) this.emitUpdate(id);
    return result;
  }

  async updateSortOrder(
    roomId: string,
    userId: string,
    order: string[],
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = this.engine.updateSortOrder(id, userId, order);
    if (!('code' in result)) this.emitUpdate(id);
    return result;
  }

  async submitSort(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = this.engine.submitSort(id, userId);
    if (!('code' in result)) this.emitUpdate(id);
    return result;
  }

  async playAgain(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = this.engine.playAgain(id, userId);
    if (!('code' in result)) this.emitUpdate(id);
    return result;
  }

  private emitUpdate(roomId: string): void {
    const id = normalizeRoomId(roomId);
    const snapshot = this.getRoom(id);
    if (!snapshot) return;
    this.listeners.get(id)?.forEach((fn) => fn(snapshot));
  }

  private emitDeleted(roomId: string): void {
    const id = normalizeRoomId(roomId);
    this.listeners.get(id)?.forEach((fn) => fn(null));
  }
}

export const localMockSync = new LocalMockSyncService();
