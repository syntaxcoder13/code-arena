import { Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { AdminGuard } from '../moderation/admin.guard';
import { EnforcementService } from './enforcement.service';
import { ResolveFlagDto } from './dto/battles.dto';

/**
 * The similarity queue.
 *
 * Reviewers only, guarded the same way the report queue is: a valid session
 * and a username on the deploy's list. Both sides' code is shown here, which
 * is the one place a submission is readable by somebody who did not write it
 * - and the only reason it is readable is that a decision cannot be made
 * without seeing it.
 */
@Controller('api/admin/flags')
@UseGuards(AuthGuard, AdminGuard)
export class FlagsController {
  constructor(@Inject(EnforcementService) private readonly enforcement: EnforcementService) {}

  @Get()
  list(@Query('state') state?: string) {
    const wanted = (state ?? 'OPEN').toUpperCase();
    return this.enforcement.listFlags(
      ['OPEN', 'CONFIRMED', 'CLEARED'].includes(wanted) ? wanted : 'OPEN',
    );
  }

  @Post(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @ValidatedBody(ResolveFlagDto) body: ResolveFlagDto,
  ) {
    return this.enforcement.resolveFlag(id, user.id, body);
  }
}
