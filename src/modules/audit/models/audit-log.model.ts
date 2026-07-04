import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'audit_logs', underscored: true, timestamps: false })
export class AuditLogModel extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.UUID, allowNull: true, field: 'actor_user_id' })
  declare actorUserId: string | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  declare action: string;

  @Column({ type: DataType.STRING(80), allowNull: false, field: 'resource_type' })
  declare resourceType: string;

  @Column({ type: DataType.UUID, allowNull: true, field: 'resource_id' })
  declare resourceId: string | null;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare metadata: Record<string, unknown>;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'request_id' })
  declare requestId: string | null;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;
}
