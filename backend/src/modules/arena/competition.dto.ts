import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';
export class CompetitionDto {
  @IsIn(['GAUNTLET','TEAM','CLAN_WAR']) kind!: string;
  @IsIn(['javascript','typescript','python','cpp','go']) language!: string;
  @IsIn(['easy','medium','hard']) difficulty!: string;
  @IsInt() @IsIn([180,300,600,900]) durationSeconds!: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3) @IsString({ each: true }) @MaxLength(40, { each: true }) players!: string[];
}
export class SharedDraftDto {
  @IsString() @MaxLength(64000) code!: string;
  @IsInt() @Min(0) revision!: number;
}
export class SharedSubmitDto { @IsInt() @Min(0) revision!: number; }
