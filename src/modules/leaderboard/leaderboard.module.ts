import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [GroupsModule, PredictionsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService]
})
export class LeaderboardModule {}
