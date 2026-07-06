import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { SyncRunModel } from './models/sync-run.model';
import { SportsDbModule } from '../sportsdb/sportsdb.module';
import { SyncController } from './sync.controller';
import { SyncRepository } from './sync.repository';
import { SyncService } from './sync.service';

@Module({
  imports: [SequelizeModule.forFeature([SyncRunModel]), MatchesModule, PredictionsModule, SportsDbModule],
  controllers: [SyncController],
  providers: [SyncRepository, SyncService]
})
export class SyncModule {}
