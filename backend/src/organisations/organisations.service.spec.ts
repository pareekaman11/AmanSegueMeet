import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { PrismaService } from '../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { MeetingLocationType, OrganisationRole } from '@prisma/client';

describe('OrganisationsService - Meeting Locations', () => {
  let service: OrganisationsService;
  let prismaService: any;
  let auditService: any;
  let mailService: any;

  const mockAdminUser: any = {
    id: 'user-admin',
    email: 'admin@test.com',
    role: 'USER',
  };

  beforeEach(async () => {
    prismaService = {
      organisationMember: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mem-1',
          organisationId: 'org-1',
          userId: 'user-admin',
          role: OrganisationRole.BOARD_ADMIN,
        }),
      },
      meetingLocation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      meeting: {
        count: jest.fn(),
      },
    };

    auditService = {
      logSystemEvent: jest.fn(),
      logTx: jest.fn(),
    };

    mailService = {
      sendInvitationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<OrganisationsService>(OrganisationsService);
  });

  describe('Location Management', () => {
    it('should create an in-person meeting location', async () => {
      prismaService.meetingLocation.findFirst.mockResolvedValue(null);
      prismaService.meetingLocation.create.mockResolvedValue({
        id: 'loc-1',
        organisationId: 'org-1',
        name: 'Head Office - Board Room',
        type: 'IN_PERSON' as any,
        address: 'Noida, India',
        isActive: true,
      });

      const res = await service.createLocation(
        'org-1',
        {
          name: 'Head Office - Board Room',
          type: 'IN_PERSON' as any,
          address: 'Noida, India',
        },
        mockAdminUser,
      );

      expect(res.name).toBe('Head Office - Board Room');
      expect(prismaService.meetingLocation.create).toHaveBeenCalled();
    });

    it('should reject duplicate location name in the same organisation', async () => {
      prismaService.meetingLocation.findFirst.mockResolvedValue({
        id: 'loc-1',
        name: 'Board Room',
      });

      await expect(
        service.createLocation(
          'org-1',
          {
            name: 'Board Room',
            type: 'IN_PERSON' as any,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should update location details and handle deactivation', async () => {
      prismaService.meetingLocation.findFirst.mockResolvedValue({
        id: 'loc-1',
        organisationId: 'org-1',
        name: 'Board Room',
        isActive: true,
      });

      prismaService.meetingLocation.update.mockResolvedValue({
        id: 'loc-1',
        name: 'Board Room',
        isActive: false,
      });

      const res = await service.updateLocation(
        'org-1',
        'loc-1',
        { isActive: false },
        mockAdminUser,
      );

      expect(res.isActive).toBe(false);
      expect(prismaService.meetingLocation.update).toHaveBeenCalled();
    });

    it('should block deletion if location is associated with existing meetings', async () => {
      prismaService.meetingLocation.findFirst.mockResolvedValue({
        id: 'loc-1',
        organisationId: 'org-1',
        name: 'Board Room',
      });
      prismaService.meeting.count.mockResolvedValue(3);

      await expect(
        service.deleteLocation('org-1', 'loc-1', mockAdminUser),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow deletion when no meetings are associated', async () => {
      prismaService.meetingLocation.findFirst.mockResolvedValue({
        id: 'loc-1',
        organisationId: 'org-1',
        name: 'Unused Room',
      });
      prismaService.meeting.count.mockResolvedValue(0);
      prismaService.meetingLocation.delete.mockResolvedValue({ id: 'loc-1' });

      const res = await service.deleteLocation('org-1', 'loc-1', mockAdminUser);
      expect(res.id).toBe('loc-1');
      expect(prismaService.meetingLocation.delete).toHaveBeenCalledWith({
        where: { id: 'loc-1' },
      });
    });
  });
});
