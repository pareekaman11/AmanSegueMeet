import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum FeedbackType {
  SUGGESTION = 'SUGGESTION',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BUG = 'BUG',
  GENERAL = 'GENERAL',
}

export enum FeedbackStatus {
  NEW = 'NEW',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateFeedbackDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageUrl?: string;
}

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  @IsNotEmpty()
  status: FeedbackStatus;
}
