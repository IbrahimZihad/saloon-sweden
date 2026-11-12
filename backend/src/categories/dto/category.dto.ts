import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {

  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case' })
  slug!: string;

  @IsString()
  @MaxLength(120)
  nameSv!: string;

  @IsString()
  @MaxLength(120)
  nameEn!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
   @IsOptional() @IsString() @MaxLength(120)
  nameSv?: string;

   @IsOptional() @IsString() @MaxLength(120)
  nameEn?: string;

   @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

   @IsOptional() @IsBoolean()
  active?: boolean;
}