import { fonts, theme } from './theme';

export interface GameScreen {
  canvas: WechatMinigame.Canvas;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

let screen: GameScreen | null = null;
let logoImage: WechatMinigame.Image | null = null;
let logoReady = false;

export function getScreen(): GameScreen {
  if (!screen) throw new Error('Screen not initialized');
  return screen;
}

export function initScreen(): GameScreen {
  const info = wx.getSystemInfoSync();
  const canvas = wx.createCanvas();
  const pixelRatio = info.pixelRatio || 2;
  canvas.width = info.screenWidth * pixelRatio;
  canvas.height = info.screenHeight * pixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  screen = {
    canvas,
    ctx,
    width: info.screenWidth,
    height: info.screenHeight,
    pixelRatio,
  };

  loadLogo();
  return screen;
}

function loadLogo(): void {
  try {
    const img = wx.createImage();
    img.onload = () => {
      logoReady = true;
    };
    img.onerror = () => {
      logoReady = false;
    };
    img.src = 'assets/logo-256.png';
    logoImage = img;
  } catch {
    logoReady = false;
    logoImage = null;
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);
}

export function drawHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
): number {
  const cx = w / 2;
  if (logoReady && logoImage) {
    const size = 56;
    ctx.drawImage(logoImage, cx - size / 2, y, size, size);
    y += size + 8;
  }

  ctx.font = fonts.title;
  ctx.fillStyle = theme.green;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('GUESS MASTER', cx, y);
  y += 28;

  ctx.font = fonts.sub;
  ctx.fillStyle = theme.gray;
  ctx.fillText('// LOBBY', cx, y);
  return y + 24;
}

export function isLogoReady(): boolean {
  return logoReady;
}
