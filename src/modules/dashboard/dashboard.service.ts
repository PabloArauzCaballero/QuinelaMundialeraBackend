import { Injectable } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { MatchesService } from '../matches/matches.service';
import { PredictionsService } from '../predictions/predictions.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly groups: GroupsService,
    private readonly matches: MatchesService,
    private readonly predictions: PredictionsService,
    private readonly leaderboard: LeaderboardService
  ) {}

  async mine(userId: string) {
    const groups = await this.groups.listMine(userId);
    const upcomingMatches = await this.matches.upcoming(8);
    const myPredictions = await this.predictions.listMine(userId);
    const predictedMatchIds = new Set(myPredictions.map((prediction) => prediction.matchId));
    const pendingMatches = upcomingMatches.filter((match) => !predictedMatchIds.has(match.id));
    const groupPositions = await Promise.all(groups.map((group) => this.leaderboard.myPosition(userId, group.id).then((position) => ({ groupId: group.id, groupName: group.name, position }))));
    const accumulatedPoints = await this.predictions.totalPointsForUser(userId);

    return {
      groupsCount: groups.length,
      pendingPredictionsCount: pendingMatches.length,
      upcomingMatches: pendingMatches,
      groupPositions,
      accumulatedPoints
    };
  }
}
