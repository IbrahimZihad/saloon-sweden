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

@Table({ tableName: 'BusinessSettings', timestamps: true })
export class BusinessSettings extends Model {
  @PrimaryKey
  @Default('singleton')
  @Column(DataType.STRING(191))
  id!: string;

  @AllowNull(false)
  @Default('Min Salong')
  @Column(DataType.STRING(160))
  salonName!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  descriptionSv!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  descriptionEn!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  logoUrl!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  address!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(20))
  postalCode!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(120))
  city!: string | null;

  @AllowNull(false)
  @Default('Sweden')
  @Column(DataType.STRING(120))
  country!: string;

  @AllowNull(true)
  @Column(DataType.STRING(40))
  phone!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(190))
  email!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(1000))
  mapEmbedUrl!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  instagramUrl!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  facebookUrl!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  tiktokUrl!: string | null;

  @AllowNull(false)
  @Default('SEK')
  @Column(DataType.STRING(10))
  currency!: string;

  @AllowNull(false)
  @Default('Europe/Stockholm')
  @Column(DataType.STRING(60))
  timezone!: string;

  @AllowNull(false)
  @Default('sv')
  @Column(DataType.STRING(10))
  defaultLanguage!: string;

  @AllowNull(false)
  @Default('en')
  @Column(DataType.STRING(10))
  secondaryLanguage!: string;

  @AllowNull(false)
  @Default(15)
  @Column(DataType.INTEGER)
  appointmentIntervalMinutes!: number;

  @AllowNull(false)
  @Default(120)
  @Column(DataType.INTEGER)
  minBookingNoticeMinutes!: number;

  @AllowNull(false)
  @Default(60)
  @Column(DataType.INTEGER)
  maxAdvanceBookingDays!: number;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  pendingReservesTime!: boolean;

  @AllowNull(true)
  @Column(DataType.TEXT)
  cancellationPolicySv!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  cancellationPolicyEn!: string | null;

  @CreatedAt
  @Column(DataType.DATE(3))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(3))
  updatedAt!: Date;
}
