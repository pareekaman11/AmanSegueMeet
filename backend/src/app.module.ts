import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { MeetingsModule } from './meetings/meetings.module';
import { BoardPackModule } from './board-pack/board-pack.module';
import { AuditModule } from './audit/audit.module';
import { AgendaModule } from './agenda/agenda.module';
import { MinutesModule } from './minutes/minutes.module';
import { DocumentsModule } from './documents/documents.module';

import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { DecisionsModule } from './decisions/decisions.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { CommitteesModule } from './committees/committees.module';
import { AnnualPlanModule } from './annual-plan/annual-plan.module';
import { InterestsModule } from './interests/interests.module';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VotesModule } from './votes/votes.module';
import { FeedbackModule } from './feedback/feedback.module';
import { SupportModule } from './support/support.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GlobalThrottlerGuard } from './common/guards/global-throttler.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    /**
     * ConfigModule reads .env (or process.env) and makes every value
     * available via ConfigService throughout the application.
     * isGlobal: true means no other module needs to import ConfigModule.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * ThrottlerModule for rate limiting. 
     * In-memory storage for development. For horizontal scaling in production,
     * this can be swapped with throttler-storage-redis.
     */
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    /**
     * DatabaseModule is @Global and provides PrismaService to all modules
     * without requiring explicit imports.
     */
    DatabaseModule,

    /** Authentication — register, login, JWT strategy */
    AuthModule,

    /** Organisations — CRUD, member management, tenant isolation */
    OrganisationsModule,

    /** Meetings — CRUD, tenant-isolated meeting management */
    MeetingsModule,

    /** BoardPack — Meeting board pack JSON + PDF generation */
    BoardPackModule,

    /** Audit — System audit logging */
    AuditModule,

    /** Agenda — Sections and Items management */
    AgendaModule,

    /** Minutes — Meeting minutes and action items */
    MinutesModule,

    /** Documents — Document metadata management */
    DocumentsModule,

    /** Notifications — User notification read/manage API */
    NotificationsModule,

    /** Search — Global search across meetings, documents, and people */
    SearchModule,

    /** Decisions — Central register of board decisions */
    DecisionsModule,

    /** Resolutions — Circular resolutions out-of-session */
    ResolutionsModule,

    /** Committees — Management of board committees */
    CommitteesModule,

    /** Annual Plan — Board's yearly agenda/work plan */
    AnnualPlanModule,

    /** Interests — Conflicts of interest register */
    InterestsModule,

    /** Mail — Email sending service */
    MailModule,

    /** Analytics — Governance reporting and dashboards */
    AnalyticsModule,

    /** Votes — Meeting voting management */
    VotesModule,

    /** Feedback — Product feedback submission */
    FeedbackModule,

    /** Support — User support requests and issue reporting */
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
  ],
})
export class AppModule {}
