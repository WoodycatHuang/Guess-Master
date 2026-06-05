/**
 * 微信小程序用图 — Sixtyfour「G」#39FF14 + #0D0E15
 * 用法: node scripts/generate-miniprogram-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'miniprogram', 'assets');
const FONT_FILE = path.join(
  __dirname,
  '../node_modules/@expo-google-fonts/sixtyfour/400Regular/Sixtyfour_400Regular.ttf',
);
const FONT_NAME = 'Sixtyfour';

const FG = '#39FF14';
const BG = '#0D0E15';
const SUB = '#8B9B8A';

GlobalFonts.registerFromPath(FONT_FILE, FONT_NAME);

function fitFontSize(ctx, text, maxW, maxH, font = FONT_NAME) {
  let size = maxH;
  while (size > 8) {
    ctx.font = `${size}px ${font}`;
    const m = ctx.measureText(text);
    if (m.width <= maxW && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent <= maxH) {
      return size;
    }
    size -= 2;
  }
  return 8;
}

function drawGIcon(ctx, width, height, { padding = 0.14 } = {}) {
  const padX = width * padding;
  const padY = height * padding;
  const size = fitFontSize(ctx, 'G', width - padX * 2, height - padY * 2);
  ctx.font = `${size}px ${FONT_NAME}`;
  ctx.fillStyle = FG;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', width / 2, height / 2 + size * 0.02);
}

function renderIconCanvas(size, options = {}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);
  drawGIcon(ctx, size, size, options);
  return canvas;
}

function renderShareCard(w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const gSize = Math.min(w, h) * 0.42;
  const gX = w * 0.22;
  const gY = h * 0.5;
  const gCanvas = createCanvas(gSize, gSize);
  const gCtx = gCanvas.getContext('2d');
  drawGIcon(gCtx, gSize, gSize, { padding: 0.12 });
  ctx.drawImage(gCanvas, gX - gSize / 2, gY - gSize / 2);

  const titleSize = fitFontSize(ctx, 'GUESS MASTER', w * 0.55, h * 0.18);
  ctx.font = `${titleSize}px ${FONT_NAME}`;
  ctx.fillStyle = FG;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GUESS MASTER', w * 0.42, h * 0.38);

  const subSize = Math.max(14, Math.floor(h * 0.055));
  ctx.font = `${subSize}px sans-serif`;
  ctx.fillStyle = SUB;
  ctx.fillText('脑波专家 · 派对桌游', w * 0.42, h * 0.58);
  ctx.fillText('创建房间，邀请好友一起玩', w * 0.42, h * 0.68);

  return canvas;
}

function save(canvas, name) {
  const filePath = path.join(OUT, name);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log('wrote', filePath);
}

fs.mkdirSync(OUT, { recursive: true });

save(renderIconCanvas(144), 'mp-avatar-144.png');
save(renderIconCanvas(256), 'logo-256.png');
save(renderIconCanvas(512), 'logo-512.png');
save(renderShareCard(1280, 1024), 'share-1280x1024.png');
save(renderShareCard(500, 400), 'share-500x400.png');

console.log('Done — miniprogram/assets ready.');

const distAssets = path.join(__dirname, '..', 'miniprogram', 'dist', 'assets');
if (fs.existsSync(path.join(__dirname, '..', 'miniprogram', 'dist'))) {
  fs.mkdirSync(distAssets, { recursive: true });
  for (const name of fs.readdirSync(OUT)) {
    if (name.endsWith('.png')) {
      fs.copyFileSync(path.join(OUT, name), path.join(distAssets, name));
    }
  }
  console.log('copied to miniprogram/dist/assets');
}
