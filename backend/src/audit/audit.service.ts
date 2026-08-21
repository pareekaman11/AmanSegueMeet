import { Injectable, Logger, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrganisationsService))
    private readonly organisationsService: OrganisationsService,
  ) {}

  /**
   * Logs an audit event transactionally.
   * Throws errors so the transaction can rollback.
   */
  async logTx(tx: Prisma.TransactionClient, params: {
    organisationId: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload?: object;
  }) {
    await tx.auditLog.create({
      data: {
        organisationId: params.organisationId,
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        payload: params.payload ? (params.payload as any) : null,
      },
    });
  }

  /**
   * Logs a global system event (e.g. auth lifecycle).
   */
  async logSystemEvent(action: string, description: string, payload?: object) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organisationId: 'SYSTEM_AUTH',
          actorId: (payload as any)?.userId || null,
          action,
          entityType: 'System',
          entityId: 'Auth',
          payload: { description, ...payload } as any,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log system event: ${action}`, err);
    }
  }

  /**
   * Logs an audit event asynchronously. Never throws, even on failure.
   */
  async log(params: {
    organisationId: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload?: object;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organisationId: params.organisationId,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          payload: params.payload ? (params.payload as any) : null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for action ${params.action} on ${params.entityType} ${params.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * GET /audit
   * Fetch audit logs for an organisation
   */
  async getLogs(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.auditLog.findMany({
        where: { organisationId },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch audit logs for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch audit logs');
    }
  }
}
