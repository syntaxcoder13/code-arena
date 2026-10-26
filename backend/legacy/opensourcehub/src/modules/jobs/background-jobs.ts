/**
 * Whether this process should run the periodic maintenance jobs.
 *
 * A second deployment pointed at the same database - a staging copy of the
 * app, say - runs every one of these twice. The cache warming alone holds all
 * five pooled connections for half a minute at a time, which has already
 * broken judging once, and the digest would email real people twice a day.
 *
 * The battle timer is deliberately **not** covered by this. Battles cannot
 * finish without it, so a staging instance needs it running, and running it
 * twice is safe: every statement it issues is filtered on the state it is
 * about to change, and judging jobs are keyed by submission id so the same
 * work cannot be queued twice.
 */
export function backgroundJobsDisabled(): boolean {
  return process.env.DISABLE_BACKGROUND_JOBS === 'true';
}
