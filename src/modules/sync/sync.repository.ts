import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SyncRunModel } from './models/sync-run.model';

@Injectable()
export class SyncRepository {
  constructor(@InjectModel(SyncRunModel) private readonly runs: typeof SyncRunModel) {}

  createRun(input: Partial<SyncRunModel>): Promise<SyncRunModel> {
    return this.runs.create(input as any);
  }

  listRuns(limit = 20): Promise<SyncRunModel[]> {
    return this.runs.findAll({ order: [['startedAt', 'DESC']], limit });
  }
}
