/**
 * 微信小游戏构建 — esbuild 打包 game-src → dist/game.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHARED = path.join(ROOT, '..', 'src');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const src = path.join(from, name);
    const dest = path.join(to, name);
    if (fs.statSync(src).isDirectory()) {
      copyDir(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function cleanDistExtras() {
  for (const staleDir of ['pages', 'prebundle']) {
    fs.rmSync(path.join(DIST, staleDir), { recursive: true, force: true });
  }
  for (const name of fs.readdirSync(DIST)) {
    if (
      name.endsWith('.map') ||
      name.endsWith('.LICENSE.txt') ||
      name === 'app.js' ||
      name === 'app.json' ||
      name === 'app.wxss' ||
      name === 'common.js' ||
      name === 'vendors.js' ||
      name === 'taro.js' ||
      name === 'runtime.js' ||
      name === 'base.wxml' ||
      name === 'comp.js' ||
      name === 'comp.json' ||
      name === 'comp.wxml' ||
      name === 'utils.wxs'
    ) {
      fs.rmSync(path.join(DIST, name), { recursive: true, force: true });
    }
  }
}

function copyStaticFiles() {
  fs.copyFileSync(path.join(ROOT, 'game.json'), path.join(DIST, 'game.json'));

  const projectConfig = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'project.config.json'), 'utf8'),
  );
  projectConfig.miniprogramRoot = './';
  fs.writeFileSync(
    path.join(DIST, 'project.config.json'),
    JSON.stringify(projectConfig, null, 2),
  );

  const assetsSrc = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(DIST, 'assets'));
  }
}

function afterBuild() {
  cleanDistExtras();
  copyStaticFiles();
  console.log('[minigame] dist/ ready (game.js + game.json + assets)');
}

async function build({ watch = false } = {}) {
  fs.mkdirSync(DIST, { recursive: true });

  const options = {
    entryPoints: [path.join(ROOT, 'game-src/main.ts')],
    bundle: true,
    outfile: path.join(DIST, 'game.js'),
    platform: 'browser',
    format: 'iife',
    target: ['es2018'],
    sourcemap: false,
    alias: {
      '@shared': SHARED,
    },
    logLevel: 'info',
  };

  if (watch) {
    const ctx = await esbuild.context({
      ...options,
      plugins: [
        {
          name: 'post-copy',
          setup(build) {
            build.onEnd((result) => {
              if (result.errors.length === 0) {
                afterBuild();
              }
            });
          },
        },
      ],
    });
    await ctx.rebuild();
    afterBuild();
    await ctx.watch();
    console.log('[minigame] watching game-src…');
  } else {
    await esbuild.build(options);
    console.log('[minigame] bundled dist/game.js');
    afterBuild();
  }
}

const watch = process.argv.includes('--watch');
build({ watch }).catch((err) => {
  console.error(err);
  process.exit(1);
});
