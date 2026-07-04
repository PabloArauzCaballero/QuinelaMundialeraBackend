import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MatchModel } from '../../matches/models/match.model';
import { UserModel } from '../../users/models/user.model';

@Table({ tableName: 'predictions', underscored: true, timestamps: true })
export class PredictionModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @ForeignKey(() => MatchModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'match_id' })
  declare matchId: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'predicted_home_score' })
  declare predictedHomeScore: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'predicted_away_score' })
  declare predictedAwayScore: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare points: number;

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'pending' })
  declare status: 'pending' | 'scored' | 'void';

  @BelongsTo(() => UserModel)
  declare user?: UserModel;

  @BelongsTo(() => MatchModel)
  declare match?: MatchModel;

  declare createdAt: Date;

  declare updatedAt: Date;
}
