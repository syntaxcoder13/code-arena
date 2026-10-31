import { Global, Module } from '@nestjs/common';
import { OriginPolicyService } from './origin-policy';

@Global()
@Module({
  providers: [OriginPolicyService],
  exports: [OriginPolicyService],
})
export class SecurityModule {}
