import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidEmailStrict } from '../../common/decorators/is-valid-email.decorator';
import { Match } from '../../common/decorators/match.decorator';

export class RegisterDto {
  /**
   * Email address: Min 5 characters, Max 50 characters.
   */
  @IsValidEmailStrict()
  @MinLength(5, { message: 'Email address is too short' })
  @MaxLength(50, { message: 'Email address cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  /**
   * Full Name: Min 2 characters, Max 20 characters.
   * Allows Unicode letters, accents, spaces, hyphens, and apostrophes.
   */
  @IsString({ message: 'Name must be a text string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(20, { message: 'Full name cannot exceed 20 characters' })
  @Matches(/^[\p{L}\p{M}'’\-\.\s]{2,20}$/u, {
    message: 'Full name should only contain valid letters, spaces, hyphens, and apostrophes (max 20 chars)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  /**
   * Password: Minimum 12 characters, Maximum 20 characters.
   */
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  @Matches(/(?=.*\d)(?=.*[\W_])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  password: string;

  @IsString()
  @MaxLength(20, { message: 'Password confirmation cannot exceed 20 characters' })
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirmation: string;

  /**
   * Organisation name: Min 2 characters, Max 30 characters.
   */
  @IsString()
  @IsNotEmpty({ message: 'Organisation name is required' })
  @MinLength(2, { message: 'Organisation name must be at least 2 characters' })
  @MaxLength(30, { message: 'Organisation name cannot exceed 30 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  organisationName: string;

  /**
   * Physical Address: Optional, min 5 chars if provided, Max 100 chars.
   */
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Physical address must be at least 5 characters if provided' })
  @MaxLength(100, { message: 'Physical address cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  physicalAddress?: string;

  /**
   * Country / Jurisdiction: Optional, max 100 chars.
   */
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Country name cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;
}
