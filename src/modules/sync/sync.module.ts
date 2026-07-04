import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { SyncRunModel } from './models/sync-run.model';
import { SportsDbClient } from './sportsdb.client';
import { SyncController } from './sync.controller';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

@Module({
  imports: [SequelizeModule.forFeature([SyncRunModel]), MatchesModule, PredictionsModule],
  controllers: [SyncController],
  providers: [SportsDbClient, SyncRepository, SyncService]
})
export class SyncModule {}
