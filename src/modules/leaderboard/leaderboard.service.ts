import { Injectable } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service';
import { GroupRepository } from '../groups/group.repository';
import { PredictionRepository } from '../predictions/prediction.repository';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groups: GroupRepository,
    private readonly predictions: PredictionRepository
  ) {}

  async byGroup(requestUserId: string, groupId: string) {
    await this.groupsService.assertMember(groupId, requestUserId);
    const members = await this.groups.findMembers(groupId);
    const userIds = members.map((member) => member.userId);
    const predictions = await this.predictions.findByUserIds(userIds);

    const rows = members.map((member) => {
      const memberPredictions = predictions.filter((prediction) => prediction.userId === member.userId);
      return {
        userId: member.userId,
        name: member.user?.name ?? 'Usuario',
        points: memberPredictions.reduce((sum, prediction) => sum + prediction.points, 0),
        predictionsCount: memberPredictions.length
      };
    });

    return rows
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((row, index) => ({ position: index + 1, ...row }));
  }

  async myPosition(requestUserId: string, groupId: string) {
    const leaderboard = await this.byGroup(requestUserId, groupId);
    return leaderboard.find((row) => row.userId === requestUserId) ?? null;
  }
}
