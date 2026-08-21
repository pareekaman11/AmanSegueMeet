import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import ical, { ICalCalendarMethod, ICalEventStatus } from 'ical-generator';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendMemberAddedEmail(to: string, recipientName: string, orgName: string, role: string, designation: string | null, actorName: string) {
    try {
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const htmlContent = `
        <h2>Hello ${recipientName},</h2>
        <p><strong>${actorName}</strong> has added you to <strong>${orgName}</strong> on SegueMeet.</p>
        <p><strong>Role:</strong> ${role}</p>
        ${designation ? `<p><strong>Designation:</strong> ${designation}</p>` : ''}
        <br/>
        <p>Please log in to your dashboard to view your new board: <a href="${loginUrl}">${loginUrl}</a></p>
      `;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `You have been added to ${orgName}`,
        html: htmlContent,
      });

      this.logger.log(`Member added email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send member added email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendCommitteeMemberAddedEmail(to: string, recipientName: string, committeeName: string, role: string, actorName: string) {
    try {
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const htmlContent = `
        <h2>Hello ${recipientName},</h2>
        <p><strong>${actorName}</strong> has added you to the <strong>${committeeName}</strong> committee on SegueMeet.</p>
        <p><strong>Role:</strong> ${role}</p>
        <br/>
        <p>Please log in to your dashboard to view the committee: <a href="${loginUrl}">${loginUrl}</a></p>
      `;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `You have been added to the ${committeeName} committee`,
        html: htmlContent,
      });

      this.logger.log(`Committee member added email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send committee member added email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  private parseLocalTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
  }

  private buildIcalString(meeting: any, method: ICalCalendarMethod, sequence: number, isCancelled = false): string {
    const cal = ical({
      name: meeting.title,
      method: method,
    });
    
    const tz = meeting.timeZone;
    const startObj = tz ? `${meeting.date}T${meeting.startTime}:00` : this.parseLocalTime(meeting.date, meeting.startTime);
    const endObj = tz ? `${meeting.date}T${meeting.endTime}:00` : this.parseLocalTime(meeting.date, meeting.endTime);
    
    cal.createEvent({
      start: startObj,
      end: endObj,
      summary: meeting.title,
      description: meeting.notes || '',
      location: meeting.location,
      id: meeting.id,
      sequence: sequence,
      status: isCancelled ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED,
      timezone: tz || undefined,
      floating: !tz,
    });

    return cal.toString();
  }

  async sendMeetingInvite(
    to: string,
    meeting: any,
    orgName: string,
    actorName: string,
  ) {
    try {
      let htmlContent = `
        <h2>You're invited to a meeting!</h2>
        <p><strong>${actorName}</strong> has invited you to a meeting for <strong>${orgName}</strong>.</p>
        <p><strong>Meeting:</strong> ${meeting.title}</p>
        <p><strong>Date:</strong> ${meeting.date}</p>
        <p><strong>Time:</strong> ${meeting.startTime} - ${meeting.endTime}${meeting.timeZone ? ` (${meeting.timeZone})` : ''}</p>
      `;

      if (meeting.location) {
        htmlContent += `<p><strong>Location:</strong> ${meeting.location}</p>`;
      }
      
      if (meeting.videoLink) {
        htmlContent += `<p><strong>Video Link:</strong> <a href="${meeting.videoLink}">${meeting.videoLink}</a></p>`;
      }

      htmlContent += `<p>Please log in to SegueMeet to view the agenda and documents.</p>`;

      const icalContent = this.buildIcalString(meeting, ICalCalendarMethod.REQUEST, 0);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Meeting Invite: ${meeting.title}`,
        html: htmlContent,
        icalEvent: {
          filename: 'invite.ics',
          method: 'request',
          content: icalContent
        }
      });

      this.logger.log(`Meeting Invite Email Sent to ${to}! (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send meeting invite email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
      
      const htmlContent = `
        <h2>Verify your email for SegueMeet</h2>
        <p>Thank you for registering. Please click the link below to verify your email address. This link is valid for 24 hours.</p>
        <br/>
        <a href="${verifyUrl}" style="padding: 10px 15px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify your email</a>
        <br/><br/>
        <p>If you did not register for an account, please ignore this email.</p>
        <br/>
        <p>Thanks,<br/>The SegueMeet Team</p>
      `;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: 'Verify your SegueMeet account',
        html: htmlContent,
      });

      this.logger.log(`Verification email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      const htmlContent = `
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password for your SegueMeet account.</p>
        <p>Click the link below to reset it. This link is valid for 1 hour.</p>
        <br/>
        <a href="${resetUrl}" style="padding: 10px 15px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset your password</a>
        <br/><br/>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next hour.</p>
        <br/>
        <p>Thanks,<br/>The SegueMeet Team</p>
      `;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: 'Reset your SegueMeet password',
        html: htmlContent,
      });

      this.logger.log(`Password reset email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendMeetingUpdate(
    to: string,
    meeting: any,
    orgName: string,
    actorName: string,
  ) {
    try {
      let htmlContent = `
        <h2>Meeting Update</h2>
        <p><strong>${actorName}</strong> has updated a meeting for <strong>${orgName}</strong>.</p>
        <p><strong>Meeting:</strong> ${meeting.title}</p>
        <p><strong>Date:</strong> ${meeting.date}</p>
        <p><strong>Time:</strong> ${meeting.startTime} - ${meeting.endTime}${meeting.timeZone ? ` (${meeting.timeZone})` : ''}</p>
      `;

      if (meeting.location) {
        htmlContent += `<p><strong>Location:</strong> ${meeting.location}</p>`;
      }
      
      if (meeting.videoLink) {
        htmlContent += `<p><strong>Video Link:</strong> <a href="${meeting.videoLink}">${meeting.videoLink}</a></p>`;
      }

      const sequence = meeting.updatedAt ? Math.floor(new Date(meeting.updatedAt).getTime() / 1000) : 1;
      const icalContent = this.buildIcalString(meeting, ICalCalendarMethod.REQUEST, sequence);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Updated Meeting: ${meeting.title}`,
        html: htmlContent,
        icalEvent: {
          filename: 'invite.ics',
          method: 'request',
          content: icalContent
        }
      });

      this.logger.log(`Meeting Update Email Sent to ${to}! (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send meeting update email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendMeetingCancelled(
    to: string,
    meeting: any,
    orgName: string,
    actorName: string,
  ) {
    try {
      let htmlContent = `
        <h2>Meeting Cancelled</h2>
        <p><strong>${actorName}</strong> has cancelled the meeting: <strong>${meeting.title}</strong> for <strong>${orgName}</strong>.</p>
      `;

      const sequence = meeting.updatedAt ? Math.floor(new Date(meeting.updatedAt).getTime() / 1000) : 2;
      const icalContent = this.buildIcalString(meeting, ICalCalendarMethod.CANCEL, sequence, true);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Cancelled Meeting: ${meeting.title}`,
        html: htmlContent,
        icalEvent: {
          filename: 'invite.ics',
          method: 'cancel',
          content: icalContent
        }
      });

      this.logger.log(`Meeting Cancel Email Sent to ${to}! (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send meeting cancel email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }

  async sendBoardPackPublishedEmail(
    to: string,
    meetingTitle: string,
    orgName: string,
    actorName: string,
    meetingId: string
  ) {
    try {
      const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const packUrl = `${loginUrl}/meetings/${meetingId}/pack`;

      const htmlContent = `
        <h2>Board Pack Published</h2>
        <p><strong>${actorName}</strong> has published the Board Pack for the <strong>${meetingTitle}</strong> meeting at <strong>${orgName}</strong>.</p>
        <br/>
        <p>You can securely view or download the compiled Board Pack PDF by logging into SegueMeet:</p>
        <p><a href="${packUrl}">${packUrl}</a></p>
      `;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Board Pack Published: ${meetingTitle}`,
        html: htmlContent,
      });

      this.logger.log(`Board Pack email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send board pack email to ${to}: ${error.message}`);
      return { success: false, error };
    }
  }


}
