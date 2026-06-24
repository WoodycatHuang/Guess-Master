import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
} from '../../types/room';
import { normalizeRoomId } from './roomKeys';
import { getSyncBaseUrl, getSyncWsUrl } from './syncConfig';
import { GameActionError, RoomListener, RoomSyncService } from './RoomSyncService';

async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(`服务器无响应 (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`服务器响应异常 (${res.status})`);
  }
}

const FETCH_TIMEOUT_MS = 12_000;

function connectionHint(baseUrl: string): string {
  if (/localhost|127\.0\.0\.1/.test(baseUrl)) {
    return `无法连接 ${baseUrl}。请另开终端运行：npm run sync-server`;
  }
  return `无法连接 ${baseUrl}。请检查网络，或暂时改用本地联机（见 web/README.md）`;
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  hintBase?: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(
        `连接超时（${FETCH_TIMEOUT_MS / 1000}s），${connectionHint(hintBase ?? url)}`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function postJson<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${baseUrl}${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      baseUrl,
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes('连接超时')) throw e;
    throw new Error(connectionHint(baseUrl));
  }
  const data = await readResponseJson<T & { message?: string }>(res);
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : `请求失败 (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function pingSyncServer(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`);
    const data = await readResponseJson<{ ok?: boolean }>(res);
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

class RemoteSyncService implements RoomSyncService {
  private readonly baseUrl: string;
  private readonly roomCache = new Map<string, Room | null>();
  private readonly listeners = new Map<string, Set<RoomListener>>();
  private readonly sockets = new Map<string, WebSocket>();
  private readonly pollTimers = new Map<string, ReturnType<typeof setInterval>>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    const result = await postJson<CreateRoomResult>(this.baseUrl, '/rooms', input);
    if (result?.room?.roomId) {
      this.notify(normalizeRoomId(result.room.roomId), result.room);
    }
    return result;
  }

  async joinRoom(
    input: JoinRoomInput,
  ): Promise<JoinRoomResult | JoinRoomError> {
    const id = normalizeRoomId(input.roomId);
    const result = await postJson<JoinRoomResult | JoinRoomError>(
      this.baseUrl,
      `/rooms/${id}/join`,
      {
        name: input.name,
        avatarId: input.avatarId,
        userId: input.userId,
      },
    );
    if (!('code' in result) && result.room?.roomId) {
      this.notify(id, result.room);
    }
    return result;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const id = normalizeRoomId(roomId);
    try {
      const res = await postJson<{ ok: boolean }>(
        this.baseUrl,
        `/rooms/${id}/leave`,
        { userId },
      );
      return Boolean(res.ok);
    } catch {
      return false;
    }
  }

  getRoom(roomId: string): Room | null {
    return this.roomCache.get(normalizeRoomId(roomId)) ?? null;
  }

  async fetchRoom(roomId: string): Promise<Room | null> {
    const id = normalizeRoomId(roomId);
    await this.fetchAndNotify(id);
    return this.getRoom(id);
  }

  subscribe(roomId: string, listener: RoomListener): () => void {
    const id = normalizeRoomId(roomId);
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(listener);

    void this.fetchAndNotify(id);
    this.ensureSocket(id);

    return () => {
      this.listeners.get(id)?.delete(listener);
      if (this.listeners.get(id)?.size === 0) {
        this.listeners.delete(id);
        this.closeSocket(id);
      }
    };
  }

  async addMockGuests(roomId: string, count: number): Promise<Room | null> {
    const id = normalizeRoomId(roomId);
    try {
      return await postJson<Room | null>(
        this.baseUrl,
        `/rooms/${id}/mock-guests`,
        { count },
      );
    } catch {
      return null;
    }
  }

  async startGame(
    roomId: string,
    userId: string,
    difficulty: import('../../types/room').GameDifficulty = 'easy',
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    return postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/start`,
      { userId, difficulty },
    );
  }

  async updateSortOrder(
    roomId: string,
    userId: string,
    order: string[],
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    return postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/sort`,
      { userId, order },
    );
  }

  async submitSort(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    return postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/submit`,
      { userId },
    );
  }

  async playAgain(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    return postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/play-again`,
      { userId },
    );
  }

  private notify(id: string, room: Room | null): void {
    this.roomCache.set(id, room);
    this.listeners.get(id)?.forEach((fn) => fn(room));
  }

  private async fetchAndNotify(id: string): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/rooms/${id}`);
      if (res.status === 404) {
        this.notify(id, null);
        return;
      }
      const room = await readResponseJson<Room>(res);
      this.notify(id, room);
    } catch {
      // 网络异常时保留缓存
    }
  }

  private ensureSocket(id: string): void {
    if (this.sockets.has(id)) return;

    const wsUrl = `${getSyncWsUrl(this.baseUrl)}?roomId=${encodeURIComponent(id)}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type: 'update' | 'deleted';
          room?: Room;
        };
        if (payload.type === 'deleted') {
          this.notify(id, null);
        } else if (payload.room) {
          this.notify(id, payload.room);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      this.sockets.delete(id);
      if (this.listeners.has(id)) {
        this.startPolling(id);
      }
    };

    ws.onopen = () => {
      this.stopPolling(id);
    };

    ws.onerror = () => {
      ws.close();
    };

    this.sockets.set(id, ws);
  }

  private startPolling(id: string): void {
    if (this.pollTimers.has(id)) return;
    const timer = setInterval(() => {
      void this.fetchAndNotify(id);
    }, 2000);
    this.pollTimers.set(id, timer);
  }

  private stopPolling(id: string): void {
    const timer = this.pollTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.pollTimers.delete(id);
    }
  }

  private closeSocket(id: string): void {
    this.stopPolling(id);
    const ws = this.sockets.get(id);
    if (ws) {
      ws.close();
      this.sockets.delete(id);
    }
  }
}

export function createRemoteSyncService(): RemoteSyncService | null {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) return null;
  return new RemoteSyncService(baseUrl);
}
