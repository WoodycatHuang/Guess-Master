import { fonts, theme } from './theme';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function hit(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export interface ButtonSpec extends Rect {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function drawButton(ctx: CanvasRenderingContext2D, btn: ButtonSpec): void {
  const isPrimary = btn.variant === 'primary' && !btn.disabled;
  const isSecondary = btn.variant === 'secondary' || btn.disabled;

  ctx.fillStyle = isPrimary ? theme.green : theme.bgInput;
  ctx.strokeStyle = isSecondary ? theme.gray : theme.green;
  ctx.lineWidth = 3;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

  ctx.font = fonts.body.replace('16px', '15px');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isPrimary ? theme.bg : btn.disabled ? theme.muted : theme.green;
  ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

export function drawPanel(ctx: CanvasRenderingContext2D, rect: Rect): void {
  ctx.fillStyle = theme.bgPanel;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 3;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
  align: CanvasTextAlign = 'left',
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

export function drawInput(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  value: string,
  placeholder: string,
  focused: boolean,
): void {
  ctx.fillStyle = theme.bgInput;
  ctx.strokeStyle = focused ? '#00FFFF' : theme.green;
  ctx.lineWidth = focused ? 3 : 2;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const text = value || placeholder;
  ctx.font = fonts.body;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = value ? theme.green : theme.muted;
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2);
}
