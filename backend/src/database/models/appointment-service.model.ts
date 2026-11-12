import { randomUUID } from 'crypto';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Appointment } from './appointment.model';
import { Service } from './service.model';

@Table({ tableName: 'AppointmentService', timestamps: false })
export class AppointmentService extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => Appointment)
  @Index('AppointmentService_appointmentId_idx')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  appointmentId!: string;

  @ForeignKey(() => Service)
  @Index('AppointmentService_serviceId_idx')
  @AllowNull(true)
  @Column(DataType.STRING(191))
  serviceId!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  serviceNameSv!: string;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  serviceNameEn!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  durationMinutes!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  price!: string;

  @BelongsTo(() => Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment',
    onDelete: 'CASCADE',
  })
  appointment?: Appointment;

  @BelongsTo(() => Service, { foreignKey: 'serviceId', as: 'service', onDelete: 'SET NULL' })
  service?: Service | null;
}
