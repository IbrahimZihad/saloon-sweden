import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@ApiTags('services')
@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('public/services')
  @ApiOperation({ summary: 'Active services with prices (public)' })
  findPublic(@Query('category') category?: string) {
    return this.services.findPublic(category);
  }

  @Get('public/services/:id')
  @ApiOperation({ summary: 'Single active service (public)' })
  async findOnePublic(@Param('id') id: string) {
    const service = await this.services.findOne(id);
    return service;
  }

  @Get('admin/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All services incl. inactive (admin/staff)' })
  findAll() {
    return this.services.findAll();
  }

  @Post('admin/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service (admin)' })
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @Put('admin/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @Delete('admin/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service without history (admin)' })
  async remove(@Param('id') id: string) {
    await this.services.remove(id);
    return { message: 'Service deleted' };
  }
}