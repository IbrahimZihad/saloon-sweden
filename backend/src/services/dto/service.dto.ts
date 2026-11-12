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

  @IsString()
  categoryId!: string;

  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

   @IsString() @MaxLength(160)
  nameSv!: string;

   @IsString() @MaxLength(160)
  nameEn!: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

   @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

   @IsOptional() @IsBoolean()
  active?: boolean;

   @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateServiceDto {
   @IsOptional() @IsString()
  categoryId?: string;

   @IsOptional() @IsString() @MaxLength(160)
  nameSv?: string;

   @IsOptional() @IsString() @MaxLength(160)
  nameEn?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionSv?: string;

   @IsOptional() @IsString() @MaxLength(5000)
  descriptionEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

   @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

   @IsOptional() @IsBoolean()
  active?: boolean;

   @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}