import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkingHourItemDto {

  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(1439)
  startMinutes!: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(1440)
  endMinutes!: number;
}

export class BreakItemDto extends WorkingHourItemDto {
   @IsOptional() @IsString() @MaxLength(120)
  label?: string;
}

export class CreateStaffDto {
   @IsString() @MaxLength(120)
  name!: string;

  @IsString() @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

   @IsEmail() @MaxLength(190)
  email!: string;

   @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

   @IsString() @MaxLength(120)
  jobTitle!: string;

   @IsOptional() @IsString() @MaxLength(5000)
  bio?: string;

   @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

   @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  serviceIds?: string[];
}

export class UpdateStaffDto {
   @IsOptional() @IsString() @MaxLength(120)
  name?: string;

   @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

   @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

   @IsOptional() @IsString() @MaxLength(120)
  jobTitle?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  bio?: string;

   @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

   @IsOptional() @IsBoolean()
  active?: boolean;

  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  serviceIds?: string[];
}

export class SetWorkingHoursDto {

  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => WorkingHourItemDto)
  hours!: WorkingHourItemDto[];
}

export class SetBreaksDto {

  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => BreakItemDto)
  breaks!: BreakItemDto[];
}

export class CreateTimeOffDto {
   @IsDateString()
  startsAt!: string;

   @IsDateString()
  endsAt!: string;

   @IsOptional() @IsString() @MaxLength(255)
  reason?: string;
}