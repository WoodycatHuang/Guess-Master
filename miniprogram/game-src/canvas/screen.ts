import { getGmRuntime } from '../lib/runtime';
import { fonts, theme } from './theme';
import type { Rect } from './ui';

/** 小游戏内存紧张，用 1x 画布（约节省 4 倍像素缓冲） */
const MAX_PIXEL_RATIO = 1;

export interface GameScreen {
  canvas: WechatMinigame.Canvas;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

let screen: GameScreen | null = null;

export function getScreen(): GameScreen {
  if (!screen) throw new Error('Screen not initialized');
  return screen;
}

export function initScreen(): GameScreen {
  const rt = getGmRuntime();
  if (rt.screen) {
    screen = rt.screen;
    return screen;
  }

  const info = wx.getSystemInfoSync();
  const canvas = wx.createCanvas();
  const pixelRatio = Math.min(info.pixelRatio || 1, MAX_PIXEL_RATIO);
  canvas.width = Math.round(info.screenWidth * pixelRatio);
  canvas.height = Math.round(info.screenHeight * pixelRatio);
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  screen = {
    canvas,
    ctx,
    width: info.screenWidth,
    height: info.screenHeight,
    pixelRatio,
  };

  rt.screen = screen;
  return screen;
}

/** 内容区顶边：避开状态栏 + 右上角胶囊菜单 */
export function getContentTop(): number {
  const belowMenu = 12;

  try {
    const menu = wx.getMenuButtonBoundingClientRect();
    if (menu && menu.bottom > 0) {
      return Math.round(menu.bottom + belowMenu);
    }
  } catch {
    // ignore
  }

  const info = wx.getSystemInfoSync();
  const safeTop = info.safeArea?.top ?? info.statusBarHeight ?? 20;
  return Math.round(safeTop + 44 + belowMenu);
}

/** 左上角「退回/返回大厅」可点区域 */
export function getBackButtonRect(width: number): Rect {
  const pad = theme.pad;
  const top = getContentTop();
  return { x: pad, y: top, w: 88, h: 36 };
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

  ctx.font = fonts.title;
  ctx.fillStyle = theme.green;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('脑波专家', cx, y);
  y += 28;

  ctx.font = fonts.sub;
  ctx.fillStyle = theme.gray;
  ctx.fillText('Guess Master', cx, y);
  return y + 24;
}
