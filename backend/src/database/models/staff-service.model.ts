import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Service } from './service.model';
import { Staff } from './staff.model';

@Table({ tableName: 'StaffService', timestamps: true, updatedAt: false })
export class StaffService extends Model {
  @PrimaryKey
  @ForeignKey(() => Staff)
  @AllowNull(false)
  @Column(DataType.STRING(191))
  staffId!: string;

  @PrimaryKey
  @ForeignKey(() => Service)
  @Index('StaffService_serviceId_idx')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  serviceId!: string;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @BelongsTo(() => Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'CASCADE' })
  staff?: Staff;

  @BelongsTo(() => Service, { foreignKey: 'serviceId', as: 'service', onDelete: 'CASCADE' })
  service?: Service;
}
