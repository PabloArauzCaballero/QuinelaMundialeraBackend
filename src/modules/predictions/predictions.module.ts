import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditModule } from '../audit/audit.module';
import { GroupsModule } from '../groups/groups.module';
import { MatchesModule } from '../matches/matches.module';
import { PredictionModel } from './models/prediction.model';
import { PredictionRepository } from './prediction.repository';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [SequelizeModule.forFeature([PredictionModel]), MatchesModule, GroupsModule, AuditModule],
  controllers: [PredictionsController],
  providers: [PredictionRepository, PredictionsService],
  exports: [PredictionRepository, PredictionsService]
})
export class PredictionsModule {}
