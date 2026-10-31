# Backend deployment

Requires Node.js 22, PostgreSQL, and optionally Redis. This is NestJS/Fastify,
not Express/MongoDB. Keep PostgreSQL and Redis on private networks.

## Local UI preview with an existing environment

For a second local process using the existing `.env`, override
`NODE_ENV=development`, `FRONTEND_URL=http://localhost:3000`, and the local
frontend origin in `CORS_ALLOWED_ORIGINS`. Start the frontend with
`NEXT_PUBLIC_API_URL=http://localhost:5000`. Set `DISABLE_BACKGROUND_JOBS=true`
and `DISABLE_BATTLE_WORKERS=true` in this local process so it does not send
digests, run maintenance, judge shared queued submissions or sweep live battles.
Do not copy the worker-disable setting to the production instance.

This still uses the database configured in `.env`: explicit save/chat/profile
actions use that database. No migrations, seeds or destructive checks are needed
to preview the UI. A separate database is appropriate for disposable test data.
Local OAuth login needs a GitHub OAuth app whose registered callback matches
`http://localhost:5000/api/auth/github/callback`; use a development app instead
of changing the production application's callback just for this preview.

## Environment

Copy `.env.example` to `.env`. Set `NODE_ENV=production`, `DATABASE_URL`,
`FRONTEND_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and
`GITHUB_CALLBACK_URL=https://api.example.com/api/auth/github/callback`.
Generate independent JWT/COOKIE/ENCRYPTION secrets of at least 32 characters.
Preserve the existing `ENCRYPTION_KEY` when moving a database containing tokens.
Set `GITHUB_TOKEN` for public GitHub API quotas; set `REDIS_URL` for shared
rate limits/cache/login codes. Configure Resend only when email should be sent.
Do not expose `.env`, database URLs, or tokens in build logs or Docker layers.

### Reverse proxy and availability

Set `TRUSTED_PROXY_CIDRS` to the exact IP/CIDR of the reverse proxy as seen by
Fastify, for example `127.0.0.1/32,::1/128` for native Nginx on the same host.
With Docker port forwarding, the immediate peer can instead be the Docker
bridge gateway: inspect the actual network path before adding its exact address.
Do not copy a guessed gateway or trust all private networks. This setting is
empty by default so direct callers cannot spoof `X-Forwarded-For`.

Nginx must forward `X-Forwarded-For` using `$proxy_add_x_forwarded_for` (or
overwrite it with `$remote_addr` for a single proxy), as well as Host and
X-Forwarded-Proto. Without configured proxy trust, per-IP rate limits can count
all visitors as the same Nginx/Docker IP, causing shared 429 responses. Keep
port 5000 bound to loopback and do not make it public to solve this.

Set the frontend build variable `NEXT_PUBLIC_API_URL` to the HTTPS API origin.
It is compiled into the browser bundle: changing only the running backend's
environment does not update it. The backend's `FRONTEND_URL` and
`CORS_ALLOWED_ORIGINS` must contain the real frontend origin, not `*`.

Check failures by layer, without printing secrets:

```sh
curl -sS -o /dev/null -w 'local %{http_code} %{time_total}s\n' 'http://127.0.0.1:5000/api/projects?limit=1'
curl -sS -o /dev/null -w 'public %{http_code} %{time_total}s\n' 'https://YOUR_API_DOMAIN/api/projects?limit=1'
sudo docker stats --no-stream opensourcehub-backend
sudo docker logs --since 2h --tail 2000 opensourcehub-backend 2>&1 | grep -Ei 'GitHub API Failed|Rate Limit|search unavailable|Home section|Redis connection|P2024|connection pool|timed out|ECONN|PrismaClient' | tail -60
```

Local failure indicates the app/dependencies; public-only 502/504 suggests the
proxy or an unavailable/restarting backend. Browser-only failures require
checking the request URL, CORS and credentials. A 429 requires inspecting which
layer issued it; do not remove rate limits. A 200 with an empty section is not
proof that GitHub succeeded: discovery services can currently swallow upstream
errors into empty results. Correlate the server warnings with the request time.

