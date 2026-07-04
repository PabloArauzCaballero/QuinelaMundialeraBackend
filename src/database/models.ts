import { UserModel } from '../modules/users/models/user.model';
import { RoleModel } from '../modules/users/models/role.model';
import { UserRoleModel } from '../modules/users/models/user-role.model';
import { GroupModel } from '../modules/groups/models/group.model';
import { GroupMemberModel } from '../modules/groups/models/group-member.model';
import { TeamModel } from '../modules/matches/models/team.model';
import { StadiumModel } from '../modules/matches/models/stadium.model';
import { MatchModel } from '../modules/matches/models/match.model';
import { PredictionModel } from '../modules/predictions/models/prediction.model';
import { SyncRunModel } from '../modules/sync/models/sync-run.model';
import { AuditLogModel } from '../modules/audit/models/audit-log.model';

export const databaseModels = [
  UserModel,
  RoleModel,
  UserRoleModel,
  GroupModel,
  GroupMemberModel,
  TeamModel,
  StadiumModel,
  MatchModel,
  PredictionModel,
  SyncRunModel,
  AuditLogModel
];
