import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  meetingCreated?: boolean;

  @IsOptional()
  @IsBoolean()
  meetingUpdated?: boolean;

  @IsOptional()
  @IsBoolean()
  meetingCancelled?: boolean;

  @IsOptional()
  @IsBoolean()
  agendaPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  minutesConfirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  actionItemAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  documentUploaded?: boolean;

  @IsOptional()
  @IsBoolean()
  tenureExpiring?: boolean;
}
