import { ConfigService } from '@nestjs/config';

/** Options shared by every cookie the API sets (session and OAuth handshake). */
export function sessionCookieOptions(config: ConfigService) {
  const isProd = config.get<string>('nodeEnv') === 'production';
  return {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
  };
}

const FALLBACK_JWT_SECRET = 'opensourcehub_jwt_super_secret_key_change_in_prod';

export function jwtSecret(config: ConfigService): string {
  return config.get<string>('security.jwtSecret') || FALLBACK_JWT_SECRET;
}
