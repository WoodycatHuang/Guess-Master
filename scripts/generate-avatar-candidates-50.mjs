/**
 * 50 个候选低像素头像 — 32×32 网格，统一深色底 #0D0E15，供 PM 挑选 25 个
 * 用法: node scripts/generate-avatar-candidates-50.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'assets', 'avatars-candidates-50');
const BG = '#0D0E15';

const GRID = 32;
const SCALE = 2;
const OUT_SIZE = GRID * SCALE;
const K = '#000000';

const PAL = {
  Y: '#FFE600',
  y: '#CCAA00',
  W: '#FFFFFF',
  R: '#FF0055',
  O: '#FF8800',
  o: '#CC6600',
  G: '#39FF14',
  g: '#2BC410',
  B: '#00AAFF',
  b: '#0088CC',
  C: '#00FFFF',
  P: '#FF69B4',
  PK: '#FFB6C1',
  BR: '#8B4513',
  BR2: '#A0522D',
  GR: '#9E9E9E',
  GR2: '#616161',
  L: '#B3E5FC',
  PU: '#BB86FC',
  D: '#4FC3F7',
  GN: '#66BB6A',
  RD: '#EF5350',
  YL: '#FFEE58',
  WH: '#F5F5F5',
  BL: '#42A5F5',
  T: '#26A69A',
  BK: '#212121',
  NV: '#5C6BC0',
  GD: '#FFD700',
  OR: '#FF7043',
  LM: '#AED581',
  CY: '#80DEEA',
  MG: '#E040FB',
  CR: '#FF5252',
};

class PixelGrid {
  constructor() {
    this.p = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  }

  set(x, y, c) {
    if (x >= 0 && x < GRID && y >= 0 && y < GRID) this.p[y][x] = c;
  }

  fill(x, y, w, h, c) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, c);
  }

  disk(cx, cy, r, c) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c);
  }

  ellipse(cx, cy, rx, ry, c) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, c);
  }

  /** Black border on transparent edges */
  outline() {
    const out = this.p.map((row) => row.slice());
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!this.p[y][x]) continue;
        let edge = false;
        for (const [dx, dy] of [
          [1, 0], [-1, 0], [0, 1], [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || !this.p[ny][nx]) {
            edge = true;
            break;
          }
        }
        if (edge) out[y][x] = this.p[y][x];
      }
    const bordered = out.map((row) => row.slice());
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!out[y][x]) continue;
        for (const [dx, dy] of [
          [1, 0], [-1, 0], [0, 1], [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || !out[ny][nx])
            if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID) bordered[ny][nx] = K;
        }
      }
    this.p = bordered;
  }

  toCanvas(bg, scale = SCALE) {
    const size = GRID * scale;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const c = this.p[y][x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    return canvas;
  }
}

