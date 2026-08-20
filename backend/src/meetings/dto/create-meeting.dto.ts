import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { MeetingStatus } from '@prisma/client';
import { IsIanaTimeZone } from '../../common/validators/is-timezone.validator';

export class CreateMeetingDto {
  @IsUUID()
  @IsNotEmpty()
  organisationId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsString()
  videoLink?: string;

  @IsOptional()
  @IsIanaTimeZone()
  timeZone?: string;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsString()
  administrator?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  attendeeIds?: string[];

  @IsOptional()
  @IsUUID()
  committeeId?: string;

  @IsOptional()
  @IsBoolean()
  committeeVisible?: boolean;
}
