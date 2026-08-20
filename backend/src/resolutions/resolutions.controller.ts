import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ResolutionsService } from './resolutions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { VoteStatus } from '@prisma/client';
import { CreateResolutionDto } from './dto/create-resolution.dto';

@UseGuards(JwtAuthGuard)
@Controller('resolutions')
export class ResolutionsController {
  constructor(private readonly resolutionsService: ResolutionsService) {}

  @Get()
  getResolutions(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!organisationId) {
      throw new BadRequestException('organisationId query parameter is required');
    }
    return this.resolutionsService.getResolutions(organisationId, user);
  }

  @Post()
  createResolution(
    @Body() dto: CreateResolutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resolutionsService.createResolution(dto, user);
  }

}
