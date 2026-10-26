import { Body, Type, ValidationPipe } from '@nestjs/common';

/**
 * `@Body()` validated against an explicit DTO class.
 *
 * The global ValidationPipe relies on `design:paramtypes` metadata, which the
 * dev server (tsx/esbuild) does not emit. Naming the DTO here makes validation
 * behave the same in dev, tests and the tsc production build.
 */
export const ValidatedBody = (dto: Type<unknown>) =>
  Body(
    new ValidationPipe({
      expectedType: dto,
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
