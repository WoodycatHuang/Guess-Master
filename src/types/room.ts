export type UserRole = 'Host' | 'Guest' | 'Spectator';

export type RoomStatus = 'waiting' | 'gaming' | 'verifying';

export interface User {
  id: string;
  name: string;
  avatarId: number;
  role: UserRole;
  cardNumber: number | null;
  positionIndex: number | null;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  status: RoomStatus;
  topic: string;
  hostId: string;
  players: User[];
  spectators: User[];
  /** Host 提交的排序（userId 数组），gaming 阶段由 positionIndex 或拖拽维护 */
  sortOrder: string[];
}

export interface CreateRoomInput {
  name: string;
  avatarId: number;
}

export interface JoinRoomInput {
  roomId: string;
  name: string;
  avatarId: number;
}

export type JoinAs = 'player' | 'spectator';

export interface CreateRoomResult {
  room: Room;
  self: User;
}

export interface JoinRoomResult {
  room: Room;
  self: User;
  as: JoinAs;
  message?: string;
}

export type JoinRoomErrorCode = 'ROOM_NOT_FOUND' | 'ROOM_CLOSED';

export interface JoinRoomError {
  code: JoinRoomErrorCode;
  message: string;
}
