import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Current password cannot exceed 20 characters' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  @Matches(/(?=.*\d)(?=.*[\W_])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  newPassword: string;

  @IsString()
  @MaxLength(20, { message: 'Password confirmation cannot exceed 20 characters' })
  @Match('newPassword', { message: 'Passwords do not match' })
  passwordConfirmation: string;
}
