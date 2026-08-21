import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenBlocklistService } from './token-blocklist.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IsValidEmailStrictConstraint } from '../common/decorators/is-valid-email.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService & Security Validation Rules', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let tokenBlocklistService: any;
  let mailService: any;
  let auditService: any;
  const emailValidator = new IsValidEmailStrictConstraint();

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
      organisation: {
        create: jest.fn(),
      },
      organisationMember: {
        create: jest.fn(),
      },
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('token'),
    };

    tokenBlocklistService = {
      revokeToken: jest.fn(),
      isTokenRevoked: jest.fn(),
    };

    mailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    auditService = {
      logSystemEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: TokenBlocklistService, useValue: tokenBlocklistService },
        { provide: MailService, useValue: mailService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Strict Email Validation & Incomplete Gmail Detection', () => {
    it('should accept valid, complete RFC-compliant email addresses', () => {
      expect(emailValidator.validate('john.doe@gmail.com', {} as any)).toBe(true);
      expect(emailValidator.validate('alex@company.org', {} as any)).toBe(true);
      expect(emailValidator.validate('contact@sub.domain.co.uk', {} as any)).toBe(true);
    });

    it('should reject incomplete Gmail entries and domain typos', () => {
      expect(emailValidator.validate('john@gmail', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.co', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gamil.com', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmai.com', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.c', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.cm', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.con', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.om', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.org', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail.in', {} as any)).toBe(false);
    });

    it('should reject malformed email structures and dots', () => {
      expect(emailValidator.validate('john..doe@gmail.com', {} as any)).toBe(false);
      expect(emailValidator.validate('.john@gmail.com', {} as any)).toBe(false);
      expect(emailValidator.validate('john.@gmail.com', {} as any)).toBe(false);
      expect(emailValidator.validate('john@.gmail.com', {} as any)).toBe(false);
      expect(emailValidator.validate('john@gmail..com', {} as any)).toBe(false);
    });

    it('should reject emails exceeding maximum length limit (254 chars)', () => {
      const longUser = 'a'.repeat(65);
      expect(emailValidator.validate(`${longUser}@gmail.com`, {} as any)).toBe(false);
      const longEmail = 'a'.repeat(250) + '@gmail.com';
      expect(emailValidator.validate(longEmail, {} as any)).toBe(false);
    });
  });

  describe('RegisterDto Character Limits & Rules', () => {
    it('should accept valid complete registration payload', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'Nayan Mishra',
        email: 'nayan@example.com',
        password: 'ValidPassword123!',
        passwordConfirmation: 'ValidPassword123!',
        organisationName: 'Acme Corp',
        physicalAddress: '123 Innovation Way',
        country: 'India',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject name shorter than 2 or longer than 20 characters', async () => {
      const shortNameDto = plainToInstance(RegisterDto, {
        name: 'A',
        email: 'nayan@example.com',
        password: 'ValidPassword123!',
        passwordConfirmation: 'ValidPassword123!',
        organisationName: 'Acme Corp',
      });
      const shortErrors = await validate(shortNameDto);
      expect(shortErrors.some((e) => e.property === 'name')).toBe(true);

      const longNameDto = plainToInstance(RegisterDto, {
        name: 'A'.repeat(21),
        email: 'nayan@example.com',
        password: 'ValidPassword123!',
        passwordConfirmation: 'ValidPassword123!',
        organisationName: 'Acme Corp',
      });
      const longErrors = await validate(longNameDto);
      expect(longErrors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should reject password shorter than 12 or longer than 20 characters', async () => {
      const shortPassDto = plainToInstance(RegisterDto, {
        name: 'Nayan Mishra',
        email: 'nayan@example.com',
        password: 'Short1!',
        passwordConfirmation: 'Short1!',
        organisationName: 'Acme Corp',
      });
      const shortErrors = await validate(shortPassDto);
      expect(shortErrors.some((e) => e.property === 'password')).toBe(true);

      const longPassDto = plainToInstance(RegisterDto, {
        name: 'Nayan Mishra',
        email: 'nayan@example.com',
        password: 'A1!'.repeat(8), // 24 chars
        passwordConfirmation: 'A1!'.repeat(8),
        organisationName: 'Acme Corp',
      });
      const longErrors = await validate(longPassDto);
      expect(longErrors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should reject physical address shorter than 5 or longer than 100 characters when provided', async () => {
      const shortAddressDto = plainToInstance(RegisterDto, {
        name: 'Nayan Mishra',
        email: 'nayan@example.com',
        password: 'ValidPassword123!',
        passwordConfirmation: 'ValidPassword123!',
        organisationName: 'Acme Corp',
        physicalAddress: '123',
      });
      const shortErrors = await validate(shortAddressDto);
      expect(shortErrors.some((e) => e.property === 'physicalAddress')).toBe(true);

      const longAddressDto = plainToInstance(RegisterDto, {
        name: 'Nayan Mishra',
        email: 'nayan@example.com',
        password: 'ValidPassword123!',
        passwordConfirmation: 'ValidPassword123!',
        organisationName: 'Acme Corp',
        physicalAddress: 'X'.repeat(101),
      });
      const longErrors = await validate(longAddressDto);
      expect(longErrors.some((e) => e.property === 'physicalAddress')).toBe(true);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: 'Password12345!' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('Password12345!', 12);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', passwordHash: hash, isEmailVerified: true });
      await expect(service.login({ email: 'test@test.com', password: 'WrongPassword12345!' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is not verified', async () => {
      const hash = await bcrypt.hash('Password12345!', 12);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', passwordHash: hash, isEmailVerified: false });
      await expect(service.login({ email: 'test@test.com', password: 'Password12345!' })).rejects.toThrow(UnauthorizedException);
    });

    it('should block login if account is temporarily locked', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        passwordHash: 'hash',
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      await expect(service.login({ email: 'test@test.com', password: 'Password12345!' }))
        .rejects.toThrow('Account is temporarily locked due to multiple failed login attempts');
    });

    it('should lock account for 15 minutes after 5 failed attempts', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 12);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        passwordHash: hash,
        failedLoginAttempts: 4,
        isEmailVerified: true,
      });

      await expect(service.login({ email: 'test@test.com', password: 'WrongPassword123!' }))
        .rejects.toThrow('Account is temporarily locked due to multiple failed login attempts');

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('Session Management', () => {
    it('should return active sessions with isCurrent flag', async () => {
      prismaService.userSession.findMany.mockResolvedValue([
        { id: 's1', jti: 'jti-1', userAgent: 'Chrome', ipAddress: '127.0.0.1', lastActiveAt: new Date(), createdAt: new Date() },
        { id: 's2', jti: 'jti-2', userAgent: 'Safari', ipAddress: '192.168.1.1', lastActiveAt: new Date(), createdAt: new Date() },
      ]);

      const sessions = await service.getUserSessions('user-1', 'jti-1');
      expect(sessions).toHaveLength(2);
      expect(sessions[0].isCurrent).toBe(true);
      expect(sessions[1].isCurrent).toBe(false);
    });

    it('should revoke a single session and token', async () => {
      prismaService.userSession.findFirst.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        jti: 'jti-1',
        expiresAt: new Date(Date.now() + 600000),
      });
      prismaService.userSession.update.mockResolvedValue({ id: 's1', isRevoked: true });

      const res = await service.revokeSession('user-1', 's1');
      expect(res.message).toBe('Session revoked successfully.');
      expect(tokenBlocklistService.revokeToken).toHaveBeenCalled();
    });

    it('should revoke all other sessions', async () => {
      prismaService.userSession.findMany.mockResolvedValue([
        { id: 's2', jti: 'jti-2', expiresAt: new Date(Date.now() + 600000) },
      ]);

      const res = await service.revokeAllOtherSessions('user-1', 'jti-1');
      expect(res.revokedCount).toBe(1);
      expect(tokenBlocklistService.revokeToken).toHaveBeenCalledWith('jti-2', expect.any(Number));
    });
  });
});

