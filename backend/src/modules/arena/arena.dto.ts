import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreatePublicBattleDto } from '../battles/dto/battles.dto';

export class CreateRoomDto extends CreatePublicBattleDto {
  @IsBoolean() privateRoom!: boolean;
}

export class EvaluateDto {
  @IsString() @MaxLength(64000) code!: string;
  @IsIn(['javascript', 'typescript', 'python', 'cpp', 'go', 'java', 'rust']) language!: string;
  @IsOptional() @IsBoolean() submit?: boolean;
  @IsOptional() @IsString() @MaxLength(10000) input?: string;
}
export class SettingsDto {
  @IsObject() settings!: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
}
export class FeedbackDto {
  @IsIn(['bug', 'feature', 'general']) category!: string;
  @IsString() @MaxLength(5000) message!: string;
}
