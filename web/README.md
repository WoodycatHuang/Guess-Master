# 猜测大师 · 网页 H5

域名：**https://guessmaster.cn**（与 ICP 备案一致）  
联机：**https://api.guessmaster.cn**

## 本地开发（推荐）

**一条命令**（联机 + 网页一起启动）：

```bash
cd ~/Guess-Master && npm run web:local
```

浏览器打开 **http://localhost:5173** → 输入昵称 → **创建房间**。

页面底部应显示：`联机正常 · http://127.0.0.1:8787`

---

手动分两终端也可以：

```bash
# 终端 1
cd ~/Guess-Master && npm run sync-server

# 终端 2
cd ~/Guess-Master && npm run web:dev
```

`web/.env.development` 默认已是 `VITE_SYNC_URL=http://127.0.0.1:8787`。

---

### 关于线上 api.guessmaster.cn

若浏览器报「无法连接 https://api.guessmaster.cn」，说明**你当前网络访问不到线上联机**（DNS/防火墙/证书等）。本地测试请用上面的 `web:local`，不要改回线上地址。

可在浏览器直接打开 https://api.guessmaster.cn/health 自检：应看到 `{"ok":true,...}`。

## 构建（部署到 guessmaster.cn）

```bash
cd ~/Guess-Master && npm run web:build
```

产物在 `web/dist/`，上传到服务器 Nginx 网站根目录。

## M4 验收步骤

1. `npm run web:local`
2. 完成一局：房主排序并提交 → 进入结果页
3. 应看到 **从左到右依次翻牌**（约 0.7 秒一张），显示真实数字
4. 排序正确 → **✓ SUCCESS · 挑战成功**；故意排错 → 错误位置 **标红抖动**
5. 点 **「再来一局」** → 回到房间等待页（`/room/xxxx`）
6. 困难模式：同一人两张牌分别翻开，边框保持绿/青

## M3 验收步骤

1. `npm run web:dev`
2. 房主：创建房间 → 添加测试玩家 → 开始游戏（简单模式）
3. 游戏页底部应出现 **排序区**：长按玩家头像可拖动调整顺序
4. 点 **「排序完成，准备开车」** → 应跳转到 `/result/:roomId`（结果页 M4 仍为占位）
5. **客人视角**：另一台设备加入同一局 → 只能看到话题 + 自己的数字牌 +「房主正在努力排序中…」
6. **困难模式**：≤5 人开局选困难 → 排序区每人出现 **两张牌**（绿/青边框），均可拖动排序  
   （须本地 `npm run sync-server` + `VITE_SYNC_URL=http://127.0.0.1:8787`，见上文）

## M2 验收步骤

1. `npm run web:dev`
2. 房主：创建房间 → 点「+ 添加测试玩家」直到 ≥2 人
3. 点「开始游戏」→ 选简单/困难 → 应跳转到游戏页（显示话题与你的数字牌）
4. 复制邀请链接，另一台设备打开 `/?room=xxxx` → 加入同一房间
5. 生产构建后分享链接格式为 `https://guessmaster.cn/?room=xxxx`

## M1 验收步骤

1. 终端执行 `npm run web:dev`
2. 输入昵称、选头像 → **创建房间**
3. 应跳转到 `/room/xxxx`，看到房间号与玩家列表
4. 另一台设备浏览器打开 `http://<你的IP>:5173/?room=xxxx` → 加入
5. 两台设备玩家列表应同步更新
6. 点「复制邀请链接」可分享给朋友

## 环境变量

`web/.env.development` / `.env.production`：

```bash
VITE_SYNC_URL=https://api.guessmaster.cn
```
