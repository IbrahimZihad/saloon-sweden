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
import { NotificationStatus, NotificationType } from '../enums';
import { Appointment } from './appointment.model';

@Table({
  tableName: 'EmailNotification',
  timestamps: true,
  indexes: [
    { name: 'EmailNotification_status_createdAt_idx', fields: ['status', 'createdAt'] },
    {
      name: 'EmailNotification_appointmentId_type_key',
      unique: true,
      fields: ['appointmentId', 'type'],
    },
  ],
})
export class EmailNotification extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => Appointment)
  @AllowNull(true)
  @Column(DataType.STRING(191))
  appointmentId!: string | null;

  @AllowNull(false)
  @Column(
    DataType.ENUM(
      'BOOKING_CONFIRMATION',
      'APPOINTMENT_CONFIRMATION',
      'CANCELLATION',
      'RESCHEDULE',
      'REMINDER',
    ),
  )
  type!: NotificationType;

  @AllowNull(false)
  @Default(NotificationStatus.PENDING)
  @Column(DataType.ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED'))
  status!: NotificationStatus;

  @AllowNull(false)
  @Column(DataType.STRING(190))
  toEmail!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  subject!: string;

  @AllowNull(false)
  @Column(DataType.TEXT('long'))
  htmlBody!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  attempts!: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  lastError!: string | null;

  @AllowNull(true)
  @Column(DataType.DATE(3))
  sentAt!: Date | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @BelongsTo(() => Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment',
    onDelete: 'SET NULL',
  })
  appointment?: Appointment | null;
}
