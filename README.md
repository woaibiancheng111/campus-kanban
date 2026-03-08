# Campus Kanban (Trello-lite)

校园团队任务看板（Next.js + NestJS + PostgreSQL + Prisma）

## Tech Stack
- Web: Next.js (React)
- API: NestJS
- DB: PostgreSQL
- ORM: Prisma
- Deploy: Docker Compose
- CI: GitHub Actions

## Quick Start (Local)

### 1) Install deps
```bash
npm install
npm install -w apps/api
npm install -w apps/web
```

### 2) Start Postgres (docker)
```bash
docker compose up -d db
```

### 3) Setup DB
```bash
npm run prisma:generate
# first time
cd apps/api && npx prisma migrate dev --name init && cd ../..
npm run seed
```

### 4) Run both apps
```bash
npm run dev
```
- Web: http://localhost:3000
- API: http://localhost:3001/api/v1/health

Default test account (after seed):
- email: `alice@campus.edu`
- password: `P@ssw0rd!`

## Docker Compose full stack (dev)
```bash
docker compose up
```

## Production Docker Deploy
See `docs/DEPLOY_DOCKER.md`.

Quick commands:
```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

## Core APIs (MVP)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/boards/:boardId/columns?includeCards=true`
- `POST /api/v1/columns/:columnId/cards`
- `POST /api/v1/cards/:cardId/move`

## GitHub push
```bash
git init
git add .
git commit -m "feat: init campus kanban mvp"
# create remote repo then push
```
