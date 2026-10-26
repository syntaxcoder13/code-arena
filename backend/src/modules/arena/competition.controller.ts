import { Controller, Get, Inject, Param, ParseUUIDPipe, Post, Put, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { CompetitionService } from './competition.service';
import { CompetitionDto, SharedDraftDto, SharedSubmitDto } from './competition.dto';
@Controller('api/codearena/competitions') @UseGuards(AuthGuard)
export class CompetitionController {
  constructor(@Inject(CompetitionService) private readonly service: CompetitionService) {}
  @Get() list(@CurrentUser() u: AuthenticatedUser) { return this.service.list(u.id); }
  @Post() @RateLimit({ limit: 10, windowSeconds: 3600, scope: 'user', name: 'series-create' }) create(@CurrentUser() u: AuthenticatedUser, @ValidatedBody(CompetitionDto) dto: CompetitionDto) { return this.service.create(u.id,dto); }
  @Get(':id') get(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.get(id,u.id); }
  @Post(':id/accept') accept(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.accept(id,u.id); }
  @Post(':id/start') start(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.start(id,u.id); }
  @Put(':id/draft') draft(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string, @ValidatedBody(SharedDraftDto) dto: SharedDraftDto) { return this.service.draft(id,u.id,dto); }
  @Post(':id/run') @RateLimit({ limit: 60, windowSeconds: 3600, scope: 'user', name: 'series-run' }) run(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.run(id,u.id); }
  @Post(':id/submit') submit(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string, @ValidatedBody(SharedSubmitDto) dto: SharedSubmitDto) { return this.service.submit(id,u.id,dto.revision); }
  @Post(':id/share') share(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.shareSeries(id,u.id); }
}
@Controller('api/arena') @UseGuards(AuthGuard)
export class SpectatorShareController {
  constructor(@Inject(CompetitionService) private readonly service: CompetitionService) {}
  @Post(':id/spectators') share(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.shareBattle(id,u.id); }
  @Post(':id/spectators/revoke') revoke(@CurrentUser() u: AuthenticatedUser, @Param('id',ParseUUIDPipe) id: string) { return this.service.revokeBattle(id,u.id); }
}
@Controller('api/watch')
export class SpectatorController {
  constructor(@Inject(CompetitionService) private readonly service: CompetitionService) {}
  @Get(':token') @RateLimit({ limit: 120, windowSeconds: 60, name: 'spectate-read' }) watch(@Param('token') token: string) { if (!/^[a-f0-9]{64}$/.test(token)) throw new BadRequestException('Invalid spectator link'); return this.service.watch(token); }
}
