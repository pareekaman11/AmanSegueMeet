import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateFeedbackDto, UpdateFeedbackStatusDto, FeedbackType } from './dto/create-feedback.dto';
import { CAN_EDIT_BOARD_PROFILE } from '../common/auth/roles.constants';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  async createFeedback(dto: CreateFeedbackDto, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(dto.organisationId, user.id);

    const feedback = await (this.prisma as any).feedback.create({
      data: {
        organisationId: dto.organisationId,
        submittedById: user.id,
        type: dto.type || FeedbackType.GENERAL,
        message: dto.message.trim(),
        pageUrl: dto.pageUrl?.trim(),
        status: 'NEW',
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await this.auditService.logSystemEvent(
      'FEEDBACK_SUBMITTED',
      `User submitted feedback of type ${dto.type || 'GENERAL'}`,
      { feedbackId: feedback.id, organisationId: dto.organisationId, userId: user.id },
    );

    return feedback;
  }

  async getFeedbackList(organisationId: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    const isAdmin = await this.organisationsService.hasAnyRole(
      organisationId,
      user.id,
      CAN_EDIT_BOARD_PROFILE,
    );

    return (this.prisma as any).feedback.findMany({
      where: {
        organisationId,
        ...(!isAdmin ? { submittedById: user.id } : {}),
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFeedbackStatus(
    id: string,
    dto: UpdateFeedbackStatusDto,
    user: AuthenticatedUser,
  ) {
    const feedback = await (this.prisma as any).feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback entry not found');
    }

    await this.organisationsService.requireRole(
      feedback.organisationId,
      user.id,
      CAN_EDIT_BOARD_PROFILE,
    );

    const updated = await (this.prisma as any).feedback.update({
      where: { id },
      data: { status: dto.status },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await this.auditService.logSystemEvent(
      'FEEDBACK_STATUS_UPDATED',
      `Feedback ${id} status changed to ${dto.status}`,
      { feedbackId: id, status: dto.status, actorId: user.id },
    );

    return updated;
  }
}
