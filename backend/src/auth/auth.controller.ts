import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ExtractJwt } from 'passport-jwt';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * POST /auth/register
   *
   * Creates a new user account and a new organisation.
   * The user becomes BOARD_ADMIN of the created organisation.
   * Returns an access token and safe user/organisation info.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   *
   * Validates credentials, returns a JWT access token.
   * Uses constant-time bcrypt comparison to prevent timing attacks.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Get('verify')
  verify(@Req() req: Request) {
    const token = req.query.token as string;
    return this.authService.verifyEmail(token);
  }

  /**
   * POST /auth/logout
   *
   * Revokes the current token via the blocklist.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
    if (token) {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.jti && decoded.exp) {
        return this.authService.logout(decoded.jti, decoded.exp, decoded.sub);
      }
    }
    return this.authService.logout();
  }

  /**
   * GET /auth/sessions
   *
   * List active sessions for the current user.
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserSessions(user.id, user.currentJti);
  }

  /**
   * DELETE /auth/sessions/:id
   *
   * Revoke a specific active session.
   */
  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  revokeSession(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const sessionId = (req.params as any)?.id;
    return this.authService.revokeSession(user.id, sessionId);
  }

  /**
   * POST /auth/sessions/revoke-others
   *
   * Revoke all active sessions except the current one.
   */
  @Post('sessions/revoke-others')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  revokeAllOtherSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllOtherSessions(user.id, user.currentJti);
  }

  /**
   * GET /auth/me
   *
   * Returns the authenticated user's profile including their
   * organisation memberships and roles.
   * Requires a valid JWT Bearer token.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  /**
   * PATCH /auth/me
   *
   * Updates the authenticated user's profile.
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.changePassword(user, dto);
  }

  /**
   * POST /auth/me/avatar
   *
   * Uploads a new profile picture to Cloudinary and updates the user record.
   */
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }), // 1MB Max
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    ) file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.uploadAvatar(user.id, file);
  }
}