The public upstream cache retains the last successful response for the configured
fresh plus stale window, bounded to 500 local entries, even if Redis becomes
unavailable. This cache does not make new searches work during a complete GitHub
outage and cannot survive a process restart without shared storage. User-token
requests remain uncached. Redis queue durability still requires appropriate
capacity and `noeviction`; an HTTP cache is not a replacement for the queue.

Client recovery makes at most one extra GET/HEAD attempt for a connection error
or 502/503/504, within one 30-second deadline. It never automatically repeats
writes, authentication/validation errors or 429s. Long Retry-After cooldowns are
surfaced to the caller rather than retried early. Neither cache nor retries can
guarantee uninterrupted service on one VPS; monitor public endpoints and host
resources before deciding whether redundancy is needed.

## Database migrations

Back up and test on a restored staging database first. Stop old application
instances before the saved-issue identity migration, and deploy the updated
frontend/backend together. Legacy numeric issue IDs become `owner/repo#number`.

For a **fresh, empty database**:

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
```

For an **existing database previously created with `prisma db push`**:

1. Verify it matches the checked-in `20261014000000_baseline` schema, including
   the chat tables. If chat was never created, apply the historical chat SQL
   (`prisma/sql/001_add_chat.sql`) first, after checking for existing tables.
2. Only after checking the schema, mark the baseline applied (do not execute
   its CREATE TABLE statements on populated tables):

```sh
npx prisma migrate resolve --applied 20261014000000_baseline
npx prisma migrate deploy
```

The hardening migration archives original saved-issue rows into
`saved_issue_identity_archive_20261015`, combines duplicate notes/buddy flags,
retains the most recently updated workflow row, normalizes references, and adds
uniqueness. The archive contains private notes: retain it only as long as needed
for recovery, with the same database access controls as the original rows.
No migration is executed automatically at application startup.

## Run

```sh
npm run typecheck
npm test
npm run build
npm start
```

Use a process supervisor, or build the provided Dockerfile:

```sh
docker build -t opensourcehub-backend .
docker run -d --name opensourcehub-backend --restart unless-stopped --env-file .env -p 127.0.0.1:5000:5000 opensourcehub-backend
```

Container `localhost` refers to the container, so database/Redis hostnames must
be reachable from its network. Put Nginx HTTPS in front of localhost:5000.
Only SSH (restricted to the administrator), HTTP, and HTTPS need public access.
Set the frontend build variable `NEXT_PUBLIC_API_URL=https://api.example.com`.
Set the GitHub OAuth application's callback to the same backend callback URL.

## API paths

Public discovery: `GET /api/home`, `/api/projects`, `/api/issues`, `/api/developers`.
Account endpoints use `/api/users/me`, including `/profile`, `/dashboard`,
`/preferences` (GET/PATCH), `/saved-projects`, and `/saved-issues`.
Private chat uses `/api/chat/conversations`; read receipts take the explicit
`messageIds` displayed by the client. Message pagination accepts opaque cursors.

## Operations

Monitor restart counts, RAM, disk, queue sizes, database pool wait time, and
upstream API limits. Back up PostgreSQL off the server and test restore.
Email dispatch claims are durable and the provider receives an idempotency key.
Investigate `sending`/`failed` rows before any manual retry; an ambiguous delivery
must be reconciled with Resend rather than blindly resubmitted. Simulated email
does not advance `lastDigestSentAt`.

Judge0's execution containers should ideally use a separate VM from application
secrets and the database. Its API token belongs only in backend secrets.

## CodeBattle integration

`20261015000200_codebattle_integration` follows the security migration. It creates
Battle/Judge0/moderation/queue tables on a fresh core database and adopts existing
tables created by historical SQL files without dropping their data. It retains
`_applied_sql_migrations` and its rows. Existing incompatible or partially applied
Battle schemas need a schema review on a restored backup before applying it;
`IF NOT EXISTS` does not repair mismatched column types or constraints.

