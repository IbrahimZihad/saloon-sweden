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

@Table({ tableName: 'Testimonial', timestamps: true })
export class Testimonial extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  authorName!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  textSv!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  textEn!: string | null;

  @AllowNull(false)
  @Default(5)
  @Column(DataType.INTEGER)
  rating!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  sortOrder!: number;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;
}
