/**
 * 从 candidates-50 中挑选头像写入正式库
 * 用法: node scripts/apply-avatar-selection.mjs 01 02 04 ...
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATE_DIR = path.join(__dirname, '..', 'assets', 'avatars-candidates-50');
const OUT_DIRS = [
  path.join(__dirname, '..', 'assets', 'avatars'),
  path.join(__dirname, '..', 'web', 'public', 'avatars'),
  path.join(__dirname, '..', 'web', 'src', 'assets', 'avatars'),
];

const EMOJI_BY_SLUG = {
  smile: '😀', cool: '😎', ghost: '👻', robot: '🤖', bee: '🐝', owl: '🦉',
  rabbit: '🐰', diamond: '💎', sun: '☀️', mushroom: '🍄', tree: '🌲', burger: '🍔',
  joystick: '🕹️', puzzle: '🧩', trophy: '🏆', crown: '👑', alien: '👽', cat: '🐱',
  dog: '🐶', cactus: '🌵', taco: '🌮', cloud: '☁️', rocket: '🚀', ufo: '🛸',
  camera: '📷', gamepad: '🎮', flower: '🌸', butterfly: '🦋',
};

const picks = process.argv.slice(2).map((n) => n.padStart(2, '0'));
if (picks.length === 0) {
  console.error('Usage: node scripts/apply-avatar-selection.mjs 01 02 ...');
  process.exit(1);
}

const catalog = JSON.parse(
  fs.readFileSync(path.join(CANDIDATE_DIR, 'manifest.json'), 'utf8'),
);
const byNum = Object.fromEntries(catalog.map((c) => [c.num, c]));

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('avatar-') && f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
  }
}

const manifest = [];
const emojis = [];

for (let i = 0; i < picks.length; i++) {
  const num = picks[i];
  const src = byNum[num];
  if (!src) {
    console.error('Unknown candidate num:', num);
    process.exit(1);
  }
  const id = i + 1;
  const outName = `avatar-${String(id).padStart(2, '0')}-${src.slug}.png`;
  const srcPath = path.join(CANDIDATE_DIR, src.filename);
  for (const dir of OUT_DIRS) {
    fs.copyFileSync(srcPath, path.join(dir, outName));
  }
  manifest.push({
    id,
    filename: outName,
    name: src.slug,
    label: src.label,
    bg: '#0D0E15',
    sourceCandidate: num,
  });
  emojis.push(EMOJI_BY_SLUG[src.slug] ?? '⭐');
  console.log(`${id}. ${outName} <- candidate ${num} ${src.label}`);
}

const manifestPath = path.join(__dirname, '..', 'src', 'constants', 'avatar-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const avatarsTs = `import manifest from './avatar-manifest.json';

/** ${manifest.length} 个低像素头像 — 深色底，scripts/apply-avatar-selection.mjs */
export const AVATAR_COUNT = manifest.length;

export const AVATAR_FILES: string[] = manifest.map((m) => m.filename);

/** RN / 小程序 canvas emoji 占位，与像素头像 id 一一对应 */
export const AVATAR_EMOJIS: string[] = ${JSON.stringify(emojis, null, 2).replace(/\n/g, '\n')};

export function getAvatarEmoji(avatarId: number): string {
  const index = Math.min(AVATAR_COUNT, Math.max(1, avatarId)) - 1;
  return AVATAR_EMOJIS[index] ?? AVATAR_EMOJIS[0];
}

/** H5 像素头像 URL（web/public/avatars/） */
export function getAvatarUrl(avatarId: number, basePath = '/avatars'): string {
  const index = Math.min(AVATAR_COUNT, Math.max(1, avatarId)) - 1;
  const file = AVATAR_FILES[index] ?? AVATAR_FILES[0];
  return \`\${basePath}/\${file}\`;
}

export function getAvatarName(avatarId: number): string {
  const index = Math.min(AVATAR_COUNT, Math.max(1, avatarId)) - 1;
  return manifest[index]?.name ?? 'avatar';
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'constants', 'avatars.ts'), avatarsTs);
console.log('\nmanifest ->', manifestPath);
console.log('avatars.ts updated, count =', manifest.length);
