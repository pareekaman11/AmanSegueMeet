import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma, OrganisationMember, OrganisationRole } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuditService } from '../audit/audit.service';

import {
  CAN_EDIT_BOARD_PROFILE,
  CAN_INVITE_MEMBERS,
  CAN_CHANGE_MEMBER_ROLES,
  CAN_REMOVE_MEMBERS,
  CAN_VIEW_AUDIT_LOGS
} from '../common/auth/roles.constants';

import { MailService } from '../mail/mail.service';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  // ─────────────────────────────────────────────
  // ORGANISATION CRUD
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id
   *
   * Returns the organisation. Requesting user must be a member.
   */
  async findById(organisationId: string, requestingUser: AuthenticatedUser) {
    await this.requireMembership(organisationId, requestingUser.id);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        id: true,
        name: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { members: true, meetings: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    return org;
  }

  /**
   * POST /organisations
   *
   * Creates an organisation and sets the creator as BOARD_ADMIN.
   */
  async create(dto: CreateOrganisationDto, requestingUser: AuthenticatedUser) {
    const org = await this.prisma.$transaction(async (tx) => {
      const o = await tx.organisation.create({
        data: {
          name: dto.name.trim(),
          members: {
            create: {
              userId: requestingUser.id,
              role: OrganisationRole.BOARD_ADMIN,
            }
          }
        },
        select: { id: true, name: true, settings: true, createdAt: true, updatedAt: true }
      });

      await this.auditService.logTx(tx, {
        organisationId: o.id,
        actorId: requestingUser.id,
        action: 'organisation.created',
        entityType: 'Organisation',
        entityId: o.id,
        payload: { name: o.name },
      });

      return o;
    });

    return org;
  }

  /**
   * PATCH /organisations/:id
   *
   * Updates the organisation. Requesting user must be a BOARD_ADMIN.
   */
  async update(
    organisationId: string,
    dto: UpdateOrganisationDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_EDIT_BOARD_PROFILE);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const updatedOrg = await this.prisma.$transaction(async (tx) => {
      const u = await tx.organisation.update({
        where: { id: organisationId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.settings !== undefined && {
            settings: dto.settings as Prisma.InputJsonValue,
          }),
        },
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true,
        },
      });

      await this.auditService.logTx(tx, {
        organisationId,
        actorId: requestingUser.id,
        action: 'organisation.updated',
        entityType: 'Organisation',
        entityId: organisationId,
        payload: { name: dto.name, settings: dto.settings },
      });

      return u;
    });

    return updatedOrg;
  }

  async deleteOrganisation(
    organisationId: string,
    requestingUser: AuthenticatedUser,
  ) {
    // We require the same high level permission as updating
    await this.requireRole(organisationId, requestingUser.id, ['BOARD_ADMIN']);

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.auditService.logTx(tx, {
        organisationId,
        actorId: requestingUser.id,
        action: 'organisation.deleted',
        entityType: 'Organisation',
        entityId: organisationId,
        payload: { organisationId },
      });

      return tx.organisation.delete({
        where: { id: organisationId },
      });
    });
  }

  // ─────────────────────────────────────────────
  // MEMBER MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id/members
   *
   * Lists all members. Requesting user must be a member of the organisation.
   */
  async listMembers(organisationId: string, requestingUser: AuthenticatedUser) {
    await this.requireMembership(organisationId, requestingUser.id);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    return this.prisma.organisationMember.findMany({
      where: { organisationId },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * POST /organisations/:id/members
   *
   * Adds an existing user to the organisation with the specified role.
   * Requesting user must be a BOARD_ADMIN.
   */
  async addMember(
    organisationId: string,
    dto: AddMemberDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_INVITE_MEMBERS);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true, name: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'No SegueMeet account exists for this email. The person must create an account first.',
      );
    }

    const existingMembership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUser.id,
        },
      },
    });
    
    if (existingMembership) {
      throw new ConflictException(
        `${dto.email} is already a member of this organisation`,
      );
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const m = await tx.organisationMember.create({
        data: {
          organisationId,
          userId: targetUser.id,
          role: dto.role,
          designation: (dto as any).designation || null, // Will type the DTO next
        },
        select: {
          id: true,
          role: true,
          designation: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      await this.auditService.logTx(tx, {
        organisationId,
        actorId: requestingUser.id,
        action: 'organisation.member_added',
        entityType: 'OrganisationMember',
        entityId: m.id,
        payload: { userId: targetUser.id, role: dto.role, designation: (dto as any).designation },
      });

      return m;
    });

    // Send the member added email
    // This runs asynchronously in the background and does not block or fail the transaction
    this.mailService.sendMemberAddedEmail(
      dto.email,
      targetUser.name,
      orgExists.name,
      dto.role,
      (dto as any).designation || null,
      requestingUser.name,
    ).catch(error => {
      // Catch any unexpected errors outside the try-catch in MailService just in case
      console.error('Unexpected error while sending member added email:', error);
    });

    return membership;
  }



  /**
   * PATCH /organisations/:id/members/:userId
   *
   * Updates an existing member's role or tenure.
   */
  async updateMember(
    organisationId: string,
    targetUserId: string,
    dto: { role?: any; tenureEndDate?: string | null; designation?: string | null },
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_CHANGE_MEMBER_ROLES);

    const membership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this organisation');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.organisationMember.update({
        where: { id: membership.id },
        data: {
          ...(dto.role && { role: dto.role }),
          ...(dto.tenureEndDate !== undefined && { tenureEndDate: dto.tenureEndDate }),
          ...(dto.designation !== undefined && { designation: dto.designation }),
        },
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true } }
        }
      });

      await this.auditService.logTx(tx, {
        organisationId,
        actorId: requestingUser.id,
        action: 'organisation.member_updated',
        entityType: 'OrganisationMember',
        entityId: membership.id,
        payload: { role: u.role },
      });

      return u;
    });

    return updated;
  }

  /**
   * DELETE /organisations/:id/members/:userId
   *
   * Removes a user's membership from the organisation.
   * Requesting user must be a BOARD_ADMIN.
   *
   * Safety guards:
   *  - Admins cannot remove themselves (prevents accidental lock-out).
   *  - The last BOARD_ADMIN of an org cannot be removed.
   *  - Only the membership record is deleted, never the User account.
   */
  async removeMember(
    organisationId: string,
    targetUserId: string,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_REMOVE_MEMBERS);

    const orgExists = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { id: true },
    });
    if (!orgExists) {
      throw new NotFoundException('Organisation not found');
    }

    // Prevent self-removal to guard against accidental lock-out
    if (targetUserId === requestingUser.id) {
      throw new BadRequestException(
        'You cannot remove yourself from the organisation. Ask another admin to do this.',
      );
    }

    // Find the target membership
    const membership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: {
          organisationId,
          userId: targetUserId,
        },
      },
    });
    if (!membership) {
      throw new NotFoundException(
        'This user is not a member of the organisation',
      );
    }

    // Protect the last BOARD_ADMIN
    if (membership.role === OrganisationRole.BOARD_ADMIN) {
      const adminCount = await this.prisma.organisationMember.count({
        where: { organisationId, role: OrganisationRole.BOARD_ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last Board Admin. Promote another member to Board Admin first.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organisationMember.delete({
        where: { id: membership.id },
      });

      await this.auditService.logTx(tx, {
        organisationId,
        actorId: requestingUser.id,
        action: 'organisation.member_removed',
        entityType: 'OrganisationMember',
        entityId: membership.id,
        payload: { userId: targetUserId, role: membership.role },
      });
    });

    return { message: 'Member removed from the organisation successfully' };
  }

  // ─────────────────────────────────────────────
  // TENANT ISOLATION HELPERS
  // ─────────────────────────────────────────────

  /**
   * Verifies the user is a member of the organisation.
   * Throws 403 Forbidden if they are not — preventing cross-tenant access.
   *
   * This is the foundation for all tenant-scoped operations.
   * Future modules (Meetings, Agenda, Minutes) should delegate to this method
   * or copy the same pattern in their respective services.
   *
   * Returns the membership record so callers can inspect the role.
   */
  async requireMembership(
    organisationId: string,
    userId: string,
  ): Promise<OrganisationMember> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: {
        organisationId_userId: { organisationId, userId },
      },
    });

    if (!membership) {
      // Return 403, not 404, to avoid confirming the org exists to non-members
      throw new ForbiddenException(
        'You do not have access to this organisation',
      );
    }

    return membership;
  }

  /**
   * Verifies the user is a member and holds one of the allowed roles.
   * Throws 403 Forbidden if the user lacks the required capabilities.
   */
  async requireRole(
    organisationId: string,
    userId: string,
    allowedRoles: OrganisationRole[],
  ): Promise<OrganisationMember> {
    const membership = await this.requireMembership(organisationId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return membership;
  }

  /**
   * Non-throwing check: returns true if the user is a member
   * with one of the allowed roles, false otherwise.
   * Use when you need a boolean gate rather than an exception.
   */
  async hasAnyRole(
    organisationId: string,
    userId: string,
    allowedRoles: OrganisationRole[],
  ): Promise<boolean> {
    const membership = await this.prisma.organisationMember.findUnique({
      where: { organisationId_userId: { organisationId, userId } },
    });
    return !!membership && allowedRoles.includes(membership.role);
  }


  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────

  async getAuditLogs(organisationId: string, requestingUser: AuthenticatedUser) {
    await this.requireRole(organisationId, requestingUser.id, CAN_VIEW_AUDIT_LOGS);
    return this.prisma.auditLog.findMany({
      where: { organisationId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50 for now
    });
  }

  // ─────────────────────────────────────────────
  // LOCATIONS
  // ─────────────────────────────────────────────

  async getLocations(
    organisationId: string,
    requestingUser: AuthenticatedUser,
    activeOnly?: boolean,
  ) {
    await this.requireMembership(organisationId, requestingUser.id);
    return this.prisma.meetingLocation.findMany({
      where: {
        organisationId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createLocation(
    organisationId: string,
    dto: CreateLocationDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_EDIT_BOARD_PROFILE);

    // Check duplicate name within organisation
    const existing = await this.prisma.meetingLocation.findFirst({
      where: {
        organisationId,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`A location named "${dto.name}" already exists in this organisation.`);
    }

    if (dto.isDefault) {
      await this.prisma.meetingLocation.updateMany({
        where: { organisationId, isDefault: true },
        data: { isDefault: false },
      });
    }
    
    return (this.prisma as any).meetingLocation.create({
      data: {
        organisationId,
        name: dto.name.trim(),
        type: (dto.type || 'IN_PERSON') as any,
        address: dto.address?.trim() || null,
        meetingUrl: dto.meetingUrl?.trim() || null,
        description: dto.description?.trim() || null,
        timeZone: dto.timeZone || null,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateLocation(
    organisationId: string,
    locationId: string,
    dto: UpdateLocationDto,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_EDIT_BOARD_PROFILE);

    const location = await (this.prisma as any).meetingLocation.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found in this organisation.');
    }

    if (dto.name && dto.name.trim() !== location.name) {
      const duplicate = await (this.prisma as any).meetingLocation.findFirst({
        where: {
          organisationId,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: locationId },
        },
      });

      if (duplicate) {
        throw new ConflictException(`A location named "${dto.name}" already exists in this organisation.`);
      }
    }

    if (dto.isDefault) {
      await (this.prisma as any).meetingLocation.updateMany({
        where: { organisationId, isDefault: true, id: { not: locationId } },
        data: { isDefault: false },
      });
    }

    return (this.prisma as any).meetingLocation.update({
      where: { id: locationId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.address !== undefined && { address: dto.address ? dto.address.trim() : null }),
        ...(dto.meetingUrl !== undefined && { meetingUrl: dto.meetingUrl ? dto.meetingUrl.trim() : null }),
        ...(dto.description !== undefined && { description: dto.description ? dto.description.trim() : null }),
        ...(dto.timeZone !== undefined && { timeZone: dto.timeZone }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteLocation(
    organisationId: string,
    locationId: string,
    requestingUser: AuthenticatedUser,
  ) {
    await this.requireRole(organisationId, requestingUser.id, CAN_EDIT_BOARD_PROFILE);

    const location = await (this.prisma as any).meetingLocation.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found in this organisation.');
    }

    // Check if any meetings are associated with this location
    const meetingCount = await (this.prisma as any).meeting.count({
      where: {
        organisationId,
        locationId,
      },
    });

    if (meetingCount > 0) {
      throw new ConflictException(
        `Cannot delete location because ${meetingCount} meeting(s) are associated with it. Please deactivate the location instead.`
      );
    }

    return (this.prisma as any).meetingLocation.delete({
      where: { id: locationId },
    });
  }
}
