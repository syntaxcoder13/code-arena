import { BadRequestException, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { BattleService } from '../battles/battle.service';
import { SubmissionService } from '../battles/submission.service';
import { ArenaService } from './arena.service';
import { EvaluateDto, CreateRoomDto } from './arena.dto';

@Controller('api/arena')
@UseGuards(AuthGuard)
export class ArenaPlayController {
  constructor(@Inject(ArenaService) private readonly arena: ArenaService, @Inject(BattleService) private readonly battles: BattleService, @Inject(SubmissionService) private readonly submissions: SubmissionService) {}
  @Post('rooms')
  @RateLimit({ limit: 20, windowSeconds: 3600, scope: 'user', name: 'arena-room' })
  createRoom(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(CreateRoomDto) body: CreateRoomDto) {
    return this.battles.createPublic(user.id, body, body.privateRoom ? 'PRIVATE' : 'PUBLIC');
  }
  @Post('rooms/:id/join')
  async joinRoom(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.arena.joinRoom(user.id, id);
    return this.battles.getBattle(id, user.id);
  }
  @Post(':id/run')
  @RateLimit({ limit: 60, windowSeconds: 3600, scope: 'user', name: 'arena-run' })
  async run(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @ValidatedBody(EvaluateDto) body: EvaluateDto) {
    const battle = await this.battles.getBattle(id, user.id);
    const problemId = await this.battles.getBattleProblem(id, user.id);
    if (body.language !== battle.language) throw new BadRequestException('Use the language selected for this arena');
    // The run button never records a practice solve or evaluates hidden cases.
    const result = await this.arena.evaluate(user.id, problemId, { ...body, submit: false });
    if (body.input === undefined) await this.arena.recordProgress(id, user.id, result.passedCount, result.totalCount);
    return result;
  }
  @Get(':id/progress')
  async progress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const battle = await this.battles.getBattle(id, user.id);
    if (!battle.participants.some(p => p.userId === user.id)) throw new BadRequestException('Join the arena first');
    return this.arena.progress(id, battle.participants.map(p => p.userId));
  }
  @Post(':id/forfeit')
  forfeit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.submissions.submit(id, user.id, 'CODE_ARENA_FORFEIT');
  }
}
