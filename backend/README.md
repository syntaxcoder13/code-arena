# Code Arena backend

NestJS + Fastify API, PostgreSQL persistence, and Judge0 execution.

See [../CODEARENA_SETUP.md](../CODEARENA_SETUP.md) for verified local setup, feature coverage, environment isolation, and checks.

```powershell
npm run dev
npm test
npm run test:smoke
```

Development loads `.env.local`, never the pasted OpenSourceHub `.env`. Configure a separate Code Arena OAuth app with callback `http://localhost:5000/api/auth/github/callback`.

The adapted battle engine is exposed at `/api/arena`. Practice, progression, settings, and feedback use `/api/codearena`. Legacy battle routes remain aliases for compatibility with the inherited tests and tools.
