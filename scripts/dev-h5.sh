#!/usr/bin/env bash
# 本地 H5 一键开发：联机服务 + 网页（默认端口 8787 / 5173）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cleanup() {
  if [[ -n "${SYNC_PID:-}" ]] && kill -0 "$SYNC_PID" 2>/dev/null; then
    kill "$SYNC_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "▶ 启动联机服务 http://127.0.0.1:8787"
npm run sync-server &
SYNC_PID=$!

for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8787/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

echo "▶ 启动 H5  http://localhost:5173"
echo "   浏览器打开 http://localhost:5173  输入昵称 → 创建房间"
VITE_SYNC_URL=http://127.0.0.1:8787 npm run dev --prefix web
