import { Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { BattleService } from './battle.service';
import { ProblemService } from './problem.service';
import { SubmissionService } from './submission.service';
import { ResultsService } from './results.service';
import { GhostService } from './ghost.service';
import { QueueService } from './queue.service';
import { BattleRecordService } from './battle-record.service';
import {
  CreatePrivateBattleDto,
  CreatePublicBattleDto,
  JoinBattleQueueDto,
  SaveDraftDto,
  StartGhostBattleDto,
} from './dto/battles.dto';

/**
 * Creating battles and filling their lobbies. Signed-in only; the service
 * checks membership before returning anything about a private battle.
 */
@Controller(['api/arena', 'api/battles'])
@UseGuards(AuthGuard)
export class BattlesController {
  constructor(
    @Inject(BattleService) private readonly battles: BattleService,
    @Inject(ProblemService) private readonly problems: ProblemService,
    @Inject(SubmissionService) private readonly submissions: SubmissionService,
    @Inject(ResultsService) private readonly results: ResultsService,
    @Inject(GhostService) private readonly ghosts: GhostService,
    @Inject(QueueService) private readonly queue: QueueService,
    @Inject(BattleRecordService) private readonly records: BattleRecordService,
  ) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.battles.listMine(user.id);
  }

  @Post('private')
  @RateLimit({ limit: 20, windowSeconds: 3600, scope: 'user', name: 'battle-create' })
  createPrivate(
    @CurrentUser() user: AuthenticatedUser,
    @ValidatedBody(CreatePrivateBattleDto) body: CreatePrivateBattleDto,
  ) {
    return this.battles.createPrivate(user.id, body);
  }

  /**
   * A player's battle record, for their profile.
   *
   * Declared before the `:id` route, or `record` would be read as a battle id.
   * A record is public: it is what somebody looking at a profile came to see,
   * and it says nothing a battle's own results screen does not.
   */
  @Get('record')
  myRecord(@CurrentUser() user: AuthenticatedUser) {
    return this.records.forUser(user.id);
  }

  @Get('record/:username')
  recordFor(@Param('username') username: string) {
    return this.records.forUsername(username);
  }

  /** Public lobbies anybody may join. Listed before the :id route. */
  @Get('open')
  listOpen(@CurrentUser() user: AuthenticatedUser) {
    return this.battles.listOpenLobbies(user.id);
  }

  @Post('public')
  @RateLimit({ limit: 20, windowSeconds: 3600, scope: 'user', name: 'battle-create' })
  createPublic(
    @CurrentUser() user: AuthenticatedUser,
    @ValidatedBody(CreatePublicBattleDto) body: CreatePublicBattleDto,
  ) {
    return this.battles.createPublic(user.id, body);
  }

  /** Race a stored submission. Starts running at once; there is no lobby. */
  @Post('ghost')
  @RateLimit({ limit: 40, windowSeconds: 3600, scope: 'user', name: 'battle-ghost' })
  startGhost(
    @CurrentUser() user: AuthenticatedUser,
    @ValidatedBody(StartGhostBattleDto) body: StartGhostBattleDto,
  ) {
    return this.ghosts.start(user.id, body.difficulty, body.language, body.durationSeconds);
  }

  /**
   * Ask for a battle: a live opponent if one is waiting, a ghost if nobody
   * turns up within the wait.
   */
  @Post('queue')
  @RateLimit({ limit: 40, windowSeconds: 3600, scope: 'user', name: 'battle-queue' })
  joinQueue(
    @CurrentUser() user: AuthenticatedUser,
    @ValidatedBody(JoinBattleQueueDto) body: JoinBattleQueueDto,
  ) {
    return this.queue.join(user.id, body.difficulty, body.language, body.durationSeconds);
  }

  /** Polled while waiting; also where the ghost fallback is handed over. */
  @Get('queue')
  pollQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.queue.poll(user.id);
  }

  @Delete('queue')
  leaveQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.queue.leave(user.id);
  }

  @Post(':id/join')
  join(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.battles.joinPublic(id, user.id);
  }

  @Get(':id')
  getBattle(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.battles.getBattle(id, user.id);
  }

  /** How a finished battle ended, and why. Participants only. */
  @Get(':id/results')
  getResults(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.results.getResults(id, user.id);
  }

  @Post(':id/start')
  start(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.battles.startBattle(id, user.id);
  }

  /** The problem for a battle, once it is running and only for its players. */
  @Get(':id/problem')
  async getProblem(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const problemId = await this.battles.getBattleProblem(id, user.id);
    return this.problems.getForPlayer(problemId);
  }

  /** The work in progress, restored after a refresh or a crashed tab. */
  @Get(':id/draft')
  getDraft(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.submissions.getDraft(id, user.id);
  }

  @Put(':id/draft')
  @RateLimit({ limit: 600, windowSeconds: 3600, scope: 'user', name: 'battle-autosave' })
  saveDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(SaveDraftDto) body: SaveDraftDto,
  ) {
    return this.submissions.saveDraft(id, user.id, body.code);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ValidatedBody(SaveDraftDto) body: SaveDraftDto,
  ) {
    return this.submissions.submit(id, user.id, body.code, body.telemetry);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.battles.respondToInvite(id, user.id, true);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.battles.respondToInvite(id, user.id, false);
  }
}
