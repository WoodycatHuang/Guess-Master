#!/usr/bin/env bash
# 在服务器上拉代码并重启联机服务
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/deploy/.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/deploy/.env"
fi

: "${DEPLOY_HOST:?请设置 DEPLOY_HOST（或在 deploy/.env 中配置）}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_REPO_PATH="${DEPLOY_REPO_PATH:-/root/Guess-Master}"

echo "▶ 更新服务器代码并重启联机服务…"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
set -euo pipefail
cd '${DEPLOY_REPO_PATH}'
git pull
npm install
if systemctl is-active --quiet guess-master-sync 2>/dev/null; then
  sudo systemctl restart guess-master-sync
else
  pkill -f 'tsx server/index.ts' 2>/dev/null || true
  nohup npm run sync-server > /root/sync.log 2>&1 &
fi
sleep 2
curl -sf http://127.0.0.1:8787/health
echo ""
EOF

echo "▶ 检查公网 API…"
curl -sf "https://api.guessmaster.cn/health"
echo ""
echo "✓ 联机服务已更新"
