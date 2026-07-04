import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditLogModel } from './models/audit-log.model';

@Module({
  imports: [SequelizeModule.forFeature([AuditLogModel])],
  providers: [AuditRepository, AuditService],
  exports: [AuditService]
})
export class AuditModule {}
