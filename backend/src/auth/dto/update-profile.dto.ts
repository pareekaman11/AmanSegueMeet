import { IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(20, { message: 'Name cannot exceed 20 characters' })
  @Matches(/^[\p{L}\p{M}'’\-\.\s]{2,20}$/u, {
    message: 'Name should only contain valid letters, spaces, hyphens, and apostrophes (max 20 chars)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  suffix?: string;
}
