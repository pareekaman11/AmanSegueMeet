import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import { FeedbackType } from './dto/create-feedback.dto';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prismaService: any;
  let organisationsService: any;
  let auditService: any;

  const mockUser: any = {
    id: 'user-1',
    email: 'user@test.com',
  };

  beforeEach(async () => {
    prismaService = {
      feedback: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    organisationsService = {
      requireMembership: jest.fn().mockResolvedValue(true),
      hasAnyRole: jest.fn().mockResolvedValue(false),
      requireRole: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      logSystemEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OrganisationsService, useValue: organisationsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should create feedback successfully', async () => {
    prismaService.feedback.create.mockResolvedValue({
      id: 'fb-1',
      organisationId: 'org-1',
      submittedById: 'user-1',
      type: FeedbackType.FEATURE_REQUEST,
      message: 'Add dark mode please',
      status: 'NEW',
    });

    const result = await service.createFeedback(
      {
        organisationId: 'org-1',
        type: FeedbackType.FEATURE_REQUEST,
        message: 'Add dark mode please',
      },
      mockUser,
    );

    expect(result.id).toBe('fb-1');
    expect(prismaService.feedback.create).toHaveBeenCalled();
    expect(auditService.logSystemEvent).toHaveBeenCalledWith(
      'FEEDBACK_SUBMITTED',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should filter feedback list for regular members to only their submissions', async () => {
    organisationsService.hasAnyRole.mockResolvedValue(false);
    prismaService.feedback.findMany.mockResolvedValue([
      { id: 'fb-1', submittedById: 'user-1', message: 'My feedback' },
    ]);

    const result = await service.getFeedbackList('org-1', mockUser);
    expect(result).toHaveLength(1);
    expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organisationId: 'org-1',
          submittedById: 'user-1',
        },
      }),
    );
  });
});
