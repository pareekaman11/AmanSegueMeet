import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { TokenBlocklistService } from '../token-blocklist.service';
import {
  type JwtPayload,
  type AuthenticatedUser,
  SAFE_USER_SELECT,
} from '../auth.types';

/**
 * JwtStrategy — validates Bearer tokens on every protected route.
 *
 * Passport calls validate() with the decoded payload after signature
 * verification.  The return value is attached to req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenBlocklistService: TokenBlocklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.jti) {
      if (this.tokenBlocklistService.isTokenRevoked(payload.jti)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify session revocation in database if delegate is available
      if ((this.prisma as any).userSession?.findUnique) {
        try {
          const session = await (this.prisma as any).userSession.findUnique({
            where: { jti: payload.jti },
            select: { isRevoked: true, expiresAt: true },
          });

          if (session?.isRevoked) {
            this.tokenBlocklistService.revokeToken(payload.jti, Math.floor(session.expiresAt.getTime() / 1000));
            throw new UnauthorizedException('Session has been revoked');
          }
        } catch (err) {
          if (err instanceof UnauthorizedException) throw err;
        }
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        ...SAFE_USER_SELECT,
        lastPasswordResetAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    if (user.lastPasswordResetAt && payload.iat) {
      const issuedAtDate = new Date(payload.iat * 1000);
      if (issuedAtDate < user.lastPasswordResetAt) {
        throw new UnauthorizedException('Token has been revoked due to a password reset');
      }
    }

    // Omit lastPasswordResetAt from the returned user object
    const { lastPasswordResetAt, ...safeUser } = user;
    return {
      ...safeUser,
      currentJti: payload.jti,
    } as AuthenticatedUser;
  }
}
