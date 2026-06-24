/**
 * 25 个低像素头像 — 参考 neon 街机风（粗黑边 + 纯色底）
 * 用法: node scripts/generate-pixel-avatars.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIRS = [
  path.join(__dirname, '..', 'assets', 'avatars'),
  path.join(__dirname, '..', 'web', 'public', 'avatars'),
];

const GRID = 16;
const SCALE = 4;
const OUT_SIZE = GRID * SCALE;

const K = '#000000';

/** @type {Record<string, string>} */
const PAL = {
  Y: '#FFE600',
  y: '#CCAA00',
  W: '#FFFFFF',
  R: '#FF0055',
  r: '#CC0044',
  O: '#FF8800',
  o: '#CC6600',
  G: '#39FF14',
  g: '#2BC410',
  B: '#00AAFF',
  b: '#0088CC',
  C: '#00FFFF',
  P: '#FF69B4',
  BR: '#8B4513',
  BR2: '#A0522D',
  GR: '#9E9E9E',
  GR2: '#616161',
  L: '#B3E5FC',
  PU: '#BB86FC',
  PK: '#FFB6C1',
  D: '#4FC3F7',
  GN: '#66BB6A',
  RD: '#EF5350',
  YL: '#FFEE58',
  WH: '#F5F5F5',
  BL: '#42A5F5',
  T: '#26A69A',
};

class PixelGrid {
  constructor() {
    /** @type {(string|null)[][]} */
    this.p = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  }

  /** @param {number} x @param {number} y @param {string} c */
  set(x, y, c) {
    if (x >= 0 && x < GRID && y >= 0 && y < GRID) this.p[y][x] = c;
  }

  /** @param {number} x @param {number} y @param {number} w @param {number} h @param {string} c */
  fill(x, y, w, h, c) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, c);
  }

  /** @param {number} cx @param {number} cy @param {number} r @param {string} c */
  disk(cx, cy, r, c) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c);
  }

  outline() {
    const next = this.p.map((row) => row.slice());
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const c = this.p[y][x];
        if (!c || c === K) continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || !this.p[ny][nx]) {
            if (!next[y][x] || next[y][x] !== K) {
              /* border adjacent to empty */
            }
            if (ny < 0 || ny >= GRID || nx < 0 || nx >= GRID || !this.p[ny][nx]) {
              if (!this.p[y][x]) continue;
            }
          }
        }
      }
    const out = this.p.map((row) => row.slice());
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!this.p[y][x]) continue;
        let edge = false;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
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
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!out[y][x]) continue;
        let border = false;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || !out[ny][nx]) {
            border = true;
            break;
          }
        }
        if (border) this.p[y][x] = out[y][x];
      }
    const bordered = this.p.map((row) => row.slice());
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!out[y][x]) continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID || !out[ny][nx]) {
            if (!bordered[ny]?.[nx] || bordered[ny][nx] === K) {
              if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID) bordered[ny][nx] = K;
            }
          }
        }
      }
    this.p = bordered;
  }

  /** @param {string} bg */
  toCanvas(bg) {
    const canvas = createCanvas(OUT_SIZE, OUT_SIZE);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const c = this.p[y][x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    return canvas;
  }
}

