# 猜测大师 · 网页 H5

域名：**https://guessmaster.cn**（与 ICP 备案一致）  
联机：**https://api.guessmaster.cn**

## 本地开发

```bash
cd ~/Guess-Master/web && npm install
cd ~/Guess-Master && npm run web:dev
```

浏览器打开 `http://localhost:5173`（手机同一 WiFi 可用电脑 IP:5173 测试）。

## 构建（部署到 guessmaster.cn）

```bash
cd ~/Guess-Master && npm run web:build
```

产物在 `web/dist/`，上传到服务器 Nginx 网站根目录。

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
