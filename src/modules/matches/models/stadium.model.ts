import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'stadiums', underscored: true, timestamps: true })
export class StadiumModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(40), allowNull: false, defaultValue: 'manual' })
  declare source: string;

  @Column({ type: DataType.STRING(80), allowNull: true, field: 'external_id' })
  declare externalId: string | null;

  @Column({ type: DataType.STRING(140), allowNull: true })
  declare name: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  declare city: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  declare country: string | null;

  @Column({ type: DataType.DECIMAL(9, 6), allowNull: true })
  declare latitude: string | null;

  @Column({ type: DataType.DECIMAL(9, 6), allowNull: true })
  declare longitude: string | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
