import { BadRequestException, Injectable } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class BusinessHourItemDto {
  @ApiProperty({ description: '0 = Monday ... 6 = Sunday' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Minutes since midnight', example: 540 })
  @Type(() => Number) @IsInt() @Min(0) @Max(1439)
  openMinutes!: number;

  @ApiProperty({ description: 'Minutes since midnight', example: 1080 })
  @Type(() => Number) @IsInt() @Min(0) @Max(1440)
  closeMinutes!: number;

  @ApiProperty() @IsBoolean()
  isClosed!: boolean;
}

export class SetBusinessHoursDto {
  @ApiProperty({ type: [BusinessHourItemDto] })
  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => BusinessHourItemDto)
  hours!: BusinessHourItemDto[];
}

@Injectable()
export class BusinessHoursService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.businessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  }

  async replace(dto: SetBusinessHoursDto) {
    const days = dto.hours.map((h) => h.dayOfWeek);
    if (new Set(days).size !== 7 || days.length !== 7) {
      throw new BadRequestException('Provide exactly one row per weekday (0-6)');
    }
    for (const item of dto.hours) {
      if (!item.isClosed && item.openMinutes >= item.closeMinutes) {
        throw new BadRequestException('Opening time must be before closing time');
      }
    }
    await this.prisma.$transaction(
      dto.hours.map((item) =>
        this.prisma.businessHours.upsert({
          where: { dayOfWeek: item.dayOfWeek },
          update: {
            openMinutes: item.openMinutes,
            closeMinutes: item.closeMinutes,
            isClosed: item.isClosed,
          },
          create: item,
        }),
      ),
    );
    return this.findAll();
  }
}