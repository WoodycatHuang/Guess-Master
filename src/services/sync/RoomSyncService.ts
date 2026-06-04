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

export type StartGameErrorCode =
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_STATUS'
  | 'ROOM_NOT_FOUND';

export interface StartGameError {
  code: StartGameErrorCode;
  message: string;
}

export interface RoomSyncService {
  createRoom(input: CreateRoomInput): CreateRoomResult;
  joinRoom(input: JoinRoomInput): JoinRoomResult | JoinRoomError;
  leaveRoom(roomId: string, userId: string): boolean;
  getRoom(roomId: string): Room | null;
  subscribe(roomId: string, listener: RoomListener): () => void;
  startGame(roomId: string, userId: string): Room | StartGameError;

  /** 测试用：批量添加模拟 Guest */
  addMockGuests(roomId: string, count: number): Room | null;
}
