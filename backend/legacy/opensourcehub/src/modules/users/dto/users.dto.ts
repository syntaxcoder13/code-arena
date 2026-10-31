import {
ArrayMaxSize,
IsArray,
IsBoolean,
IsIn,
IsInt,
IsOptional,
IsString,
IsUrl,
Matches,
Max,
MaxLength,
Min,
MinLength,
ValidateIf,
} from 'class-validator';
import { Transform,Type } from 'class-transformer';

/** GitHub rules: 1-39 chars, alphanumeric or single hyphens, no edge hyphens. */
export const GITHUB_OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
export const GITHUB_REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const DIGEST_FREQUENCIES = ['daily', 'weekly', 'never'] as const;
export const ISSUE_STATUSES = ['todo', 'in_progress', 'pr_submitted', 'completed'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

const MAX_TAGS = 50;
const MAX_TAG_LENGTH = 50;
const MAX_NOTES_LENGTH = 2000;

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(EXPERIENCE_LEVELS, { each: true })
  preferredDifficulty?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  contributionAreas?: string[];

  @IsOptional()
  @IsBoolean()
  personalizedRecommendations?: boolean;

  @IsOptional()
  @IsBoolean()
  issueRecommendations?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  favoriteLanguages?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  technologies?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  topics?: string[];

  @IsOptional()
  @IsIn(EXPERIENCE_LEVELS)
  experienceLevel?: string;

  @IsOptional()
  @IsBoolean()
  receiveRecommendations?: boolean;

  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @IsBoolean()
  emailDigest?: boolean;

  @IsOptional()
  @IsIn(DIGEST_FREQUENCIES)
  digestFrequency?: string;
}

class RepoRefDto {
  @IsString()
  @Matches(GITHUB_OWNER_PATTERN, { message: 'owner must be a valid GitHub username or organisation' })
  owner!: string;

  @IsString()
  @Matches(GITHUB_REPO_PATTERN, { message: 'repo must be a valid GitHub repository name' })
  repo!: string;
}

export class SaveProjectDto extends RepoRefDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  @MaxLength(MAX_TAG_LENGTH, { each: true })
  tags?: string[];
}

export class SaveIssueDto extends SaveProjectDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  issueNumber!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  issueId?: string;
}

export class UpdateIssueStatusDto {
  @IsIn(ISSUE_STATUSES)
  status!: IssueStatus;

  /** Empty string clears the PR link; anything else must be an http(s) URL. */
  @IsOptional()
  @ValidateIf((o: UpdateIssueStatusDto) => !!o.prUrl)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  prUrl?: string;
}

export class ClaimIssueDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number;
}

export class ToggleBuddyDto {
  @IsBoolean()
  seekingBuddy!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  buddyNotes?: string;

  @IsOptional()
  @IsString()
  @Matches(GITHUB_OWNER_PATTERN)
  owner?: string;

  @IsOptional()
  @IsString()
  @Matches(GITHUB_REPO_PATTERN)
  repo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  issueNumber?: number;
}

/**
 * Onboarding cannot set a username or an email address: the username mirrors
 * the GitHub login (so it cannot be used to impersonate or lock out another
 * developer), and the email is the verified address GitHub gave us (so the
 * digest cannot be pointed at a stranger's inbox).
 */
export class OnboardUserDto {
  @IsOptional()
  @Transform(({ obj, key }) => obj[key])
  @IsBoolean()
  emailDigest?: boolean;

  /** Hosted image URL, or an inline base64 image when no upload service is configured. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1_000_000)
  @Matches(/^(https?:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/, {
    message: 'avatarUrl must be an http(s) URL or a base64 image',
  })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsIn(EXPERIENCE_LEVELS)
  experienceLevel?: string;
}
