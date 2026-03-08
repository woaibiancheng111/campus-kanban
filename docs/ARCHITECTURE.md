# 架构设计（Architecture）

## 1. 总体架构
- 前端：Next.js (TypeScript)
- 后端：NestJS (TypeScript)
- DB：PostgreSQL
- ORM/迁移：Prisma + Prisma Migrate
- 部署：Docker + docker-compose
- CI：GitHub Actions

仓库形态：**monorepo**

```
apps/
  web/   # Next.js
  api/   # NestJS
packages/
  shared/ (可选，后续抽 DTO/types)
```

## 2. 关键设计点
### 2.1 认证
- JWT Bearer Access Token（MVP 先做 access token；refresh 可作为里程碑 2）
- 密码使用 bcrypt/argon2 哈希

### 2.2 多租户与鉴权
- workspace 是租户边界
- 所有资源通过 workspace 归属校验
- Guard：JwtAuthGuard + WorkspaceRoleGuard

### 2.3 看板排序与移动
- board_columns: unique(board_id, position)
- cards: unique(column_id, position)
- move 算法必须在事务内完成：
  - 目标列受影响区间批量 shift
  - 更新 card 的 column_id/position
  - 原列受影响区间回填

### 2.4 可观测性
- 结构化日志（含 requestId/userId/workspaceId）
- health: `/health`
- 审计日志：关键写操作写 audit_logs

## 3. 运行时拓扑（Compose）
- web: 3000
- api: 3001
- db: 5432

## 4. 里程碑
- M1: 仓库初始化 + Compose 跑通 + Prisma 迁移 + seed
- M2: Auth + Workspaces API + e2e
- M3: Boards/Columns/Cards + move
- M4: Web MVP（登录 + 看板展示 + 移动）
- M5: 测试/CI 完整化 + README
