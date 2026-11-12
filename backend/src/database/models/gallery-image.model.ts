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

@Table({ tableName: 'GalleryImage', timestamps: true })
export class GalleryImage extends Model {
  @PrimaryKey
  @Default(() => randomUUID())
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(500))
  imageUrl!: string;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  altSv!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  altEn!: string | null;

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
}
