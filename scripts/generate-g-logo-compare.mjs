/**
 * Sixtyfour vs Boldonse — 单字母 G Logo 对比稿
 * 用法: node scripts/generate-g-logo-compare.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'logo-draft');

const FG = '#39FF14';
const BG = '#0D0E15';
const LABEL = '#8B9B8A';

const FONTS = [
  {
    name: 'Sixtyfour',
    file: path.join(
      __dirname,
      '../node_modules/@expo-google-fonts/sixtyfour/400Regular/Sixtyfour_400Regular.ttf',
    ),
    label: 'Sixtyfour',
  },
  {
    name: 'Boldonse',
    file: path.join(
      __dirname,
      '../node_modules/@expo-google-fonts/boldonse/400Regular/Boldonse_400Regular.ttf',
    ),
    label: 'Boldonse',
  },
];

for (const font of FONTS) {
  GlobalFonts.registerFromPath(font.file, font.name);
}

function fitFontSize(ctx, fontName, text, maxW, maxH) {
  let size = maxH;
  while (size > 8) {
    ctx.font = `${size}px ${fontName}`;
    const m = ctx.measureText(text);
    const w = m.width;
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    if (w <= maxW && h <= maxH) return size;
    size -= 2;
  }
  return 8;
}

function drawG(canvas, fontName, padding = 0.12) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const padX = width * padding;
  const padY = height * padding;
  const maxW = width - padX * 2;
  const maxH = height - padY * 2;
  const size = fitFontSize(ctx, fontName, 'G', maxW, maxH);

  ctx.font = `${size}px ${fontName}`;
  ctx.fillStyle = FG;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', width / 2, height / 2 + size * 0.02);
}

function saveCanvas(canvas, filePath) {
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log('wrote', filePath);
}

fs.mkdirSync(OUT, { recursive: true });

// 单字体各尺寸预览
const sizes = [
  { suffix: '1024', px: 1024 },
  { suffix: '256', px: 256 },
  { suffix: '64', px: 64 },
];

for (const font of FONTS) {
  for (const { suffix, px } of sizes) {
    const canvas = createCanvas(px, px);
    drawG(canvas, font.name);
    saveCanvas(
      canvas,
      path.join(OUT, `g-logo-${font.name.toLowerCase()}-${suffix}.png`),
    );
  }
}

// 并排对比图（大 + 小）
function buildCompareSheet() {
  const pad = 48;
  const gap = 40;
  const labelH = 36;
  const big = 420;
  const small = 96;
  const colW = big;
  const row1H = labelH + big;
  const row2H = labelH + small;
  const width = pad * 2 + colW * 2 + gap;
  const height = pad * 2 + row1H + gap + row2H + 40;

  const sheet = createCanvas(width, height);
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = LABEL;
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';

  ctx.fillStyle = FG;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('G Logo Compare — #39FF14 on #0D0E15', width / 2, pad - 8);

  FONTS.forEach((font, i) => {
    const x = pad + i * (colW + gap);

    ctx.fillStyle = LABEL;
    ctx.font = '20px sans-serif';
    ctx.fillText(font.label, x + colW / 2, pad + 24);

    const bigCanvas = createCanvas(big, big);
    drawG(bigCanvas, font.name);
    ctx.drawImage(bigCanvas, x, pad + labelH, big, big);

    ctx.fillStyle = LABEL;
    ctx.font = '16px sans-serif';
    const smallY = pad + row1H + gap;
    ctx.fillText('icon ~64px', x + colW / 2, smallY + 18);

    const smallCanvas = createCanvas(small, small);
    drawG(smallCanvas, font.name);
    ctx.drawImage(smallCanvas, x + (colW - small) / 2, smallY + labelH, small, small);
  });

  return sheet;
}

saveCanvas(buildCompareSheet(), path.join(OUT, 'g-logo-compare-sixtyfour-vs-boldonse.png'));

console.log('Done.');
