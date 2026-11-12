import { randomUUID } from 'crypto';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Staff } from './staff.model';

@Table({
  tableName: 'StaffTimeOff',
  timestamps: true,
  indexes: [
    { name: 'StaffTimeOff_staffId_startsAt_endsAt_idx', fields: ['staffId', 'startsAt', 'endsAt'] },
  ],
})
export class StaffTimeOff extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => Staff)
  @AllowNull(false)
  @Column(DataType.STRING(191))
  staffId!: string;

  @AllowNull(false)
  @Column(DataType.DATE(3))
  startsAt!: Date;

  @AllowNull(false)
  @Column(DataType.DATE(3))
  endsAt!: Date;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  reason!: string | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'CASCADE' })
  staff?: Staff;
}
