import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { RoleModel } from './role.model';
import { UserRoleModel } from './user-role.model';

@Table({ tableName: 'users', underscored: true, timestamps: true })
export class UserModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(180), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'password_hash' })
  declare passwordHash: string;

  @Column({ type: DataType.STRING(24), allowNull: false, defaultValue: 'active' })
  declare status: 'active' | 'inactive';

  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  declare roles?: RoleModel[];

  declare createdAt: Date;

  declare updatedAt: Date;
}
