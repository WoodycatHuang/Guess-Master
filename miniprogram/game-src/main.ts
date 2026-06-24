import { getScreen, initScreen } from './canvas/screen';
import { readLaunchQuery, roomIdFromQuery } from './lib/launch';
import {
  initPaintLoop,
  pulsePaint,
  requestPaint,
  stopPaintLoop,
} from './lib/renderScheduler';
import { getGmRuntime, stopRenderLoop, unbindTouchHandlers } from './lib/runtime';
import { roomSync } from './lib/sync';
import {
  isGameDragging,
  onGameTouchEnd,
  onGameTouchMove,
  onGameTouchStart,
  renderGame,
  resetGameScene,
} from './scenes/game';
import { onLobbyTouch, renderLobby } from './scenes/lobby';
import {
  isResultAnimating,
  onResultTouch,
  renderResult,
  resetResultScene,
} from './scenes/result';
import { getRoomShareConfig, getRoomState, onRoomTouch, renderRoom } from './scenes/room';
import { bootLobby, getScene } from './scenes/router';

const LOG = '[GuessMaster]';

let prevRoomStatus: string | null = null;
let lifecycleBound = false;

function getRoomStatus(): string | null {
  if (getScene() !== 'room') return null;
  const roomId = getRoomState().roomId;
  if (!roomId) return null;
  return roomSync.getRoom(roomId)?.status ?? null;
}

function prepareCanvas(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.globalAlpha = 1;
}

function render(): void {
  const { ctx, pixelRatio } = getScreen();
  prepareCanvas(ctx, pixelRatio);

  if (getScene() === 'lobby') {
    renderLobby();
    return;
  }

  const status = getRoomStatus();
  if (status === 'waiting' && prevRoomStatus && prevRoomStatus !== 'waiting') {
    resetGameScene();
    resetResultScene();
  }
  if (getScene() === 'room') {
    prevRoomStatus = status;
  }

  if (status === 'gaming') {
    renderGame();
  } else if (status === 'verifying') {
    renderResult();
  } else {
    renderRoom();
  }

  if (isGameDragging()) {
    pulsePaint(32);
  } else if (isResultAnimating()) {
    pulsePaint(32);
  }
}

function bindTouch(): void {
  unbindTouchHandlers();

  const onStart = (e: WechatMinigame.TouchEvent) => {
    const t = e.touches?.[0];
    if (!t) return;
    if (getScene() === 'room' && getRoomStatus() === 'gaming') {
      onGameTouchStart(t.clientX, t.clientY);
      requestPaint();
    }
  };

  const onMove = (e: WechatMinigame.TouchEvent) => {
    const t = e.touches?.[0];
    if (!t) return;
    if (getScene() === 'room' && getRoomStatus() === 'gaming') {
      onGameTouchMove(t.clientX, t.clientY);
      if (isGameDragging()) requestPaint();
    }
  };

  const onEnd = (e: WechatMinigame.TouchEvent) => {
    const t = e.changedTouches?.[0] ?? e.touches?.[0];
    if (!t) return;
    const x = t.clientX;
    const y = t.clientY;

    if (getScene() === 'lobby') {
      void onLobbyTouch(x, y);
      return;
    }

    const status = getRoomStatus();
    if (status === 'gaming') {
      void onGameTouchEnd(x, y);
    } else if (status === 'verifying') {
      void onResultTouch(x, y);
    } else {
      void onRoomTouch(x, y);
    }
    requestPaint();
  };

  wx.onTouchStart(onStart);
  wx.onTouchMove(onMove);
  wx.onTouchEnd(onEnd);
  getGmRuntime().touchHandlers = { start: onStart, move: onMove, end: onEnd };
}

function bindShare(): void {
  const rt = getGmRuntime();
  if (rt.shareBound) return;

  try {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage'] });
    wx.onShareAppMessage(() => {
      if (getScene() === 'room') {
        return getRoomShareConfig();
      }
      return {
        title: '来一起玩脑波专家！',
        query: '',
        imageUrl: 'assets/share-500x400.png',
      };
    });
    rt.shareBound = true;
  } catch (err) {
    console.warn(`${LOG} share skipped`, err);
  }
}

function bindLifecycle(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;

  wx.onHide(() => {
    stopPaintLoop();
  });

  wx.onShow(() => {
    requestPaint();
  });

  if (typeof wx.onMemoryWarning === 'function') {
    wx.onMemoryWarning((res) => {
      console.warn(`${LOG} memory warning level=${res?.level ?? '?'}`);
      stopPaintLoop();
      setTimeout(() => requestPaint(), 1000);
    });
  }
}

function startGame(): void {
  stopRenderLoop();
  stopPaintLoop();
  unbindTouchHandlers();

  const rt = getGmRuntime();
  rt.bootVersion += 1;
  const version = rt.bootVersion;

  console.log(`${LOG} boot v${version} (on-demand render)`);
  initScreen();
  initPaintLoop(render);
  bindTouch();
  bindShare();
  bindLifecycle();

  const launchQuery = readLaunchQuery();
  const prefilledRoomId = roomIdFromQuery(launchQuery);
  bootLobby(prefilledRoomId);

  requestPaint();
  console.log(`${LOG} ready v${version}`);
}

startGame();
