import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';

describe('MeetingsService - Quorum & Participation', () => {
  let service: MeetingsService;
  let prismaService: any;
  let organisationsService: any;
  let auditService: any;
  let notificationsService: any;
  let mailService: any;

  const mockUser: any = {
    id: 'user-1',
    name: 'Board Member',
    email: 'user1@example.com',
  };

  beforeEach(async () => {
    prismaService = {
      meeting: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      meetingAttendee: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      organisationMember: {
        count: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
    };

    organisationsService = {
      requireMembership: jest.fn().mockResolvedValue(true),
      requireRole: jest.fn().mockResolvedValue(true),
      hasAnyRole: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      logTx: jest.fn().mockResolvedValue(true),
    };

    notificationsService = {
      createNotification: jest.fn().mockResolvedValue(true),
    };

    mailService = {
      sendMeetingInvite: jest.fn().mockResolvedValue(true),
      sendMeetingUpdate: jest.fn().mockResolvedValue(true),
      sendMeetingCancelled: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OrganisationsService, useValue: organisationsService },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
  });

  describe('calculateQuorumMetrics', () => {
    it('should correctly calculate quorum when quorum is MET with custom requiredQuorum', async () => {
      prismaService.meeting.findUnique.mockResolvedValue({
        id: 'meeting-1',
        organisationId: 'org-1',
        requiredQuorum: 5,
        attendees: [
          { id: 'a1', userId: 'u1', attendanceStatus: 'PRESENT' },
          { id: 'a2', userId: 'u2', attendanceStatus: 'PRESENT' },
          { id: 'a3', userId: 'u3', attendanceStatus: 'REMOTE' },
          { id: 'a4', userId: 'u4', attendanceStatus: 'LATE' },
          { id: 'a5', userId: 'u5', attendanceStatus: 'PRESENT' },
          { id: 'a6', userId: 'u6', attendanceStatus: 'PRESENT' },
          { id: 'a7', userId: 'u7', attendanceStatus: 'PRESENT' },
          { id: 'a8', userId: 'u8', attendanceStatus: 'ABSENT' },
          { id: 'a9', userId: 'u9', attendanceStatus: 'EXCUSED' },
          { id: 'a10', userId: 'u10', attendanceStatus: 'ABSENT' },
        ],
        organisation: { id: 'org-1', settings: {} },
      });

      const result = await service.calculateQuorumMetrics('meeting-1');

      expect(result.totalEligible).toBe(10);
      expect(result.requiredQuorum).toBe(5);
      expect(result.presentCount).toBe(7); // 5 PRESENT + 1 REMOTE + 1 LATE
      expect(result.absentCount).toBe(2);
      expect(result.excusedCount).toBe(1);
      expect(result.isQuorumMet).toBe(true);
      expect(result.quorumStatus).toBe('MET');
      expect(result.participationRate).toBe(70);
    });

    it('should correctly calculate quorum when quorum is NOT MET using default majority rule', async () => {
      prismaService.meeting.findUnique.mockResolvedValue({
        id: 'meeting-2',
        organisationId: 'org-1',
        requiredQuorum: null, // Should default to majority: Math.floor(6/2)+1 = 4
        attendees: [
          { id: 'a1', userId: 'u1', attendanceStatus: 'PRESENT' },
          { id: 'a2', userId: 'u2', attendanceStatus: 'PRESENT' },
          { id: 'a3', userId: 'u3', attendanceStatus: 'ABSENT' },
          { id: 'a4', userId: 'u4', attendanceStatus: 'ABSENT' },
          { id: 'a5', userId: 'u5', attendanceStatus: 'EXCUSED' },
          { id: 'a6', userId: 'u6', attendanceStatus: 'EXCUSED' },
        ],
        organisation: { id: 'org-1', settings: {} },
      });

      const result = await service.calculateQuorumMetrics('meeting-2');

      expect(result.totalEligible).toBe(6);
      expect(result.requiredQuorum).toBe(4);
      expect(result.presentCount).toBe(2);
      expect(result.absentCount).toBe(2);
      expect(result.excusedCount).toBe(2);
      expect(result.isQuorumMet).toBe(false);
      expect(result.quorumStatus).toBe('NOT_MET');
      expect(result.participationRate).toBe(33);
    });

    it('should throw NotFoundException if meeting does not exist', async () => {
      prismaService.meeting.findUnique.mockResolvedValue(null);
      await expect(service.calculateQuorumMetrics('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAttendeeAttendance', () => {
    it('should update attendee attendance status and return updated quorum', async () => {
      prismaService.meeting.findUnique.mockResolvedValue({
        id: 'meeting-1',
        organisationId: 'org-1',
        requiredQuorum: 2,
        attendees: [
          { id: 'a1', userId: 'u1', attendanceStatus: 'ABSENT', user: { id: 'u1', name: 'Alice' } },
          { id: 'a2', userId: 'u2', attendanceStatus: 'PRESENT', user: { id: 'u2', name: 'Bob' } },
        ],
        organisation: { id: 'org-1', settings: {} },
      });

      prismaService.meetingAttendee.findFirst.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        attendanceStatus: 'ABSENT',
        user: { id: 'u1', name: 'Alice' },
      });

      prismaService.meetingAttendee.update.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        attendanceStatus: 'PRESENT',
        user: { id: 'u1', name: 'Alice' },
      });

      const result = await service.updateAttendeeAttendance(
        'meeting-1',
        'a1',
        { attendanceStatus: 'PRESENT' },
        mockUser,
      );

      expect((result.attendee as any).attendanceStatus).toBe('PRESENT');
      expect(auditService.logTx).toHaveBeenCalled();
    });
  });
});
