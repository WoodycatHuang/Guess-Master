#!/usr/bin/env bash
# 本地构建 H5 并上传到服务器
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/deploy/.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/deploy/.env"
fi

: "${DEPLOY_HOST:?请设置 DEPLOY_HOST（或在 deploy/.env 中配置）}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_WEB_PATH="${DEPLOY_WEB_PATH:-/var/www/guessmaster}"

echo "▶ 构建 H5（production）…"
npm run web:build

echo "▶ 上传到 ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_WEB_PATH}/"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_WEB_PATH}'"
rsync -avz --delete \
  -e ssh \
  "${ROOT}/web/dist/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_WEB_PATH}/"

echo "✓ H5 已部署。请访问 https://guessmaster.cn"
