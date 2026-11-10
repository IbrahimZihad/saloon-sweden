import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from './customers.service';

class CustomerQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  limit?: number = 20;

  @IsOptional() @IsString() @MaxLength(190)
  search?: string;
}

@ApiTags('customers')
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List/search customers with visit counts' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customers.findAll(query.page, query.limit, query.search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Customer details with appointment history' })
  findOne(@Param('id') id: string) {
    return this.customers.findOne(id);
  }

  @Get(':id/export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GDPR data export (admin)' })
  exportData(@Param('id') id: string) {
    return this.customers.exportData(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GDPR erasure — anonymize customer personal data (admin)' })
  erase(@Param('id') id: string) {
    return this.customers.erase(id);
  }
}