import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  User,
} from '../../types/room';

export type RoomListener = (room: Room | null) => void;

export interface RoomSyncService {
  createRoom(input: CreateRoomInput): CreateRoomResult;
  joinRoom(input: JoinRoomInput): JoinRoomResult | JoinRoomError;
  leaveRoom(roomId: string, userId: string): boolean;
  getRoom(roomId: string): Room | null;
  subscribe(roomId: string, listener: RoomListener): () => void;

  /** M1 调试用：批量添加模拟 Guest */
  addMockGuests(roomId: string, count: number): Room | null;
}
