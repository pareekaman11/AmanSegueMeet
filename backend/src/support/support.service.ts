import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  CreateSupportRequestDto,
  UpdateSupportRequestDto,
  SupportCategory,
  SupportPriority,
  SupportStatus,
} from './dto/create-support-request.dto';
import { CAN_EDIT_BOARD_PROFILE } from '../common/auth/roles.constants';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  async createSupportRequest(
    dto: CreateSupportRequestDto,
    user: AuthenticatedUser,
  ) {
    await this.organisationsService.requireMembership(dto.organisationId, user.id);

    const ticketNumber = `SR-${Math.floor(1000 + Math.random() * 9000)}`;

    const request = await (this.prisma as any).supportRequest.create({
      data: {
        ticketNumber,
        organisationId: dto.organisationId,
        submittedById: user.id,
        category: dto.category || SupportCategory.OTHER,
        subject: dto.subject.trim(),
        description: dto.description.trim(),
        priority: dto.priority || SupportPriority.MEDIUM,
        status: SupportStatus.OPEN,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await this.auditService.logSystemEvent(
      'SUPPORT_REQUEST_CREATED',
      `Support ticket #${ticketNumber} created by user ${user.id}`,
      { ticketNumber, supportRequestId: request.id, organisationId: dto.organisationId },
    );

    return request;
  }

  async listSupportRequests(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    const isAdmin = await this.organisationsService.hasAnyRole(
      organisationId,
      user.id,
      CAN_EDIT_BOARD_PROFILE,
    );

    return (this.prisma as any).supportRequest.findMany({
      where: {
        organisationId,
        ...(!isAdmin ? { submittedById: user.id } : {}),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSupportRequestById(id: string, user: AuthenticatedUser) {
    const request = await (this.prisma as any).supportRequest.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    await this.organisationsService.requireMembership(request.organisationId, user.id);

    const isAdmin = await this.organisationsService.hasAnyRole(
      request.organisationId,
      user.id,
      CAN_EDIT_BOARD_PROFILE,
    );

    if (!isAdmin && request.submittedById !== user.id && request.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this support request');
    }

    return request;
  }

  async updateSupportRequest(
    id: string,
    dto: UpdateSupportRequestDto,
    user: AuthenticatedUser,
  ) {
    const request = await (this.prisma as any).supportRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    await this.organisationsService.requireRole(
      request.organisationId,
      user.id,
      CAN_EDIT_BOARD_PROFILE,
    );

    if (dto.assignedToId) {
      await this.organisationsService.requireMembership(request.organisationId, dto.assignedToId);
    }

    const updated = await (this.prisma as any).supportRequest.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await this.auditService.logSystemEvent(
      'SUPPORT_REQUEST_UPDATED',
      `Support ticket #${request.ticketNumber} updated`,
      { supportRequestId: id, updates: dto, actorId: user.id },
    );

    return updated;
  }
}
