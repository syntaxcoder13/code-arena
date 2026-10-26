# Judge0 with current runtimes

The published `judge0/judge0:1.13.1` image is the newest one there is — April
2024 — and it ships **Node 12.14, Python 3.8.1, Java 13 and Go 1.13.5**. Newer
runtimes exist on Judge0's hosted service but in no self-hostable image.

Node 12 is the one that hurts: `?.` and `??` are syntax errors there, and a
player who writes them in a timed battle loses to a parser rather than to an
opponent.

A language in Judge0 is only a database row naming a binary, so the fix is to
install newer runtimes alongside the old ones and register them. Nothing
already in the image is touched: every existing language keeps working and
problems written against them keep running exactly as before.

| | Was | Now |
|---|---|---|
| JavaScript | Node 12.14.0 | **Node 22.11.0** |
| Python | 3.8.1 | **3.13.0** |
| Java | OpenJDK 13 | **OpenJDK 21** |
| Go | 1.13.5 | 1.13.5 — see below |

Node 18 and later need glibc 2.28. The base image is Debian 10, which has
exactly 2.28 — that is the ceiling, and why these versions and not newer.

**Go stays on 1.13.5.** Go removed its pre-compiled standard library after
1.19, so every compile rebuilds the parts of it a program touches. Inside a
fresh sandbox there is no cache to reuse, and the judge compiles once per test
case — four runs over seven cases is nearly thirty compiles for one
submission. Go 1.23 blew the ten second compile limit on a five line program;
raising the limit would just make a Go battle take minutes. Go 1.13 ships the
prebuilt archives, which is exactly why it is fast, and nothing in the problem
bank needs anything newer.

## Installing

On the VPS, from the `judge0-v1.13.1` directory that holds `docker-compose.yml`
and `judge0.conf`. Copy this directory there first.

Build the image (a few minutes; it downloads four runtimes):

```bash
docker build -t judge0-current:1.13.1 -f judge0/Dockerfile judge0/
```

Point the two Judge0 services at it. In `docker-compose.yml`, change the
`image:` line of **both** `server` and `workers`:

```yaml
image: judge0-current:1.13.1
```

Restart them:

```bash
docker compose up -d --force-recreate server workers
```

The runtimes register themselves as part of Judge0's own seed on boot. Check
they are there:

```bash
curl -s -H "X-Auth-Token: $J0" http://localhost:2358/languages | tr ',' '\n' | grep -E '"id":2[0-9][0-9]'
```

And that one actually runs — this uses syntax Node 12 rejects:

```bash
curl -s -H "X-Auth-Token: $J0" -H "Content-Type: application/json" -d '{"language_id":201,"source_code":"const x=null; console.log(x?.y ?? 42)"}' "http://localhost:2358/submissions?base64_encoded=false&wait=true"
```

`"stdout":"42\n"` means it worked.

## The application needs no change

OpenSourceHub resolves language ids from the instance itself, by name, taking
the highest id that matches. Node 22 is id 201 and Node 12 is 63, so the new
one is picked up on the next boot with nothing to edit.

## Why the languages live in the image

Judge0 re-seeds on boot, and its seed deletes every row in `languages` before
recreating its own. Rows inserted into the database by hand survive exactly
until the next `docker compose up --force-recreate` — and nothing says so.
Submissions simply start failing with "language with id 201 doesn't exist".

So `languages-extra.rb` is appended to Judge0's own seed file inside the
image. The re-seed then restores these rather than wiping them, and there is
nothing to remember to re-run.

Adding a language therefore means editing `languages-extra.rb`, rebuilding and
recreating the two containers — not writing a row into the database. Doing the
latter appears to work and then quietly stops working.

## After changing the sandbox

Every expected output in the problem bank was computed by running code. Change
the runtime and those answers are no longer measurements of what players will
actually run:

```bash
cd backend && npm run problems:verify -- --dry --revalidate
```

It re-runs every banked problem and reports any answer that moved. After this
upgrade, all fifteen produced identical answers on the new runtimes.
