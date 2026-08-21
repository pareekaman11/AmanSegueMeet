import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum SupportCategory {
  ACCOUNT_LOGIN = 'ACCOUNT_LOGIN',
  MEETINGS = 'MEETINGS',
  AGENDA = 'AGENDA',
  BOARD_PACK = 'BOARD_PACK',
  MINUTES = 'MINUTES',
  DOCUMENTS = 'DOCUMENTS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  OTHER = 'OTHER',
}

export enum SupportPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum SupportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class CreateSupportRequestDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsOptional()
  @IsEnum(SupportCategory)
  category?: SupportCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  description: string;

  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;
}

export class UpdateSupportRequestDto {
  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;
}
