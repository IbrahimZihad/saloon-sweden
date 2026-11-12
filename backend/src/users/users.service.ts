import { BadRequestException, NotFoundException } from '../common/http-exceptions';
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
import { Op } from 'sequelize';
import { Role } from '../database/enums';
import { Staff, User } from '../database/models';

export class CreateUserDto {
   @IsString() @MaxLength(120)
  name!: string;

   @IsEmail() @MaxLength(190)
  email!: string;

   @IsString() @MinLength(10) @MaxLength(128)
  password!: string;

   @IsEnum(Role)
  role!: Role;

  @IsOptional() @IsString()
  staffId?: string;
}

export class UpdateUserDto {
   @IsOptional() @IsString() @MaxLength(120)
  name?: string;

   @IsOptional() @IsEmail() @MaxLength(190)
  email?: string;

   @IsOptional() @IsEnum(Role)
  role?: Role;

   @IsOptional() @IsBoolean()
  active?: boolean;

   @IsOptional() @IsString() @MinLength(10) @MaxLength(128)
  password?: string;
}

const userAttributes = ['id', 'name', 'email', 'role', 'active', 'createdAt'];
const staffInclude = {
  model: Staff,
  as: 'staffMember',
  attributes: ['id', 'name'],
  required: false,
};

export class UsersService {
  findAll() {
    return User.findAll({
      attributes: userAttributes,
      include: [staffInclude],
      order: [['createdAt', 'ASC']],
    });
  }

  async create(dto: CreateUserDto) {
    if (dto.staffId) {
      const staff = await Staff.findByPk(dto.staffId);
      if (!staff) throw new BadRequestException('Staff profile not found');
    }
    const user = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash: await hash(dto.password, 12),
      role: dto.role,
    });
    if (dto.staffId) {
      await Staff.update({ userId: user.id }, { where: { id: dto.staffId } });
    }
    return this.findByIdForOutput(user.id);
  }

  async update(id: string, dto: UpdateUserDto, actingUserId: string) {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundException('User not found');
    if (id === actingUserId && (dto.active === false || (dto.role && dto.role !== user.role))) {
      throw new BadRequestException('You cannot deactivate or change your own role');
    }
    if (user.role === 'ADMIN' && dto.active === false) {
      const activeAdmins = await User.count({
        where: { role: 'ADMIN', active: true, id: { [Op.ne]: id } },
      });
      if (activeAdmins < 1) {
        throw new BadRequestException('At least one active admin must remain');
      }
    }
    await user.update({
      name: dto.name,
      email: dto.email?.toLowerCase(),
      role: dto.role,
      active: dto.active,
      ...(dto.password ? { passwordHash: await hash(dto.password, 12) } : {}),
    });
    return this.findByIdForOutput(id);
  }

  private async findByIdForOutput(id: string) {
    const user = await User.findByPk(id, {
      attributes: userAttributes,
      include: [staffInclude],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
