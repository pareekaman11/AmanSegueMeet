import { Module } from '@nestjs/common';
import { CommitteesService } from './committees.service';
import { CommitteesController } from './committees.controller';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [OrganisationsModule, AuditModule, NotificationsModule, MailModule],
  controllers: [CommitteesController],
  providers: [CommitteesService],
  exports: [CommitteesService],
})
export class CommitteesModule {}
