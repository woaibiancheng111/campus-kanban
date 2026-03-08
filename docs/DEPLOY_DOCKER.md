# Docker 部署指南（生产）

## 1) 准备环境
```bash
git clone https://github.com/woaibiancheng111/campus-kanban.git
cd campus-kanban
cp .env.example .env
```
编辑 `.env`，至少改：
- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`

## 2) 构建并启动
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 3) 初始化数据库（首次）
```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

## 4) 访问
- Web: `http://服务器IP:3000`
- API Health: `http://服务器IP:3001/api/v1/health`

## 5) 更新发布
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

## 6) 回滚（按 commit）
```bash
git log --oneline
git checkout <commit>
docker compose -f docker-compose.prod.yml up -d --build
```
