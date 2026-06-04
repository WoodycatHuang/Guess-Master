import { useCallback, useEffect, useState } from 'react';
import { roomSync } from '../services/sync';
import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
  User,
} from '../types/room';

export function useRoomSync(activeRoomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [self, setSelf] = useState<User | null>(null);

  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      return;
    }
    return roomSync.subscribe(activeRoomId, setRoom);
  }, [activeRoomId]);

  const createRoom = useCallback((input: CreateRoomInput): CreateRoomResult => {
    const result = roomSync.createRoom(input);
    setSelf(result.self);
    return result;
  }, []);

  const joinRoom = useCallback(
    (input: JoinRoomInput): JoinRoomResult | JoinRoomError => {
      const result = roomSync.joinRoom({
        ...input,
        roomId: input.roomId.toUpperCase(),
      });
      if ('code' in result) return result;
      setSelf(result.self);
      return result;
    },
    [],
  );

  const leaveRoom = useCallback(() => {
    if (!activeRoomId || !self) return false;
    const ok = roomSync.leaveRoom(activeRoomId, self.id);
    if (ok) {
      setSelf(null);
    }
    return ok;
  }, [activeRoomId, self]);

  const addMockGuests = useCallback(
    (count: number) => {
      if (!activeRoomId) return null;
      return roomSync.addMockGuests(activeRoomId, count);
    },
    [activeRoomId],
  );

  return {
    room,
    self,
    setSelf,
    createRoom,
    joinRoom,
    leaveRoom,
    addMockGuests,
  };
}
