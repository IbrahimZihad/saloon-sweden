import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto, AvailabilitySlotsQueryDto } from './dto/availability-query.dto';

@ApiTags('availability')
@Controller('public/availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get('dates')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Bookable dates for the selected services' })
  getDates(@Query() query: AvailabilityQueryDto) {
    return this.availability.getAvailableDates(query.serviceIds, query.staffId);
  }

  @Get('slots')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Real available time slots for a date' })
  getSlots(@Query() query: AvailabilitySlotsQueryDto) {
    return this.availability.getSlots(query.serviceIds, query.date, query.staffId);
  }
}