import { Controller, Get, Inject, NotFoundException, Req, Res, UseGuards, HttpException, Optional } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RateLimit } from '../../common/security/rate-limit.guard';
import { PrismaService } from '../../database/prisma.service';
import { EventsService } from './events.service';
import { metrics } from '../../common/observability/metrics';
import { AdminGuard } from '../moderation/admin.guard';
import { OriginPolicyService } from '../../common/security/origin-policy';

@Controller('api/events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(@Inject(EventsService) private readonly events: EventsService, @Inject(PrismaService) private readonly prisma: PrismaService, @Optional() @Inject(OriginPolicyService) private readonly origins?: OriginPolicyService) {}
  @Get()
  @RateLimit({ limit: 30, windowSeconds: 60, scope: 'user', name: 'live-connect' })
  stream(@CurrentUser() user: AuthenticatedUser, @Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    if (!this.events.enabled()) throw new NotFoundException();
    if (request.headers?.origin && !this.origins?.isAllowed(request.headers.origin)) throw new NotFoundException();
    let closed = false;
    const send = (frame: string) => { if (!closed && !reply.raw.write(frame)) close(); };
    const unsubscribe = this.events.subscribe(user.id, event => send(`id: ${event.id}\nevent: change\ndata: ${JSON.stringify(event)}\n\n`), () => close());
    if (!unsubscribe) throw new HttpException('Too many live connections', 429);
    const close = () => {
      if (closed) return; closed = true;
      clearInterval(heartbeat); clearInterval(revalidate); clearTimeout(expiry);
      unsubscribe(); request.raw.off('close', close); reply.raw.off('close', close); reply.raw.off('error', close);
      reply.raw.end();
    };
    const heartbeat = setInterval(() => send(': heartbeat\n\n'), 20000);
    let checking = false;
    const revalidate = setInterval(() => {
      if (checking) return; checking = true;
      void this.prisma.user.findUnique({ where: { id: user.id }, select: { githubId: true } }).then(row => { if (!row || row.githubId !== user.githubId) close(); }).catch(close).finally(() => { checking = false; });
    }, 60000);
    const exp = (user as AuthenticatedUser & { exp?: number }).exp;
    const expiry = setTimeout(close, Math.max(1, Math.min(300000, exp ? exp * 1000 - Date.now() : 300000)));
    reply.hijack();
    reply.raw.writeHead(200, { ...reply.getHeaders() as import('node:http').OutgoingHttpHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'private, no-store, no-transform', 'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    reply.raw.on('close', close); reply.raw.on('error', close);
    send('event: ready\ndata: {}\n\n');
  }
  @Get('metrics')
  @UseGuards(AdminGuard)
  snapshot(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.header('Cache-Control', 'private, no-store');
    return { window: 'last 128 observations per key; process local', metrics: metrics.snapshot() };
  }
}
