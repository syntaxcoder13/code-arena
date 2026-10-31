import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('api/developers')
export class DevelopersController {
  constructor(@Inject(DevelopersService) private developersService: DevelopersService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getDevelopers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('technology') technology?: string,
    @Query('location') location?: string,
    @Query('filter') filter?: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.developersService.getDevelopers({
      page,
      limit,
      search,
      technology,
      location,
      filter,
      currentUserId: user?.id,
    });
  }

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  async getDeveloper(
    @Param('username') username: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ) {
    return this.developersService.getDeveloperByUsername(username, user?.id);
  }
}
