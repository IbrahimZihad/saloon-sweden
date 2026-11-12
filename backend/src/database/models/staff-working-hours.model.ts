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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { Staff } from './staff.model';

@Table({
  tableName: 'StaffWorkingHours',
  timestamps: true,
  indexes: [
    {
      name: 'StaffWorkingHours_staffId_dayOfWeek_key',
      unique: true,
      fields: ['staffId', 'dayOfWeek'],
    },
  ],
})
export class StaffWorkingHours extends Model {
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

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'CASCADE' })
  staff?: Staff;
}
