import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  salonName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  country?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

  @ApiPropertyOptional({ description: 'Google Maps embed URL' })
  @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(1000)
  mapEmbedUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  instagramUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  facebookUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500)
  tiktokUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  defaultLanguage?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  secondaryLanguage?: string;

  @ApiPropertyOptional({ description: 'Slot grid interval in minutes (5-60)' })
  @IsOptional() @IsInt() @Min(5) @Max(60)
  appointmentIntervalMinutes?: number;

  @ApiPropertyOptional({ description: 'Minimum notice before a booking, in minutes' })
  @IsOptional() @IsInt() @Min(0) @Max(10080)
  minBookingNoticeMinutes?: number;

  @ApiPropertyOptional({ description: 'How far ahead customers may book, in days' })
  @IsOptional() @IsInt() @Min(1) @Max(365)
  maxAdvanceBookingDays?: number;

  @ApiPropertyOptional({ description: 'Whether PENDING appointments reserve time' })
  @IsOptional() @IsBoolean()
  pendingReservesTime?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  cancellationPolicySv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  cancellationPolicyEn?: string;
}