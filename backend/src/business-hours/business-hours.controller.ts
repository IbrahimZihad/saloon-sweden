import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusinessHoursService, SetBusinessHoursDto } from './business-hours.service';

@ApiTags('business-hours')
@Controller()
export class BusinessHoursController {
  constructor(private readonly hours: BusinessHoursService) {}

  @Get('public/business-hours')
  @ApiOperation({ summary: 'Salon opening hours (public)' })
  findPublic() {
    return this.hours.findAll();
  }

  @Get('admin/business-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Opening hours (admin)' })
  findAll() {
    return this.hours.findAll();
  }

  @Put('admin/business-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace weekly opening hours (admin)' })
  replace(@Body() dto: SetBusinessHoursDto) {
    return this.hours.replace(dto);
  }
}