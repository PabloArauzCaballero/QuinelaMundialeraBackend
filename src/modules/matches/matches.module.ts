import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditModule } from '../audit/audit.module';
import { MatchRepository } from './match.repository';
import { AdminMatchesController, MatchesController, StadiumsController, TeamsController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchModel } from './models/match.model';
import { StadiumModel } from './models/stadium.model';
import { TeamModel } from './models/team.model';

@Module({
  imports: [SequelizeModule.forFeature([MatchModel, TeamModel, StadiumModel]), AuditModule],
  controllers: [MatchesController, AdminMatchesController, TeamsController, StadiumsController],
  providers: [MatchRepository, MatchesService],
  exports: [MatchRepository, MatchesService]
})
export class MatchesModule {}
