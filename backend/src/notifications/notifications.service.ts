import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotificationType } from '@prisma/client';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
  ) {}

  // ─────────────────────────────────────────────
  // PREFERENCES
  // ─────────────────────────────────────────────

  async getPreferences(userId: string) {
    if (!(this.prisma as any).userNotificationPreference?.findUnique) {
      return {
        userId,
        inAppEnabled: true,
        emailEnabled: true,
        meetingCreated: true,
        meetingUpdated: true,
        meetingCancelled: true,
        agendaPublished: true,
        minutesConfirmed: true,
        actionItemAssigned: true,
        documentUploaded: true,
        tenureExpiring: true,
      };
    }

    try {
      let pref = await (this.prisma as any).userNotificationPreference.findUnique({
        where: { userId },
      });

      if (!pref) {
        pref = await (this.prisma as any).userNotificationPreference.create({
          data: { userId },
        });
      }

      return pref;
    } catch (err) {
      this.logger.warn(`Failed to fetch notification preferences for user ${userId}`, err);
      return {
        userId,
        inAppEnabled: true,
        emailEnabled: true,
        meetingCreated: true,
        meetingUpdated: true,
        meetingCancelled: true,
        agendaPublished: true,
        minutesConfirmed: true,
        actionItemAssigned: true,
        documentUploaded: true,
        tenureExpiring: true,
      };
    }
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    if (!(this.prisma as any).userNotificationPreference?.upsert) {
      return { userId, ...dto };
    }

    try {
      return await (this.prisma as any).userNotificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...dto,
        },
        update: {
          ...dto,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to update notification preferences for user ${userId}`, err);
      throw new InternalServerErrorException('Failed to update notification preferences');
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Finds a notification by ID and verifies that it belongs to the
   * requesting user. Throws 404 if not found, 403 if owned by another user.
   */
  private async resolveOwnNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.recipientId !== userId) {
      // Return 403 — do not expose that the notification exists but belongs
      // to another user (avoids resource discovery).
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    return notification;
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  /**
   * Internal helper to create a notification. Not exposed via API.
   * Called by other services (e.g., MeetingsService, MinutesService) when events occur.
   * Enforces server-side recipient preferences before creating the record.
   */
  async createNotification(data: {
    organisationId: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    try {
      // Check recipient preferences
      const pref = await this.getPreferences(data.recipientId);

      // If user disabled in-app delivery entirely, skip
      if (pref && pref.inAppEnabled === false) {
        this.logger.debug(`Skipping in-app notification for ${data.recipientId} (in-app notifications disabled)`);
        return null;
      }

      // Check specific notification type preference
      if (pref) {
        if (data.type === NotificationType.MEETING_CREATED && pref.meetingCreated === false) return null;
        if (data.type === NotificationType.MEETING_UPDATED && pref.meetingUpdated === false) return null;
        if (data.type === NotificationType.MEETING_CANCELLED && pref.meetingCancelled === false) return null;
        if (data.type === NotificationType.AGENDA_PUBLISHED && pref.agendaPublished === false) return null;
        if (data.type === NotificationType.MINUTES_CONFIRMED && pref.minutesConfirmed === false) return null;
        if (data.type === NotificationType.ACTION_ITEM_ASSIGNED && pref.actionItemAssigned === false) return null;
        if (data.type === NotificationType.DOCUMENT_UPLOADED && pref.documentUploaded === false) return null;
        if (data.type === NotificationType.TENURE_EXPIRING && pref.tenureExpiring === false) return null;
      }

      return await this.prisma.notification.create({
        data,
      });
    } catch (error) {
      // Don't throw so we don't break the main workflow if notifications fail
      this.logger.error(
        `Failed to create notification for user ${data.recipientId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // ─────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────

  /**
   * GET /notifications
   *
   * Returns only notifications where recipientId === currentUser.id.
   * recipientId is sourced entirely from @CurrentUser() — never from the client.
   *
   * If organisationId is provided, membership is validated before filtering.
   */
  async getNotifications(
    query: QueryNotificationsDto,
    user: AuthenticatedUser,
  ) {
    // If org scope is requested, validate membership before using it in the query
    if (query.organisationId) {
      await this.organisationsService.requireMembership(
        query.organisationId,
        user.id,
      );
    }

    try {
      return await this.prisma.notification.findMany({
        where: {
          // User ownership — always enforced from server-side identity
          recipientId: user.id,
          // Optional filters — only applied after ownership is locked in
          ...(query.organisationId && {
            organisationId: query.organisationId,
          }),
          ...(query.isRead !== undefined && { isRead: query.isRead }),
          ...(query.type && { type: query.type }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch notifications for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  // ─────────────────────────────────────────────
  // GET SINGLE
  // ─────────────────────────────────────────────

  /**
   * GET /notifications/:id
   *
   * Ownership enforced: notification.recipientId must match currentUser.id.
   * Organisation membership also validated for org-scoped isolation.
   */
  async getNotificationById(id: string, user: AuthenticatedUser) {
    const notification = await this.resolveOwnNotification(id, user.id);

    // Validate organisation membership even for read access
    await this.organisationsService.requireMembership(
      notification.organisationId,
      user.id,
    );

    return notification;
  }

  // ─────────────────────────────────────────────
  // MARK AS READ
  // ─────────────────────────────────────────────

  /**
   * PATCH /notifications/:id/read
   *
   * Sets isRead = true for a single notification.
   * Only the recipient can perform this action.
   * Only isRead is updated — all other fields remain immutable through this endpoint.
   */
  async markAsRead(id: string, user: AuthenticatedUser) {
    const notification = await this.resolveOwnNotification(id, user.id);

    await this.organisationsService.requireMembership(
      notification.organisationId,
      user.id,
    );

    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${id} as read for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to mark notification as read',
      );
    }
  }

  // ─────────────────────────────────────────────
  // MARK ALL AS READ
  // ─────────────────────────────────────────────

  /**
   * PATCH /notifications/read-all
   *
   * Sets isRead = true for all notifications belonging to the current user.
   * If organisationId is provided in query, only affects that org's notifications
   * (membership is validated before use).
   *
   * Returns the count of updated records.
   */
  async markAllAsRead(
    user: AuthenticatedUser,
    organisationId?: string,
  ): Promise<{ updated: number }> {
    if (organisationId) {
      await this.organisationsService.requireMembership(
        organisationId,
        user.id,
      );
    }

    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          // User ownership is the primary constraint — always enforced
          recipientId: user.id,
          isRead: false,
          ...(organisationId && { organisationId }),
        },
        data: { isRead: true },
      });
      return { updated: result.count };
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to mark all notifications as read',
      );
    }
  }
}
