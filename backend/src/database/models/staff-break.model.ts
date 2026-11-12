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
  tableName: 'StaffBreak',
  timestamps: true,
  indexes: [{ name: 'StaffBreak_staffId_dayOfWeek_idx', fields: ['staffId', 'dayOfWeek'] }],
})
export class StaffBreak extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => Staff)
  @AllowNull(false)
  @Column(DataType.STRING(191))
  staffId!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  dayOfWeek!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  startMinutes!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  endMinutes!: number;

  @AllowNull(true)
  @Column(DataType.STRING(120))
  label!: string | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'CASCADE' })
  staff?: Staff;
}
