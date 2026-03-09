# Campus Kanban（校园团队任务看板）

一个面向校园课程/竞赛小组的 Trello-lite 项目，支持：登录注册、工作区/项目/看板、卡片跨列移动。

- 前端：Next.js
- 后端：NestJS
- 数据库：PostgreSQL
- ORM：Prisma
- 部署：Docker Compose

---

## 一、项目结构

```text
campus-kanban/
├─ apps/
│  ├─ web/                  # Next.js 前端
│  └─ api/                  # NestJS 后端 + Prisma
├─ docs/
│  ├─ PRD.md
│  ├─ ARCHITECTURE.md
│  ├─ DB_SCHEMA.md
│  ├─ API_SPEC.yaml
│  └─ DEPLOY_DOCKER.md
├─ docker-compose.yml       # 开发环境
├─ docker-compose.prod.yml  # 生产环境
└─ .env.example
```

---

## 二、本地开发（推荐先跑通这个）

### 1) 安装依赖

```bash
npm install
npm install -w apps/api
npm install -w apps/web
```

### 2) 启动 PostgreSQL（仅数据库）

```bash
docker compose up -d db
```

### 3) 初始化 Prisma

```bash
npm run prisma:generate
cd apps/api && npx prisma migrate dev --name init && cd ../..
npm run seed
```

### 4) 启动前后端

```bash
npm run dev
```

### 5) 验证访问

- 前端：<http://localhost:3000>
- 健康检查：<http://localhost:3001/api/v1/health>

默认测试账号（seed 后可用）：
- 邮箱：`alice@campus.edu`
- 密码：`P@ssw0rd!`

---

## 三、Docker 一键启动（开发全栈）

```bash
docker compose up
```

---

## 四、生产 Docker 部署（你上线用这个）

### 1) 准备环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少修改：
- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`

### 2) 构建并启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3) 首次迁移/初始化

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

### 4) 检查服务

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3001/api/v1/health
```

完整部署文档见：`docs/DEPLOY_DOCKER.md`

---

## 五、常用命令

```bash
# 查看最近日志
docker compose -f docker-compose.prod.yml logs -f --tail=200

# 更新代码并发布
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 停止服务
docker compose -f docker-compose.prod.yml down
```

---

## 六、当前已实现功能（MVP）

- 用户注册 / 登录（JWT）
- 查询我的工作区
- 工作区下项目列表
- 项目下看板列表
- 列表+卡片展示
- 卡片跨列移动（含顺序处理）
- 基础 Docker 部署能力

---

## 七、下一步计划

- 细化 RBAC 权限
- 前端拖拽交互（替代按钮移动）
- 更完善的 E2E 测试
- Nginx + HTTPS 生产化模板
