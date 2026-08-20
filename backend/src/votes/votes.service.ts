import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VotesGateway } from './votes.gateway';
import { DecisionStatus, DecisionOutcome, ResolutionStatus, VoteStatus } from '@prisma/client';
import { CAN_MANAGE_DECISIONS, CAN_MANAGE_RESOLUTIONS, CAN_VOTE } from '../common/auth/roles.constants';

@Injectable()
export class VotesService {
  private readonly logger = new Logger(VotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
    private readonly votesGateway: VotesGateway,
  ) {}

  async closeVote(entityType: 'decision' | 'resolution', entityId: string, user: AuthenticatedUser) {
    if (entityType === 'decision') {
      return this.closeDecision(entityId, user);
    } else if (entityType === 'resolution') {
      return this.closeResolution(entityId, user);
    } else {
      throw new BadRequestException('Invalid entity type');
    }
  }

  private async closeDecision(decisionId: string, user: AuthenticatedUser) {
    const decision = await this.prisma.decision.findUnique({
      where: { id: decisionId },
      include: { votes: true },
    });
    if (!decision) throw new NotFoundException('Decision not found');
    await this.organisationsService.requireRole(decision.organisationId, user.id, CAN_MANAGE_DECISIONS);
    if (decision.status !== DecisionStatus.OPEN) {
      throw new BadRequestException('Decision already closed');
    }

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
      this.votesGateway.notifyVoteUpdated('decision', decisionId, { status: DecisionStatus.CLOSED, outcome });
      return closed;
    } catch (error) {
      this.logger.error('Failed to close decision', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to close decision');
    }
  }

  private async closeResolution(resolutionId: string, user: AuthenticatedUser) {
    const resolution = await this.prisma.resolution.findUnique({
      where: { id: resolutionId },
      include: { votes: true },
    });
    if (!resolution) throw new NotFoundException('Resolution not found');
    await this.organisationsService.requireRole(resolution.organisationId, user.id, CAN_MANAGE_RESOLUTIONS);
    if (resolution.status !== ResolutionStatus.OPEN) {
      throw new BadRequestException('Resolution already closed or not open');
    }

    let finalStatus: ResolutionStatus = ResolutionStatus.FAILED;
    const inFavour = resolution.votes.filter(v => v.status === 'IN_FAVOUR').length;
    const against = resolution.votes.filter(v => v.status === 'AGAINST').length;
    
    if (inFavour > against) {
      finalStatus = ResolutionStatus.PASSED;
    }

    try {
      const closed = await this.prisma.$transaction(async (tx) => {
        const c = await tx.resolution.update({
          where: { id: resolutionId },
          data: { status: finalStatus },
        });
        await this.auditService.logTx(tx, {
          organisationId: resolution.organisationId,
          actorId: user.id,
          action: 'resolution.closed',
          entityType: 'Resolution',
          entityId: resolutionId,
          payload: { status: finalStatus },
        });
        return c;
      });
      this.votesGateway.notifyVoteUpdated('resolution', resolutionId, { status: finalStatus });
      return closed;
    } catch (error) {
      this.logger.error('Failed to close resolution', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to close resolution');
    }
  }

  async castVote(entityType: 'decision' | 'resolution', entityId: string, voteDto: CastVoteDto, user: AuthenticatedUser) {
    if (entityType === 'decision') {
      return this.castDecisionVote(entityId, voteDto, user);
    } else if (entityType === 'resolution') {
      return this.castResolutionVote(entityId, voteDto, user);
    } else {
      throw new BadRequestException('Invalid entity type');
    }
  }

  private async castDecisionVote(decisionId: string, voteDto: CastVoteDto, user: AuthenticatedUser) {
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
        const v = await tx.decisionVote.upsert({
          where: { decisionId_voterId: { decisionId, voterId: user.id } },
          create: {
            decisionId,
            voterId: user.id,
            vote: voteDto.vote,
            comment: voteDto.comment,
          },
          update: {
            vote: voteDto.vote,
            comment: voteDto.comment,
          }
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

      this.votesGateway.notifyVoteUpdated('decision', decisionId, vote);
      return vote;
    } catch (error: any) {
      this.logger.error('Failed to cast decision vote', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to cast vote');
    }
  }

  private async castResolutionVote(resolutionId: string, voteDto: CastVoteDto, user: AuthenticatedUser) {
    const resolution = await this.prisma.resolution.findUnique({ where: { id: resolutionId } });
    if (!resolution) throw new NotFoundException('Resolution not found');

    await this.organisationsService.requireMembership(resolution.organisationId, user.id);
    await this.organisationsService.requireRole(resolution.organisationId, user.id, CAN_VOTE);

    if (resolution.status !== ResolutionStatus.OPEN) {
      throw new BadRequestException('Cannot vote on a closed resolution');
    }

    try {
      const vote = await this.prisma.$transaction(async (tx) => {
        const v = await tx.vote.upsert({
          where: { resolutionId_voterId: { resolutionId, voterId: user.id } },
          create: {
            resolutionId,
            voterId: user.id,
            status: voteDto.vote,
            comment: voteDto.comment,
          },
          update: {
            status: voteDto.vote,
            comment: voteDto.comment,
          }
        });

        await this.auditService.logTx(tx, {
          organisationId: resolution.organisationId,
          actorId: user.id,
          action: 'resolution.voted',
          entityType: 'Vote',
          entityId: v.id,
          payload: { voteDto },
        });

        return v;
      });

      this.votesGateway.notifyVoteUpdated('resolution', resolutionId, vote);
      return vote;
    } catch (error: any) {
      this.logger.error('Failed to cast resolution vote', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to cast vote');
    }
  }
}
