# 脑波专家 · 微信小程序

> 小游戏审批未通过后，改走 **小程序** 提审。联机服务器 ICP 已备案：`https://api.guessmaster.cn`

## 快速开始

### 0. 前置

- Mac 请用 **ARM64 版**微信开发者工具（M 系列芯片）
- 联机服务已可用：`curl https://api.guessmaster.cn/health` → `{"ok":true,...}`

### 1. 安装依赖

```bash
cd ~/Guess-Master/weapp && npm install
```

### 2. 构建

```bash
cd ~/Guess-Master && npm run weapp:build
# 开发监听
npm run weapp:dev
```

### 3. 微信开发者工具

- **导入目录：** `Guess-Master/weapp`（不是 `miniprogram/` 小游戏目录）
- **AppID：** 注册小程序后填入 `project.config.json` 的 `appid`（开发阶段可用测试号）
- **详情 → 本地设置：** 生产域名已备案时可开启域名校验；本地调试联机需勾选「不校验合法域名」

### 4. 联机配置

`weapp/.env.development` 已默认：

```bash
TARO_APP_SYNC_URL=https://api.guessmaster.cn
```

修改后重新 `npm run weapp:build`。

构建产物在 `weapp/dist/`，分享图等资源会从 `miniprogram/assets/` 复制到 `dist/assets/`。

## 微信后台（AppID 注册后）

1. [微信公众平台](https://mp.weixin.qq.com/) 注册 **小程序**（非小游戏）
2. 开发 → 开发设置 → 服务器域名：
   - request：`https://api.guessmaster.cn`
   - socket：`wss://api.guessmaster.cn`
3. 将 `project.config.json` 中 `appid` 从 `touristappid` 改为真实 AppID

### 域名配置清单

| 类型 | 域名 | 状态 |
|------|------|------|
| request 合法域名 | `https://api.guessmaster.cn` | ICP 已通过，待填入微信后台 |
| socket 合法域名 | `wss://api.guessmaster.cn` | 同上 |
| 业务域名（如有 web-view） | — | 暂不需要 |

注册 AppID 前可在开发者工具选 **测试号** 或保持 `touristappid` 本地预览。

## 页面

| 页面 | 路径 |
|------|------|
| 大厅 | `pages/lobby` |
| 房间 | `pages/room` |
| 游戏 | `pages/game` |
| 结果 | `pages/result` |

共享业务逻辑：`../src/`（房间引擎、题库、类型）

## 与小游戏目录的关系

| 目录 | 用途 |
|------|------|
| `weapp/` | **小程序（当前主线）** Taro + React |
| `miniprogram/` | 小游戏 Canvas 版（已冻结，仅作参考） |
