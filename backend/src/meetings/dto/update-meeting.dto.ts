import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsUUID, Matches } from 'class-validator';
import { MeetingStatus, AgendaStatus } from '@prisma/client';
import { IsIanaTimeZone } from '../../common/validators/is-timezone.validator';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

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
  @IsEnum(AgendaStatus)
  agendaStatus?: AgendaStatus;

  @IsOptional()
  @IsUUID()
  committeeId?: string;

  @IsOptional()
  @IsBoolean()
  committeeVisible?: boolean;
}