/** @type {Array<{ slug: string; label: string; draw: (g: PixelGrid) => void }>} */
const CANDIDATES = [
  { slug: 'smile', label: '笑脸', draw(g) {
    g.disk(15, 16, 11, PAL.Y);
    g.fill(10, 11, 2, 3, K);
    g.fill(20, 11, 2, 3, K);
    g.fill(10, 21, 12, 2, K);
    g.fill(11, 23, 10, 1, K);
    g.fill(12, 24, 8, 1, K);
  }},
  { slug: 'cool', label: '墨镜', draw(g) {
    g.disk(15, 16, 11, PAL.Y);
    g.fill(8, 13, 16, 5, K);
    g.fill(9, 14, 5, 3, PAL.B);
    g.fill(18, 14, 5, 3, PAL.B);
    g.fill(14, 14, 4, 3, K);
    g.fill(12, 22, 8, 2, K);
  }},
  { slug: 'laugh', label: '大笑', draw(g) {
    g.disk(15, 16, 11, PAL.Y);
    g.fill(10, 11, 2, 2, K);
    g.fill(20, 11, 2, 2, K);
    g.fill(8, 13, 2, 4, PAL.B);
    g.fill(22, 13, 2, 4, PAL.B);
    g.fill(9, 20, 14, 6, K);
    g.fill(11, 22, 10, 4, PAL.W);
  }},
  { slug: 'ghost', label: '幽灵', draw(g) {
    g.fill(8, 6, 16, 16, PAL.W);
    g.fill(9, 5, 14, 2, PAL.W);
    g.fill(10, 4, 12, 2, PAL.W);
    g.fill(8, 22, 4, 4, PAL.W);
    g.fill(14, 24, 4, 4, PAL.W);
    g.fill(20, 22, 4, 4, PAL.W);
    g.fill(10, 12, 2, 4, K);
    g.fill(20, 12, 2, 4, K);
    g.fill(14, 18, 4, 2, K);
  }},
  { slug: 'robot', label: '机器人', draw(g) {
    g.fill(14, 4, 4, 4, PAL.GR);
    g.fill(8, 9, 16, 14, PAL.GR);
    g.fill(10, 13, 4, 4, PAL.C);
    g.fill(18, 13, 4, 4, PAL.C);
    g.fill(12, 20, 8, 2, K);
    g.fill(6, 14, 2, 8, PAL.GR2);
    g.fill(24, 14, 2, 8, PAL.GR2);
    g.fill(6, 22, 2, 2, PAL.GR2);
    g.fill(24, 22, 2, 2, PAL.GR2);
  }},
  { slug: 'alien', label: '外星人', draw(g) {
    g.ellipse(15, 17, 10, 12, PAL.G);
    g.fill(9, 13, 5, 6, K);
    g.fill(17, 13, 5, 6, K);
    g.fill(10, 14, 3, 4, PAL.W);
    g.fill(18, 14, 3, 4, PAL.W);
    g.fill(13, 22, 4, 2, K);
  }},
  { slug: 'cat', label: '猫咪', draw(g) {
    g.fill(8, 8, 5, 6, PAL.O);
    g.fill(19, 8, 5, 6, PAL.O);
    g.fill(8, 10, 16, 14, PAL.O);
    g.fill(10, 18, 12, 6, PAL.PK);
    g.fill(10, 14, 2, 3, K);
    g.fill(20, 14, 2, 3, K);
    g.fill(14, 19, 4, 2, K);
    g.fill(8, 20, 3, 1, K);
    g.fill(21, 20, 3, 1, K);
  }},
  { slug: 'dog', label: '小狗', draw(g) {
    g.fill(6, 10, 6, 8, PAL.BR2);
    g.fill(20, 10, 6, 8, PAL.BR2);
    g.fill(8, 10, 16, 14, PAL.BR2);
    g.fill(10, 16, 12, 8, PAL.PK);
    g.fill(10, 13, 2, 3, K);
    g.fill(20, 13, 2, 3, K);
    g.fill(13, 20, 6, 4, PAL.R);
    g.fill(14, 21, 4, 2, PAL.PK);
  }},
  { slug: 'penguin', label: '企鹅', draw(g) {
    g.ellipse(15, 17, 9, 12, PAL.BK);
    g.fill(11, 10, 8, 14, PAL.WH);
    g.fill(12, 14, 6, 8, PAL.BK);
    g.fill(13, 16, 4, 4, PAL.WH);
    g.fill(10, 8, 4, 3, PAL.O);
    g.fill(18, 8, 4, 3, PAL.O);
    g.fill(12, 26, 3, 3, PAL.O);
    g.fill(17, 26, 3, 3, PAL.O);
  }},
  { slug: 'frog', label: '青蛙', draw(g) {
    g.disk(15, 20, 9, PAL.G);
    g.fill(8, 8, 6, 6, PAL.G);
    g.fill(18, 8, 6, 6, PAL.G);
    g.fill(10, 10, 2, 3, K);
    g.fill(20, 10, 2, 3, K);
    g.fill(12, 24, 6, 3, PAL.GN);
    g.fill(14, 22, 2, 2, K);
  }},
  { slug: 'bee', label: '蜜蜂', draw(g) {
    g.ellipse(15, 16, 8, 10, PAL.Y);
    g.fill(9, 12, 12, 3, K);
    g.fill(9, 18, 12, 3, K);
    g.fill(6, 10, 4, 6, PAL.L);
    g.fill(22, 10, 4, 6, PAL.L);
    g.fill(12, 8, 2, 2, K);
    g.fill(18, 8, 2, 2, K);
    g.fill(14, 6, 4, 2, K);
  }},
  { slug: 'owl', label: '猫头鹰', draw(g) {
    g.fill(8, 10, 16, 16, PAL.BR);
    g.fill(10, 12, 12, 10, PAL.WH);
    g.fill(10, 14, 5, 6, K);
    g.fill(17, 14, 5, 6, K);
    g.fill(12, 16, 2, 2, PAL.WH);
    g.fill(19, 16, 2, 2, PAL.WH);
    g.fill(13, 22, 6, 4, PAL.O);
    g.fill(12, 8, 3, 3, PAL.BR2);
    g.fill(17, 8, 3, 3, PAL.BR2);
  }},
  { slug: 'rabbit', label: '兔子', draw(g) {
    g.fill(10, 4, 4, 10, PAL.WH);
    g.fill(18, 4, 4, 10, PAL.WH);
    g.fill(11, 5, 2, 6, PAL.PK);
    g.fill(19, 5, 2, 6, PAL.PK);
    g.disk(15, 20, 9, PAL.WH);
    g.fill(10, 17, 2, 3, K);
    g.fill(20, 17, 2, 3, K);
    g.fill(13, 22, 4, 2, PAL.PK);
    g.fill(14, 24, 2, 2, K);
  }},
  { slug: 'fish', label: '小鱼', draw(g) {
    g.ellipse(14, 16, 10, 7, PAL.O);
    g.fill(4, 14, 4, 6, PAL.O);
    g.fill(22, 12, 4, 4, PAL.O);
    g.fill(24, 14, 3, 6, PAL.O);
    g.fill(26, 16, 2, 2, PAL.O);
    g.fill(11, 14, 2, 2, K);
    g.fill(8, 18, 4, 2, PAL.WH);
    g.fill(18, 12, 4, 3, PAL.O);
  }},
  { slug: 'snail', label: '蜗牛', draw(g) {
    g.disk(20, 12, 8, PAL.BR);
    g.fill(17, 10, 6, 6, PAL.BR2);
    g.fill(14, 13, 3, 2, PAL.BR2);
    g.ellipse(10, 24, 8, 4, PAL.PK);
    g.fill(6, 23, 4, 2, PAL.PK);
    g.fill(16, 24, 2, 2, K);
    g.fill(18, 24, 2, 2, K);
    g.fill(22, 8, 2, 2, K);
    g.fill(24, 6, 2, 4, K);
  }},
  { slug: 'ladybug', label: '瓢虫', draw(g) {
    g.ellipse(16, 18, 9, 8, PAL.R);
    g.fill(6, 14, 6, 8, K);
    g.fill(6, 16, 4, 4, K);
    g.fill(10, 14, 2, 2, K);
    g.fill(16, 14, 2, 2, K);
    g.fill(20, 16, 2, 2, K);
    g.fill(12, 18, 2, 2, K);
    g.fill(18, 20, 2, 2, K);
    g.fill(14, 8, 4, 4, K);
    g.fill(15, 10, 2, 2, K);
  }},
  { slug: 'butterfly', label: '蝴蝶', draw(g) {
    g.fill(14, 12, 4, 10, K);
    g.fill(8, 8, 6, 8, PAL.MG);
    g.fill(18, 8, 6, 8, PAL.MG);
    g.fill(6, 10, 4, 4, PAL.P);
    g.fill(22, 10, 4, 4, PAL.P);
    g.fill(10, 18, 4, 4, PAL.C);
    g.fill(18, 18, 4, 4, PAL.C);
    g.fill(15, 8, 2, 2, PAL.YL);
  }},
  { slug: 'unicorn', label: '独角兽', draw(g) {
    g.disk(16, 20, 9, PAL.PK);
    g.fill(14, 6, 4, 10, PAL.PU);
    g.fill(16, 4, 2, 4, PAL.YL);
    g.fill(17, 2, 2, 4, PAL.YL);
    g.fill(11, 18, 2, 3, K);
    g.fill(19, 18, 2, 3, K);
    g.fill(14, 24, 4, 2, PAL.PK);
    g.fill(8, 14, 4, 3, PAL.PK);
  }},
  { slug: 'heart', label: '爱心', draw(g) {
    g.disk(11, 12, 5, PAL.R);
    g.disk(21, 12, 5, PAL.R);
    g.fill(6, 14, 20, 6, PAL.R);
    g.fill(8, 20, 16, 4, PAL.R);
    g.fill(10, 24, 12, 2, PAL.R);
    g.fill(12, 26, 8, 2, PAL.R);
    g.fill(14, 28, 4, 2, PAL.R);
  }},
  { slug: 'star', label: '星星', draw(g) {
    g.fill(14, 4, 4, 4, PAL.YL);
    g.fill(12, 8, 8, 4, PAL.YL);
    g.fill(6, 12, 20, 4, PAL.YL);
    g.fill(10, 16, 12, 4, PAL.YL);
    g.fill(8, 20, 4, 4, PAL.YL);
    g.fill(20, 20, 4, 4, PAL.YL);
    g.fill(12, 20, 8, 4, PAL.YL);
    g.fill(14, 24, 4, 4, PAL.YL);
  }},
  { slug: 'flame', label: '火焰', draw(g) {
    g.fill(14, 4, 4, 4, PAL.YL);
    g.fill(12, 6, 8, 6, PAL.O);
    g.fill(10, 12, 12, 6, PAL.O);
    g.fill(12, 18, 8, 6, PAL.R);
    g.fill(14, 24, 4, 4, PAL.R);
    g.fill(14, 10, 4, 10, PAL.YL);
  }},
  { slug: 'diamond', label: '钻石', draw(g) {
    g.fill(14, 4, 4, 2, PAL.D);
    g.fill(10, 6, 12, 4, PAL.D);
    g.fill(8, 10, 16, 4, PAL.D);
    g.fill(10, 14, 12, 4, PAL.B);
    g.fill(12, 18, 8, 4, PAL.B);
    g.fill(14, 22, 4, 4, PAL.B);
  }},
  { slug: 'bolt', label: '闪电', draw(g) {
    g.fill(16, 2, 6, 6, PAL.YL);
    g.fill(12, 8, 12, 4, PAL.YL);
    g.fill(16, 12, 6, 6, PAL.YL);
    g.fill(8, 18, 12, 4, PAL.YL);
    g.fill(12, 22, 10, 4, PAL.YL);
  }},
  { slug: 'moon', label: '月亮', draw(g) {
    g.disk(16, 16, 12, PAL.YL);
    g.disk(20, 14, 10, BG);
  }},
  { slug: 'sun', label: '太阳', draw(g) {
    g.disk(15, 15, 8, PAL.YL);
    g.fill(14, 2, 4, 4, PAL.YL);
    g.fill(14, 26, 4, 4, PAL.YL);
    g.fill(2, 14, 4, 4, PAL.YL);
    g.fill(26, 14, 4, 4, PAL.YL);
    g.fill(6, 6, 4, 4, PAL.O);
    g.fill(22, 6, 4, 4, PAL.O);
    g.fill(6, 22, 4, 4, PAL.O);
    g.fill(22, 22, 4, 4, PAL.O);
  }},
  { slug: 'cloud', label: '雨云', draw(g) {
    g.fill(8, 10, 6, 6, PAL.WH);
    g.fill(14, 8, 10, 8, PAL.WH);
    g.fill(22, 10, 6, 6, PAL.WH);
    g.fill(10, 20, 2, 4, PAL.B);
    g.fill(16, 22, 2, 6, PAL.B);
    g.fill(22, 20, 2, 4, PAL.B);
  }},
  { slug: 'snowflake', label: '雪花', draw(g) {
    g.fill(14, 2, 4, 28, PAL.C);
    g.fill(2, 14, 28, 4, PAL.C);
    g.fill(6, 6, 4, 4, PAL.C);
    g.fill(22, 6, 4, 4, PAL.C);
    g.fill(6, 22, 4, 4, PAL.C);
    g.fill(22, 22, 4, 4, PAL.C);
    g.fill(10, 10, 2, 2, PAL.W);
    g.fill(20, 10, 2, 2, PAL.W);
    g.fill(10, 20, 2, 2, PAL.W);
    g.fill(20, 20, 2, 2, PAL.W);
  }},
  { slug: 'rainbow', label: '彩虹', draw(g) {
    g.fill(4, 22, 24, 2, PAL.R);
    g.fill(4, 20, 24, 2, PAL.O);
    g.fill(4, 18, 24, 2, PAL.YL);
    g.fill(4, 16, 24, 2, PAL.G);
    g.fill(4, 14, 24, 2, PAL.B);
    g.fill(4, 12, 24, 2, PAL.PU);
    g.fill(2, 24, 28, 6, PAL.GN);
  }},
  { slug: 'flower', label: '花朵', draw(g) {
    g.fill(14, 16, 4, 12, PAL.GN);
    g.fill(10, 8, 4, 4, PAL.P);
    g.fill(18, 8, 4, 4, PAL.P);
    g.fill(8, 12, 4, 4, PAL.P);
    g.fill(20, 12, 4, 4, PAL.P);
    g.fill(12, 14, 8, 4, PAL.YL);
    g.fill(14, 15, 4, 2, PAL.O);
  }},
  { slug: 'cactus', label: '仙人掌', draw(g) {
    g.fill(14, 8, 4, 20, PAL.G);
    g.fill(8, 14, 6, 4, PAL.G);
    g.fill(8, 10, 4, 6, PAL.G);
    g.fill(18, 16, 6, 4, PAL.G);
    g.fill(20, 12, 4, 6, PAL.G);
    g.fill(10, 6, 12, 2, PAL.CR);
    g.fill(12, 4, 8, 2, PAL.R);
  }},
  { slug: 'mushroom', label: '蘑菇', draw(g) {
    g.fill(6, 8, 20, 8, PAL.R);
    g.fill(8, 10, 4, 4, PAL.WH);
    g.fill(16, 10, 4, 4, PAL.WH);
    g.fill(22, 12, 2, 2, PAL.WH);
    g.fill(12, 16, 8, 12, PAL.PK);
    g.fill(14, 26, 4, 2, PAL.PK);
  }},
  { slug: 'tree', label: '松树', draw(g) {
    g.fill(14, 22, 4, 8, PAL.BR);
    g.fill(10, 18, 12, 4, PAL.GN);
    g.fill(8, 14, 16, 4, PAL.G);
    g.fill(10, 10, 12, 4, PAL.G);
    g.fill(12, 6, 8, 4, PAL.G);
    g.fill(14, 4, 4, 4, PAL.G);
  }},
  { slug: 'pizza', label: '披萨', draw(g) {
    g.fill(8, 8, 16, 4, PAL.YL);
    g.fill(6, 12, 18, 4, PAL.YL);
    g.fill(8, 16, 14, 4, PAL.YL);
    g.fill(10, 20, 10, 4, PAL.YL);
    g.fill(12, 24, 6, 4, PAL.YL);
    g.fill(10, 12, 2, 2, PAL.R);
    g.fill(18, 16, 2, 2, PAL.R);
    g.fill(14, 20, 2, 2, PAL.R);
    g.fill(6, 28, 20, 2, PAL.BR);
  }},
  { slug: 'burger', label: '汉堡', draw(g) {
    g.fill(8, 6, 16, 4, PAL.BR);
    g.fill(8, 10, 16, 2, PAL.WH);
    g.fill(8, 12, 16, 4, PAL.GN);
    g.fill(8, 16, 16, 4, PAL.YL);
    g.fill(8, 20, 16, 4, PAL.BR2);
    g.fill(6, 24, 20, 4, PAL.BR);
    g.fill(12, 14, 2, 2, PAL.R);
    g.fill(18, 14, 2, 2, PAL.R);
  }},
  { slug: 'sushi', label: '寿司', draw(g) {
    g.fill(8, 14, 16, 10, PAL.WH);
    g.fill(10, 16, 12, 6, PAL.CR);
    g.fill(12, 18, 8, 2, PAL.WH);
    g.fill(8, 12, 16, 2, PAL.BK);
    g.fill(6, 14, 2, 10, PAL.BK);
    g.fill(24, 14, 2, 10, PAL.BK);
  }},
  { slug: 'taco', label: '塔可', draw(g) {
    g.fill(10, 8, 12, 4, PAL.YL);
    g.fill(8, 12, 16, 4, PAL.O);
    g.fill(10, 16, 12, 4, PAL.GN);
    g.fill(8, 20, 16, 4, PAL.YL);
    g.fill(12, 14, 4, 2, PAL.R);
    g.fill(16, 16, 2, 2, PAL.GN);
  }},
  { slug: 'icecream', label: '甜筒', draw(g) {
    g.fill(10, 6, 12, 10, PAL.PK);
    g.fill(12, 8, 4, 4, PAL.WH);
    g.fill(18, 8, 2, 2, PAL.R);
    g.fill(12, 16, 8, 10, PAL.O);
    g.fill(14, 18, 4, 2, PAL.YL);
    g.fill(13, 26, 6, 2, PAL.O);
  }},
  { slug: 'donut', label: '甜甜圈', draw(g) {
    g.disk(15, 15, 12, PAL.O);
    g.disk(15, 15, 5, BG);
    g.fill(8, 10, 4, 4, PAL.PK);
    g.fill(20, 10, 4, 4, PAL.PK);
    g.fill(10, 20, 4, 2, PAL.PK);
    g.fill(18, 22, 2, 2, PAL.B);
  }},
  { slug: 'coffee', label: '咖啡', draw(g) {
    g.fill(8, 10, 14, 16, PAL.BR);
    g.fill(10, 8, 10, 2, PAL.WH);
    g.fill(22, 14, 4, 8, PAL.BR2);
    g.fill(10, 12, 10, 8, PAL.O);
    g.fill(12, 6, 2, 4, PAL.WH);
    g.fill(16, 4, 2, 6, PAL.WH);
    g.fill(20, 6, 2, 4, PAL.WH);
  }},
  { slug: 'gamepad', label: '手柄', draw(g) {
    g.fill(6, 12, 20, 10, PAL.GR);
    g.fill(8, 10, 16, 2, PAL.GR);
    g.fill(10, 14, 4, 6, K);
    g.fill(18, 16, 2, 2, PAL.R);
    g.fill(20, 14, 2, 2, PAL.B);
    g.fill(22, 16, 2, 2, PAL.G);
    g.fill(22, 18, 2, 2, PAL.Y);
  }},
  { slug: 'joystick', label: '摇杆', draw(g) {
    g.fill(8, 16, 16, 12, PAL.NV);
    g.fill(12, 10, 8, 8, PAL.NV);
    g.fill(14, 4, 4, 8, PAL.R);
    g.disk(16, 4, 3, PAL.R);
    g.fill(10, 18, 4, 2, PAL.YL);
    g.fill(18, 18, 4, 2, PAL.G);
    g.fill(14, 22, 4, 2, PAL.R);
  }},
  { slug: 'dice', label: '骰子', draw(g) {
    g.fill(8, 8, 16, 16, PAL.WH);
    g.fill(10, 10, 4, 4, K);
    g.fill(18, 10, 4, 4, K);
    g.fill(14, 14, 4, 4, K);
    g.fill(10, 18, 4, 4, K);
    g.fill(18, 18, 4, 4, K);
  }},
  { slug: 'puzzle', label: '拼图', draw(g) {
    g.fill(8, 8, 8, 8, PAL.B);
    g.fill(16, 8, 8, 8, PAL.R);
    g.fill(8, 16, 8, 8, PAL.G);
    g.fill(16, 16, 8, 8, PAL.YL);
    g.fill(14, 12, 4, 4, BG);
    g.fill(12, 14, 4, 4, BG);
    g.fill(16, 14, 4, 4, BG);
    g.fill(14, 16, 4, 4, BG);
  }},
  { slug: 'trophy', label: '奖杯', draw(g) {
    g.fill(10, 6, 12, 4, PAL.GD);
    g.fill(8, 10, 16, 8, PAL.GD);
    g.fill(6, 12, 2, 4, PAL.GD);
    g.fill(24, 12, 2, 4, PAL.GD);
    g.fill(12, 18, 8, 4, PAL.GD);
    g.fill(10, 22, 12, 4, PAL.BR);
    g.fill(8, 26, 16, 2, PAL.BR2);
  }},
  { slug: 'crown', label: '皇冠', draw(g) {
    g.fill(8, 20, 16, 6, PAL.GD);
    g.fill(8, 12, 4, 10, PAL.GD);
    g.fill(14, 8, 4, 14, PAL.GD);
    g.fill(20, 12, 4, 10, PAL.GD);
    g.fill(10, 10, 2, 2, PAL.R);
    g.fill(15, 6, 2, 4, PAL.R);
    g.fill(20, 10, 2, 2, PAL.R);
    g.fill(12, 22, 2, 2, PAL.B);
    g.fill(18, 22, 2, 2, PAL.B);
  }},
  { slug: 'rocket', label: '火箭', draw(g) {
    g.fill(12, 4, 8, 16, PAL.WH);
    g.fill(14, 2, 4, 4, PAL.R);
    g.fill(10, 16, 4, 6, PAL.O);
    g.fill(18, 16, 4, 6, PAL.O);
    g.fill(14, 20, 4, 6, PAL.B);
    g.fill(12, 26, 8, 2, PAL.O);
    g.fill(10, 28, 12, 2, PAL.R);
  }},
  { slug: 'ufo', label: '飞碟', draw(g) {
    g.fill(8, 14, 16, 6, PAL.GR);
    g.fill(12, 10, 8, 6, PAL.C);
    g.fill(10, 16, 2, 2, PAL.C);
    g.fill(14, 16, 4, 2, PAL.YL);
    g.fill(20, 16, 2, 2, PAL.C);
    g.fill(6, 20, 20, 2, PAL.G);
    g.fill(8, 22, 2, 4, PAL.G);
    g.fill(22, 22, 2, 4, PAL.G);
  }},
  { slug: 'camera', label: '相机', draw(g) {
    g.fill(6, 12, 20, 14, PAL.BK);
    g.fill(10, 8, 8, 6, PAL.BK);
    g.disk(16, 19, 6, PAL.GR2);
    g.disk(16, 19, 4, PAL.C);
    g.fill(22, 14, 4, 2, PAL.R);
    g.fill(8, 14, 2, 2, PAL.WH);
  }},
  { slug: 'gift', label: '礼物', draw(g) {
    g.fill(8, 14, 16, 14, PAL.R);
    g.fill(8, 10, 16, 6, PAL.GD);
    g.fill(14, 10, 4, 18, PAL.GD);
    g.fill(10, 10, 12, 4, PAL.PK);
    g.fill(12, 8, 8, 2, PAL.GD);
  }},
  { slug: 'balloon', label: '气球', draw(g) {
    g.ellipse(16, 12, 6, 9, PAL.CR);
    g.fill(15, 21, 2, 2, K);
    g.fill(16, 23, 2, 8, PAL.WH);
    g.fill(17, 30, 2, 2, PAL.WH);
  }},
];

