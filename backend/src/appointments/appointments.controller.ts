import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentFilterDto,
  BookAppointmentDto,
  CancelAppointmentDto,
  CreateAdminAppointmentDto,
  RescheduleAppointmentDto,
  UpdateStatusDto,
} from './dto/appointment.dto';

@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post('public/appointments')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Book an appointment without an account' })
  book(@Body() dto: BookAppointmentDto) {
    return this.appointments.bookPublic(dto);
  }

  @Get('public/appointments/reference/:reference')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Look up a booking by reference (+ email verification)' })
  findByReference(@Param('reference') reference: string, @Query('email') email?: string) {
    return this.appointments.findByReference(reference, email);
  }

  @Get('admin/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List appointments with search/filters/pagination' })
  findAll(@Query() query: AppointmentFilterDto) {
    return this.appointments.findAll(query);
  }

  @Get('admin/appointments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Appointment details' })
  findOne(@Param('id') id: string) {
    return this.appointments.findOne(id);
  }

  @Post('admin/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a manual (telephone) appointment' })
  createAdmin(@Body() dto: CreateAdminAppointmentDto) {
    return this.appointments.createAdmin(dto);
  }

  @Patch('admin/appointments/:id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule with availability revalidation' })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointments.reschedule(id, dto);
  }

  @Patch('admin/appointments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm / complete / cancel / no-show' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointments.updateStatus(id, dto);
  }

  @Post('admin/appointments/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointments.cancel(id, dto.reason);
  }
}