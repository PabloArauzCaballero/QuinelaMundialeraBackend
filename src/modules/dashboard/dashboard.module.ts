import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [GroupsModule, MatchesModule, PredictionsModule, LeaderboardModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
