#!/usr/bin/env bash
# 将本地 API 源码同步到服务器并重启联机服务
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

RSYNC=(rsync -avz -e ssh)

echo "▶ 同步 API 源码到 ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REPO_PATH}/"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_REPO_PATH}/server' '${DEPLOY_REPO_PATH}/src' '${DEPLOY_REPO_PATH}/data'"

"${RSYNC[@]}" "${ROOT}/server/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REPO_PATH}/server/"
"${RSYNC[@]}" "${ROOT}/src/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REPO_PATH}/src/"
"${RSYNC[@]}" "${ROOT}/package.json" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REPO_PATH}/"
if [[ -f "${ROOT}/package-lock.json" ]]; then
  "${RSYNC[@]}" "${ROOT}/package-lock.json" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REPO_PATH}/"
fi

echo "▶ 安装依赖并重启联机服务…"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<EOF
set -euo pipefail
cd '${DEPLOY_REPO_PATH}'
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
curl -sf http://127.0.0.1:8787/stats/visitors
echo ""
EOF

echo "▶ 检查公网 API…"
curl -sf "https://api.guessmaster.cn/health"
echo ""
curl -sf "https://api.guessmaster.cn/stats/visitors"
echo ""
echo "✓ 联机服务已更新（含访问统计）"
