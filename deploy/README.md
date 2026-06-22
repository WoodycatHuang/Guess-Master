# M5 · 部署 guessmaster.cn

将 **H5 静态页** 部署到 `https://guessmaster.cn`，**联机 API** 部署到 `https://api.guessmaster.cn`。

---

## 架构

```
guessmaster.cn      → Nginx 静态文件（web/dist/）
api.guessmaster.cn  → Nginx 反代 → 127.0.0.1:8787（server/index.ts）
```

---

## 一、服务器首次初始化（只做一次）

假设 VPS 为 **Linux**（CentOS / Ubuntu），已备案域名解析到服务器 IP。

### 1. 安装依赖

```bash
# Node.js 20+（按发行版安装）
node -v   # 应 ≥ 20

sudo apt install nginx certbot python3-certbot-nginx   # Debian/Ubuntu
# 或 yum install nginx certbot python3-certbot-nginx   # CentOS
```

### 2. 克隆代码

```bash
cd /root
git clone <你的仓库地址> Guess-Master
cd Guess-Master
npm install
```

### 3. Nginx 配置

```bash
# WebSocket 映射（写入 nginx.conf 的 http { } 内，仅一次）
sudo cp deploy/nginx/guess-master-ws-map.conf /etc/nginx/conf.d/
# 编辑 /etc/nginx/nginx.conf，在 http { 内加一行：
#   include /etc/nginx/conf.d/guess-master-ws-map.conf;

sudo cp deploy/nginx/guessmaster.cn.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/api.guessmaster.cn.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/guessmaster.cn.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.guessmaster.cn.conf /etc/nginx/sites-enabled/

sudo mkdir -p /var/www/guessmaster
sudo nginx -t && sudo systemctl reload nginx
```

### 4. HTTPS 证书

```bash
sudo certbot --nginx -d guessmaster.cn -d www.guessmaster.cn -d api.guessmaster.cn
sudo nginx -t && sudo systemctl reload nginx
```

### 5. 联机服务（systemd）

```bash
sudo cp deploy/systemd/guess-master-sync.service /etc/systemd/system/
# 如代码不在 /root/Guess-Master，编辑 WorkingDirectory
sudo systemctl daemon-reload
sudo systemctl enable --now guess-master-sync
curl http://127.0.0.1:8787/health
curl https://api.guessmaster.cn/health
```

---

## 二、日常部署（Mac 本地执行）

### 1. 配置部署目标

```bash
cd ~/Guess-Master
cp deploy/env.example deploy/.env
# 编辑 deploy/.env，填写 DEPLOY_HOST=你的服务器IP
```

### 2. 部署 H5 网页

```bash
npm run deploy:web
```

等价于：本地 `npm run web:build` → rsync `web/dist/` 到服务器 `/var/www/guessmaster/`。

### 3. 更新联机 API（含困难模式等新逻辑）

```bash
npm run deploy:api
```

等价于：SSH 到服务器 `git pull` → `npm install` → 重启 `guess-master-sync`。

### 4. 冒烟测试

```bash
npm run deploy:smoke
```

检查 `api.guessmaster.cn/health` 与 `guessmaster.cn` 是否可访问。

---

## 三、M5 验收步骤

1. 浏览器打开 **https://guessmaster.cn** → 看到大厅页
2. 打开 **https://api.guessmaster.cn/health** → `{"ok":true,...}`
3. 创建房间 → 两台设备联机同步正常
4. 困难模式每人 2 张牌（需已 `deploy:api` 更新服务端）
5. 分享链接格式：`https://guessmaster.cn/?room=xxxx`
6. 直接访问 `https://guessmaster.cn/room/xxxx` 不 404（SPA 回退）

---

## 四、常见问题

| 现象 | 处理 |
|------|------|
| 浏览器无法连接 api | 先 `deploy:api`，检查 `systemctl status guess-master-sync` |
| 困难模式只有 1 张牌 | 线上 API 未更新，执行 `npm run deploy:api` |
| 深链 404 | nginx 缺少 `try_files $uri $uri/ /index.html` |
| WebSocket 连不上 | 确认 ws-map 已 include，api 站点有 Upgrade 头 |
| deploy:web 报 Permission denied | 检查 SSH 密钥，`DEPLOY_USER` 是否有写 `/var/www/guessmaster` 权限 |

---

## 文件清单

| 文件 | 用途 |
|------|------|
| `deploy/nginx/guessmaster.cn.conf` | H5 静态站 |
| `deploy/nginx/api.guessmaster.cn.conf` | API 反代 |
| `deploy/nginx/guess-master-ws-map.conf` | WebSocket 升级 |
| `deploy/systemd/guess-master-sync.service` | 联机守护进程 |
| `scripts/deploy-web.sh` | 构建并上传 H5 |
| `scripts/deploy-api.sh` | 更新并重启 API |
| `scripts/deploy-smoke.sh` | 部署后自检 |
