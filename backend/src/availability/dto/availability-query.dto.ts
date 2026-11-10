import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export class AvailabilityQueryDto {
  @ApiProperty({ type: [String], description: 'Selected service IDs (1-10), comma-separated in query strings' })
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  serviceIds!: string[];

  @ApiPropertyOptional({ description: 'Specific staff ID; omit or "any" for any available stylist' })
  @IsOptional()
  @IsString()
  staffId?: string;
}

export class AvailabilitySlotsQueryDto extends AvailabilityQueryDto {
  @ApiProperty({ description: 'Local date YYYY-MM-DD (Europe/Stockholm)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;
}