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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'BusinessHours', timestamps: true })
export class BusinessHours extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.INTEGER)
  dayOfWeek!: number;

  @AllowNull(false)
  @Default(540)
  @Column(DataType.INTEGER)
  openMinutes!: number;

  @AllowNull(false)
  @Default(1080)
  @Column(DataType.INTEGER)
  closeMinutes!: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isClosed!: boolean;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;
}
