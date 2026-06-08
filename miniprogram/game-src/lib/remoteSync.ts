import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import {
  CreateRoomInput,
  CreateRoomResult,
  JoinRoomError,
  JoinRoomInput,
  JoinRoomResult,
  Room,
} from '@shared/types/room';
import {
  GameActionError,
  RoomListener,
  RoomSyncService,
} from '@shared/services/sync/RoomSyncService';
import { getSyncWsUrl } from './syncConfig';

type WxRequestResult = {
  statusCode: number;
  data: unknown;
};

function readResponseJson<T>(res: WxRequestResult): T {
  const data = res.data;
  if (data === '' || data == null) {
    throw new Error(`服务器无响应 (${res.statusCode})`);
  }
  return data as T;
}

function request(
  url: string,
  method: 'GET' | 'POST',
  data?: unknown,
): Promise<WxRequestResult> {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      header: { 'Content-Type': 'application/json' },
      data,
      success: resolve,
      fail: () => {
        reject(
          new Error(
            `无法连接 ${url}\n请确认服务器已启动，且已配置合法域名或勾选「不校验合法域名」`,
          ),
        );
      },
    });
  });
}

async function postJson<T>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await request(`${baseUrl}${path}`, 'POST', body);
  return readResponseJson<T>(res);
}

class RemoteSyncService implements RoomSyncService {
  private readonly baseUrl: string;
  private readonly roomCache = new Map<string, Room | null>();
  private readonly listeners = new Map<string, Set<RoomListener>>();
  private readonly sockets = new Map<string, WechatMinigame.SocketTask>();
  private readonly pollTimers = new Map<string, number>();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    return postJson<CreateRoomResult>(this.baseUrl, '/rooms', input);
  }

  async joinRoom(
    input: JoinRoomInput,
  ): Promise<JoinRoomResult | JoinRoomError> {
    const id = normalizeRoomId(input.roomId);
    return postJson<JoinRoomResult | JoinRoomError>(
      this.baseUrl,
      `/rooms/${id}/join`,
      { name: input.name, avatarId: input.avatarId },
    );
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
      const result = await postJson<Room | null>(
        this.baseUrl,
        `/rooms/${id}/mock-guests`,
        { count },
      );
      if (result) this.notify(id, result);
      return result;
    } catch {
      return null;
    }
  }

  async startGame(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = await postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/start`,
      { userId },
    );
    if (!('code' in result)) this.notify(id, result);
    return result;
  }

  async updateSortOrder(
    roomId: string,
    userId: string,
    order: string[],
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = await postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/sort`,
      { userId, order },
    );
    if (!('code' in result)) this.notify(id, result);
    return result;
  }

  async submitSort(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = await postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/submit`,
      { userId },
    );
    if (!('code' in result)) this.notify(id, result);
    return result;
  }

  async playAgain(
    roomId: string,
    userId: string,
  ): Promise<Room | GameActionError> {
    const id = normalizeRoomId(roomId);
    const result = await postJson<Room | GameActionError>(
      this.baseUrl,
      `/rooms/${id}/play-again`,
      { userId },
    );
    if (!('code' in result)) this.notify(id, result);
    return result;
  }

  private notify(id: string, room: Room | null): void {
    this.roomCache.set(id, room);
    this.listeners.get(id)?.forEach((fn) => fn(room));
  }

  private async fetchAndNotify(id: string): Promise<void> {
    try {
      const res = await request(`${this.baseUrl}/rooms/${id}`, 'GET');
      if (res.statusCode === 404) {
        this.notify(id, null);
        return;
      }
      const room = readResponseJson<Room>(res);
      this.notify(id, room);
    } catch {
      // 保留缓存
    }
  }

  private ensureSocket(id: string): void {
    if (this.sockets.has(id)) return;

    const wsUrl = `${getSyncWsUrl(this.baseUrl)}?roomId=${encodeURIComponent(id)}`;
    const ws = wx.connectSocket({ url: wsUrl });

    ws.onMessage((event) => {
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
    });

    ws.onClose(() => {
      this.sockets.delete(id);
      if (this.listeners.has(id)) {
        this.startPolling(id);
      }
    });

    ws.onOpen(() => {
      this.stopPolling(id);
    });

    ws.onError(() => {
      ws.close({});
    });

    this.sockets.set(id, ws);
  }

  private startPolling(id: string): void {
    if (this.pollTimers.has(id)) return;
    const timer = setInterval(() => {
      void this.fetchAndNotify(id);
    }, 2000) as unknown as number;
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
      ws.close({});
      this.sockets.delete(id);
    }
    this.roomCache.delete(id);
  }
}

export function createRemoteSyncService(baseUrl: string): RemoteSyncService {
  return new RemoteSyncService(baseUrl);
}
