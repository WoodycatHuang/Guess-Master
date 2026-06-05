/**
 * 生成脑波专家桌面图标 — 严格两色 #39FF14 + #0D0E15
 * 用法: node scripts/generate-brain-icon.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets');

const FG = { r: 0x39, g: 0xff, b: 0x14, a: 255 };
const BG = { r: 0x0d, g: 0x0e, b: 0x15, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };
const CLEAR = { r: 0, g: 0, b: 0, a: 0 };

/** 48×48 像素大脑 — 参考图与简版之间的折中复杂度 */
function buildBrainGrid() {
  const w = 48;
  const h = 48;
  const grid = Array.from({ length: h }, () => Array(w).fill(0));

  const stroke = (x, y) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y][x] = 1;
  };

  const erase = (x, y) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y][x] = 0;
  };

  const fillEllipse = (cx, cy, rx, ry) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) stroke(x, y);
      }
    }
  };

  const eraseLine = (x0, y0, x1, y1, thickness = 1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      for (let dy = -thickness + 1; dy < thickness; dy++) {
        for (let dx = -thickness + 1; dx < thickness; dx++) {
          erase(x + dx, y + dy);
        }
      }
    }
  };

  const erasePath = (points, thickness = 1) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      eraseLine(x0, y0, x1, y1, thickness);
    }
  };

  const mirrorPath = (points) =>
    points.map(([x, y]) => [w - 1 - x, y]);

  // 有机轮廓：顶宽、两侧颞叶、底收窄
  fillEllipse(23.5, 12, 16, 11);
  fillEllipse(12, 17, 9, 8);
  fillEllipse(35, 17, 9, 8);
  fillEllipse(23.5, 22, 11, 7);

  // 修边：顶部更圆、底部收尖
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < 6; y++) erase(x, y);
    for (let y = 30; y < h; y++) erase(x, y);
  }
  for (let y = 6; y < 30; y++) {
    for (let x = 0; x < 7; x++) erase(x, y);
    for (let x = 41; x < w; x++) erase(x, y);
  }
  for (let y = 27; y <= 29; y++) {
    for (let x = 0; x < w; x++) {
      if (x < 17 || x > 30) erase(x, y);
    }
  }
  stroke(22, 29);
  stroke(23, 29);
  stroke(24, 29);
  stroke(25, 29);

  // 中央脑裂
  for (let y = 8; y <= 27; y++) {
    erase(23, y);
    erase(24, y);
  }

  // 左半球脑沟（折中：比简版多、比参考图少）
  const leftGrooves = [
    // 顶部外弧
    [
      [8, 9],
      [11, 8],
      [14, 10],
      [17, 11],
    ],
    // 上前回
    [
      [9, 12],
      [12, 11],
      [16, 13],
      [19, 14],
    ],
    // 中央长沟
    [
      [7, 16],
      [11, 15],
      [15, 16],
      [19, 17],
    ],
    // 中下部 S 形
    [
      [10, 18],
      [13, 17],
      [16, 19],
      [19, 20],
    ],
    // 下外弧
    [
      [11, 21],
      [14, 22],
      [17, 21],
      [20, 22],
    ],
    // 颞叶短沟
    [
      [6, 19],
      [9, 18],
      [11, 20],
    ],
    // 顶叶支沟
    [
      [12, 14],
      [14, 13],
      [15, 15],
    ],
  ];

  for (const path of leftGrooves) {
    erasePath(path, 1);
    erasePath(mirrorPath(path), 1);
  }

  // 左右各一条稍粗主沟（参考图感）
  erasePath(
    [
      [10, 10],
      [14, 12],
      [17, 15],
      [18, 18],
    ],
    2,
  );
  erasePath(
    mirrorPath([
      [10, 10],
      [14, 12],
      [17, 15],
      [18, 18],
    ]),
    2,
  );

  return grid.map((row) => row.map((v) => (v ? 'g' : '.')).join(''));
}

const BRAIN_GRID = buildBrainGrid();

function assertGrid(grid) {
  const w = grid[0].length;
  for (let y = 0; y < grid.length; y++) {
    if (grid[y].length !== w) {
      throw new Error(`Row ${y} width ${grid[y].length} != ${w}`);
    }
  }
}

function makeCanvas(size, fill) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = fill.r;
    png.data[i + 1] = fill.g;
    png.data[i + 2] = fill.b;
    png.data[i + 3] = fill.a;
  }
  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  png.data[i] = color.r;
  png.data[i + 1] = color.g;
  png.data[i + 2] = color.b;
  png.data[i + 3] = color.a;
}

function blitNearest(src, dst, dstX, dstY, scale, mapCell) {
  for (let sy = 0; sy < src.length; sy++) {
    for (let sx = 0; sx < src[sy].length; sx++) {
      const cell = src[sy][sx];
      const color = mapCell(cell);
      if (!color) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          setPixel(dst, dstX + sx * scale + dx, dstY + sy * scale + dy, color);
        }
      }
    }
  }
}

function renderIcon({ size, scale, bgMode, fgColor }) {
  const src = BRAIN_GRID.length;
  const brainPx = BRAIN_GRID[0].length * scale;
  const offset = Math.floor((size - brainPx) / 2);
  const png =
    bgMode === 'solid'
      ? makeCanvas(size, BG)
      : bgMode === 'clear'
        ? makeCanvas(size, CLEAR)
        : makeCanvas(size, BG);

  blitNearest(BRAIN_GRID, png, offset, offset, scale, (cell) => {
    if (cell === 'g') return fgColor;
    if (bgMode === 'solid' && cell === '.') return BG;
    return null;
  });

  return png;
}

function writePng(png, filePath) {
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('wrote', filePath, `${png.width}x${png.height}`);
}

assertGrid(BRAIN_GRID);

const BRAIN_SCALE = 16; // 48×16=768px，居中适配 1024 安全区

writePng(
  renderIcon({ size: 1024, scale: BRAIN_SCALE, bgMode: 'solid', fgColor: FG }),
  path.join(OUT, 'icon.png'),
);

writePng(
  renderIcon({ size: 1024, scale: BRAIN_SCALE, bgMode: 'clear', fgColor: FG }),
  path.join(OUT, 'android-icon-foreground.png'),
);

writePng(makeCanvas(1024, BG), path.join(OUT, 'android-icon-background.png'));

writePng(
  renderIcon({ size: 1024, scale: BRAIN_SCALE, bgMode: 'clear', fgColor: WHITE }),
  path.join(OUT, 'android-icon-monochrome.png'),
);

writePng(
  renderIcon({ size: 48, scale: 1, bgMode: 'solid', fgColor: FG }),
  path.join(OUT, 'favicon.png'),
);

writePng(
  renderIcon({ size: 1024, scale: BRAIN_SCALE, bgMode: 'solid', fgColor: FG }),
  path.join(OUT, 'splash-icon.png'),
);

const previewDir = path.join(OUT, 'logo-draft');
fs.mkdirSync(previewDir, { recursive: true });
writePng(
  renderIcon({ size: 384, scale: 8, bgMode: 'solid', fgColor: FG }),
  path.join(previewDir, 'brain-preview-48.png'),
);

console.log('Done — strict 2-color brain icons generated.');
