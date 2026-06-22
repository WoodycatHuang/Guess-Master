import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { roomSync } from '../services/sync';
import { normalizeRoomId } from '../services/sync/roomKeys';
import { GameActionError } from '../services/sync/RoomSyncService';
import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  User,
} from '../types/room';

function findSelfInRoom(room: Room, userId: string): User | null {
  return (
    room.players.find((u) => u.id === userId) ??
    room.spectators.find((u) => u.id === userId) ??
    null
  );
}

export function useRoomSync(activeRoomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [self, setSelf] = useState<User | null>(null);

  const normalizedRoomId = activeRoomId
    ? normalizeRoomId(activeRoomId)
    : null;

  useLayoutEffect(() => {
    if (!normalizedRoomId) {
      setRoom(null);
      return;
    }

    setRoom(roomSync.getRoom(normalizedRoomId));

    return roomSync.subscribe(normalizedRoomId, (snapshot) => {
      if (snapshot === null) {
        setRoom(null);
        return;
      }
      setRoom(snapshot);
    });
  }, [normalizedRoomId]);

  useEffect(() => {
    if (!room || !self) return;
    const updated = findSelfInRoom(room, self.id);
    if (
      updated &&
      (updated.role !== self.role ||
        updated.cardNumber !== self.cardNumber ||
        updated.positionIndex !== self.positionIndex)
    ) {
      setSelf({ ...updated });
    }
  }, [room, self?.id]);

  const createRoom = useCallback(
    async (input: CreateRoomInput): Promise<CreateRoomResult> => {
      const result = await roomSync.createRoom(input);
      setSelf(result.self);
      setRoom(result.room);
      return result;
    },
    [],
  );

  const joinRoom = useCallback(
    async (
      input: JoinRoomInput,
    ): Promise<JoinRoomResult | JoinRoomError> => {
      const result = await roomSync.joinRoom({
        ...input,
        roomId: normalizeRoomId(input.roomId),
      });
      if ('code' in result) return result;
      setSelf(result.self);
      setRoom(result.room);
      return result;
    },
    [],
  );

  const leaveRoom = useCallback(async () => {
    if (!normalizedRoomId || !self) return false;
    const ok = await roomSync.leaveRoom(normalizedRoomId, self.id);
    if (ok) {
      setSelf(null);
    }
    return ok;
  }, [normalizedRoomId, self]);

  const startGame = useCallback(async (
    difficulty: import('../types/room').GameDifficulty = 'easy',
  ): Promise<Room | GameActionError | null> => {
    if (!normalizedRoomId || !self) return null;
    const result = await roomSync.startGame(normalizedRoomId, self.id, difficulty);
    if (!('code' in result)) setRoom(result);
    return result;
  }, [normalizedRoomId, self]);

  const updateSortOrder = useCallback(
    async (order: string[]): Promise<GameActionError | null> => {
      if (!normalizedRoomId || !self) {
        return { code: 'ROOM_NOT_FOUND', message: '房间状态异常' };
      }
      const result = await roomSync.updateSortOrder(
        normalizedRoomId,
        self.id,
        order,
      );
      if ('code' in result) return result;
      setRoom(result);
      return null;
    },
    [normalizedRoomId, self],
  );

  const submitSort = useCallback(async (): Promise<
    Room | GameActionError | null
  > => {
    if (!normalizedRoomId || !self) return null;
    const result = await roomSync.submitSort(normalizedRoomId, self.id);
    if (!('code' in result)) setRoom(result);
    return result;
  }, [normalizedRoomId, self]);

  const playAgain = useCallback(async (): Promise<
    Room | GameActionError | null
  > => {
    if (!normalizedRoomId || !self) return null;
    const result = await roomSync.playAgain(normalizedRoomId, self.id);
    if (!('code' in result)) setRoom(result);
    return result;
  }, [normalizedRoomId, self]);

  const addMockGuests = useCallback(
    async (count: number, roomIdOverride?: string) => {
      const id = roomIdOverride
        ? normalizeRoomId(roomIdOverride)
        : normalizedRoomId;
      if (!id) return null;
      const result = await roomSync.addMockGuests(id, count);
      if (result) {
        setRoom(result);
      }
      return result;
    },
    [normalizedRoomId],
  );

  return {
    room,
    self,
    setSelf,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updateSortOrder,
    submitSort,
    playAgain,
    addMockGuests,
  };
}