/** @type {Array<{ id: string; name: string; bg: string; draw: (g: PixelGrid) => void }>} */
const AVATARS = [
  {
    id: '01-smile',
    name: 'smile',
    bg: '#87CEEB',
    draw(g) {
      g.disk(7, 7, 6, PAL.Y);
      g.fill(5, 5, 1, 2, K);
      g.fill(9, 5, 1, 2, K);
      g.fill(5, 10, 6, 1, K);
      g.fill(6, 11, 4, 1, K);
    },
  },
  {
    id: '02-cool',
    name: 'cool',
    bg: '#7CFC00',
    draw(g) {
      g.disk(7, 7, 6, PAL.Y);
      g.fill(4, 6, 8, 3, K);
      g.fill(5, 7, 2, 1, PAL.B);
      g.fill(9, 7, 2, 1, PAL.B);
      g.fill(6, 11, 4, 1, K);
    },
  },
  {
    id: '03-laugh',
    name: 'laugh',
    bg: '#87CEEB',
    draw(g) {
      g.disk(7, 7, 6, PAL.Y);
      g.fill(5, 5, 1, 1, K);
      g.fill(9, 5, 1, 1, K);
      g.fill(4, 7, 1, 2, PAL.B);
      g.fill(10, 7, 1, 2, PAL.B);
      g.fill(5, 10, 6, 3, K);
      g.fill(6, 11, 4, 2, PAL.W);
    },
  },
  {
    id: '04-angry',
    name: 'angry',
    bg: '#FFB6C1',
    draw(g) {
      g.disk(7, 7, 6, PAL.RD);
      g.fill(4, 5, 3, 1, K);
      g.fill(9, 5, 3, 1, K);
      g.fill(5, 6, 1, 1, K);
      g.fill(9, 6, 1, 1, K);
      g.fill(5, 10, 6, 1, K);
      g.fill(4, 11, 2, 1, K);
      g.fill(10, 11, 2, 1, K);
    },
  },
  {
    id: '05-wink',
    name: 'wink',
    bg: '#B0B0B0',
    draw(g) {
      g.disk(7, 7, 6, PAL.Y);
      g.fill(5, 5, 1, 2, K);
      g.fill(9, 6, 3, 1, K);
      g.fill(6, 10, 4, 1, K);
    },
  },
  {
    id: '06-ghost',
    name: 'ghost',
    bg: '#B0B0B0',
    draw(g) {
      g.fill(4, 3, 8, 8, PAL.W);
      g.fill(4, 11, 2, 2, PAL.W);
      g.fill(7, 11, 2, 2, PAL.W);
      g.fill(10, 11, 2, 2, PAL.W);
      g.fill(5, 6, 1, 2, K);
      g.fill(9, 6, 1, 2, K);
    },
  },
  {
    id: '07-cat',
    name: 'cat',
    bg: '#7CFC00',
    draw(g) {
      g.fill(4, 4, 3, 3, PAL.O);
      g.fill(9, 4, 3, 3, PAL.O);
      g.fill(4, 5, 8, 7, PAL.O);
      g.fill(5, 8, 6, 3, PAL.PK);
      g.fill(5, 6, 1, 2, K);
      g.fill(10, 6, 1, 2, K);
      g.fill(7, 9, 2, 1, K);
      g.fill(6, 10, 1, 1, K);
      g.fill(9, 10, 1, 1, K);
    },
  },
  {
    id: '08-robot',
    name: 'robot',
    bg: '#B0B0B0',
    draw(g) {
      g.fill(7, 2, 2, 2, PAL.GR);
      g.fill(4, 4, 8, 8, PAL.GR);
      g.fill(5, 6, 2, 2, PAL.B);
      g.fill(9, 6, 2, 2, PAL.B);
      g.fill(6, 10, 4, 1, K);
      g.fill(3, 7, 1, 3, PAL.GR2);
      g.fill(12, 7, 1, 3, PAL.GR2);
    },
  },
  {
    id: '09-alien',
    name: 'alien',
    bg: '#20B2AA',
    draw(g) {
      g.fill(5, 4, 6, 8, PAL.G);
      g.fill(4, 6, 8, 5, PAL.G);
      g.fill(5, 6, 2, 3, K);
      g.fill(9, 6, 2, 3, K);
      g.fill(7, 11, 2, 1, K);
    },
  },
  {
    id: '10-dog',
    name: 'dog',
    bg: '#B0B0B0',
    draw(g) {
      g.fill(3, 5, 3, 4, PAL.BR2);
      g.fill(10, 5, 3, 4, PAL.BR2);
      g.fill(4, 5, 8, 7, PAL.BR2);
      g.fill(5, 7, 6, 4, PAL.PK);
      g.fill(5, 6, 1, 2, K);
      g.fill(10, 6, 1, 2, K);
      g.fill(7, 9, 2, 2, K);
    },
  },
  {
    id: '11-heart',
    name: 'heart',
    bg: '#FFB6C1',
    draw(g) {
      g.fill(4, 5, 3, 3, PAL.R);
      g.fill(9, 5, 3, 3, PAL.R);
      g.fill(3, 7, 10, 3, PAL.R);
      g.fill(4, 10, 8, 2, PAL.R);
      g.fill(5, 12, 6, 1, PAL.R);
      g.fill(6, 13, 4, 1, PAL.R);
      g.fill(7, 14, 2, 1, PAL.R);
    },
  },
  {
    id: '12-star',
    name: 'star',
    bg: '#FFE600',
    draw(g) {
      g.fill(7, 3, 2, 2, PAL.YL);
      g.fill(6, 5, 4, 2, PAL.YL);
      g.fill(3, 7, 10, 2, PAL.YL);
      g.fill(5, 9, 6, 2, PAL.YL);
      g.fill(4, 11, 2, 2, PAL.YL);
      g.fill(10, 11, 2, 2, PAL.YL);
      g.fill(6, 11, 4, 2, PAL.YL);
    },
  },
  {
    id: '13-flame',
    name: 'flame',
    bg: '#87CEEB',
    draw(g) {
      g.fill(7, 3, 2, 2, PAL.YL);
      g.fill(6, 4, 4, 3, PAL.O);
      g.fill(5, 7, 6, 3, PAL.O);
      g.fill(6, 10, 4, 3, PAL.R);
      g.fill(7, 13, 2, 2, PAL.R);
      g.fill(7, 7, 2, 4, PAL.YL);
    },
  },
  {
    id: '14-diamond',
    name: 'diamond',
    bg: '#87CEEB',
    draw(g) {
      g.fill(7, 3, 2, 1, PAL.D);
      g.fill(5, 4, 6, 2, PAL.D);
      g.fill(4, 6, 8, 2, PAL.D);
      g.fill(5, 8, 6, 2, PAL.B);
      g.fill(6, 10, 4, 2, PAL.B);
      g.fill(7, 12, 2, 2, PAL.B);
    },
  },
  {
    id: '15-pizza',
    name: 'pizza',
    bg: '#7CFC00',
    draw(g) {
      g.fill(4, 4, 8, 2, PAL.YL);
      g.fill(3, 6, 9, 2, PAL.YL);
      g.fill(4, 8, 7, 2, PAL.YL);
      g.fill(5, 10, 5, 2, PAL.YL);
      g.fill(6, 5, 1, 1, PAL.R);
      g.fill(9, 7, 1, 1, PAL.R);
      g.fill(7, 9, 1, 1, PAL.R);
      g.fill(3, 12, 10, 2, PAL.BR);
    },
  },
  {
    id: '16-palm',
    name: 'palm',
    bg: '#7CFC00',
    draw(g) {
      g.fill(7, 5, 2, 9, PAL.BR);
      g.fill(4, 4, 2, 2, PAL.GN);
      g.fill(7, 3, 2, 2, PAL.GN);
      g.fill(10, 4, 2, 2, PAL.GN);
      g.fill(5, 5, 2, 2, PAL.GN);
      g.fill(9, 5, 2, 2, PAL.GN);
      g.fill(6, 6, 4, 2, PAL.GN);
    },
  },
  {
    id: '17-burger',
    name: 'burger',
    bg: '#7CFC00',
    draw(g) {
      g.fill(4, 4, 8, 2, PAL.BR);
      g.fill(4, 6, 8, 2, PAL.GN);
      g.fill(4, 8, 8, 2, PAL.YL);
      g.fill(4, 10, 8, 2, PAL.BR2);
      g.fill(3, 12, 10, 2, PAL.BR);
    },
  },
  {
    id: '18-coffee',
    name: 'coffee',
    bg: '#87CEEB',
    draw(g) {
      g.fill(4, 5, 7, 8, PAL.BR);
      g.fill(5, 4, 5, 1, PAL.WH);
      g.fill(11, 7, 2, 4, PAL.BR2);
      g.fill(5, 6, 5, 3, PAL.O);
    },
  },
  {
    id: '19-gamepad',
    name: 'gamepad',
    bg: '#FFB6C1',
    draw(g) {
      g.fill(3, 6, 10, 5, PAL.GR);
      g.fill(4, 5, 8, 1, PAL.GR);
      g.fill(5, 7, 2, 3, K);
      g.fill(9, 8, 1, 1, PAL.R);
      g.fill(10, 7, 1, 1, PAL.B);
    },
  },
  {
    id: '20-bolt',
    name: 'bolt',
    bg: '#FFE600',
    draw(g) {
      g.fill(8, 2, 3, 3, PAL.YL);
      g.fill(6, 5, 5, 2, PAL.YL);
      g.fill(8, 7, 3, 3, PAL.YL);
      g.fill(4, 10, 5, 2, PAL.YL);
      g.fill(6, 12, 4, 2, PAL.YL);
    },
  },
  {
    id: '21-unicorn',
    name: 'unicorn',
    bg: '#E6B3FF',
    draw(g) {
      g.disk(7, 8, 5, PAL.PK);
      g.fill(7, 3, 2, 4, PAL.PU);
      g.fill(8, 2, 1, 2, PAL.YL);
      g.fill(5, 7, 1, 2, K);
      g.fill(9, 7, 1, 2, K);
      g.fill(7, 10, 2, 1, K);
    },
  },
  {
    id: '22-rocket',
    name: 'rocket',
    bg: '#0D0E15',
    draw(g) {
      g.fill(6, 3, 4, 8, PAL.WH);
      g.fill(7, 2, 2, 2, PAL.R);
      g.fill(5, 8, 2, 3, PAL.O);
      g.fill(9, 8, 2, 3, PAL.O);
      g.fill(7, 11, 2, 3, PAL.B);
      g.fill(6, 14, 4, 1, PAL.O);
    },
  },
  {
    id: '23-trophy',
    name: 'trophy',
    bg: '#FFD700',
    draw(g) {
      g.fill(5, 4, 6, 2, PAL.YL);
      g.fill(4, 6, 8, 4, PAL.YL);
      g.fill(3, 7, 1, 2, PAL.YL);
      g.fill(12, 7, 1, 2, PAL.YL);
      g.fill(6, 10, 4, 2, PAL.YL);
      g.fill(5, 12, 6, 2, PAL.BR);
    },
  },
  {
    id: '24-mushroom',
    name: 'mushroom',
    bg: '#FF6B6B',
    draw(g) {
      g.fill(4, 4, 8, 4, PAL.R);
      g.fill(5, 5, 2, 2, PAL.WH);
      g.fill(9, 5, 2, 2, PAL.WH);
      g.fill(6, 8, 4, 6, PAL.PK);
    },
  },
  {
    id: '25-crown',
    name: 'crown',
    bg: '#9932FF',
    draw(g) {
      g.fill(4, 10, 8, 3, PAL.YL);
      g.fill(4, 6, 2, 5, PAL.YL);
      g.fill(7, 4, 2, 7, PAL.YL);
      g.fill(10, 6, 2, 5, PAL.YL);
      g.fill(5, 5, 1, 1, PAL.R);
      g.fill(7, 3, 2, 2, PAL.R);
      g.fill(10, 5, 1, 1, PAL.R);
    },
  },
];

for (const dir of OUT_DIRS) fs.mkdirSync(dir, { recursive: true });

/** @type {string[]} */
const filenames = [];

for (const av of AVATARS) {
  const g = new PixelGrid();
  av.draw(g);
  g.outline();
  const canvas = g.toCanvas(av.bg);
  const filename = `avatar-${av.id}.png`;
  filenames.push(filename);
  const buf = canvas.toBuffer('image/png');
  for (const dir of OUT_DIRS) fs.writeFileSync(path.join(dir, filename), buf);
  console.log('wrote', filename);
}

const metaPath = path.join(__dirname, '..', 'src', 'constants', 'avatar-manifest.json');
fs.writeFileSync(
  metaPath,
  JSON.stringify(
    AVATARS.map((a, i) => ({
      id: i + 1,
      filename: filenames[i],
      name: a.name,
      bg: a.bg,
    })),
    null,
    2,
  ),
);
console.log('manifest ->', metaPath);
console.log('done:', AVATARS.length, 'avatars');
