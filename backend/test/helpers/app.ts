import { Test } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/app.setup';
import { PrismaService } from '../../src/database/prisma.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { GithubService } from '../../src/modules/github/github.service';
import { createGithubMock, createPrismaMock, createRedisMock, GithubMock, PrismaMock } from './mocks';

export interface TestApp {
  app: NestFastifyApplication;
  prisma: PrismaMock;
  github: GithubMock;
}

/**
 * Boots the real AppModule (controllers, guards, pipes, filters, Fastify
 * plugins, security hooks) with the database, cache and GitHub mocked.
 */
export async function createTestApp(): Promise<TestApp> {
  const prisma = createPrismaMock();
  const github = createGithubMock();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(RedisService)
    .useValue(createRedisMock())
    .overrideProvider(GithubService)
    .useValue(github)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, prisma, github };
}
