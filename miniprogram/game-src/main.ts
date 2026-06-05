import { initScreen, getScreen } from './canvas/screen';
import { onLobbyTouch, renderLobby } from './scenes/lobby';
import { getRoomShareConfig, onRoomTouch, renderRoom } from './scenes/room';
import { boot, getScene, goLobby, setLaunchQuery } from './scenes/router';

let rafId = 0;

function render(): void {
  if (getScene() === 'lobby') {
    renderLobby();
  } else {
    renderRoom();
  }
}

function loop(): void {
  render();
  rafId = requestAnimationFrame(loop);
}

function bindTouch(): void {
  wx.onTouchEnd((e) => {
    const t = e.changedTouches?.[0] ?? e.touches[0];
    if (!t) return;
    const x = t.clientX;
    const y = t.clientY;
    if (getScene() === 'lobby') {
      void onLobbyTouch(x, y);
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
