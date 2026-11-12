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
import { AppointmentSource, AppointmentStatus } from '../enums';
import { AppointmentService } from './appointment-service.model';
import { Customer } from './customer.model';
import { EmailNotification } from './email-notification.model';
import { Staff } from './staff.model';

@Table({
  tableName: 'Appointment',
  timestamps: true,
  indexes: [
    { name: 'Appointment_staffId_status_startsAt_idx', fields: ['staffId', 'status', 'startsAt'] },
    { name: 'Appointment_status_startsAt_idx', fields: ['status', 'startsAt'] },
    { name: 'Appointment_customerId_startsAt_idx', fields: ['customerId', 'startsAt'] },
    { name: 'Appointment_startsAt_idx', fields: ['startsAt'] },
  ],
})
export class Appointment extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(20))
  bookingReference!: string;

  @ForeignKey(() => Customer)
  @AllowNull(false)
  @Column(DataType.STRING(191))
  customerId!: string;

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

  @AllowNull(false)
  @Column(DataType.INTEGER)
  durationMinutes!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  totalPrice!: string;

  @AllowNull(false)
  @Default(AppointmentStatus.CONFIRMED)
  @Column(DataType.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))
  status!: AppointmentStatus;

  @AllowNull(false)
  @Default(AppointmentSource.ONLINE)
  @Column(DataType.ENUM('ONLINE', 'PHONE', 'ADMIN'))
  source!: AppointmentSource;

  @AllowNull(true)
  @Column(DataType.TEXT)
  customerNotes!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  internalNotes!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  cancelReason!: string | null;

  @AllowNull(true)
  @Column(DataType.DATE(3))
  cancelledAt!: Date | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'RESTRICT' })
  customer?: Customer;

  @BelongsTo(() => Staff, { foreignKey: 'staffId', as: 'staff', onDelete: 'RESTRICT' })
  staff?: Staff;

  @HasMany(() => AppointmentService, {
    foreignKey: 'appointmentId',
    as: 'services',
    onDelete: 'CASCADE',
  })
  services?: AppointmentService[];

  @HasMany(() => EmailNotification, {
    foreignKey: 'appointmentId',
    as: 'notifications',
    onDelete: 'SET NULL',
  })
  notifications?: EmailNotification[];
}
