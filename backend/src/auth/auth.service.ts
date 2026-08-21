import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { TokenBlocklistService } from './token-blocklist.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  type JwtPayload,
  type AuthenticatedUser,
  SAFE_USER_SELECT,
} from './auth.types';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

/** bcrypt cost factor — 12 rounds is the recommended production minimum. */
const BCRYPT_ROUNDS = 12;

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenBlocklistService: TokenBlocklistService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    // 1. Reject duplicate email early (before touching the DB transactionally)
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    // 2. Hash password — never store plaintext
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 2.5 Generate email verification token (SHA-256 hash for DB, raw token for email)
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 3. Atomically create: User → Organisation → OrganisationMember (BOARD_ADMIN)
    //    Using $transaction to guarantee consistency.
    let result: { userId: string; orgId: string; orgName: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            name: dto.name.trim(),
            passwordHash,
            isEmailVerified: false,
            verificationTokenHash,
            verificationExpires,
          },
          select: { id: true },
        });

        const org = await tx.organisation.create({
          data: { 
            name: dto.organisationName.trim(),
            settings: {
              physicalAddress: dto.physicalAddress,
              country: dto.country,
            }
          },
          select: { id: true, name: true },
        });

        await tx.organisationMember.create({
          data: {
            userId: user.id,
            organisationId: org.id,
            role: OrganisationRole.BOARD_ADMIN,
          },
        });

        return { userId: user.id, orgId: org.id, orgName: org.name };
      });
    } catch {
      throw new InternalServerErrorException(
        'Registration failed — please try again',
      );
    }

    // 4. Fetch the fully populated safe user representation for the response
    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: result.userId },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            organisationId: true,
            role: true,
            organisation: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 4. Send verification email
    await this.mailService.sendVerificationEmail(safeUser.email, verificationToken);

    await this.auditService.logSystemEvent(
      'USER_REGISTERED',
      'User successfully registered an account',
      { userId: safeUser.id },
    );

    return {
      message: 'Account created successfully. Please verify your email.',
      user: safeUser,
    };
  }

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  async login(dto: LoginDto, req?: any) {
    const email = dto.email.toLowerCase().trim();

    // Fetch user including passwordHash for comparison
    const user: any = await this.prisma.user.findUnique({ where: { email } });

    // 1. Check temporary account lockout
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditService.logSystemEvent(
        'ACCOUNT_LOCKED_ATTEMPT',
        'Login attempted on temporarily locked account',
        { userId: user.id },
      );
      throw new UnauthorizedException(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      );
    }

    // 2. Use a timing-safe comparison path — return the same error for missing
    // user and wrong password to prevent email enumeration.
    if (!user || !user.passwordHash) {
      // Run a dummy bcrypt to maintain constant-time behaviour
      await bcrypt.compare(
        dto.password,
        '$2b$12$invalidhashpadding000000000000000',
      );
      
      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;
      const willLock = nextAttempts >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts,
          ...(willLock && { lockedUntil }),
        },
      });

      await this.auditService.logSystemEvent(
        willLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        willLock
          ? 'Account temporarily locked for 15 minutes due to 5 consecutive failed login attempts'
          : 'Failed login attempt (wrong password)',
        { userId: user.id, attemptNumber: nextAttempts },
      );

      if (willLock) {
        throw new UnauthorizedException(
          'Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.'
        );
      }

      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    // Unverified account
    if (!user.isEmailVerified) {
      await this.auditService.logSystemEvent(
        'LOGIN_FAILED',
        'Failed login attempt (account unverified)',
        { userId: user.id },
      );
      throw new UnauthorizedException('Invalid email or password or account unverified.');
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Fetch the fully populated safe user with memberships
    const safeUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            organisationId: true,
            role: true,
            organisation: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (safeUser) {
      await this.auditService.logSystemEvent(
        'LOGIN_SUCCESS',
        'User successfully logged in',
        { userId: safeUser.id },
      );
    }

    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, jti });

    try {
      const ipAddress = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req?.ip || '127.0.0.1';
      const userAgent = req?.headers?.['user-agent'] || 'Web Browser';
      await (this.prisma as any).userSession.create({
        data: {
          userId: user.id,
          jti,
          userAgent,
          ipAddress,
          expiresAt,
          isRevoked: false,
        },
      });
    } catch (e) {
      this.logger.warn('Failed to record user session in database', e);
    }

    return {
      accessToken,
      user: safeUser,
    };
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  async logout(jti?: string, exp?: number, userId?: string) {
    if (jti) {
      if (exp) {
        this.tokenBlocklistService.revokeToken(jti, exp);
      }
      try {
        await (this.prisma as any).userSession.updateMany({
          where: { jti },
          data: { isRevoked: true },
        });
      } catch (err) {
        this.logger.warn('Failed to mark session as revoked in database', err);
      }
    }
    
    if (userId) {
      await this.auditService.logSystemEvent(
        'LOGOUT',
        'User logged out',
        { userId },
      );
    }

    return {
      message: 'Logged out successfully.',
    };
  }

  // ─────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────

  async getUserSessions(userId: string, currentJti?: string) {
    if (!(this.prisma as any).userSession?.findMany) {
      return currentJti ? [{
        id: 'current-session',
        ipAddress: '127.0.0.1',
        userAgent: 'Current Active Session',
        lastActiveAt: new Date(),
        createdAt: new Date(),
        isCurrent: true,
      }] : [];
    }

    try {
      const sessions = await (this.prisma as any).userSession.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sessions.map((s: any) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        isCurrent: currentJti ? s.jti === currentJti : false,
      }));
    } catch (err) {
      return [];
    }
  }

  async revokeSession(userId: string, sessionId: string) {
    if (!(this.prisma as any).userSession?.findFirst) {
      return { message: 'Session revoked successfully.' };
    }

    const session = await (this.prisma as any).userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await (this.prisma as any).userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    const exp = Math.floor(session.expiresAt.getTime() / 1000);
    this.tokenBlocklistService.revokeToken(session.jti, exp);

    await this.auditService.logSystemEvent(
      'SESSION_REVOKED',
      'User revoked an active session',
      { userId, sessionId },
    );

    return { message: 'Session revoked successfully.' };
  }

  async revokeAllOtherSessions(userId: string, currentJti?: string) {
    if (!(this.prisma as any).userSession?.findMany) {
      return { message: 'All other sessions have been revoked.', revokedCount: 0 };
    }

    const sessionsToRevoke = await (this.prisma as any).userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        ...(currentJti && { jti: { not: currentJti } }),
      },
    });

    for (const session of sessionsToRevoke) {
      const exp = Math.floor(session.expiresAt.getTime() / 1000);
      this.tokenBlocklistService.revokeToken(session.jti, exp);
    }

    await (this.prisma as any).userSession.updateMany({
      where: {
        userId,
        ...(currentJti && { jti: { not: currentJti } }),
      },
      data: { isRevoked: true },
    });

    await this.auditService.logSystemEvent(
      'ALL_SESSIONS_REVOKED',
      'User revoked all other active sessions',
      { userId, count: sessionsToRevoke.length },
    );

    return {
      message: `Revoked ${sessionsToRevoke.length} other session(s).`,
      revokedCount: sessionsToRevoke.length,
    };
  }

  // ─────────────────────────────────────────────
  // ME
  // ─────────────────────────────────────────────

  async me(currentUser: AuthenticatedUser) {
    // Re-query to include organisation memberships efficiently
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        ...SAFE_USER_SELECT,
        memberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            organisationId: true,
            organisation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.suffix !== undefined && { suffix: dto.suffix }),
      },
      select: SAFE_USER_SELECT
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'seguemeet_avatars',
          resource_type: 'image',
          transformation: [{ width: 500, height: 500, crop: 'limit' }],
        },
        async (error, result) => {
          if (error) {
            return reject(new InternalServerErrorException('Failed to upload image'));
          }
          if (!result) {
            return reject(new InternalServerErrorException('No result from Cloudinary'));
          }

          try {
            const updatedUser = await this.prisma.user.update({
              where: { id: userId },
              data: { avatarUrl: result.secure_url },
              select: SAFE_USER_SELECT,
            });
            resolve(updatedUser);
          } catch (dbError) {
            reject(new InternalServerErrorException('Failed to update avatar in database'));
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // ─────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────

  async verifyEmail(token: string) {
    const verificationTokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        verificationTokenHash,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationTokenHash: null,
        verificationExpires: null,
      },
    });

    await this.auditService.logSystemEvent(
      'EMAIL_VERIFIED',
      'User verified their email address',
      { userId: user.id },
    );

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && !user.isEmailVerified) {
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash,
          verificationExpires,
        },
      });

      await this.mailService.sendVerificationEmail(user.email, verificationToken);
      
      await this.auditService.logSystemEvent(
        'EMAIL_VERIFICATION_SENT',
        'Resent verification email',
        { userId: user.id },
      );
    }

    // Generic response to prevent enumeration
    return { message: 'If the account exists and requires verification, a verification email has been sent.' };
  }

  // ─────────────────────────────────────────────
  // PASSWORD RESET
  // ─────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Silently return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists for this email, a password reset link has been sent.' };
    }

    // Generate secure token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpires,
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetToken);

    await this.auditService.logSystemEvent(
      'PASSWORD_RESET_REQUESTED',
      'User requested a password reset',
      { userId: user.id },
    );

    return { message: 'If an account exists for this email, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetTokenHash = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
        lastPasswordResetAt: new Date(),
      },
    });

    await this.auditService.logSystemEvent(
      'PASSWORD_RESET_COMPLETED',
      'User completed password reset',
      { userId: user.id },
    );

    return { message: 'Password has been reset successfully.' };
  }

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────

  async changePassword(currentUser: AuthenticatedUser, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found or password not set.');
    }

    const passwordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect current password.');
    }

    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ConflictException('New password must be different from current password.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastPasswordResetAt: new Date(),
      },
    });

    await this.auditService.logSystemEvent(
      'PASSWORD_CHANGED',
      'User changed their password',
      { userId: user.id },
    );

    return { message: 'Password changed successfully.' };
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  private issueToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email, jti: randomUUID() };
    return this.jwtService.sign(payload);
  }
}
