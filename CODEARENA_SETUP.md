# Code Arena: local setup and implementation status

## Run locally

Use Node.js 22 or newer. This workspace already has dependencies installed and an isolated PostgreSQL database seeded with 80 reviewed problem entries (sixteen algorithms in JavaScript, TypeScript, Python, C++, and Go).

The local API reads **backend/.env.local**. The pasted **backend/.env** belongs to OpenSourceHub and is deliberately not loaded by the development API. Do not run migrations against that old file.

On this Windows machine, start the isolated database if it is stopped:

```powershell
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D "$PWD/.local/postgres" -l "$PWD/.local/postgres.log" -o '-h 127.0.0.1 -p 55432' start
```

Then use two terminals from the project root:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Open http://localhost:3000. The API listens on http://localhost:5000.

## GitHub login

Create a separate GitHub OAuth application for Code Arena. Set its homepage to `http://localhost:3000` and its authorization callback to `http://localhost:5000/api/auth/github/callback`. Put its client ID and client secret into **backend/.env.local** and restart the API. The copied OpenSourceHub OAuth application was not modified.

The frontend now uses the actual GitHub OAuth flow, PKCE, and the backend's HTTP-only session cookie. It no longer creates a pretend signed-in user.

## Connected features

| Frontend feature | Backend behavior |
| --- | --- |
| Practice | Reviewed server catalog, real Judge0 runs and submissions, custom stdin, hidden tests, measured runtime/memory |
| Practice progress | Persistent bookmarks, solved problems, deduplicated XP, daily activity streak |
| Daily challenge | A deterministic daily selection shared by dashboard and practice |
| Arena | The adapted Code Battle engine, exposed under `/api/arena` |
| Arena modes | Ranked/Blitz/custom duels plus a separate best-of-three Gauntlet with easy/medium/hard stages |
| Matchmaking | Difficulty/language/duration plus server-derived rating proximity; widening rating range; ghost fallback or continued waiting |
| Rooms | Public room browsing and private rooms joined by their unguessable room ID; capacity and membership checks |
| Match workspace | Server deadline, persisted drafts, sample runs, measured opponent sample progress, submissions, forfeit, queued judging, persisted standings |
| Realtime updates | Authenticated server-sent events with REST polling as recovery |
| Player records | Server-derived wins, losses, rating, XP, level, streaks, and completed Arena history |
| Leaderboard | Real players, all-time/weekly/quarterly views, measured solve-time and streak sorting |
| Achievements | Progress derived from recorded results for supported combat, speed, streak, language and rating criteria |
| Settings/profile | Stored settings, display name, bio, profile banner; real server logout |
| Feedback | Authenticated feedback saved in PostgreSQL |
| Clans | Create/join/leave, one clan per user, 20-member capacity, ownership transfer, live average-rating standings, profile tags |
| Tournaments | Knockout and 3–5-round Swiss, 4/8/16 seats, byes, standings, automatic Arena matches and champion persistence |
| Inventory | Eighteen XP/win-gated banners, editor themes, titles, sound packs, animated frames and victory effects |
| Analytics | Acceptance, language/difficulty breakdowns, measured runtime/memory, activity history and recent results |
| Team competitions | Consent-based 2v2 sessions, versioned shared drafts, one judged team solution and best-of-three progression |
| Clan wars | Clan leader + member on each side; persisted results; 100 win / 25 loss / 50 draw clan-war points |
| Spectators | Opt-in, revocable read-only links with sample progress and judged standings; no solution code or hidden tests |
| Analysis/mastery | Clearly labelled JavaScript/TypeScript structural complexity hints; category progress and measured-memory achievement |

Private rooms do not appear in public listings. Hidden test inputs, expected outputs, and program output from hidden runs are withheld from responses.

Rating currently uses a transparent fixed rule: start at 1200, +25 for an eligible live victory and -20 for an eligible loss. This is **not Glicko-2**. Ghost races do not affect live rating. Gauntlet and team competitions use separate multi-round sessions and do not change individual duel ratings.

