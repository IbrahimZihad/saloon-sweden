import { randomUUID } from 'crypto';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { AppointmentService } from './appointment-service.model';
import { ServiceCategory } from './service-category.model';
import { StaffService } from './staff-service.model';

@Table({
  tableName: 'Service',
  timestamps: true,
  indexes: [{ name: 'Service_categoryId_active_idx', fields: ['categoryId', 'active'] }],
})
export class Service extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => ServiceCategory)
  @AllowNull(false)
  @Column(DataType.STRING(191))
  categoryId!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(160))
  slug!: string;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  nameSv!: string;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  nameEn!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  descriptionSv!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  descriptionEn!: string | null;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  price!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  durationMinutes!: number;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  imageUrl!: string | null;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  sortOrder!: number;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => ServiceCategory, {
    foreignKey: 'categoryId',
    as: 'category',
    onDelete: 'RESTRICT',
  })
  category?: ServiceCategory;

  @HasMany(() => StaffService, { foreignKey: 'serviceId', as: 'staff', onDelete: 'CASCADE' })
  staff?: StaffService[];

  @HasMany(() => AppointmentService, {
    foreignKey: 'serviceId',
    as: 'appointmentServices',
    onDelete: 'SET NULL',
  })
  appointmentServices?: AppointmentService[];
}
