import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: '0 = Monday ... 6 = Sunday' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Minutes since midnight', example: 540 })
  @Type(() => Number) @IsInt() @Min(0) @Max(1439)
  startMinutes!: number;

  @ApiProperty({ description: 'Minutes since midnight', example: 1080 })
  @Type(() => Number) @IsInt() @Min(1) @Max(1440)
  endMinutes!: number;
}

export class BreakItemDto extends WorkingHourItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  label?: string;
}

export class CreateStaffDto {
  @ApiProperty() @IsString() @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'anna' })
  @IsString() @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @ApiProperty() @IsEmail() @MaxLength(190)
  email!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiProperty() @IsString() @MaxLength(120)
  jobTitle!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  bio?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  serviceIds?: string[];
}

export class UpdateStaffDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  bio?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Replaces the full service assignment list' })
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true })
  serviceIds?: string[];
}

export class SetWorkingHoursDto {
  @ApiProperty({ type: [WorkingHourItemDto], description: 'Full weekly schedule; omitted days are non-working' })
  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => WorkingHourItemDto)
  hours!: WorkingHourItemDto[];
}

export class SetBreaksDto {
  @ApiProperty({ type: [BreakItemDto], description: 'Replaces all recurring breaks' })
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => BreakItemDto)
  breaks!: BreakItemDto[];
}

export class CreateTimeOffDto {
  @ApiProperty({ description: 'UTC ISO instant' }) @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'UTC ISO instant' }) @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  reason?: string;
}