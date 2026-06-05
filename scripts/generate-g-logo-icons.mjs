/**
 * 生成 Sixtyfour「G」桌面图标 — #39FF14 + #0D0E15
 * 用法: node scripts/generate-g-logo-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'assets');
const FONT_FILE = path.join(
  __dirname,
  '../node_modules/@expo-google-fonts/sixtyfour/400Regular/Sixtyfour_400Regular.ttf',
);
const FONT_NAME = 'Sixtyfour';

const FG = '#39FF14';
const BG = '#0D0E15';
const WHITE = '#FFFFFF';

GlobalFonts.registerFromPath(FONT_FILE, FONT_NAME);

function fitFontSize(ctx, text, maxW, maxH) {
  let size = maxH;
  while (size > 8) {
    ctx.font = `${size}px ${FONT_NAME}`;
    const m = ctx.measureText(text);
    if (m.width <= maxW && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent <= maxH) {
      return size;
    }
    size -= 2;
  }
  return 8;
}

function drawG(canvas, { fg, background, padding = 0.14 }) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  if (background === 'transparent') {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  const padX = width * padding;
  const padY = height * padding;
  const size = fitFontSize(ctx, 'G', width - padX * 2, height - padY * 2);

  ctx.font = `${size}px ${FONT_NAME}`;
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', width / 2, height / 2 + size * 0.02);
}

function saveCanvas(canvas, filePath) {
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log('wrote', filePath);
}

function renderIcon(size, options) {
  const base = size <= 64 ? size : 128;
  const small = createCanvas(base, base);
  drawG(small, options);

  if (size === base) return small;

  const out = createCanvas(size, size);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, size, size);
  return out;
}

saveCanvas(renderIcon(1024, { fg: FG, background: BG }), path.join(ASSETS, 'icon.png'));

saveCanvas(
  renderIcon(1024, { fg: FG, background: 'transparent' }),
  path.join(ASSETS, 'android-icon-foreground.png'),
);

saveCanvas(renderIcon(1024, { fg: FG, background: BG }), path.join(ASSETS, 'android-icon-background.png'));

saveCanvas(
  renderIcon(1024, { fg: WHITE, background: 'transparent' }),
  path.join(ASSETS, 'android-icon-monochrome.png'),
);

saveCanvas(renderIcon(48, { fg: FG, background: BG, padding: 0.1 }), path.join(ASSETS, 'favicon.png'));

saveCanvas(renderIcon(1024, { fg: FG, background: BG }), path.join(ASSETS, 'splash-icon.png'));

console.log('Done — Sixtyfour G icons updated.');
