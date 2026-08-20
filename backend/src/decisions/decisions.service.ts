import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CAN_MANAGE_DECISIONS, CAN_VOTE } from '../common/auth/roles.constants';
import {
  DecisionStatus,
  DecisionOutcome,
} from '@prisma/client';

@Injectable()
export class DecisionsService {
  private readonly logger = new Logger(DecisionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------
  // Decision list / get
  // ---------------------------------------------------------------------
  async getDecisions(organisationId: string, committeeIdQuery: string, skipQuery: string, takeQuery: string, user: AuthenticatedUser) {
    await this.organisationsService.requireMembership(organisationId, user.id);

    try {
      const skip = skipQuery ? Number(skipQuery) : 0;
      const take = takeQuery ? Number(takeQuery) : 50;

      const isManager = await this.organisationsService.hasAnyRole(
        organisationId,
        user.id,
        CAN_MANAGE_DECISIONS
      );

      const where: any = { organisationId };
      
      if (committeeIdQuery) {
        where.committeeId = committeeIdQuery;
      }

      if (!isManager) {
        where.OR = [
          { committeeId: null, meetingId: null },
          // Visibility through meeting attendance
          {
            meeting: { attendees: { some: { userId: user.id } } }
          },
          // Visibility through committee membership
          {
            committeeVisible: true,
            committee: { members: { some: { userId: user.id } } }
          }
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.decision.findMany({
          where,
          include: {
            meeting: { select: { id: true, title: true } },
          },
          orderBy: { date: 'desc' },
          skip,
          take,
        }),
        this.prisma.decision.count({ where }),
      ]);

      return { data, total, skip, take };
    } catch (error) {
      this.logger.error(
        `Failed to fetch decisions for organisation ${organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch decisions');
    }
  }

  async getDecisionById(decisionId: string, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({
      where: { id: decisionId },
      include: { meeting: { include: { attendees: true } }, votes: true },
    });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireMembership(decision.organisationId, user.id);

    const isManager = await this.organisationsService.hasAnyRole(
      decision.organisationId,
      user.id,
      CAN_MANAGE_DECISIONS
    );

    if (!isManager) {
      const isAttendee = decision.meeting?.attendees.some(a => a.userId === user.id);
      
      let isCommitteeVisibleMember = false;
      if (decision.committeeVisible && decision.committeeId) {
        const committeeMember = await this.prisma.committeeMember.findUnique({
          where: { committeeId_userId: { committeeId: decision.committeeId, userId: user.id } }
        });
        if (committeeMember) isCommitteeVisibleMember = true;
      }

      if (decision.meetingId || decision.committeeId) {
        if (!isAttendee && !isCommitteeVisibleMember) {
          throw new ForbiddenException('You are not authorized to view this decision');
        }
      }
    }

    return decision;
  }

  // ---------------------------------------------------------------------
  // Create / Update / Close decision
  // ---------------------------------------------------------------------
  async createDecision(dto: any, user: AuthenticatedUser) {
    const { organisationId } = dto;
    await this.organisationsService.requireRole(organisationId, user.id, CAN_MANAGE_DECISIONS);
    try {
      const decision = await this.prisma.$transaction(async (tx) => {
        const d = await tx.decision.create({
          data: { ...dto, createdById: user.id },
        });
        await this.auditService.logTx(tx, {
          organisationId,
          actorId: user.id,
          action: 'decision.created',
          entityType: 'Decision',
          entityId: d.id,
          payload: { dto },
        });
        return d;
      });
      return decision;
    } catch (error) {
      this.logger.error('Failed to create decision', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to create decision');
    }
  }

  async updateDecision(decisionId: string, dto: any, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireRole(decision.organisationId, user.id, CAN_MANAGE_DECISIONS);
    if (decision.status !== DecisionStatus.OPEN) {
      throw new BadRequestException('Cannot modify a closed decision');
    }
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.decision.update({
          where: { id: decisionId },
          data: dto,
        });
        await this.auditService.logTx(tx, {
          organisationId: decision.organisationId,
          actorId: user.id,
          action: 'decision.updated',
          entityType: 'Decision',
          entityId: decisionId,
          payload: { dto },
        });
        return u;
      });
      return updated;
    } catch (error) {
      this.logger.error('Failed to update decision', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to update decision');
    }
  }

  async closeDecision(decisionId: string, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({
      where: { id: decisionId },
      include: { votes: true },
    });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireRole(decision.organisationId, user.id, CAN_MANAGE_DECISIONS);
    if (decision.status !== DecisionStatus.OPEN) {
      throw new BadRequestException('Decision already closed');
    }

    // Calculate outcome
    let outcome: DecisionOutcome = DecisionOutcome.FAILED;
    const inFavour = decision.votes.filter(v => v.vote === 'IN_FAVOUR').length;
    const against = decision.votes.filter(v => v.vote === 'AGAINST').length;
    
    if (inFavour > against) {
      outcome = DecisionOutcome.PASSED;
    } else if (inFavour === against && inFavour > 0) {
      outcome = DecisionOutcome.TIED;
    }

    try {
      const closed = await this.prisma.$transaction(async (tx) => {
        const c = await tx.decision.update({
          where: { id: decisionId },
          data: { status: DecisionStatus.CLOSED, outcome },
        });
        await this.auditService.logTx(tx, {
          organisationId: decision.organisationId,
          actorId: user.id,
          action: 'decision.closed',
          entityType: 'Decision',
          entityId: decisionId,
          payload: { outcome },
        });
        return c;
      });
      return closed;
    } catch (error) {
      this.logger.error('Failed to close decision', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to close decision');
    }
  }

  // ---------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------
  async castVote(decisionId: string, voteDto: any, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireMembership(decision.organisationId, user.id);
    await this.organisationsService.requireRole(decision.organisationId, user.id, CAN_VOTE);
    if (decision.status !== DecisionStatus.OPEN) {
      throw new BadRequestException('Cannot vote on a closed decision');
    }
    if (decision.meetingId) {
      const attendee = await this.prisma.meetingAttendee.findUnique({
        where: { meetingId_userId: { meetingId: decision.meetingId, userId: user.id } },
      });
      if (!attendee) {
        throw new ForbiddenException('User not an attendee of the related meeting');
      }
    }
    try {
      const vote = await this.prisma.$transaction(async (tx) => {
        const v = await tx.decisionVote.create({
          data: {
            decisionId,
            voterId: user.id,
            vote: voteDto.vote,
            comment: voteDto.comment,
          },
        });
        await this.auditService.logTx(tx, {
          organisationId: decision.organisationId,
          actorId: user.id,
          action: 'decision.voted',
          entityType: 'DecisionVote',
          entityId: v.id,
          payload: { voteDto },
        });
        return v;
      });
      return vote;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('You have already voted on this decision');
      }
      this.logger.error('Failed to cast vote', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to cast vote');
    }
  }

  async updateVote(decisionId: string, voteId: string, voteDto: any, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) throw new NotFoundException('Decision not found');
    const existingVote = await this.prisma.decisionVote.findUnique({ where: { id: voteId } });
    if (!existingVote) throw new NotFoundException('Vote not found');
    if (existingVote.decisionId !== decisionId) {
      throw new BadRequestException('Vote does not belong to the specified decision');
    }
    await this.organisationsService.requireMembership(decision.organisationId, user.id);
    const canManage = await this.organisationsService.hasAnyRole(decision.organisationId, user.id, CAN_MANAGE_DECISIONS);
    if (existingVote.voterId !== user.id && !canManage) {
      throw new ForbiddenException('Not allowed to update this vote');
    }
    if (decision.status !== DecisionStatus.OPEN) {
      throw new BadRequestException('Cannot change vote on a closed decision');
    }
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.decisionVote.update({
          where: { id: voteId },
          data: {
            vote: voteDto.vote ?? undefined,
            comment: voteDto.comment ?? undefined,
          },
        });
        await this.auditService.logTx(tx, {
          organisationId: decision.organisationId,
          actorId: user.id,
          action: 'decision.vote_updated',
          entityType: 'DecisionVote',
          entityId: voteId,
          payload: { voteDto },
        });
        return u;
      });
      return updated;
    } catch (error) {
      this.logger.error('Failed to update vote', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to update vote');
    }
  }

  async getVoteSummary(decisionId: string, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireMembership(decision.organisationId, user.id);
    const summary = await this.prisma.decisionVote.groupBy({
      by: ['vote'],
      where: { decisionId },
      _count: { _all: true },
    });
    const totals: any = { IN_FAVOUR: 0, AGAINST: 0, ABSTAIN: 0, TOTAL: 0 };
    for (const item of summary) {
      totals[item.vote] = item._count._all;
      totals.TOTAL += item._count._all;
    }
    return totals;
  }
}
