import { initScreen } from './canvas/screen';
import { roomSync } from './lib/sync';
import { onGameTouchEnd, onGameTouchMove, onGameTouchStart, renderGame, resetGameScene } from './scenes/game';
import { onLobbyTouch, renderLobby } from './scenes/lobby';
import { onResultTouch, renderResult, resetResultScene } from './scenes/result';
import { getRoomShareConfig, getRoomState, onRoomTouch, renderRoom } from './scenes/room';
import { boot, getScene, goLobby, setLaunchQuery } from './scenes/router';

let rafId = 0;
let prevRoomStatus: string | null = null;

function getRoomStatus(): string | null {
  if (getScene() !== 'room') return null;
  const roomId = getRoomState().roomId;
  if (!roomId) return null;
  return roomSync.getRoom(roomId)?.status ?? null;
}

function render(): void {
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
}

function loop(): void {
  render();
  rafId = requestAnimationFrame(loop);
}

function bindTouch(): void {
  wx.onTouchStart((e) => {
    const t = e.touches?.[0];
    if (!t) return;
    if (getScene() === 'room' && getRoomStatus() === 'gaming') {
      onGameTouchStart(t.clientX, t.clientY);
    }
  });

  wx.onTouchMove((e) => {
    const t = e.touches?.[0];
    if (!t) return;
    if (getScene() === 'room' && getRoomStatus() === 'gaming') {
      onGameTouchMove(t.clientX, t.clientY);
    }
  });

  wx.onTouchEnd((e) => {
    const t = e.changedTouches?.[0] ?? e.touches[0];
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
  });
}

function bindShare(): void {
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
}

export function startGame(): void {
  initScreen();
  boot();
  bindTouch();
  bindShare();

  wx.onShow((opts) => {
    setLaunchQuery(opts?.query as Record<string, string> | undefined);
    if (getScene() === 'lobby') {
      goLobby();
    }
  });

  loop();
}

startGame();
