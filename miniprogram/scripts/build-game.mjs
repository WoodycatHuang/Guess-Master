/**
 * 微信小游戏构建 — esbuild 打包 game-src → game.js（与 project.config.json 同级）
 *
 * 标准小游戏目录：导入 miniprogram/ 即可，不要导入 dist/。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTFILE = path.join(ROOT, 'game.js');
const SHARED = path.join(ROOT, '..', 'src');

function cleanStaleArtifacts() {
  const staleDirs = ['dist', path.join(ROOT, 'pages'), path.join(ROOT, 'prebundle')];
  for (const dir of staleDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  for (const name of [
    'app.js',
    'app.json',
    'app.wxss',
    'common.js',
    'vendors.js',
    'taro.js',
    'runtime.js',
    'base.wxml',
    'comp.js',
    'comp.json',
    'comp.wxml',
    'utils.wxs',
  ]) {
    fs.rmSync(path.join(ROOT, name), { force: true });
  }
}

function loadSyncUrl() {
  const envPath = path.join(ROOT, '.env.development');
  if (!fs.existsSync(envPath)) return '';
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key === 'SYNC_URL' || key === 'GUESS_MASTER_SYNC_URL') {
      return value;
    }
  }
  return '';
}

async function build({ watch = false } = {}) {
  cleanStaleArtifacts();
  const syncUrl = loadSyncUrl();
  if (syncUrl) {
    console.log(`[minigame] SYNC_URL=${syncUrl}`);
  }

  const options = {
    entryPoints: [path.join(ROOT, 'game-src/main.ts')],
    bundle: true,
    outfile: OUTFILE,
    platform: 'browser',
    format: 'iife',
    target: ['es2018'],
    sourcemap: false,
    define: {
      __SYNC_URL__: JSON.stringify(syncUrl),
    },
    alias: {
      '@shared': SHARED,
    },
    logLevel: 'info',
    banner: {
      js: `console.log('[GuessMaster] game.js loaded', Date.now());`,
    },
  };

  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.rebuild();
    console.log('[minigame] game.js ready (watching game-src)');
    await ctx.watch();
  } else {
    await esbuild.build(options);
    console.log('[minigame] bundled game.js');
  }
}

const watch = process.argv.includes('--watch');
build({ watch }).catch((err) => {
  console.error(err);
  process.exit(1);
});
