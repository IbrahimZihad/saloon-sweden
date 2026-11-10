import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'haircuts' })
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @ApiProperty({ example: 'Klippningar' })
  @IsString()
  @MaxLength(120)
  nameSv!: string;

  @ApiProperty({ example: 'Haircuts' })
  @IsString()
  @MaxLength(120)
  nameEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  nameSv?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  nameEn?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}