The production judge worker uses Redis/BullMQ with a Code Arena namespace. For this single-process local setup, `JUDGE_QUEUE_DRIVER=postgres-local` uses the persisted database backlog and does not require Docker or Redis. Run only one API process with that development driver. Judge0 still executes all submitted code.

## Competition rules and implementation boundaries

Gauntlet challenges run easy, medium, then hard problems. The first player to win two rounds wins the series; after three rounds, equal round wins are broken by total passed tests, with a draw if still equal. Team and clan-war matches use the same series rules at the selected difficulty. All invitees must accept before the host starts. Five minutes per round is the current frontend default.

Each team edits one persistent draft. Saving uses a revision check; conflicting teammate writes are rejected and can be reloaded and merged manually. Run and submit use the saved draft, and submission also checks the revision. The battle engine judges one representative seat per team, so team/series rounds are excluded from individual duel rating. Next rounds are created by a persistent worker after judging finishes.

Swiss tournaments keep every entrant in the field for 3–5 rounds. Win/bye earns one point. Pairing minimizes repeat opponents, then score differences; small fields may require repeats. Final ties use opponents' points (Buchholz), then registration order. Knockout matches use judged standing; if neither side submits, the earlier randomized seed advances. New rounds start automatically: entrants should keep the bracket/competition page open.

Spectator links are created explicitly by participants and can be revoked. They expose the problem statement, sample progress and judged metrics, never solution code or hidden inputs/outputs. Team sessions keep the opposing team's draft private.

Inventory authorization is server-side. Ordinary settings saves cannot bypass unlocks or erase equipped cosmetics. Banners/titles/frames apply to profiles, themes to both coding workspaces, sound packs to UI sounds, and victory effects to match result screens.

Complexity hints are structural heuristics for JavaScript/TypeScript, not proofs of algorithmic complexity. Other languages retain real Judge0 runtime/memory metrics. The old O(1)-space badge was replaced with an objective rule: 15 distinct accepted problems using at most 16 MB measured memory. DP and graph mastery use the reviewed server category metadata.

Unused OpenSourceHub discovery, issues, developer search, chat, recommendations, digest/user-product modules, and their obsolete tests were moved to **backend/legacy/opensourcehub/**. This archive is outside TypeScript compilation and the active test suite. Shared auth, avatar, username, security, migration history and existing database tables were preserved. No OpenSourceHub deployment or hosted database was changed.

Cash prizes/payouts and automatic character-level conflict merging are not part of these implementations.

## Validation

Final checks on 26 October 2026: 671 backend tests passed (2 skipped), backend source/test type checks passed, and all 22 frontend pages built successfully using Webpack. Real Judge0 practice and Arena smoke checks passed on the rebuilt API. New-bank reference verification covered 53 cases across 11 additional algorithms.

```powershell
cd backend
npm test
npm run lint
npm run test:smoke
npm run test:features
npm run test:modes
npm run problems:verify-expanded
```

`test:smoke` requires the local API to be running. It refuses a nonlocal database, creates temporary users, checks access controls and persistence, runs real Judge0 samples and hidden tests, verifies final judging and winner persistence, then removes its temporary users. `test:features` checks clan permissions, inventory authorization, analytics, bracket byes and automatic progression using disposable local fixtures; its bracket judging results are injected fixtures, while real Judge0 execution is covered separately by `test:smoke`. `test:modes` checks Gauntlet, team draft conflicts, real Judge0 team judging, clan wars, spectators and Swiss progression. Its progression-only rounds use injected judged fixtures. `problems:verify-expanded` runs all new algorithm cases through Judge0 reference programs.

```powershell
cd frontend
npm run build
```

If Turbopack fails to launch its local CSS worker on Windows, use `npx next build --webpack`. The final production build was verified with this alternative engine. The configured Google fonts require network access during the build.

To reapply migrations or seed the local bank:

```powershell
cd backend
npm run migrate:local
npm run seed:local
```

For a deployment, supply a dedicated Code Arena database, Redis, Judge0 URL/auth, strong secrets, frontend origin and GitHub OAuth callback. Use `npm run migrate:production` with that deployment environment. Never reuse OpenSourceHub's database credentials for a new Code Arena deployment.
