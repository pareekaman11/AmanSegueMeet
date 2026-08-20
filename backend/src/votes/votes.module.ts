import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { VotesGateway } from './votes.gateway';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [OrganisationsModule, AuditModule],
  controllers: [VotesController],
  providers: [VotesService, VotesGateway],
  exports: [VotesService, VotesGateway],
})
export class VotesModule {}
