import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

@UseGuards(JwtAuthGuard)
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  // ─── Decision CRUD ────────────────────────────────────────────────────────

  /** List decisions for an organisation with pagination */
  @Get()
  getDecisions(
    @Query('organisationId') organisationId: string,
    @Query('committeeId') committeeId: string,
    @Query('skip') skip: string,
    @Query('take') take: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) {
      throw new BadRequestException('organisationId query parameter is required');
    }
    return this.decisionsService.getDecisions(organisationId, committeeId, skip, take, user);
  }

  /** Get a single decision by ID */
  @Get(':decisionId')
  getDecisionById(
    @Param('decisionId', ParseUUIDPipe) decisionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.decisionsService.getDecisionById(decisionId, user);
  }

  /** Create a new decision — requires CAN_MANAGE_DECISIONS */
  @Post()
  createDecision(
    @Body() dto: CreateDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.decisionsService.createDecision(dto, user);
  }

  /** Update an open decision — requires CAN_MANAGE_DECISIONS */
  @Patch(':decisionId')
  updateDecision(
    @Param('decisionId', ParseUUIDPipe) decisionId: string,
    @Body() dto: UpdateDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.decisionsService.updateDecision(decisionId, dto, user);
  }

  // ─── Voting ───────────────────────────────────────────────────────────────

  /** Get aggregated vote summary for a decision */
  @Get(':decisionId/votes/summary')
  getVoteSummary(
    @Param('decisionId', ParseUUIDPipe) decisionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.decisionsService.getVoteSummary(decisionId, user);
  }
}
