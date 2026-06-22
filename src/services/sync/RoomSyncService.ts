import {
  CreateRoomInput,
  CreateRoomResult,
  GameDifficulty,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  User,
} from '../../types/room';

export type RoomListener = (room: Room | null) => void;

export type GameActionErrorCode =
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_STATUS'
  | 'ROOM_NOT_FOUND'
  | 'INVALID_SORT'
  | 'TOO_MANY_FOR_HARD';

export interface GameActionError {
  code: GameActionErrorCode;
  message: string;
}

export type StartGameError = GameActionError;
export type StartGameErrorCode = GameActionErrorCode;

export interface RoomSyncService {
  createRoom(input: CreateRoomInput): Promise<CreateRoomResult>;
  joinRoom(
    input: JoinRoomInput,
  ): Promise<JoinRoomResult | JoinRoomError>;
  leaveRoom(roomId: string, userId: string): Promise<boolean>;
  getRoom(roomId: string): Room | null;
  fetchRoom(roomId: string): Promise<Room | null>;
  subscribe(roomId: string, listener: RoomListener): () => void;
  startGame(
    roomId: string,
    userId: string,
    difficulty?: GameDifficulty,
  ): Promise<Room | GameActionError>;
  updateSortOrder(
    roomId: string,
    userId: string,
    order: string[],
  ): Promise<Room | GameActionError>;
  submitSort(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError>;
  playAgain(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError>;
  addMockGuests(roomId: string, count: number): Promise<Room | null>;
}
