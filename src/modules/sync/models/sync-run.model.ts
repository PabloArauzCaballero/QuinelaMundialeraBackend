import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'sync_runs', underscored: true, timestamps: false })
export class SyncRunModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(40), allowNull: false })
  declare provider: string;

  @Column({ type: DataType.STRING(24), allowNull: false })
  declare status: 'success' | 'partial' | 'failed' | 'skipped';

  @Column({ type: DataType.DATE, allowNull: false, field: 'started_at' })
  declare startedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'finished_at' })
  declare finishedAt: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'matches_checked' })
  declare matchesChecked: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'matches_updated' })
  declare matchesUpdated: number;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'error_summary' })
  declare errorSummary: string | null;
}
