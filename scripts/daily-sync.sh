#!/usr/bin/env bash
# 每日同步：拉取 → 提交 → 推送
#
# 一次性配置（只需做一次）：
#   git config --global credential.helper osxkeychain
#   env -u HTTP_PROXY -u http_proxy git push -u origin main
#   （Password 处粘贴 GitHub Token，之后由钥匙串记住，不必每天重输）
#
# 用法：
#   ./scripts/daily-sync.sh
#   ./scripts/daily-sync.sh "今天改了大厅布局"
#   npm run sync

set -euo pipefail

# ── 颜色与日志 ──────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RESET='\033[0m'
  C_DIM='\033[2m'
  C_GREEN='\033[0;32m'
  C_RED='\033[0;31m'
  C_YELLOW='\033[0;33m'
  C_CYAN='\033[0;36m'
  C_BOLD='\033[1m'
else
  C_RESET='' C_DIM='' C_GREEN='' C_RED='' C_YELLOW='' C_CYAN='' C_BOLD=''
fi

STEP=0
SYNC_OK=false

log()  { echo -e "${C_DIM}[$(date +%H:%M:%S)]${C_RESET} $*"; }
ok()   { echo -e "${C_GREEN}✓${C_RESET} $*"; }
warn() { echo -e "${C_YELLOW}!${C_RESET} $*"; }
fail() { echo -e "${C_RED}✗${C_RESET} $*" >&2; }

step() {
  STEP=$((STEP + 1))
  echo ""
  echo -e "${C_CYAN}${C_BOLD}[$STEP] $*${C_RESET}"
}

on_error() {
  local code=$?
  echo ""
  echo -e "${C_RED}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo -e "${C_RED}${C_BOLD}  ✗ 同步失败（第 $STEP 步出错，退出码 $code）${C_RESET}"
  echo -e "${C_RED}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo ""
  echo "常见原因："
  echo "  · 推送时卡在 Password → 粘贴 GitHub Token（输入不显示，正常）"
  echo "  · 网络/代理问题 → env -u HTTP_PROXY git push origin main"
  echo "  · 拉取冲突 → 手动解决后重新运行"
  exit "$code"
}
trap on_error ERR

unset HTTP_PROXY http_proxy HTTPS_PROXY https_proxy ALL_PROXY all_proxy

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "当前目录不是 git 仓库"
  exit 1
fi

BRANCH="$(git branch --show-current)"
REMOTE="${REMOTE:-origin}"
MSG="${1:-sync: $(date +%Y-%m-%d)}"
REMOTE_URL="$(git remote get-url "$REMOTE" 2>/dev/null || echo '（未配置）')"

echo ""
echo -e "${C_BOLD}╔══════════════════════════════════════╗${C_RESET}"
echo -e "${C_BOLD}║       Guess-Master 每日同步          ║${C_RESET}"
echo -e "${C_BOLD}╚══════════════════════════════════════╝${C_RESET}"
log "仓库: $ROOT"
log "分支: $BRANCH"
log "远程: $REMOTE ($REMOTE_URL)"
log "提交信息: $MSG"
warn "若某步长时间无输出，可能在等待 GitHub Token（输入时屏幕空白，属正常）"

# ── 1. 拉取 ───────────────────────────────────────────
step "拉取远程最新"
if git rev-parse "$REMOTE/$BRANCH" >/dev/null 2>&1; then
  BEFORE="$(git rev-parse HEAD)"
  git pull --rebase "$REMOTE" "$BRANCH"
  AFTER="$(git rev-parse HEAD)"
  if [[ "$BEFORE" == "$AFTER" ]]; then
    ok "已是最新，无需拉取"
  else
    ok "拉取成功，HEAD: ${BEFORE:0:7} → ${AFTER:0:7}"
    git log --oneline "${BEFORE}..${AFTER}" 2>/dev/null | sed 's/^/    /' || true
  fi
else
  warn "尚未设置 upstream（$REMOTE/$BRANCH），跳过 pull"
fi

# ── 2. 检查状态 ───────────────────────────────────────
step "检查本地改动"
git status -sb
echo ""

STAGED_OR_UNSTAGED="$(git status --porcelain)"
AHEAD="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count HEAD.."$REMOTE/$BRANCH" 2>/dev/null || echo 0)"

if [[ -n "$STAGED_OR_UNSTAGED" ]]; then
  CHANGED_COUNT="$(echo "$STAGED_OR_UNSTAGED" | wc -l | tr -d ' ')"
  log "发现 $CHANGED_COUNT 个文件有改动："
  echo "$STAGED_OR_UNSTAGED" | sed 's/^/    /'
elif [[ "$AHEAD" -eq 0 ]]; then
  ok "工作区干净，且本地与远程一致，无需同步"
  echo ""
  echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo -e "${C_GREEN}${C_BOLD}  ✓ 已是最新，无需操作${C_RESET}"
  echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo ""
  exit 0
else
  log "工作区无新改动，但有 $AHEAD 个本地 commit 待推送"
  git log --oneline -"$AHEAD" 2>/dev/null | sed 's/^/    /' || true
fi

# ── 3. 提交 ───────────────────────────────────────────
if [[ -n "$STAGED_OR_UNSTAGED" ]]; then
  step "提交改动"
  git add -A
  git reset HEAD .env 2>/dev/null || true
  echo ""
  git diff --cached --stat | sed 's/^/    /'
  echo ""
  git commit -m "$MSG"
  ok "提交成功: $MSG"
  NEW_SHA="$(git rev-parse --short HEAD)"
  log "新 commit: $NEW_SHA"
fi

# ── 4. 推送 ───────────────────────────────────────────
step "推送到 $REMOTE/$BRANCH"
log "正在推送…（可能需要输入 Token，输入时屏幕无回显，属正常）"
git push "$REMOTE" "$BRANCH"
ok "推送成功"

# ── 5. 验证 ───────────────────────────────────────────
step "验证同步结果"
git fetch "$REMOTE" "$BRANCH" 2>/dev/null || true
FINAL_AHEAD="$(git rev-list --count "$REMOTE/$BRANCH"..HEAD 2>/dev/null || echo '?')"
FINAL_BEHIND="$(git rev-list --count HEAD.."$REMOTE/$BRANCH" 2>/dev/null || echo '?')"

echo ""
git status -sb
echo ""

if [[ "$FINAL_AHEAD" == "0" && "$FINAL_BEHIND" == "0" ]]; then
  SYNC_OK=true
  echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo -e "${C_GREEN}${C_BOLD}  ✓ 同步成功！本地与 GitHub 已一致${C_RESET}"
  echo -e "${C_GREEN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
else
  warn "推送后仍有差异：领先 $FINAL_AHEAD / 落后 $FINAL_BEHIND，请检查网络或远程分支"
fi
echo ""