Use `npm run migrate` / `prisma migrate deploy` for normal deployments. Do not
replay `prisma/sql/001..010` or run the historical custom migration runner after
Prisma takes over. Do not mark all historical files applied to skip unknown drift.
Never run `db push`, reset, or execute generated DROP statements on the live DB.

CodeBattle judging requires a reachable `REDIS_URL` and a sandbox configured
with `JUDGE0_URL` and `JUDGE0_AUTH_TOKEN` (or the Piston fallback). Ordinary
application startup can succeed without them while judging remains unavailable.
`DISABLE_BACKGROUND_JOBS=true` skips discovery/email maintenance but does not
disable the Battle timer or judging worker. Configure `ADMIN_USERNAMES` for
moderation access. For a fresh database, seed reviewed problems only after the
schema is ready; do not overwrite an existing curated bank without review.

All runtime scripts are compiled into the image. For example, a deliberate
fresh-bank seed uses `node dist/modules/battles/seed-problems.script.js`, and a
sandbox connectivity check uses `node dist/modules/battles/sandbox-check.script.js`.
No live database, seeding, email, DNS or VPS changes were made by the integration PR.

### Optional digest consent (Phase 2)

Deploy the paired frontend/backend changes together. Migration
`20261016000100_optional_digest_default` changes the default for new
`user_preferences.emailDigest` records to false; it does not update existing
users' saved choices. Application creation paths also explicitly use false.
Onboarding saves an explicit optional email choice atomically with completion.
Apply this migration through the normal reviewed deployment workflow. Local
Phase 2 verification used an isolated database and did not migrate the shared DB.

## Live events and performance rollout

The backend now exposes authenticated `GET /api/events` SSE notifications and
admin-only `GET /api/events/metrics` aggregate timings. Both keep credentials out
of query strings. Streams are private/no-store, bounded to three per user and
500 per process, close on backpressure, heartbeat every 20 seconds, and reconnect
at most every five minutes (or sooner at token expiry). Account existence is
rechecked during a stream. Events contain type/resource ID only; clients refetch
through existing authorized REST endpoints. Redis Pub/Sub provides cross-process
fanout, not durable replay. Clients resynchronize on reconnect and periodically
through REST. Membership is resolved from committed state before notifications.

Deploy backend support before the frontend. `LIVE_EVENTS_ENABLED=false` disables
streaming server-side; `NEXT_PUBLIC_LIVE_EVENTS_ENABLED=false` disables the client
at frontend build time. REST polling is retained when streams are unavailable.
The stream enables by default when these flags are absent. Do not publicly cache
this endpoint. Keep the existing restrictive CORS and proxy trust configuration.

For Nginx, apply the following to the API virtual host (review the actual host
configuration first). This exact location does not replace ordinary REST routes:

```nginx
location = /api/events {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 70s;
}
```

Verify the actual frontend/API/proxy path, connection cleanup, reconnect and
multi-user isolation before a production rollout. No production Nginx or
Cloudflare configuration was changed during local implementation.

`PERF_QUERY_TIMINGS=true` records aggregate Prisma query durations without SQL or
parameters; these durations do not measure connection-pool wait. HTTP timings use
normalized route templates. Stream lifetime is a separate metric. Cache outcomes,
GitHub status/network duration and judging job age/process duration are included.
Snapshots retain at most 128 duration samples per bounded key and are process-local;
they are diagnostics, not a substitute for a full monitoring backend. Job age
includes retry/delay time and must not be described as pure queue wait.

`QUEUE_REDIS_URL` optionally separates BullMQ judging storage from disposable
cache/fanout Redis. It falls back to `REDIS_URL`. Set the queue service to
`noeviction`, confirm capacity/persistence and alerts in its provider; the app
must not run CONFIG SET or FLUSHDB automatically. Worker concurrency remains
bounded and must be tuned using actual VPS and database limits. No Redis policy,
database index/migration, shared data or Judge0 installation was changed locally.
