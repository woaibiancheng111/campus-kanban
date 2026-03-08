import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(email: string, password: string, displayName: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { email, passwordHash, displayName } });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, displayName: user.displayName });
    return { accessToken, user: { id: user.id, email: user.email, displayName: user.displayName } };
  }

  async moveCard(actorUserId: string, cardId: string, toColumnId: string, toPosition: number) {
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { id: cardId } });
      if (!card) throw new Error('Card not found');

      if (card.columnId === toColumnId) {
        if (toPosition > card.position) {
          await tx.card.updateMany({
            where: { columnId: card.columnId, position: { gt: card.position, lte: toPosition } },
            data: { position: { decrement: 1 } },
          });
        } else if (toPosition < card.position) {
          await tx.card.updateMany({
            where: { columnId: card.columnId, position: { gte: toPosition, lt: card.position } },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        await tx.card.updateMany({
          where: { columnId: card.columnId, position: { gt: card.position } },
          data: { position: { decrement: 1 } },
        });
        await tx.card.updateMany({
          where: { columnId: toColumnId, position: { gte: toPosition } },
          data: { position: { increment: 1 } },
        });
      }

      const updated = await tx.card.update({ where: { id: cardId }, data: { columnId: toColumnId, position: toPosition } });

      await tx.auditLog.create({
        data: {
          workspaceId: (await tx.project.findFirst({ where: { boards: { some: { columns: { some: { id: toColumnId } } } } } }))?.workspaceId || '',
          actorUserId,
          action: 'CARD_MOVED',
          entityType: 'CARD',
          entityId: cardId,
          meta: { fromColumnId: card.columnId, toColumnId, toPosition },
        },
      }).catch(() => undefined);

      return updated;
    });
  }
}
