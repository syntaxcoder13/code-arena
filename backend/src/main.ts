import './load-env';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp, createFastifyAdapter } from './app.setup';
import { assertSecurityConfig } from './common/security/secrets';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Refuse to run with missing, weak or publicly-known secrets
  assertSecurityConfig();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, createFastifyAdapter());
  await configureApp(app);

  const port = app.get(ConfigService).get<number>('port') || 5000;
  await app.listen({ port, host: '0.0.0.0' });
  logger.log(`Code Arena Backend is running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during application startup:', err);
  process.exit(1);
});
