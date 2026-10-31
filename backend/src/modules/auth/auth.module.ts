import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LoginCodeService } from './login-code.service';
import { AuthGuard, OptionalAuthGuard } from '../../common/guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LoginCodeService, AuthGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
