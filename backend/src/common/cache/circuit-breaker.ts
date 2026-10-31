import { Logger } from '@nestjs/common';

/**
 * Stops hammering an upstream that is clearly down.
 *
 * After `failureThreshold` consecutive connection failures the circuit opens
 * and calls fail instantly for `openMs`, instead of every request waiting out
 * its own timeout. One trial call is allowed after that window; success closes
 * the circuit again.
 */
export class CircuitBreaker {
  private readonly logger: Logger;
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 3,
    private readonly openMs = 30_000,
  ) {
    this.logger = new Logger(`CircuitBreaker:${name}`);
  }

  public get isOpen(): boolean {
    if (this.openedAt === 0) return false;
    if (Date.now() - this.openedAt < this.openMs) return true;
    // Window elapsed: let the next call through as a trial
    this.openedAt = 0;
    this.consecutiveFailures = this.failureThreshold - 1;
    return false;
  }

  public get retryAfterMs(): number {
    return this.openedAt === 0 ? 0 : Math.max(0, this.openMs - (Date.now() - this.openedAt));
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  }

  public recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.failureThreshold && this.openedAt === 0) {
      this.openedAt = Date.now();
      this.logger.warn(`${this.name} looks unreachable; skipping calls for ${this.openMs / 1000}s`);
    }
  }

  public openError(): Error {
    return new Error(`${this.name} is unavailable (retrying in ${Math.ceil(this.retryAfterMs / 1000)}s)`);
  }
}
