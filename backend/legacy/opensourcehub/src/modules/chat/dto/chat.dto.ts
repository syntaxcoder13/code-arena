import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from 'class-validator';
import { GITHUB_OWNER_PATTERN } from '../../users/dto/users.dto';

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_CODE_LENGTH = 10000;

/** Languages the composer offers; anything else is stored as plain text. */
export const CODE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'java',
  'bash',
  'json',
  'sql',
  'text',
] as const;

export class StartConversationDto {
  @IsString()
  @Matches(GITHUB_OWNER_PATTERN, { message: 'username must be a valid GitHub username' })
  username!: string;
}

export class SendMessageDto {
  @IsOptional()
  @IsUUID()
  clientMessageId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_CODE_LENGTH)
  codeSnippet?: string;

  // Only meaningful alongside a snippet, and only from the known list
  @ValidateIf((dto: SendMessageDto) => Boolean(dto.codeSnippet))
  @IsOptional()
  @IsIn(CODE_LANGUAGES)
  codeLanguage?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class MarkReadDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID(undefined, { each: true })
  messageIds!: string[];
}
