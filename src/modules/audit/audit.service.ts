import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository, AuditInput } from './audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly audit: AuditRepository) {}

  async record(input: AuditInput): Promise<void> {
    try {
      await this.audit.create(input);
    } catch (error) {
      this.logger.warn(`No se pudo registrar auditoría: ${(error as Error).message}`);
    }
  }
}
