import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';

@Controller('api/v1')
export class AppController {
  constructor(private prisma: PrismaService, private app: AppService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Post('auth/register')
  register(@Body() body: any) {
    return this.app.register(body.email, body.password, body.displayName);
  }

  @Post('auth/login')
  login(@Body() body: any) {
    return this.app.login(body.email, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('auth/me')
  me(@Req() req: any) {
    return { user: req.user };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('workspaces')
  async workspaces(@Req() req: any) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId: req.user.userId } } },
      include: { members: true },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('workspaces')
  async createWorkspace(@Req() req: any, @Body() body: any) {
    return this.prisma.workspace.create({
      data: {
        name: body.name,
        slug: body.slug,
        ownerUserId: req.user.userId,
        members: { create: { userId: req.user.userId, role: 'OWNER' } },
      },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('workspaces/:workspaceId/projects')
  projects(@Param('workspaceId') workspaceId: string) {
    return this.prisma.project.findMany({ where: { workspaceId, archivedAt: null } });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('workspaces/:workspaceId/projects')
  createProject(@Param('workspaceId') workspaceId: string, @Body() body: any) {
    return this.prisma.project.create({ data: { workspaceId, name: body.name, description: body.description } });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('projects/:projectId/boards')
  boards(@Param('projectId') projectId: string) {
    return this.prisma.board.findMany({ where: { projectId, archivedAt: null } });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('projects/:projectId/boards')
  async createBoard(@Param('projectId') projectId: string, @Body() body: any) {
    return this.prisma.board.create({
      data: {
        projectId,
        name: body.name,
        columns: {
          create: [
            { name: 'Todo', position: 0 },
            { name: 'Doing', position: 1 },
            { name: 'Done', position: 2 },
          ],
        },
      },
      include: { columns: true },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('boards/:boardId/columns')
  columns(@Param('boardId') boardId: string, @Query('includeCards') includeCards?: string) {
    return this.prisma.boardColumn.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: includeCards === 'true' ? { cards: { orderBy: { position: 'asc' } } } : undefined,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('columns/:columnId/cards')
  async createCard(@Req() req: any, @Param('columnId') columnId: string, @Body() body: any) {
    const count = await this.prisma.card.count({ where: { columnId } });
    return this.prisma.card.create({
      data: {
        columnId,
        title: body.title,
        description: body.description,
        position: count,
        createdBy: req.user.userId,
      },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('cards/:cardId')
  updateCard(@Param('cardId') cardId: string, @Body() body: any) {
    return this.prisma.card.update({ where: { id: cardId }, data: body });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cards/:cardId/move')
  moveCard(@Req() req: any, @Param('cardId') cardId: string, @Body() body: any) {
    return this.app.moveCard(req.user.userId, cardId, body.toColumnId, body.toPosition);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cards/:cardId/comments')
  comments(@Param('cardId') cardId: string) {
    return this.prisma.cardComment.findMany({ where: { cardId }, orderBy: { createdAt: 'asc' } });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cards/:cardId/comments')
  comment(@Req() req: any, @Param('cardId') cardId: string, @Body() body: any) {
    return this.prisma.cardComment.create({ data: { cardId, authorUserId: req.user.userId, content: body.content } });
  }
}
