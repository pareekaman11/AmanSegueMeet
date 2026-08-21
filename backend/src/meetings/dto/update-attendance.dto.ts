import { IsString, IsIn, IsOptional } from 'class-validator';

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'EXCUSED', 'REMOTE', 'LATE'] as const;
export type AttendanceStatusType = (typeof ATTENDANCE_STATUSES)[number];

export class UpdateAttendanceDto {
  @IsString()
  @IsIn(ATTENDANCE_STATUSES, {
    message: 'attendanceStatus must be one of: PRESENT, ABSENT, EXCUSED, REMOTE, LATE',
  })
  attendanceStatus: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
