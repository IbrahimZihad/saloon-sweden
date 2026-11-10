import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StaffService } from './staff.service';
import {
  CreateStaffDto,
  CreateTimeOffDto,
  SetBreaksDto,
  SetWorkingHoursDto,
  UpdateStaffDto,
} from './dto/staff.dto';

@ApiTags('staff')
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('public/staff')
  @ApiOperation({ summary: 'Active staff profiles (public)' })
  findPublic() {
    return this.staff.findPublic();
  }

  @Get('admin/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All staff with schedules (admin/staff)' })
  findAll() {
    return this.staff.findAll();
  }

  @Get('admin/staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff details incl. time off (admin/staff)' })
  findOne(@Param('id') id: string) {
    return this.staff.findOne(id);
  }

  @Post('admin/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create staff member (admin)' })
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Put('admin/staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff member and service assignments (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, dto);
  }

  @Delete('admin/staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate staff member (admin)' })
  async deactivate(@Param('id') id: string) {
    await this.staff.deactivate(id);
    return { message: 'Staff member deactivated' };
  }

  @Put('admin/staff/:id/working-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace weekly working schedule (admin)' })
  setWorkingHours(@Param('id') id: string, @Body() dto: SetWorkingHoursDto) {
    return this.staff.setWorkingHours(id, dto);
  }

  @Put('admin/staff/:id/breaks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace recurring breaks (admin)' })
  setBreaks(@Param('id') id: string, @Body() dto: SetBreaksDto) {
    return this.staff.setBreaks(id, dto);
  }

  @Post('admin/staff/:id/time-off')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add holiday / time off period (admin)' })
  addTimeOff(@Param('id') id: string, @Body() dto: CreateTimeOffDto) {
    return this.staff.addTimeOff(id, dto);
  }

  @Delete('admin/staff/:id/time-off/:timeOffId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove time off period (admin)' })
  async removeTimeOff(@Param('id') id: string, @Param('timeOffId') timeOffId: string) {
    await this.staff.removeTimeOff(id, timeOffId);
    return { message: 'Time off removed' };
  }
}