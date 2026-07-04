import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { UserModel } from './user.model';
import { UserRoleModel } from './user-role.model';

@Table({ tableName: 'roles', underscored: true, timestamps: true })
export class RoleModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(40), allowNull: false, unique: true })
  declare name: 'user' | 'admin';

  @BelongsToMany(() => UserModel, () => UserRoleModel)
  declare users?: UserModel[];

  declare createdAt: Date;

  declare updatedAt: Date;
}
