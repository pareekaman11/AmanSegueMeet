import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CastVoteDto } from './dto/cast-vote.dto';

@UseGuards(JwtAuthGuard)
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post(':entityType/:entityId')
  castVote(
    @Param('entityType') entityType: 'decision' | 'resolution',
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CastVoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.castVote(entityType, entityId, dto, user);
  }

  @Post(':entityType/:entityId/close')
  closeVote(
    @Param('entityType') entityType: 'decision' | 'resolution',
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.votesService.closeVote(entityType, entityId, user);
  }
}
