import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsService - Preferences & Delivery', () => {
  let service: NotificationsService;
  let prismaService: any;
  let organisationsService: any;

  beforeEach(async () => {
    prismaService = {
      notification: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userNotificationPreference: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    organisationsService = {
      requireMembership: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OrganisationsService, useValue: organisationsService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification with Preferences', () => {
    it('should create notification when inAppEnabled and meetingCreated are true', async () => {
      prismaService.userNotificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: true,
        meetingCreated: true,
      });

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        recipientId: 'user-1',
        type: NotificationType.MEETING_CREATED,
        title: 'New Meeting',
        message: 'You are invited',
      });

      const result = await service.createNotification({
        organisationId: 'org-1',
        recipientId: 'user-1',
        type: NotificationType.MEETING_CREATED,
        title: 'New Meeting',
        message: 'You are invited',
      });

      expect(prismaService.notification.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should skip creating in-app notification when inAppEnabled is false', async () => {
      prismaService.userNotificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: false,
        meetingCreated: true,
      });

      const result = await service.createNotification({
        organisationId: 'org-1',
        recipientId: 'user-1',
        type: NotificationType.MEETING_CREATED,
        title: 'New Meeting',
        message: 'You are invited',
      });

      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should skip creating notification when specific type is disabled', async () => {
      prismaService.userNotificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: true,
        meetingCreated: false,
        actionItemAssigned: true,
      });

      const result = await service.createNotification({
        organisationId: 'org-1',
        recipientId: 'user-1',
        type: NotificationType.MEETING_CREATED,
        title: 'New Meeting',
        message: 'You are invited',
      });

      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should allow other enabled notification types when one is disabled', async () => {
      prismaService.userNotificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: true,
        meetingCreated: false,
        actionItemAssigned: true,
      });

      prismaService.notification.create.mockResolvedValue({
        id: 'notif-2',
        recipientId: 'user-1',
        type: NotificationType.ACTION_ITEM_ASSIGNED,
        title: 'Action Item',
        message: 'You have a new action item',
      });

      const result = await service.createNotification({
        organisationId: 'org-1',
        recipientId: 'user-1',
        type: NotificationType.ACTION_ITEM_ASSIGNED,
        title: 'Action Item',
        message: 'You have a new action item',
      });

      expect(prismaService.notification.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updatePreferences', () => {
    it('should update user notification preferences', async () => {
      prismaService.userNotificationPreference.upsert.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: true,
        emailEnabled: false,
        meetingCreated: true,
      });

      const result = await service.updatePreferences('user-1', {
        emailEnabled: false,
      });

      expect(result.emailEnabled).toBe(false);
      expect(prismaService.userNotificationPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          update: { emailEnabled: false },
        }),
      );
    });
  });
});
