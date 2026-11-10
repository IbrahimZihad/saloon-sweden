import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentSource, AppointmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class BookAppointmentDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsString({ each: true })
  serviceIds!: string[];

  @ApiProperty({ description: 'Staff ID, or omit/"any" to assign the first available qualified stylist' })
  @IsOptional() @IsString()
  staffId?: string;

  @ApiProperty({ description: 'Exact slot start returned by the availability API (UTC ISO)' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty() @IsString() @MinLength(2) @MaxLength(160)
  fullName!: string;

  @ApiProperty() @IsEmail() @MaxLength(190)
  email!: string;

  @ApiProperty({ example: '+46 70 123 45 67' })
  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,25}$/, { message: 'phone must be a valid telephone number' })
  phone!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}

export class CreateAdminAppointmentDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsString({ each: true })
  serviceIds!: string[];

  @ApiProperty() @IsString()
  staffId!: string;

  @ApiProperty({ description: 'UTC ISO instant' }) @IsDateString()
  startsAt!: string;

  @ApiProperty() @IsString() @MinLength(2) @MaxLength(160)
  fullName!: string;

  @ApiProperty() @IsEmail() @MaxLength(190)
  email!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,25}$/, { message: 'phone must be a valid telephone number' })
  phone!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ enum: AppointmentSource, default: AppointmentSource.PHONE })
  @IsOptional() @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @ApiPropertyOptional({ enum: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] })
  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'New start instant (UTC ISO)' }) @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({ description: 'Optionally move to another qualified stylist' })
  @IsOptional() @IsString()
  staffId?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class AppointmentFilterDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Customer name, phone, email or booking reference' })
  @IsOptional() @IsString() @MaxLength(190)
  search?: string;

  @ApiPropertyOptional({ description: 'Local date YYYY-MM-DD' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({ description: 'Local start date YYYY-MM-DD' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiPropertyOptional({ description: 'Local end date YYYY-MM-DD (inclusive)' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  staffId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}