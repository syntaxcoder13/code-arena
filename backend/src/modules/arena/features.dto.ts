import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class ClanDto {
  @IsString() @MinLength(3) @MaxLength(40) name!: string;
  @IsString() @Matches(/^[A-Z0-9]{2,6}$/) tag!: string;
  @IsString() @MaxLength(300) description!: string;
}
export class TournamentDto {
  @IsOptional() @IsIn(['ELIMINATION', 'SWISS']) format: string = 'ELIMINATION';
  @IsOptional() @IsInt() @IsIn([3,4,5]) roundLimit: number = 3;
  @IsString() @MinLength(3) @MaxLength(60) name!: string;
  @IsIn(['easy', 'medium', 'hard']) difficulty!: string;
  @IsIn(['javascript', 'typescript', 'python', 'cpp', 'go']) language!: string;
  @IsInt() @IsIn([180, 300, 600, 900, 1800]) durationSeconds!: number;
  @IsInt() @IsIn([4, 8, 16]) capacity!: number;
}
export class EquipDto { @IsString() @MaxLength(60) itemId!: string; }
