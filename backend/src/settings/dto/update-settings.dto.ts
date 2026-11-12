import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
   @IsOptional() @IsString() @MaxLength(160)
  salonName?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

   @IsOptional() @IsString() @MaxLength(500)
  logoUrl?: string;

   @IsOptional() @IsString() @MaxLength(255)
  address?: string;

   @IsOptional() @IsString() @MaxLength(20)
  postalCode?: string;

   @IsOptional() @IsString() @MaxLength(120)
  city?: string;

   @IsOptional() @IsString() @MaxLength(120)
  country?: string;

   @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

   @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

  @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(1000)
  mapEmbedUrl?: string;

   @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  instagramUrl?: string;

   @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  facebookUrl?: string;

   @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  tiktokUrl?: string;

   @IsOptional() @IsString() @MaxLength(10)
  currency?: string;

   @IsOptional() @IsString() @MaxLength(60)
  timezone?: string;

   @IsOptional() @IsString() @MaxLength(10)
  defaultLanguage?: string;

   @IsOptional() @IsString() @MaxLength(10)
  secondaryLanguage?: string;

  @IsOptional() @IsInt() @Min(5) @Max(60)
  appointmentIntervalMinutes?: number;

  @IsOptional() @IsInt() @Min(0) @Max(10080)
  minBookingNoticeMinutes?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  maxAdvanceBookingDays?: number;

  @IsOptional() @IsBoolean()
  pendingReservesTime?: boolean;

   @IsOptional() @IsString() @MaxLength(5000)
  cancellationPolicySv?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  cancellationPolicyEn?: string;
}