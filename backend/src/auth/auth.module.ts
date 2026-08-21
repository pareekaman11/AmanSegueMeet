import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlocklistService } from './token-blocklist.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),

    /**
     * JwtModule is configured asynchronously so that ConfigService is available
     * to read JWT_SECRET from the environment at bootstrap time.
     */
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast required: @nestjs/jwt uses ms.StringValue, not bare string.
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlocklistService],
  /**
   * Export JwtAuthGuard and JwtStrategy so that other modules (e.g. future
   * decorators or policy-based auth) can reuse them without re-importing.
   */
  exports: [AuthService, JwtModule, PassportModule, TokenBlocklistService],
})
export class AuthModule {}
