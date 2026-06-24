import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'visitors.json');

interface VisitorStore {
  deviceIds: string[];
}

function loadIds(): Set<string> {
  try {
    if (!fs.existsSync(STORE_FILE)) return new Set();
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const data = JSON.parse(raw) as VisitorStore;
    if (!Array.isArray(data.deviceIds)) return new Set();
    return new Set(data.deviceIds.filter((id) => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function saveIds(ids: Set<string>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    STORE_FILE,
    JSON.stringify({ deviceIds: [...ids] }, null, 2),
    'utf8',
  );
}

export function recordVisit(deviceId: string): { total: number; isNew: boolean } {
  const trimmed = deviceId.trim();
  if (!trimmed || trimmed.length > 128) {
    throw new Error('invalid deviceId');
  }

  const ids = loadIds();
  const isNew = !ids.has(trimmed);
  if (isNew) {
    ids.add(trimmed);
    saveIds(ids);
  }
  return { total: ids.size, isNew };
}

export function getVisitorCount(): number {
  return loadIds().size;
}
