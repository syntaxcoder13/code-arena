import { parseOriginList } from '../common/security/origin-policy';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  cors: {
    /** Extra trusted frontend origins besides FRONTEND_URL (e.g. preview deployments). */
    allowedOrigins: string[];
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackUrl?: string;
  };
  security: {
    jwtSecret: string;
    cookieSecret: string;
    encryptionKey: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cors: {
    allowedOrigins: parseOriginList(process.env.CORS_ALLOWED_ORIGINS),
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'opensourcehub_jwt_super_secret_key_change_in_prod',
    cookieSecret: process.env.COOKIE_SECRET || process.env.SESSION_SECRET || 'opensourcehub_cookie_secret_key_change_in_prod',
    encryptionKey: process.env.ENCRYPTION_KEY || 'opensourcehub_default_aes_key_32_bytes!',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'OpenSourceHub <opensourcehub@vikrant.sbs>',
  },
});
