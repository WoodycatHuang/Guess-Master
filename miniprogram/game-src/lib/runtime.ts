import type { RoomSyncService } from '@shared/services/sync/RoomSyncService';
import type { GameScreen } from '../canvas/screen';

type TouchHandlers = {
  start: (e: WechatMinigame.TouchEvent) => void;
  move: (e: WechatMinigame.TouchEvent) => void;
  end: (e: WechatMinigame.TouchEvent) => void;
};

export type GmRuntime = {
  framePending?: boolean;
  rafId?: number;
  touchHandlers?: TouchHandlers;
  shareBound?: boolean;
  roomSync?: RoomSyncService;
  screen?: GameScreen;
  bootVersion: number;
};

type GmHost = typeof globalThis & { __gm?: GmRuntime };

function host(): GmHost {
  if (typeof GameGlobal !== 'undefined') return GameGlobal as GmHost;
  return globalThis as GmHost;
}

export function getGmRuntime(): GmRuntime {
  const g = host();
  if (!g.__gm) {
    g.__gm = { bootVersion: 0 };
  }
  return g.__gm;
}

export function stopRenderLoop(): void {
  const rt = getGmRuntime();
  rt.framePending = false;
  if (rt.rafId != null) {
    cancelAnimationFrame(rt.rafId);
    rt.rafId = undefined;
  }
}

export function unbindTouchHandlers(): void {
  const rt = getGmRuntime();
  const handlers = rt.touchHandlers;
  if (!handlers) return;
  wx.offTouchStart(handlers.start);
  wx.offTouchMove(handlers.move);
  wx.offTouchEnd(handlers.end);
  rt.touchHandlers = undefined;
}
