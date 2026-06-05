# 脑波专家 · 微信小游戏

AppID: `wxb94cbaa68a975d82`（游戏类目）

## 产品经理：如何打开预览

### ① Mac 终端（必须）

```bash
cd ~/Guess-Master
npm run miniprogram:dev
```

看到 `[minigame] bundled dist/game.js` 后**不要关窗口**。

### ② 微信开发者工具

- 导入目录：**`Guess-Master/miniprogram`**
- AppID：`wxb94cbaa68a975d82`
- **详情 → 本地设置**：勾选「不校验合法域名」

### ③ 编译

点 **普通编译** 或 **Command + B**。

应看到：深底 + 绿色 **GUESS MASTER** + 昵称/头像/创建房间。

### ④ 图片素材

`miniprogram/assets/` — 平台头像用 `mp-avatar-144.png`  
重新生成：`npm run miniprogram:assets`

## 当前进度（小游戏版）

| 阶段 | 状态 |
|------|------|
| 骨架 + 大厅 Canvas | ✅ |
| 房间 + 分享 + 演示联机 | ✅ |
| 游戏页（排序） | ⏳ 下一阶段 |
| 结果页 | ⏳ |
| 真·联机服务器 | ⏳ 备案后 |

## 开发者

```bash
cd miniprogram && npm run build:game   # 单次构建
cd miniprogram && npm run dev:game     # 监听 game-src
```

源码在 `miniprogram/game-src/`，复用 `../src/` 房间逻辑。

旧 Taro 小程序代码保留在 `miniprogram/src/`（已停用）。
