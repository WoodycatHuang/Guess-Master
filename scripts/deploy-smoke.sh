#!/usr/bin/env bash
# 部署后冒烟测试
set -euo pipefail

echo "▶ API health"
curl -sf https://api.guessmaster.cn/health | python3 -m json.tool

echo "▶ API 访问统计"
curl -sf https://api.guessmaster.cn/stats/visitors | python3 -m json.tool

echo "▶ H5 首页"
code=$(curl -so /dev/null -w '%{http_code}' https://guessmaster.cn/)
if [[ "$code" != "200" ]]; then
  echo "guessmaster.cn 返回 HTTP $code"
  exit 1
fi
echo "HTTP $code OK"

echo "▶ H5 SPA 深链"
code=$(curl -so /dev/null -w '%{http_code}' https://guessmaster.cn/room/TEST01)
if [[ "$code" != "200" ]]; then
  echo "/room/TEST01 返回 HTTP $code（nginx 需 try_files 回退 index.html）"
  exit 1
fi
echo "HTTP $code OK"

echo "✓ 冒烟测试通过"
