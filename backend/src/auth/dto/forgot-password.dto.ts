import { IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidEmailStrict } from '../../common/decorators/is-valid-email.decorator';

export class ForgotPasswordDto {
  @IsValidEmailStrict()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Email address cannot exceed 50 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;
}
