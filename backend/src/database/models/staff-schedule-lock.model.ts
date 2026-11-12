import { randomUUID } from 'crypto';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'StaffScheduleLock',
  timestamps: true,
  indexes: [
    {
      name: 'StaffScheduleLock_staffId_lockDate_key',
      unique: true,
      fields: ['staffId', 'lockDate'],
    },
  ],
})
export class StaffScheduleLock extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(191))
  staffId!: string;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  lockDate!: string;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;
}
