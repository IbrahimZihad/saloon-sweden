import { AppointmentSource, AppointmentStatus } from '../../database/enums';
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

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsString({ each: true })
  serviceIds!: string[];

  @IsOptional() @IsString()
  staffId?: string;

  @IsDateString()
  startsAt!: string;

   @IsString() @MinLength(2) @MaxLength(160)
  fullName!: string;

   @IsEmail() @MaxLength(190)
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,25}$/, { message: 'phone must be a valid telephone number' })
  phone!: string;

   @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}

export class CreateAdminAppointmentDto {

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsString({ each: true })
  serviceIds!: string[];

   @IsString()
  staffId!: string;

   @IsDateString()
  startsAt!: string;

   @IsString() @MinLength(2) @MaxLength(160)
  fullName!: string;

   @IsEmail() @MaxLength(190)
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9 ()-]{6,25}$/, { message: 'phone must be a valid telephone number' })
  phone!: string;

   @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

   @IsOptional() @IsString() @MaxLength(2000)
  internalNotes?: string;

  @IsOptional() @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class RescheduleAppointmentDto {
   @IsDateString()
  startsAt!: string;

  @IsOptional() @IsString()
  staffId?: string;
}

export class UpdateStatusDto {

  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

   @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class CancelAppointmentDto {
   @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class AppointmentFilterDto {
   @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

   @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;

  @IsOptional() @IsString() @MaxLength(190)
  search?: string;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

   @IsOptional() @IsString()
  staffId?: string;

   @IsOptional() @IsString()
  serviceId?: string;

  @IsOptional() @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}