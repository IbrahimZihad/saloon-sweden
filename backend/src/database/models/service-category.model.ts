import { randomUUID } from 'crypto';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { Service } from './service.model';

@Table({ tableName: 'ServiceCategory', timestamps: true })
export class ServiceCategory extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(120))
  slug!: string;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  nameSv!: string;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  nameEn!: string;

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

  @HasMany(() => Service, { foreignKey: 'categoryId', as: 'services' })
  services?: Service[];
}
