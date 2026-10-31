import { Controller,Get,Inject,UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser,AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('api/home')
export class HomeController {
  constructor(@Inject(HomeService) private readonly home: HomeService) {}

  /** Everything the landing page needs, in one request. */
  @Get()
  @UseGuards(OptionalAuthGuard)
  getHome(@CurrentUser() user?: AuthenticatedUser | null) {
    return this.home.getHomeData(user?.id);
  }
}
