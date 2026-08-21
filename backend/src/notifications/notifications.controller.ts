import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

/**
 * NotificationsController — all endpoints are JWT-protected.
 *
 * IMPORTANT: recipientId is NEVER accepted from the client.
 * User identity comes exclusively from @CurrentUser().
 *
 * Business logic and ownership enforcement live entirely in
 * NotificationsService.
 */
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications/preferences
   *
   * Returns the current user's notification preferences.
   */
  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  /**
   * PATCH /notifications/preferences
   *
   * Updates the current user's notification preferences.
   */
  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto);
  }

  /**
   * PATCH /notifications/read-all
   *
   * MUST be declared BEFORE /:id to prevent Express interpreting
   * "read-all" as an :id param.
   *
   * Optional ?organisationId= to scope the operation to one org.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organisationId') organisationId?: string,
  ) {
    return this.notificationsService.markAllAsRead(user, organisationId);
  }

  /**
   * GET /notifications
   *
   * Lists the authenticated user's own notifications.
   * Supports optional organisationId, isRead, type filters.
   */
  @Get()
  findAll(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.getNotifications(query, user);
  }

  /**
   * GET /notifications/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getNotificationById(id, user);
  }

  /**
   * PATCH /notifications/:id/read
   *
   * Marks a single notification as read. Only isRead is updated.
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAsRead(id, user);
  }
}
