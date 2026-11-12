import { randomUUID } from 'crypto';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from '../enums';
import { Staff } from './staff.model';

@Table({ tableName: 'User', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(190))
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  passwordHash!: string;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  name!: string;

  @AllowNull(false)
  @Default(Role.STAFF)
  @Column(DataType.ENUM('ADMIN', 'STAFF'))
  role!: Role;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  active!: boolean;

  @Unique
  @AllowNull(true)
  @Column(DataType.STRING(190))
  passwordResetToken!: string | null;

  @AllowNull(true)
  @Column(DataType.DATE(3))
  passwordResetExpires!: Date | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;

  @HasOne(() => Staff, { foreignKey: 'userId', as: 'staffMember' })
  staffMember?: Staff;
}
