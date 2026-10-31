import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret',
      COOKIE_SECRET: 'test-cookie-secret',
      ENCRYPTION_KEY: 'test-encryption-key',
      RESEND_API_KEY: '',
      GITHUB_TOKEN: '',
      REDIS_URL: '',
      QUEUE_REDIS_URL: '',
      LIVE_EVENTS_ENABLED: 'true',
      DISABLE_BACKGROUND_JOBS: 'false',
      JUDGE0_URL: '',
      JUDGE0_AUTH_TOKEN: '',
      FRONTEND_URL: 'https://app.example.com',
      CORS_ALLOWED_ORIGINS: 'https://preview.example.com',
    },
  },
});
