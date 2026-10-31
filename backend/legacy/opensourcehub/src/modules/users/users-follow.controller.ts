import { Controller,Post,Delete,Get,Param,Query,Inject,UseGuards } from '@nestjs/common';
import { AuthGuard,OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser,AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FollowService } from './follow.service';
import { RateLimit } from '../../common/security/rate-limit.guard';

@Controller('api/users')
export class UsersFollowController {
  constructor(@Inject(FollowService) private readonly follows: FollowService) {}

  @Post(':targetUserId/follow')
  @UseGuards(AuthGuard)
  @RateLimit({ limit: 120, windowSeconds: 3600, scope: 'user', name: 'follow' })
  followUser(@CurrentUser() user: AuthenticatedUser, @Param('targetUserId') targetUserId: string) {
    return this.follows.followUser(user.id, targetUserId);
  }

  @Delete(':targetUserId/follow')
  @UseGuards(AuthGuard)
  unfollowUser(@CurrentUser() user: AuthenticatedUser, @Param('targetUserId') targetUserId: string) {
    return this.follows.unfollowUser(user.id, targetUserId);
  }

  @Get(':targetUserId/follow-status')
  @UseGuards(OptionalAuthGuard)
  getFollowStatus(@Param('targetUserId') targetUserId: string, @CurrentUser() user?: AuthenticatedUser | null) {
    return this.follows.getFollowStatus(user?.id, targetUserId);
  }

  @Get(':targetUserId/followers')
  @UseGuards(OptionalAuthGuard)
  getFollowers(
    @Param('targetUserId') targetUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.follows.getFollowers(targetUserId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      currentUserId: user?.id,
    });
  }

  @Get(':targetUserId/following')
  @UseGuards(OptionalAuthGuard)
  getFollowing(
    @Param('targetUserId') targetUserId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.follows.getFollowing(targetUserId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      currentUserId: user?.id,
    });
  }
}
