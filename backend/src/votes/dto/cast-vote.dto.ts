import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VoteStatus } from '@prisma/client';

export class CastVoteDto {
  @IsEnum(VoteStatus)
  vote: VoteStatus; // IN_FAVOUR | AGAINST | ABSTAIN

  @IsOptional()
  @IsString()
  comment?: string;
}
