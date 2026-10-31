import { Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { PrismaService } from '../../database/prisma.service';
import { ArenaService } from './arena.service';
import { EvaluateDto, FeedbackDto, SettingsDto } from './arena.dto';

@Controller('api/codearena')
@UseGuards(AuthGuard)
export class ArenaController {
  constructor(@Inject(ArenaService) private readonly arena: ArenaService, @Inject(PrismaService) private readonly db: PrismaService) {}
  @Get('problems') catalog() { return this.arena.catalog(); }
  @Post('problems/:id/evaluate')
  @RateLimit({ limit: 60, windowSeconds: 3600, scope: 'user', name: 'practice-judge' })
  evaluate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @ValidatedBody(EvaluateDto) body: EvaluateDto) { return this.arena.evaluate(user.id, id, body); }
  @Get('practice') practice(@CurrentUser() user: AuthenticatedUser) { return this.arena.practiceState(user.id); }
  @Put('bookmarks/:id') bookmark(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.arena.bookmark(user.id, id, true); }
  @Delete('bookmarks/:id') unbookmark(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.arena.bookmark(user.id, id, false); }
  @Get('summary') summary(@CurrentUser() user: AuthenticatedUser) { return this.arena.summary(user.id); }
  @Get('leaderboard') leaderboard(@Query('timeframe') timeframe?: string) { return this.arena.leaderboard(timeframe); }
  @Get('settings') settings(@CurrentUser() user: AuthenticatedUser) { return this.arena.settings(user.id); }
  @Put('settings') saveSettings(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(SettingsDto) body: SettingsDto) { return this.arena.saveSettings(user.id, body); }
  @Post('feedback')
  @RateLimit({ limit: 10, windowSeconds: 3600, scope: 'user', name: 'feedback' })
  async feedback(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(FeedbackDto) body: FeedbackDto) { await this.db.arenaFeedback.create({ data: { userId: user.id, ...body } }); return { success: true }; }
}
