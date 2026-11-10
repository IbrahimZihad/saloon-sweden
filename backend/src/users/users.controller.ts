import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto, UsersService } from './users.service';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List admin/staff accounts' })
  findAll() {
    return this.users.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an admin or staff account' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account (role, active, password reset)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.users.update(id, dto, user.id);
  }
}