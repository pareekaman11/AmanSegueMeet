import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
  InternalServerErrorException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingsDto } from './dto/query-meetings.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      return await this.meetingsService.createMeeting(createMeetingDto, user);
    } catch (err: any) {
      throw new InternalServerErrorException(err.stack || err.message || String(err));
    }
  }

  @Get()
  findAll(
    @Query() query: QueryMeetingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.getMeetings(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.getMeetingById(id, user);
  }

  @Get(':id/quorum')
  getQuorum(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.getQuorumAndParticipation(id, user);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  update(
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.updateMeeting(id, updateMeetingDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.deleteMeeting(id, user);
  }

  @Post(':id/attendees')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  addAttendee(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.addAttendee(id, userId, user);
  }

  @Patch(':id/attendees/:attendeeId/attendance')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  updateAttendance(
    @Param('id') id: string,
    @Param('attendeeId') attendeeId: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.updateAttendeeAttendance(
      id,
      attendeeId,
      updateAttendanceDto,
      user,
    );
  }

  @Get(':id/notice/pdf')
  @Header('Content-Type', 'application/pdf')
  generateNoticePdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.generateNoticePdf(id, user);
  }
}

