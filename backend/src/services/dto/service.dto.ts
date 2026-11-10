import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 'womens-haircut' })
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @ApiProperty() @IsString() @MaxLength(160)
  nameSv!: string;

  @ApiProperty() @IsString() @MaxLength(160)
  nameEn!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

  @ApiProperty({ example: 650, description: 'Price in SEK' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  price!: number;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateServiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  categoryId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  nameSv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160)
  nameEn?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}