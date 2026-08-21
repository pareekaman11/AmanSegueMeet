import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CAN_MANAGE_COMMITTEES } from '../common/auth/roles.constants';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CommitteesService {
  private readonly logger = new Logger(CommitteesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async getCommittees(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      return await this.prisma.committee.findMany({
        where: { organisationId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch committees for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch committees');
    }
  }

  async createCommittee(dto: CreateCommitteeDto, user: AuthenticatedUser) {
    await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const committee = await this.prisma.$transaction(async (tx) => {
        const c = await tx.committee.create({
          data: {
            name: dto.name,
            description: dto.description,
            organisationId: dto.organisationId,
            members: {
              create: {
                userId: user.id,
                role: 'CHAIR',
              }
            }
          },
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        });

        await this.auditService.logTx(tx, {
          organisationId: dto.organisationId,
          actorId: user.id,
          action: 'committee.created',
          entityType: 'Committee',
          entityId: c.id,
          payload: { name: dto.name },
        });

        return c;
      });

      return committee;
    } catch (error) {
      this.logger.error(
        `Failed to create committee in organisation ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed to create committee');
    }
  }

  async updateCommittee(
    id: string,
    data: { name?: string; description?: string },
    user: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.committee.update({
          where: { id },
          data,
        });

        await this.auditService.logTx(tx, {
          organisationId: committee.organisationId,
          actorId: user.id,
          action: 'committee.updated',
          entityType: 'Committee',
          entityId: id,
          payload: data,
        });

        return u;
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed`, error);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed');
    }
  }

  async deleteCommittee(id: string, user: AuthenticatedUser) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      user.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.committee.delete({ where: { id } });

        await this.auditService.logTx(tx, {
          organisationId: committee.organisationId,
          actorId: user.id,
          action: 'committee.deleted',
          entityType: 'Committee',
          entityId: id,
          payload: { name: committee.name },
        });
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed`, error);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed');
    }
  }

  async addCommitteeMember(
    id: string,
    userId: string,
    role: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const member = await this.prisma.$transaction(async (tx) => {
        const m = await tx.committeeMember.create({
          data: {
            committeeId: id,
            userId,
            role,
          },
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        });

        await this.auditService.logTx(tx, {
          organisationId: committee.organisationId,
          actorId: currentUser.id,
          action: 'committee.member_added',
          entityType: 'Committee',
          entityId: id,
          payload: { addedUserId: userId, role },
        });

        // Create in-app notification for the newly added committee member
        await this.notificationsService.createNotification({
          organisationId: committee.organisationId,
          recipientId: userId,
          type: NotificationType.MEETING_CREATED, // Using this as a generic alert since no COMMITTEE_ADDED exists
          title: 'Added to Committee',
          message: `You have been added to the "${committee.name}" committee.`,
          entityType: 'Committee',
          entityId: id,
        });

        return m;
      });

      // Send the email notification asynchronously
      this.mailService.sendCommitteeMemberAddedEmail(
        member.user.email,
        member.user.name,
        committee.name,
        member.role,
        currentUser.name
      ).catch(error => {
        this.logger.error(`Unhandled error sending committee member added email to ${member.user.email}`, error);
      });

      return member;
    } catch (error) {
      this.logger.error(`Failed`, error);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed');
    }
  }

  async updateCommitteeMemberRole(
    id: string,
    userId: string,
    role: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      const member = await this.prisma.$transaction(async (tx) => {
        const m = await tx.committeeMember.update({
          where: { committeeId_userId: { committeeId: id, userId } },
          data: { role },
        });

        await this.auditService.logTx(tx, {
          organisationId: committee.organisationId,
          actorId: currentUser.id,
          action: 'committee.member_role_updated',
          entityType: 'Committee',
          entityId: id,
          payload: { updatedUserId: userId, role },
        });

        return m;
      });

      return member;
    } catch (error) {
      this.logger.error(`Failed`, error);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed');
    }
  }

  async removeCommitteeMember(
    id: string,
    userId: string,
    currentUser: AuthenticatedUser
  ) {
    const committee = await this.prisma.committee.findUnique({ where: { id } });
    if (!committee) throw new BadRequestException('Committee not found');

    await this.organisationsService.requireRole(
      committee.organisationId,
      currentUser.id,
      CAN_MANAGE_COMMITTEES
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.committeeMember.delete({
          where: { committeeId_userId: { committeeId: id, userId } },
        });

        await this.auditService.logTx(tx, {
          organisationId: committee.organisationId,
          actorId: currentUser.id,
          action: 'committee.member_removed',
          entityType: 'Committee',
          entityId: id,
          payload: { removedUserId: userId },
        });
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed`, error);
      throw new InternalServerErrorException(error instanceof Error ? error.message : 'Failed');
    }
  }
}
