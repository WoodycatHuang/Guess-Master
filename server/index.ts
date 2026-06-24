/**
 * 局域网房间同步服务 — 多台手机共用同一房间状态
 *
 * 启动: npm run sync-server
 * 默认: http://0.0.0.0:8787
 */
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomEngine } from '../src/services/sync/roomEngine';
import { normalizeRoomId } from '../src/services/sync/roomKeys';
import { Room } from '../src/types/room';
import { GameActionError } from '../src/services/sync/RoomSyncService';
import { JoinRoomError } from '../src/types/room';
import { TOPIC_POOL } from '../src/constants/topics';

const PORT = Number(process.env.SYNC_PORT ?? 8787);
const engine = new RoomEngine(new Map<string, Room>());
const watchers = new Map<string, Set<WebSocket>>();

function isError(
  value: unknown,
): value is GameActionError | JoinRoomError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

function broadcast(roomId: string, room: Room | null): void {
  const id = normalizeRoomId(roomId);
  const payload = JSON.stringify(
    room ? { type: 'update', room } : { type: 'deleted' },
  );
  watchers.get(id)?.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function afterMutation(roomId: string, outcome: 'updated' | 'deleted' | false) {
  const id = normalizeRoomId(roomId);
  if (outcome === 'deleted') {
    broadcast(id, null);
    return;
  }
  if (outcome === 'updated') {
    const room = engine.getRoom(id);
    if (room) broadcast(id, room);
  }
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  data: unknown,
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
    sendJson(res, 204, null);
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'guess-master-sync' });
    return;
  }

  try {
    if (req.method === 'POST' && url.pathname === '/rooms') {
      const body = (await readBody(req)) as { name: string; avatarId: number };
      const result = engine.createRoom(body);
      broadcast(result.room.roomId, result.room);
      sendJson(res, 200, result);
      return;
    }

    const joinMatch = url.pathname.match(/^\/rooms\/([^/]+)\/join$/);
    if (req.method === 'POST' && joinMatch) {
      const roomId = normalizeRoomId(decodeURIComponent(joinMatch[1]));
      const body = (await readBody(req)) as {
        name: string;
        avatarId: number;
        userId?: string;
      };
      const result = engine.joinRoom({ roomId, ...body });
      if ('code' in result) {
        sendJson(res, 404, result);
        return;
      }
      broadcast(roomId, result.room);
      sendJson(res, 200, result);
      return;
    }

    const leaveMatch = url.pathname.match(/^\/rooms\/([^/]+)\/leave$/);
    if (req.method === 'POST' && leaveMatch) {
      const roomId = normalizeRoomId(decodeURIComponent(leaveMatch[1]));
      const body = (await readBody(req)) as { userId: string };
      const outcome = engine.leaveRoom(roomId, body.userId);
      afterMutation(roomId, outcome);
      sendJson(res, 200, { ok: outcome !== false });
      return;
    }

    const getMatch = url.pathname.match(/^\/rooms\/([^/]+)$/);
    if (req.method === 'GET' && getMatch) {
      const roomId = normalizeRoomId(decodeURIComponent(getMatch[1]));
      const room = engine.getRoom(roomId);
      if (!room) {
        sendJson(res, 404, { code: 'ROOM_NOT_FOUND', message: '房间不存在' });
        return;
      }
      sendJson(res, 200, room);
      return;
    }

    const actionHandlers: Record<
      string,
      (roomId: string, body: Record<string, unknown>) => unknown
    > = {
      'mock-guests': (roomId, body) =>
        engine.addMockGuests(roomId, Number(body.count ?? 1)),
      start: (roomId, body) =>
        engine.startGame(
          roomId,
          String(body.userId),
          (body.difficulty as import('../src/types/room').GameDifficulty) ?? 'easy',
        ),
      sort: (roomId, body) =>
        engine.updateSortOrder(
          roomId,
          String(body.userId),
          body.order as string[],
        ),
      submit: (roomId, body) =>
        engine.submitSort(roomId, String(body.userId)),
      'play-again': (roomId, body) =>
        engine.playAgain(roomId, String(body.userId)),
    };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      const match = url.pathname.match(
        new RegExp(`^/rooms/([^/]+)/${action}$`),
      );
      if (req.method === 'POST' && match) {
        const roomId = normalizeRoomId(decodeURIComponent(match[1]));
        const body = (await readBody(req)) as Record<string, unknown>;
        const result = handler(roomId, body);
        if (result && isError(result)) {
          sendJson(res, 400, result);
          return;
        }
        if (result) {
          broadcast(roomId, result as Room);
        }
        sendJson(res, 200, result);
        return;
      }
    }

    sendJson(res, 404, { message: 'Not found' });
  } catch (e) {
    sendJson(res, 500, {
      message: e instanceof Error ? e.message : 'Server error',
    });
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const roomId = normalizeRoomId(url.searchParams.get('roomId') ?? '');
  if (!roomId) {
    ws.close();
    return;
  }

  if (!watchers.has(roomId)) {
    watchers.set(roomId, new Set());
  }
  watchers.get(roomId)!.add(ws);

  const snapshot = engine.getRoom(roomId);
  if (snapshot) {
    ws.send(JSON.stringify({ type: 'update', room: snapshot }));
  }

  ws.on('close', () => {
    watchers.get(roomId)?.delete(ws);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Guess Master sync server: http://0.0.0.0:${PORT}`);
  console.log(`Topic pool loaded: ${TOPIC_POOL.length} topics`);
  console.log('Set EXPO_PUBLIC_SYNC_URL to your LAN IP, e.g.:');
  console.log(`  EXPO_PUBLIC_SYNC_URL=http://192.168.x.x:${PORT}`);
});
