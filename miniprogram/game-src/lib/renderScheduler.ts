import { getGmRuntime } from './runtime';

type FrameFn = () => void;

let paintFn: FrameFn | null = null;
let animUntil = 0;

export function initPaintLoop(fn: FrameFn): void {
  paintFn = fn;
}

/** 请求重绘一帧；若动画未结束会继续链式调度 */
export function requestPaint(): void {
  const rt = getGmRuntime();
  if (rt.framePending) return;
  rt.framePending = true;
  rt.rafId = requestAnimationFrame(() => {
    rt.framePending = false;
    rt.rafId = undefined;
    paintFn?.();
    if (Date.now() < animUntil) {
      requestPaint();
    }
  });
}

/** 在一段时间内保持刷新（翻牌、拖拽等） */
export function pulsePaint(ms: number): void {
  animUntil = Math.max(animUntil, Date.now() + ms);
  requestPaint();
}

export function stopPaintLoop(): void {
  animUntil = 0;
  const rt = getGmRuntime();
  rt.framePending = false;
  if (rt.rafId != null) {
    cancelAnimationFrame(rt.rafId);
    rt.rafId = undefined;
  }
}

export function extendAnimation(ms: number): void {
  animUntil = Math.max(animUntil, Date.now() + ms);
}

export function isPaintAnimating(): boolean {
  return Date.now() < animUntil;
}
