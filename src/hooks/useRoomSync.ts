import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { roomSync } from '../services/sync';
import { normalizeRoomId } from '../services/sync/roomKeys';
import { StartGameError } from '../services/sync/RoomSyncService';
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

  const createRoom = useCallback((input: CreateRoomInput): CreateRoomResult => {
    const result = roomSync.createRoom(input);
    setSelf(result.self);
    setRoom(result.room);
    return result;
  }, []);

  const joinRoom = useCallback(
    (input: JoinRoomInput): JoinRoomResult | JoinRoomError => {
      const result = roomSync.joinRoom({
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

  const leaveRoom = useCallback(() => {
    if (!normalizedRoomId || !self) return false;
    const ok = roomSync.leaveRoom(normalizedRoomId, self.id);
    if (ok) {
      setSelf(null);
    }
    return ok;
  }, [normalizedRoomId, self]);

  const startGame = useCallback((): Room | StartGameError | null => {
    if (!normalizedRoomId || !self) return null;
    return roomSync.startGame(normalizedRoomId, self.id);
  }, [normalizedRoomId, self]);

  const addMockGuests = useCallback(
    (count: number, roomIdOverride?: string) => {
      const id = roomIdOverride
        ? normalizeRoomId(roomIdOverride)
        : normalizedRoomId;
      if (!id) return null;
      const result = roomSync.addMockGuests(id, count);
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
    addMockGuests,
  };
}
