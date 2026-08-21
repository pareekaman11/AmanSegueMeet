import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidEmailStrict } from '../../common/decorators/is-valid-email.decorator';

export class LoginDto {
  @IsValidEmailStrict()
  @MaxLength(50, { message: 'Email address cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  password: string;
}
