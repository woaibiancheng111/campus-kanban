import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('P@ssw0rd!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'alice@campus.edu' },
    update: {},
    create: { email: 'alice@campus.edu', displayName: 'Alice', passwordHash },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: '数据结构课程小组',
      slug: `ds-team-${Date.now()}`,
      ownerUserId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
      projects: {
        create: {
          name: '课程大作业',
          boards: {
            create: {
              name: '开发看板',
              columns: {
                create: [
                  { name: 'Todo', position: 0 },
                  { name: 'Doing', position: 1 },
                  { name: 'Done', position: 2 },
                ],
              },
            },
          },
        },
      },
    },
    include: { projects: { include: { boards: { include: { columns: true } } } } },
  });

  const todo = workspace.projects[0].boards[0].columns.find((c) => c.position === 0)!;
  for (let i = 0; i < 5; i++) {
    await prisma.card.create({
      data: {
        columnId: todo.id,
        title: `示例任务 ${i + 1}`,
        description: '通过 seed 创建',
        position: i,
        createdBy: user.id,
      },
    });
  }

  console.log('Seed done. user=', user.email);
}

main().finally(async () => prisma.$disconnect());
