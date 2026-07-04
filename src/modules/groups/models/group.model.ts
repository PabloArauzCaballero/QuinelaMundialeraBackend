import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { UserModel } from '../../users/models/user.model';
import { GroupMemberModel } from './group-member.model';

@Table({ tableName: 'groups', underscored: true, timestamps: true })
export class GroupModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true, field: 'invitation_code' })
  declare invitationCode: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'owner_user_id' })
  declare ownerUserId: string;

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'active' })
  declare status: 'active' | 'archived';

  @BelongsTo(() => UserModel, 'ownerUserId')
  declare owner?: UserModel;

  @HasMany(() => GroupMemberModel)
  declare members?: GroupMemberModel[];

  declare createdAt: Date;

  declare updatedAt: Date;
}
