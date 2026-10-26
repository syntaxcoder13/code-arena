import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorDetails: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as { message?: string | string[]; error?: string };
        message = obj.message || obj.error || message;
        errorDetails = obj as Record<string, unknown>;
      }
    } else if (isDatabaseUnavailable(exception)) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'The database is currently unavailable, please try again shortly';
      this.logger.error(`Database unavailable on ${request.method} ${request.url}`);
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
      this.logger.error(`Unhandled Exception on ${request.method} ${request.url}: ${exception.stack}`);
    }

    response.status(status).send({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && errorDetails ? { details: errorDetails } : {}),
    });
  }
}

/** Prisma could not reach (or stay connected to) the database server. */
function isDatabaseUnavailable(exception: unknown): boolean {
  if (exception instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    exception instanceof Prisma.PrismaClientKnownRequestError &&
    // P1001/P1002/P1017: cannot reach or lost the server; P1008/P2024: timed out
    // waiting (including for a free connection from the pool)
    ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(exception.code)
  );
}
