import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { RoleModel } from './role.model';
import { UserModel } from './user.model';

@Table({ tableName: 'user_roles', underscored: true, timestamps: true })
export class UserRoleModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'role_id' })
  declare roleId: string;

  declare createdAt: Date;

  declare updatedAt: Date;
}
