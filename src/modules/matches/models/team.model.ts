import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'teams', underscored: true, timestamps: true })
export class TeamModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(40), allowNull: false, defaultValue: 'manual' })
  declare source: string;

  @Column({ type: DataType.STRING(80), allowNull: true, field: 'external_id' })
  declare externalId: string | null;

  @Column({ type: DataType.STRING(90), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(12), allowNull: false, unique: true, field: 'fifa_code' })
  declare fifaCode: string;

  @Column({ type: DataType.STRING(40), allowNull: false, field: 'short_name' })
  declare shortName: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'flag_url' })
  declare flagUrl: string | null;

  declare createdAt: Date;

  declare updatedAt: Date;
}
