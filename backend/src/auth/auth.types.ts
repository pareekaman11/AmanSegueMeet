/**
 * Shared auth types used across auth and feature modules.
 *
 * Kept in a dedicated file so that controllers/services can import the
 * interface with `import type` (required by isolatedModules + emitDecoratorMetadata).
 */

/** Shape of the JWT payload written at sign-time. */
export type JwtPayload = {
  /** Subject — the authenticated user's UUID */
  sub: string;
  email: string;
  jti?: string;
  iat?: number;
  exp?: number;
};

/**
 * The user object placed on req.user by JwtStrategy.validate().
 * Never includes passwordHash.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  mobileNumber?: string | null;
  title?: string | null;
  suffix?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  currentJti?: string;
}

/** Prisma select that guarantees passwordHash is never returned. */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  mobileNumber: true,
  title: true,
  suffix: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;
