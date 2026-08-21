import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

/**
 * All routes in this controller require a valid JWT Bearer token.
 * Tenant isolation (membership verification) is enforced in the service layer.
 */
@UseGuards(JwtAuthGuard)
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  // ─────────────────────────────────────────────
  // ORGANISATION
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id
   *
   * Returns organisation details. Caller must be a member.
   */
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.organisationsService.findById(id, user);
  }

  /**
   * POST /organisations
   *
   * Creates a new organisation and assigns the caller as BOARD_ADMIN.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(
    @Body() dto: CreateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.create(dto, user);
  }

  /**
   * PATCH /organisations/:id
   *
   * Updates name and/or settings. Caller must be a BOARD_ADMIN.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.update(id, dto, user);
  }

  /**
   * DELETE /organisations/:id
   *
   * Deletes an organisation. Caller must be a BOARD_ADMIN.
   */
  @Delete(':id')
  deleteOrganisation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.deleteOrganisation(id, user);
  }

  // ─────────────────────────────────────────────
  // MEMBERS
  // ─────────────────────────────────────────────

  /**
   * GET /organisations/:id/members
   *
   * Lists all members with their roles. Caller must be a member.
   */
  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.organisationsService.listMembers(id, user);
  }

  /**
   * POST /organisations/:id/members
   *
   * Adds an existing user by email to the organisation.
   * Caller must be a BOARD_ADMIN.
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.addMember(id, dto, user);
  }



  /**
   * PATCH /organisations/:id/members/:userId
   *
   * Updates an existing member's role and/or tenureEndDate.
   * Caller must be a BOARD_ADMIN.
   */
  @Patch(':id/members/:userId')
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: { role?: any; tenureEndDate?: string | null; designation?: string | null },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.updateMember(id, userId, dto, user);
  }

  /**
   * DELETE /organisations/:id/members/:userId
   *
   * Removes a user's membership. Caller must be a BOARD_ADMIN.
   * Safety: cannot remove self; cannot remove last admin.
   * Only the membership record is deleted — the user account is preserved.
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.removeMember(id, userId, user);
  }

  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────

  @Get(':id/audit-logs')
  getAuditLogs(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.organisationsService.getAuditLogs(id, user);
  }

  // ─────────────────────────────────────────────
  // LOCATIONS
  // ─────────────────────────────────────────────

  @Get(':id/locations')
  getLocations(
    @Param('id') id: string,
    @Query('activeOnly') activeOnly: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.getLocations(
      id,
      user,
      activeOnly === 'true' || activeOnly === '1',
    );
  }

  @Post(':id/locations')
  @HttpCode(HttpStatus.CREATED)
  createLocation(
    @Param('id') id: string,
    @Body() dto: CreateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.createLocation(id, dto, user);
  }

  @Patch(':id/locations/:locationId')
  @HttpCode(HttpStatus.OK)
  updateLocation(
    @Param('id') id: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.updateLocation(id, locationId, dto, user);
  }

  @Delete(':id/locations/:locationId')
  @HttpCode(HttpStatus.OK)
  deleteLocation(
    @Param('id') id: string,
    @Param('locationId') locationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organisationsService.deleteLocation(id, locationId, user);
  }
}
