import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SupportService } from './support.service';
import { CreateSupportRequestDto, UpdateSupportRequestDto } from './dto/create-support-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('support-requests')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSupportRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportService.createSupportRequest(dto, user);
  }

  @Get()
  list(
    @Query('organisationId') organisationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportService.listSupportRequests(organisationId, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportService.getSupportRequestById(id, user);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupportRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportService.updateSupportRequest(id, dto, user);
  }
}
