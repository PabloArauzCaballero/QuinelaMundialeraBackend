import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'stadiums', underscored: true, timestamps: true })
export class StadiumModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(140), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  declare city: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  declare country: string;

  @Column({ type: DataType.DECIMAL(9, 6), allowNull: true })
  declare latitude: string | null;

  @Column({ type: DataType.DECIMAL(9, 6), allowNull: true })
  declare longitude: string | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
