import { describe, expect, it } from 'vitest';
import { BadRequestException, ExecutionContext, Type, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { FastifyRequest } from 'fastify';
import {
  ClaimIssueDto,
  OnboardUserDto,
  SaveIssueDto,
  SaveProjectDto,
  ToggleBuddyDto,
  UpdateIssueStatusDto,
  UpdatePreferencesDto,
} from '../../src/modules/users/dto/users.dto';
import { AuthGuard, OptionalAuthGuard, extractToken } from '../../src/common/guards/auth.guard';

/** Runs a body through the same pipe `@ValidatedBody` uses. */
async function validate<T>(dto: Type<T>, body: unknown): Promise<T> {
  const pipe = new ValidationPipe({
    expectedType: dto,
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  return pipe.transform(body, { type: 'body' }) as Promise<T>;
}

async function rejects(dto: Type<unknown>, body: unknown) {
  await expect(validate(dto, body)).rejects.toBeInstanceOf(BadRequestException);
}

describe('UpdatePreferencesDto', () => {
  it('requires a real boolean for email consent instead of coercing a string', async () => {
    await rejects(UpdatePreferencesDto, { emailDigest: 'false' });
    await rejects(OnboardUserDto, { emailDigest: 'true' });
    expect(await validate(OnboardUserDto, { emailDigest: false })).toEqual({ emailDigest: false });
  });
  it('accepts a normal settings payload and strips unknown fields', async () => {
    const dto = await validate(UpdatePreferencesDto, {
      technologies: ['TypeScript', 'Go'],
      digestFrequency: 'daily',
      emailDigest: false,
      isAdmin: true,
    });
    expect(dto).toEqual({ technologies: ['TypeScript', 'Go'], digestFrequency: 'daily', emailDigest: false });
  });

  it('rejects unknown enums, oversize lists and non-string items', async () => {
    await rejects(UpdatePreferencesDto, { digestFrequency: 'hourly' });
    await rejects(UpdatePreferencesDto, { experienceLevel: 'wizard' });
    await rejects(UpdatePreferencesDto, { topics: Array.from({ length: 51 }, (_, i) => `t${i}`) });
    await rejects(UpdatePreferencesDto, { technologies: [123] });
    await rejects(UpdatePreferencesDto, { topics: ['x'.repeat(51)] });
  });
});

describe('SaveProjectDto / SaveIssueDto', () => {
  it('accepts real GitHub names', async () => {
    await expect(validate(SaveProjectDto, { owner: 'vercel', repo: 'next.js' })).resolves.toBeTruthy();
    await expect(validate(SaveProjectDto, { owner: 'a', repo: 'my_repo-2' })).resolves.toBeTruthy();
  });

  it('rejects path tricks and malformed names', async () => {
    await rejects(SaveProjectDto, { owner: '../etc', repo: 'x' });
    await rejects(SaveProjectDto, { owner: 'octo', repo: 'a/b' });
    await rejects(SaveProjectDto, { owner: '-bad-', repo: 'x' });
    await rejects(SaveProjectDto, { repo: 'missing-owner' });
    await rejects(SaveProjectDto, { owner: 'octo', repo: 'x', notes: 'n'.repeat(2001) });
  });

  it('coerces and validates the issue number', async () => {
    const dto = await validate(SaveIssueDto, { owner: 'octo', repo: 'x', issueNumber: '12' });
    expect(dto.issueNumber).toBe(12);
    await rejects(SaveIssueDto, { owner: 'octo', repo: 'x', issueNumber: 0 });
    await rejects(SaveIssueDto, { owner: 'octo', repo: 'x' });
  });
});

describe('UpdateIssueStatusDto', () => {
  it('allows http(s) PR links and an empty string to clear', async () => {
    await expect(
      validate(UpdateIssueStatusDto, { status: 'pr_submitted', prUrl: 'https://github.com/o/r/pull/1' }),
    ).resolves.toBeTruthy();
    await expect(validate(UpdateIssueStatusDto, { status: 'todo', prUrl: '' })).resolves.toBeTruthy();
    await expect(validate(UpdateIssueStatusDto, { status: 'completed' })).resolves.toBeTruthy();
  });

  it('rejects unknown statuses and non-http links', async () => {
    await rejects(UpdateIssueStatusDto, { status: 'done' });
    await rejects(UpdateIssueStatusDto, { status: 'pr_submitted', prUrl: 'javascript:alert(1)' });
    await rejects(UpdateIssueStatusDto, { status: 'pr_submitted', prUrl: 'not a url' });
  });
});

describe('ClaimIssueDto / ToggleBuddyDto', () => {
  it('bounds claim duration and allows an empty body', async () => {
    await expect(validate(ClaimIssueDto, undefined)).resolves.toEqual({});
    await expect(validate(ClaimIssueDto, { days: 14 })).resolves.toEqual({ days: 14 });
    await rejects(ClaimIssueDto, { days: 0 });
    await rejects(ClaimIssueDto, { days: 365 });
  });

  it('requires the buddy flag', async () => {
    await expect(validate(ToggleBuddyDto, { seekingBuddy: true, buddyNotes: 'hi' })).resolves.toBeTruthy();
    await rejects(ToggleBuddyDto, { buddyNotes: 'no flag' });
    await rejects(ToggleBuddyDto, { seekingBuddy: true, buddyNotes: 'x'.repeat(1001) });
  });
});

describe('OnboardUserDto', () => {
  it('strips username and email: both are owned by GitHub', async () => {
    await expect(
      validate(OnboardUserDto, { username: 'torvalds', email: 'attacker@evil.test', bio: 'hello' }),
    ).resolves.toEqual({ bio: 'hello' });
  });

  it('accepts hosted and inline avatars', async () => {
    await expect(validate(OnboardUserDto, { avatarUrl: 'https://res.cloudinary.com/x.png' })).resolves.toBeTruthy();
    await expect(validate(OnboardUserDto, { avatarUrl: 'data:image/png;base64,AAAA' })).resolves.toBeTruthy();
  });

  it('rejects oversized bios and unsafe avatar schemes', async () => {
    await rejects(OnboardUserDto, { bio: 'b'.repeat(501) });
    await rejects(OnboardUserDto, { avatarUrl: 'javascript:alert(1)' });
    await rejects(OnboardUserDto, { avatarUrl: 'data:text/html;base64,AAAA' });
    await rejects(OnboardUserDto, { experienceLevel: 'guru' });
  });
});

describe('auth guards', () => {
  const config = new ConfigService({ security: { jwtSecret: 'unit-secret' } });
  const sign = (payload: object, secret = 'unit-secret') => jwt.sign(payload, secret);

  function context(request: Partial<FastifyRequest>) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('reads the token from a cookie first, then the Bearer header', () => {
    expect(extractToken({ cookies: { token: 'c' }, headers: { authorization: 'Bearer h' } } as unknown as FastifyRequest)).toBe('c');
    expect(extractToken({ cookies: {}, headers: { authorization: 'Bearer h' } } as unknown as FastifyRequest)).toBe('h');
    expect(extractToken({ cookies: {}, headers: { authorization: 'Basic h' } } as unknown as FastifyRequest)).toBeNull();
  });

  it('uses the unsigned value of a signed cookie', () => {
    const request = {
      cookies: { token: 's:signed' },
      headers: {},
      unsignCookie: () => ({ valid: true, renew: false, value: 'inner' }),
    } as unknown as FastifyRequest;
    expect(extractToken(request)).toBe('inner');
  });

  const prisma = { user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id, githubId: '123', username: 'octo' }) } } as unknown as import('../../src/database/prisma.service').PrismaService;

  it('AuthGuard attaches the user for a valid token', async () => {
    const request = { headers: { authorization: `Bearer ${sign({ id: 'u1', githubId: '123', username: 'octo' })}` } } as FastifyRequest;
    expect(await new AuthGuard(config, prisma).canActivate(context(request))).toBe(true);
    expect(request.user).toMatchObject({ id: 'u1', username: 'octo' });
  });

  it('AuthGuard rejects missing, forged and expired tokens', async () => {
    const guard = new AuthGuard(config, prisma);
    await expect(guard.canActivate(context({ headers: {} }))).rejects.toThrow(UnauthorizedException);
    const forged = sign({ id: 'u1' }, 'other-secret');
    await expect(guard.canActivate(context({ headers: { authorization: `Bearer ${forged}` } }))).rejects.toThrow(
      UnauthorizedException,
    );
    const expired = jwt.sign({ id: 'u1', exp: Math.floor(Date.now() / 1000) - 10 }, 'unit-secret');
    await expect(guard.canActivate(context({ headers: { authorization: `Bearer ${expired}` } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a deleted account even when its username has been reused', async () => {
    const deleted = { user: { findUnique: async () => null } } as unknown as import('../../src/database/prisma.service').PrismaService;
    const request = { headers: { authorization: 'Bearer ' + sign({ id: 'deleted', githubId: '123', username: 'octo' }) } } as FastifyRequest;
    await expect(new AuthGuard(config, deleted).canActivate(context(request))).rejects.toThrow(UnauthorizedException);
    expect(request.user).toBeUndefined();
    await new OptionalAuthGuard(config, deleted).canActivate(context(request));
    expect(request.user).toBeUndefined();
  });

  it('OptionalAuthGuard never rejects and ignores invalid tokens', async () => {
    const guard = new OptionalAuthGuard(config, prisma);
    const anonymous = { headers: { authorization: 'Bearer garbage' } } as FastifyRequest;
    expect(await guard.canActivate(context(anonymous))).toBe(true);
    expect(anonymous.user).toBeUndefined();

    const signedIn = { headers: { authorization: `Bearer ${sign({ id: 'u2', githubId: '123' })}` } } as FastifyRequest;
    expect(await guard.canActivate(context(signedIn))).toBe(true);
    expect(signedIn.user?.id).toBe('u2');
  });
});
