import { Controller,Delete,Get,Inject,Param,Post,Query,UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthenticatedUser,CurrentUser } from '../../common/decorators/current-user.decorator';
import { ValidatedBody } from '../../common/pipes/validated-body.decorator';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { AdminGuard,isAdmin } from './admin.guard';
import { BlockService } from './block.service';
import { ReportService,ReportState } from './report.service';
import { BlockUserDto,CreateReportDto,ResolveReportDto } from './dto/moderation.dto';

/**
 * Blocking, muting and reporting.
 *
 * Everything here is something a person does about somebody else without
 * asking anybody's permission first. The queue those reports land in is the
 * separate controller below.
 */
@Controller('api/moderation')
@UseGuards(AuthGuard)
export class ModerationController {
  constructor(
    @Inject(BlockService) private readonly blocks: BlockService,
    @Inject(ReportService) private readonly reports: ReportService,
  ) {}

  @Get('blocks')
  listBlocks(@CurrentUser() user: AuthenticatedUser) {
    return this.blocks.list(user.id);
  }

  @Post('blocks')
  @RateLimit({ limit: 100, windowSeconds: 3600, scope: 'user', name: 'block-set' })
  block(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(BlockUserDto) body: BlockUserDto) {
    return this.blocks.set(user.id, body.username, body.kind ?? 'BLOCK');
  }

  @Delete('blocks/:username')
  unblock(@CurrentUser() user: AuthenticatedUser, @Param('username') username: string) {
    return this.blocks.clear(user.id, username);
  }

  /** How the caller and one other person stand, for the button's own state. */
  @Get('blocks/:username')
  async blockStatus(@CurrentUser() user: AuthenticatedUser, @Param('username') username: string) {
    const list = await this.blocks.list(user.id);
    const entry = list.find((row) => row.username.toLowerCase() === username.toLowerCase());
    // Only the caller's own side is ever reported. Whether the other person
    // has blocked them is not theirs to know.
    return { kind: entry?.kind ?? null };
  }

  @Get('reports')
  listMyReports(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.listMine(user.id);
  }

  @Post('reports')
  @RateLimit({ limit: 20, windowSeconds: 3600, scope: 'user', name: 'report-create' })
  report(@CurrentUser() user: AuthenticatedUser, @ValidatedBody(CreateReportDto) body: CreateReportDto) {
    return this.reports.create(user.id, body);
  }

  /** Whether this session may see the queue, so the nav can hide the link. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { isAdmin: isAdmin(user.username) };
  }
}

/**
 * The review queue.
 *
 * Guarded twice over: a valid session, and a username on the deploy's
 * reviewer list.
 */
@Controller('api/admin/reports')
@UseGuards(AuthGuard, AdminGuard)
export class AdminReportsController {
  constructor(@Inject(ReportService) private readonly reports: ReportService) {}

  @Get()
  queue(@Query('state') state?: string) {
    const wanted = (state ?? 'OPEN').toUpperCase();
    const valid: ReportState[] = ['OPEN', 'ACTIONED', 'DISMISSED'];
    return this.reports.queue(valid.includes(wanted as ReportState) ? (wanted as ReportState) : 'OPEN');
  }

  @Get('count')
  count() {
    return this.reports.openCount();
  }

  @Post(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @ValidatedBody(ResolveReportDto) body: ResolveReportDto,
  ) {
    return this.reports.resolve(id, user.id, body);
  }
}
