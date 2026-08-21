import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import { AuditService } from '../audit/audit.service';
import { SupportCategory, SupportPriority, SupportStatus } from './dto/create-support-request.dto';

describe('SupportService', () => {
  let service: SupportService;
  let prismaService: any;
  let organisationsService: any;
  let auditService: any;

  const mockUser: any = {
    id: 'user-1',
    email: 'user@test.com',
  };

  beforeEach(async () => {
    prismaService = {
      supportRequest: {
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
        SupportService,
        { provide: PrismaService, useValue: prismaService },
        { provide: OrganisationsService, useValue: organisationsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should create support request with ticket number', async () => {
    prismaService.supportRequest.create.mockResolvedValue({
      id: 'sr-1',
      ticketNumber: 'SR-1042',
      organisationId: 'org-1',
      submittedById: 'user-1',
      category: SupportCategory.MEETINGS,
      subject: 'Audio issue in meeting',
      description: 'Audio was echoing',
      priority: SupportPriority.MEDIUM,
      status: SupportStatus.OPEN,
    });

    const result = await service.createSupportRequest(
      {
        organisationId: 'org-1',
        category: SupportCategory.MEETINGS,
        subject: 'Audio issue in meeting',
        description: 'Audio was echoing',
      },
      mockUser,
    );

    expect(result.ticketNumber).toBe('SR-1042');
    expect(prismaService.supportRequest.create).toHaveBeenCalled();
    expect(auditService.logSystemEvent).toHaveBeenCalledWith(
      'SUPPORT_REQUEST_CREATED',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should update support request status and log audit event', async () => {
    prismaService.supportRequest.findUnique.mockResolvedValue({
      id: 'sr-1',
      ticketNumber: 'SR-1042',
      organisationId: 'org-1',
      status: SupportStatus.OPEN,
    });

    prismaService.supportRequest.update.mockResolvedValue({
      id: 'sr-1',
      ticketNumber: 'SR-1042',
      status: SupportStatus.RESOLVED,
    });

    const result = await service.updateSupportRequest(
      'sr-1',
      { status: SupportStatus.RESOLVED },
      mockUser,
    );

    expect(result.status).toBe(SupportStatus.RESOLVED);
    expect(prismaService.supportRequest.update).toHaveBeenCalled();
    expect(auditService.logSystemEvent).toHaveBeenCalledWith(
      'SUPPORT_REQUEST_UPDATED',
      expect.any(String),
      expect.any(Object),
    );
  });
});
