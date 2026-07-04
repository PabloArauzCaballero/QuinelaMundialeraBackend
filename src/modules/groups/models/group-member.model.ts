import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { UserModel } from '../../users/models/user.model';
import { GroupModel } from './group.model';

@Table({ tableName: 'group_members', underscored: true, timestamps: true })
export class GroupMemberModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => GroupModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'group_id' })
  declare groupId: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'member' })
  declare role: 'owner' | 'member';

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'active' })
  declare status: 'active' | 'left';

  @Column({ type: DataType.DATE, allowNull: false, field: 'joined_at', defaultValue: DataType.NOW })
  declare joinedAt: Date;

  @BelongsTo(() => GroupModel)
  declare group?: GroupModel;

  @BelongsTo(() => UserModel)
  declare user?: UserModel;

  declare createdAt: Date;

  declare updatedAt: Date;
}
