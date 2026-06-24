#!/usr/bin/env node
/** 生成 25 张预览图（5×5 网格） */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATAR_DIR = path.join(__dirname, '..', 'assets', 'avatars');
const OUT = path.join(AVATAR_DIR, 'avatar-grid-preview.png');

const COLS = 5;
const CELL = 64;
const PAD = 8;
const files = fs
  .readdirSync(AVATAR_DIR)
  .filter((f) => f.startsWith('avatar-') && f.endsWith('.png'))
  .sort();

const rows = Math.ceil(files.length / COLS);
const w = COLS * CELL + (COLS + 1) * PAD;
const h = rows * CELL + (rows + 1) * PAD;
const canvas = createCanvas(w, h);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#0D0E15';
ctx.fillRect(0, 0, w, h);

for (let i = 0; i < files.length; i++) {
  const img = await loadImage(path.join(AVATAR_DIR, files[i]));
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = PAD + col * (CELL + PAD);
  const y = PAD + row * (CELL + PAD);
  ctx.drawImage(img, x, y, CELL, CELL);
}

fs.writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log('preview ->', OUT);
