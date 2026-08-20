import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../common/database/prisma.service';
import { OrganisationsService } from '../organisations/organisations.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { OrganisationRole, Prisma, NotificationType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { CAN_MANAGE_MEETINGS } from '../common/auth/roles.constants';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organisationsService: OrganisationsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  /**
   * POST /meetings
   */
  async createMeeting(dto: CreateMeetingDto, user: AuthenticatedUser) {
    // 1. Verify tenant membership and role
    await this.organisationsService.requireRole(
      dto.organisationId,
      user.id,
      CAN_MANAGE_MEETINGS
    );

    let tz = dto.timeZone;
    if (tz === 'Asia/Calcutta') tz = 'Asia/Kolkata';

    try {
      const meeting = await this.prisma.$transaction(async (tx) => {
        const m = await tx.meeting.create({
          data: {
            organisationId: dto.organisationId,
            title: dto.title,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
            timeZone: tz,
            location: dto.location,
            videoLink: dto.videoLink,
            isRemote: dto.isRemote ?? false,
            administrator: dto.administrator,
            notes: dto.notes,
            status: dto.status,
            committeeId: dto.committeeId,
            committeeVisible: dto.committeeVisible,
            ...(dto.attendeeIds && dto.attendeeIds.length > 0 && {
              attendees: {
                create: dto.attendeeIds.map(userId => ({
                  userId,
                  rsvp: 'PENDING'
                }))
              }
            })
          },
          include: {
            attendees: {
              include: { user: true }
            }
          }
        });

        await this.auditService.logTx(tx, {
          organisationId: dto.organisationId,
          actorId: user.id,
          action: 'meeting.created',
          entityType: 'Meeting',
          entityId: m.id,
          payload: { title: dto.title, date: dto.date },
        });

        return m;
      });

      const org = await this.prisma.organisation.findUnique({
        where: { id: dto.organisationId },
        select: { name: true }
      });
      const orgName = org?.name || 'an organisation';

      // Only notify actual attendees if attendeeIds are provided, else notify everyone (fallback for old UI)
      const usersToNotify = meeting.attendees?.length > 0 
        ? meeting.attendees.map(a => a.user)
        : await this.prisma.user.findMany({
            where: { memberships: { some: { organisationId: dto.organisationId } } }
          });

      for (const member of usersToNotify) {
        // if (member.id !== user.id) { // Allow creator to receive invite for testing
        await this.notificationsService.createNotification({
          organisationId: dto.organisationId,
          recipientId: member.id,
          type: NotificationType.MEETING_CREATED,
          title: 'New Meeting Scheduled',
          message: `A new meeting "${meeting.title}" has been scheduled for ${meeting.date}.`,
          entityType: 'Meeting',
          entityId: meeting.id,
        });

        // Also dispatch email
        this.mailService.sendMeetingInvite(
          member.email,
          meeting,
          orgName,
          user.name
        ).catch(error => {
          this.logger.error('Unexpected error while sending meeting invite email:', error);
        });
        // }
      }

      return meeting;
    } catch (error) {
      this.logger.error(
        `Failed to create meeting for org ${dto.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(error instanceof Error ? error.stack : String(error));
    }
  }

  /**
   * GET /meetings
   */
  async getMeetings(query: QueryMeetingsDto, user: AuthenticatedUser) {
    // 1. Verify tenant membership
    await this.organisationsService.requireMembership(
      query.organisationId,
      user.id,
    );

    try {
      const isManager = await this.organisationsService.hasAnyRole(
        query.organisationId,
        user.id,
        CAN_MANAGE_MEETINGS
      );

      const where: Prisma.MeetingWhereInput = {
        organisationId: query.organisationId,
      };

      if (!isManager) {
        where.OR = [
          { attendees: { some: { userId: user.id } } },
          {
            committeeVisible: true,
            committee: { members: { some: { userId: user.id } } }
          }
        ];
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.from || query.to) {
        where.date = {};
        if (query.from) where.date.gte = query.from;
        if (query.to) where.date.lte = query.to;
      }

      if (query.search) {
        where.title = { contains: query.search, mode: 'insensitive' };
      }

      const skip = query.skip ? Number(query.skip) : 0;
      const take = query.take ? Number(query.take) : 50;

      const [data, total] = await Promise.all([
        this.prisma.meeting.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take,
        }),
        this.prisma.meeting.count({ where }),
      ]);

      return { data, total, skip, take };
    } catch (error) {
      this.logger.error(
        `Failed to fetch meetings for org ${query.organisationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to fetch meetings');
    }
  }

  /**
   * GET /meetings/:id
   */
  async getMeetingById(id: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: { user: true }
        }
      }
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership against the meeting's organisationId
    await this.organisationsService.requireMembership(
      meeting.organisationId,
      user.id,
    );

    // 2. Verify meeting attendance for non-managers
    const isManager = await this.organisationsService.hasAnyRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_MEETINGS
    );

    if (!isManager) {
      const isAttendee = meeting.attendees.some(a => a.userId === user.id);
      
      let isCommitteeVisibleMember = false;
      if (meeting.committeeVisible && meeting.committeeId) {
        const committeeMember = await this.prisma.committeeMember.findUnique({
          where: { committeeId_userId: { committeeId: meeting.committeeId, userId: user.id } }
        });
        if (committeeMember) {
          isCommitteeVisibleMember = true;
        }
      }

      if (!isAttendee && !isCommitteeVisibleMember) {
        throw new ForbiddenException('You are not authorized to view this meeting');
      }
    }

    return meeting;
  }

  /**
   * PATCH /meetings/:id
   */
  async updateMeeting(
    id: string,
    dto: UpdateMeetingDto,
    user: AuthenticatedUser,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership and role-based authorization for editing
    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_MEETINGS
    );

    let tz = dto.timeZone;
    if (tz === 'Asia/Calcutta') tz = 'Asia/Kolkata';

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.meeting.update({
          where: { id },
          data: {
            title: dto.title,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
            ...(tz && { timeZone: tz }),
            location: dto.location,
            videoLink: dto.videoLink,
            isRemote: dto.isRemote,
            administrator: dto.administrator,
            notes: dto.notes,
            status: dto.status,
            agendaStatus: dto.agendaStatus,
            ...(dto.committeeId !== undefined && { committeeId: dto.committeeId }),
            ...(dto.committeeVisible !== undefined && { committeeVisible: dto.committeeVisible }),
          },
        });

        await this.auditService.logTx(tx, {
          organisationId: meeting.organisationId,
          actorId: user.id,
          action: 'meeting.updated',
          entityType: 'Meeting',
          entityId: id,
          payload: { title: dto.title, status: dto.status },
        });

        if (dto.agendaStatus === 'PUBLISHED') {
          await this.auditService.logTx(tx, {
            organisationId: meeting.organisationId,
            actorId: user.id,
            action: 'agenda.published',
            entityType: 'Meeting',
            entityId: id,
          });
        }

        return u;
      });

      // Send update emails to attendees
      const attendees = await this.prisma.meetingAttendee.findMany({
        where: { meetingId: id },
        include: { user: true }
      });
      const orgName = (await this.prisma.organisation.findUnique({ where: { id: meeting.organisationId } }))?.name || 'an organisation';
      
      for (const attendee of attendees) {
        this.mailService.sendMeetingUpdate(
          attendee.user.email,
          updated,
          orgName,
          user.name
        ).catch(err => this.logger.error('Error sending update email', err));
      }

      if (dto.agendaStatus === 'PUBLISHED') {

        // Notify all members
        const members = await this.prisma.organisationMember.findMany({
          where: { organisationId: meeting.organisationId },
        });

        for (const member of members) {
          if (member.userId !== user.id) {
            await this.notificationsService.createNotification({
              organisationId: meeting.organisationId,
              recipientId: member.userId,
              type: NotificationType.AGENDA_PUBLISHED,
              title: 'Agenda Published',
              message: `The agenda for "${meeting.title}" has been published.`,
              entityType: 'Meeting',
              entityId: meeting.id,
            });
          }
        }
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update meeting ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to update meeting');
    }
  }

  /**
   * DELETE /meetings/:id
   */
  async deleteMeeting(id: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership and role-based authorization for deletion
    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_MEETINGS
    );

    try {
      // Send cancellation emails before deleting
      const attendees = await this.prisma.meetingAttendee.findMany({
        where: { meetingId: id },
        include: { user: true }
      });
      const orgName = (await this.prisma.organisation.findUnique({ where: { id: meeting.organisationId } }))?.name || 'an organisation';
      
      for (const attendee of attendees) {
        this.mailService.sendMeetingCancelled(
          attendee.user.email,
          meeting,
          orgName,
          user.name
        ).catch(err => this.logger.error('Error sending cancel email', err));
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.meeting.delete({
          where: { id },
        });

        await this.auditService.logTx(tx, {
          organisationId: meeting.organisationId,
          actorId: user.id,
          action: 'meeting.deleted',
          entityType: 'Meeting',
          entityId: id,
        });
      });

      return { message: 'Meeting deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete meeting ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete meeting');
    }
  }
  /**
   * POST /meetings/:id/attendees
   */
  async addAttendee(meetingId: string, userId: string, user: AuthenticatedUser) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { organisation: { select: { name: true } } }
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // 1. Verify tenant membership and role-based authorization for editing
    const membership = await this.organisationsService.requireRole(
      meeting.organisationId,
      user.id,
      CAN_MANAGE_MEETINGS
    );

    try {
      // Check if attendee already exists to avoid duplicate emails
      const existingAttendee = await this.prisma.meetingAttendee.findUnique({
        where: { meetingId_userId: { meetingId, userId } }
      });

      let attendee;
      if (existingAttendee) {
        attendee = existingAttendee;
      } else {
        attendee = await this.prisma.$transaction(async (tx) => {
          const a = await tx.meetingAttendee.create({
            data: {
              meetingId,
              userId,
              rsvp: 'PENDING',
            },
            include: { user: true }
          });

          await this.auditService.logTx(tx, {
            organisationId: meeting.organisationId,
            actorId: user.id,
            action: 'meeting.attendee_added',
            entityType: 'Meeting',
            entityId: meetingId,
            payload: { userId },
          });

          return a;
        });

        // Create in-app notification for the newly added attendee
        await this.notificationsService.createNotification({
          organisationId: meeting.organisationId,
          recipientId: userId,
          type: NotificationType.MEETING_CREATED,
          title: 'Added to Meeting',
          message: `You have been added to the meeting "${meeting.title}" scheduled for ${meeting.date}.`,
          entityType: 'Meeting',
          entityId: meeting.id,
        });

        // Send email invite asynchronously
        this.mailService.sendMeetingInvite(
          attendee.user.email,
          meeting,
          meeting.organisation.name,
          user.name
        ).catch(error => {
          this.logger.error('Unexpected error while sending meeting invite email:', error);
        });
      }

      return attendee;
    } catch (error) {
      this.logger.error(
        `Failed to add attendee to meeting ${meetingId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to add attendee');
    }
  }

  /**
   * GET /meetings/:id/notice/pdf
   */
  async generateNoticePdf(id: string, user: AuthenticatedUser): Promise<StreamableFile> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { attendees: { include: { user: true } } }
    });

    if (!meeting) throw new NotFoundException('Meeting not found');

    await this.organisationsService.requireMembership(meeting.organisationId, user.id);

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;

      // Header banner
      doc.rect(0, 0, pageWidth, 140).fill('#2d1b54');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
        .text('MEETING NOTICE', 50, 45, { align: 'center' });
      doc.fontSize(13).font('Helvetica')
        .text(meeting.title, 50, 80, { align: 'center' });

      doc.fillColor('#1a1a1a').moveDown(5);

      const sectionHeader = (label: string) => {
        doc.moveDown(0.8)
          .fontSize(9).font('Helvetica-Bold').fillColor('#7c3aed')
          .text(label.toUpperCase(), { characterSpacing: 1.5 })
          .moveDown(0.2)
          .moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y)
          .strokeColor('#e9d5ff').lineWidth(0.5).stroke()
          .moveDown(0.5);
      };

      const row = (label: string, value: string) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280')
          .text(`${label}:`, 58, doc.y, { continued: true, width: 130 })
          .font('Helvetica').fillColor('#1a1a1a')
          .text(value, { width: pageWidth - 250 })
          .moveDown(0.3);
      };

      sectionHeader('Meeting Details');
      row('Date', meeting.date);
      row('Time', `${meeting.startTime} - ${meeting.endTime}`);
      row('Location', meeting.isRemote ? `${meeting.location} (Remote)` : meeting.location);
      if (meeting.administrator) row('Administrator', meeting.administrator);
      if (meeting.notes) row('Notes', meeting.notes);

      if (meeting.attendees && meeting.attendees.length > 0) {
        sectionHeader('Invitees');
        (meeting.attendees as any[]).forEach((a) => {
          doc.fontSize(10).font('Helvetica').fillColor('#1a1a1a')
            .text(`- ${a.user.name} (${a.user.email})  RSVP: ${a.rsvp || 'PENDING'}`, 58)
            .moveDown(0.2);
        });
      }

      doc.moveDown(2)
        .fontSize(8).fillColor('#9ca3af').font('Helvetica')
        .text('Generated by SegueMeet', { align: 'center' });

      doc.end();
    });

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="notice-${id}.pdf"`,
    });
  }
}
