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
  Index,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { Appointment } from './appointment.model';
import { StaffBreak } from './staff-break.model';
import { StaffService } from './staff-service.model';
import { StaffTimeOff } from './staff-time-off.model';
import { StaffWorkingHours } from './staff-working-hours.model';
import { User } from './user.model';

@Table({ tableName: 'Staff', timestamps: true })
export class Staff extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @ForeignKey(() => User)
  @Unique
  @AllowNull(true)
  @Column(DataType.STRING(191))
  userId!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  name!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(120))
  slug!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(190))
  email!: string;

  @AllowNull(true)
  @Column(DataType.STRING(40))
  phone!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  jobTitle!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  bio!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  imageUrl!: string | null;

  @Index('Staff_active_idx')
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

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user', onDelete: 'SET NULL' })
  user?: User | null;

  @HasMany(() => StaffService, { foreignKey: 'staffId', as: 'services', onDelete: 'CASCADE' })
  services?: StaffService[];

  @HasMany(() => StaffWorkingHours, {
    foreignKey: 'staffId',
    as: 'workingHours',
    onDelete: 'CASCADE',
  })
  workingHours?: StaffWorkingHours[];

  @HasMany(() => StaffBreak, { foreignKey: 'staffId', as: 'breaks', onDelete: 'CASCADE' })
  breaks?: StaffBreak[];

  @HasMany(() => StaffTimeOff, { foreignKey: 'staffId', as: 'timeOffs', onDelete: 'CASCADE' })
  timeOffs?: StaffTimeOff[];

  @HasMany(() => Appointment, { foreignKey: 'staffId', as: 'appointments' })
  appointments?: Appointment[];
}
