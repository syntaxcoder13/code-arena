import { Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { ArenaFeaturesService } from './features.service';
import { ClanDto, EquipDto, TournamentDto } from './features.dto';
@Controller('api/codearena')
@UseGuards(AuthGuard)
export class ArenaFeaturesController {
  constructor(@Inject(ArenaFeaturesService) private readonly features: ArenaFeaturesService) {}
  @Get('clans') clans(@CurrentUser() u: AuthenticatedUser) { return this.features.clans(u.id); }
  @Post('clans') @RateLimit({ limit: 5, windowSeconds: 3600, scope: 'user', name: 'clan-create' })
  createClan(@CurrentUser() u: AuthenticatedUser, @ValidatedBody(ClanDto) body: ClanDto) { return this.features.createClan(u.id, body); }
  @Post('clans/:id/join') joinClan(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.features.joinClan(u.id, id); }
  @Post('clans/:id/leave') leaveClan(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.features.leaveClan(u.id, id); }
  @Post('clans/:id/leader/:userId') transferClan(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Param('userId') target: string) { return this.features.transferClan(u.id, id, target); }
  @Get('inventory') inventory(@CurrentUser() u: AuthenticatedUser) { return this.features.inventory(u.id); }
  @Post('inventory/equip') equip(@CurrentUser() u: AuthenticatedUser, @ValidatedBody(EquipDto) body: EquipDto) { return this.features.equip(u.id, body.itemId); }
  @Get('analytics') analytics(@CurrentUser() u: AuthenticatedUser) { return this.features.analytics(u.id); }
  @Get('tournaments') tournaments() { return this.features.tournaments(); }
  @Post('tournaments') @RateLimit({ limit: 5, windowSeconds: 3600, scope: 'user', name: 'tournament-create' })
  createTournament(@CurrentUser() u: AuthenticatedUser, @ValidatedBody(TournamentDto) body: TournamentDto) { return this.features.createTournament(u.id, body); }
  @Post('tournaments/:id/join') joinTournament(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.features.joinTournament(u.id, id); }
  @Post('tournaments/:id/leave') leaveTournament(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.features.joinTournament(u.id, id, true); }
  @Post('tournaments/:id/start') startTournament(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) { return this.features.startTournament(u.id, id); }
}
