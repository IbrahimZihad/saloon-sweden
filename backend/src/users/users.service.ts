import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateUserDto {
  @ApiProperty() @IsString() @MaxLength(120)
  name!: string;

  @ApiProperty() @IsEmail() @MaxLength(190)
  email!: string;

  @ApiProperty() @IsString() @MinLength(10) @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: Role }) @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ description: 'Link to a staff profile (STAFF role)' })
  @IsOptional() @IsString()
  staffId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(10) @MaxLength(128)
  password?: string;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  staffMember: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateUserDto) {
    if (dto.staffId) {
      const staff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
      if (!staff) throw new BadRequestException('Staff profile not found');
    }
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await hash(dto.password, 12),
        role: dto.role,
        ...(dto.staffId ? { staffMember: { connect: { id: dto.staffId } } } : {}),
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (id === actingUserId && (dto.active === false || (dto.role && dto.role !== user.role))) {
      throw new BadRequestException('You cannot deactivate or change your own role');
    }
    if (user.role === 'ADMIN' && dto.active === false) {
      const activeAdmins = await this.prisma.user.count({ where: { role: 'ADMIN', active: true } });
      if (activeAdmins <= 1) {
        throw new BadRequestException('At least one active admin must remain');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        role: dto.role,
        active: dto.active,
        ...(dto.password ? { passwordHash: await hash(dto.password, 12) } : {}),
      },
      select: userSelect,
    });
  }
}