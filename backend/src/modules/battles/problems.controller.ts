import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ProblemService } from './problem.service';

/**
 * What a battle can be created on.
 *
 * There is deliberately no route that lists or fetches problems directly: the
 * problem is drawn when the battle starts, and a browsable bank would let
 * players study every problem beforehand. Players reach their own problem
 * through their battle instead.
 */
@Controller('api/battles/pools')
@UseGuards(AuthGuard)
export class ProblemsController {
  constructor(@Inject(ProblemService) private readonly problems: ProblemService) {}

  @Get()
  listPools() {
    return this.problems.listPools();
  }
}
