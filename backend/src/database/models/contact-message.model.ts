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

@Table({
  tableName: 'ContactMessage',
  timestamps: true,
  indexes: [{ name: 'ContactMessage_handled_createdAt_idx', fields: ['handled', 'createdAt'] }],
})
export class ContactMessage extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(160))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(190))
  email!: string;

  @AllowNull(true)
  @Column(DataType.STRING(40))
  phone!: string | null;

  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  handled!: boolean;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;
}
