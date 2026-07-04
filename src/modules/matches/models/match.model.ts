import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { StadiumModel } from './stadium.model';
import { TeamModel } from './team.model';

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type MatchPhase = 'group' | 'round_32' | 'round_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final';

@Table({ tableName: 'matches', underscored: true, timestamps: true })
export class MatchModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(80), allowNull: true, unique: true, field: 'external_id' })
  declare externalId: string | null;

  @ForeignKey(() => TeamModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'home_team_id' })
  declare homeTeamId: string;

  @ForeignKey(() => TeamModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'away_team_id' })
  declare awayTeamId: string;

  @ForeignKey(() => StadiumModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'stadium_id' })
  declare stadiumId: string;

  @Column({ type: DataType.STRING(40), allowNull: false })
  declare phase: MatchPhase;

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'scheduled' })
  declare status: MatchStatus;

  @Column({ type: DataType.DATE, allowNull: false, field: 'starts_at' })
  declare startsAt: Date;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'home_score' })
  declare homeScore: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'away_score' })
  declare awayScore: number | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_synced_at' })
  declare lastSyncedAt: Date | null;

  @BelongsTo(() => TeamModel, 'homeTeamId')
  declare homeTeam?: TeamModel;

  @BelongsTo(() => TeamModel, 'awayTeamId')
  declare awayTeam?: TeamModel;

  @BelongsTo(() => StadiumModel, 'stadiumId')
  declare stadium?: StadiumModel;

  declare createdAt: Date;

  declare updatedAt: Date;
}
