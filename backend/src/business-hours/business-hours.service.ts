import { BadRequestException } from '../common/http-exceptions';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { DatabaseService } from '../database/database.service';
import { BusinessHours } from '../database/models';

export class BusinessHourItemDto {

  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(1439)
  openMinutes!: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(1440)
  closeMinutes!: number;

  @IsBoolean()
  isClosed!: boolean;
}

export class SetBusinessHoursDto {

  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => BusinessHourItemDto)
  hours!: BusinessHourItemDto[];
}

export class BusinessHoursService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return BusinessHours.findAll({ order: [['dayOfWeek', 'ASC']] });
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

    await this.database.transaction(async (transaction) => {
      for (const item of dto.hours) {
        const [row, created] = await BusinessHours.findOrCreate({
          where: { dayOfWeek: item.dayOfWeek },
          defaults: {
            dayOfWeek: item.dayOfWeek,
            openMinutes: item.openMinutes,
            closeMinutes: item.closeMinutes,
            isClosed: item.isClosed,
          },
          transaction,
        });
        if (!created) {
          await row.update(
            {
              openMinutes: item.openMinutes,
              closeMinutes: item.closeMinutes,
              isClosed: item.isClosed,
            },
            { transaction },
          );
        }
      }
    });
    return this.findAll();
  }
}
