import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLogModel } from './models/audit-log.model';

export interface AuditInput {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
}

@Injectable()
export class AuditRepository {
  constructor(@InjectModel(AuditLogModel) private readonly logs: typeof AuditLogModel) {}

  async create(input: AuditInput): Promise<void> {
    await this.logs.create({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? {},
      requestId: input.requestId ?? null
    } as any);
  }
}
