import { IsString, Matches } from 'class-validator';

export class ExchangeLoginCodeDto {
  /** 32 random bytes, base64url. */
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/, { message: 'code is malformed' })
  code!: string;

  /** RFC 7636 code_verifier. */
  @IsString()
  @Matches(/^[A-Za-z0-9._~-]{43,128}$/, { message: 'codeVerifier is malformed' })
  codeVerifier!: string;
}