if (CANDIDATES.length !== 50) {
  throw new Error(`Expected 50 candidates, got ${CANDIDATES.length}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
for (let i = 0; i < CANDIDATES.length; i++) {
  const c = CANDIDATES[i];
  const num = String(i + 1).padStart(2, '0');
  const filename = `candidate-${num}-${c.slug}.png`;
  const g = new PixelGrid();
  c.draw(g);
  g.outline();
  const buf = g.toCanvas(BG, SCALE).toBuffer('image/png');
  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  manifest.push({ id: i + 1, num, filename, slug: c.slug, label: c.label, bg: BG });
  console.log(`${num} ${c.label} -> ${filename}`);
}

fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

// 预览图 10×5，带编号
const COLS = 10;
const CELL = 64;
const LABEL_H = 18;
const PAD = 10;
const rows = Math.ceil(CANDIDATES.length / COLS);
const w = COLS * CELL + (COLS + 1) * PAD;
const h = rows * (CELL + LABEL_H) + (rows + 1) * PAD;

const preview = createCanvas(w, h);
const ctx = preview.getContext('2d');
ctx.fillStyle = BG;
ctx.fillRect(0, 0, w, h);

try {
  GlobalFonts.registerFromPath(
    path.join(__dirname, '../node_modules/@expo-google-fonts/noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf'),
    'NotoSansSC',
  );
} catch { /* optional */ }

for (let i = 0; i < manifest.length; i++) {
  const img = await loadImage(path.join(OUT_DIR, manifest[i].filename));
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = PAD + col * (CELL + PAD);
  const y = PAD + row * (CELL + LABEL_H + PAD);
  ctx.drawImage(img, x, y, CELL, CELL);
  ctx.fillStyle = '#39FF14';
  ctx.font = '11px NotoSansSC, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${manifest[i].num} ${manifest[i].label}`, x + CELL / 2, y + CELL + 14);
}

const previewPath = path.join(OUT_DIR, 'candidates-grid-50.png');
fs.writeFileSync(previewPath, preview.toBuffer('image/png'));
console.log('\nmanifest ->', path.join(OUT_DIR, 'manifest.json'));
console.log('preview ->', previewPath);
console.log(`done: 50 candidates, ${GRID}x${GRID} grid, ${OUT_SIZE}x${OUT_SIZE}px, dark bg ${BG}`);
