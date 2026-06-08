# 脑波专家 · 微信小游戏

AppID: `wxb94cbaa68a975d82`（游戏类目）

## 产品经理：如何打开预览

### ① Mac 终端

```bash
cd ~/Guess-Master
npm run miniprogram:dev
```

看到 `[minigame] bundled dist/game.js` 后**不要关窗口**。

### ② 微信开发者工具

- 导入目录：**`Guess-Master/miniprogram`**
- AppID：`wxb94cbaa68a975d82`
- **详情 → 本地设置**：开发阶段勾选「不校验合法域名、web-view…」

### ③ 编译

点 **普通编译** 或 **Command + B**。应看到大厅（GUESS MASTER + 创建/加入房间）。

## 当前进度

| 功能 | 状态 |
|------|------|
| 大厅 / 房间 / 游戏 / 结果 | ✅ |
| 翻牌动画 | ✅ |
| 远程联机 | ✅ 代码就绪，等 ICP + 微信合法域名 |
| 服务器 | `api.guessmaster.cn`（备案通过后 HTTPS） |

## 远程联机配置

编辑 `miniprogram/.env.development`：

```bash
# 备案通过后：
SYNC_URL=https://api.guessmaster.cn
```

然后重新构建：

```bash
npm run miniprogram:build
```

构建日志出现 `[minigame] SYNC_URL=...` 表示已启用远程同步；未配置则使用本地 Mock（「添加测试玩家」）。

**微信后台**（备案通过后）：开发 → 开发设置 → 服务器域名

- request：`https://api.guessmaster.cn`
- socket：`wss://api.guessmaster.cn`

## 开发者

```bash
cd miniprogram && npm run build:game   # 单次构建
cd miniprogram && npm run dev:game     # 监听 game-src
```

源码：`miniprogram/game-src/`，共享逻辑：`../src/`。

## 服务器部署

联机服务为 `server/index.ts`，生产环境示例：

```bash
cd /root/Guess-Master
npm install
nohup npm run sync-server > /root/sync.log 2>&1 &
curl http://127.0.0.1:8787/health
```

Nginx 将 `api.guessmaster.cn` 反代到 `127.0.0.1:8787`（HTTP/HTTPS 均已配置）。
