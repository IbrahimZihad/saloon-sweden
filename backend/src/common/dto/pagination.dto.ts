import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedDto<T> {

  data!: T[];

  total!: number;

  page!: number;

  limit!: number;

  totalPages!: number;
}

export function paginated<T>(data: T[], total: number, page: number, limit: number): PaginatedDto<T> {
  return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function skipTake(page = 1, limit = 20): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}