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
import { Appointment } from './appointment.model';

@Table({
  tableName: 'Customer',
  timestamps: true,
  indexes: [
    { name: 'Customer_phone_idx', fields: ['phone'] },
    { name: 'Customer_fullName_idx', fields: ['fullName'] },
  ],
})
export class Customer extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  fullName!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(190))
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(40))
  phone!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  notes!: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  marketingConsent!: boolean;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @HasMany(() => Appointment, { foreignKey: 'customerId', as: 'appointments' })
  appointments?: Appointment[];
}
