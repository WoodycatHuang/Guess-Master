/** 微信小游戏运行时（精简类型） */
declare const wx: WechatMinigame.Wx;
declare function requestAnimationFrame(callback: () => void): number;
declare function cancelAnimationFrame(id: number): void;
declare function setTimeout(callback: () => void, ms: number): number;
declare function clearTimeout(id: number): void;

declare namespace WechatMinigame {
  interface Wx {
    createCanvas(): Canvas;
    createImage(): Image;
    getSystemInfoSync(): SystemInfo;
    onTouchStart(cb: (e: TouchEvent) => void): void;
    onTouchMove(cb: (e: TouchEvent) => void): void;
    onTouchEnd(cb: (e: TouchEvent) => void): void;
    onShow(cb: (opts?: { query?: Record<string, string> }) => void): void;
    showToast(opts: { title: string; icon?: string; duration?: number }): void;
    showModal(opts: {
      title?: string;
      content?: string;
      editable?: boolean;
      placeholderText?: string;
      success?: (r: { confirm: boolean; content?: string }) => void;
    }): void;
    showKeyboard(opts: {
      defaultValue?: string;
      maxLength?: number;
      multiple?: boolean;
      confirmHold?: boolean;
      confirmType?: string;
    }): void;
    hideKeyboard(): void;
    onKeyboardInput(cb: (e: { value: string }) => void): void;
    onKeyboardConfirm(cb: (e: { value: string }) => void): void;
    onKeyboardComplete(cb: (e: { value: string }) => void): void;
    setStorageSync(key: string, data: unknown): void;
    getStorageSync(key: string): unknown;
    removeStorageSync(key: string): void;
    onShareAppMessage(cb: () => ShareAppMessageOption): void;
    shareAppMessage(opts: ShareAppMessageOption): void;
    request(opts: {
      url: string;
      method?: string;
      header?: Record<string, string>;
      data?: unknown;
      success?: (res: { statusCode: number; data: unknown }) => void;
      fail?: () => void;
    }): void;
  }

  interface ShareAppMessageOption {
    title?: string;
    imageUrl?: string;
    query?: string;
  }

  interface SystemInfo {
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    windowWidth: number;
    windowHeight: number;
  }

  interface TouchEvent {
    touches: Array<{ clientX: number; clientY: number }>;
    changedTouches?: Array<{ clientX: number; clientY: number }>;
  }

  interface Canvas {
    width: number;
    height: number;
    getContext(type: '2d'): CanvasRenderingContext2D;
  }

  interface Image {
    src: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    width: number;
    height: number;
  }
}

interface CanvasRenderingContext2D {
  globalAlpha: number;
  scale(x: number, y: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  measureText(text: string): TextMetrics;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  drawImage(img: WechatMinigame.Image, x: number, y: number, w: number, h: number): void;
}

interface TextMetrics {
  width: number;
}
