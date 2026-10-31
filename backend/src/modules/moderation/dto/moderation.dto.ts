import { IsIn,IsOptional,IsString,Matches,MaxLength } from 'class-validator';
import { GITHUB_OWNER_PATTERN } from '../../../common/utils/github-pattern';

export const BLOCK_KINDS = ['BLOCK', 'MUTE'] as const;
export const REPORT_SUBJECTS = ['USER', 'MESSAGE', 'SUBMISSION'] as const;
export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE',
  'SEXUAL',
  'CHEATING',
  'IMPERSONATION',
  'OTHER',
] as const;

export const MAX_REPORT_DETAIL = 2000;
export const MAX_RESOLUTION_NOTE = 2000;

export class BlockUserDto {
  @IsString()
  @Matches(GITHUB_OWNER_PATTERN, { message: 'username must be a valid GitHub username' })
  username!: string;

  @IsOptional()
  @IsIn(BLOCK_KINDS)
  kind?: (typeof BLOCK_KINDS)[number];
}

export class CreateReportDto {
  @IsString()
  @Matches(GITHUB_OWNER_PATTERN, { message: 'username must be a valid GitHub username' })
  username!: string;

  @IsOptional()
  @IsIn(REPORT_REASONS)
  reason?: (typeof REPORT_REASONS)[number];

  @IsOptional()
  @IsIn(REPORT_SUBJECTS)
  subjectType?: (typeof REPORT_SUBJECTS)[number];

  /** The message or submission id, when the report is about one. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  subjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REPORT_DETAIL)
  detail?: string;
}

export class ResolveReportDto {
  /** `ACTIONED` means something was done about it; `DISMISSED` means nothing was. */
  @IsIn(['ACTIONED', 'DISMISSED'])
  action!: 'ACTIONED' | 'DISMISSED';

  @IsOptional()
  @IsString()
  @MaxLength(MAX_RESOLUTION_NOTE)
  note?: string;
}
