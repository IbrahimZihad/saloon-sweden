import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic(categorySlug?: string) {
    return this.prisma.service.findMany({
      where: {
        active: true,
        category: {
          active: true,
          ...(categorySlug ? { slug: categorySlug } : {}),
        },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { category: true },
    });
  }

  findAll(includeInactive = true) {
    return this.prisma.service.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { category: true, _count: { select: { staff: true } } },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true, staff: { include: { staff: true } } },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto) {
    await this.ensureCategory(dto.categoryId);
    const { price, ...rest } = dto;
    return this.prisma.service.create({
      data: { ...rest, price: new Prisma.Decimal(price) },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    const { price, ...rest } = dto;
    return this.prisma.service.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
      },
      include: { category: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const appointmentCount = await this.prisma.appointmentService.count({
      where: { serviceId: id },
    });
    if (appointmentCount > 0) {
      throw new BadRequestException(
        'Service has appointment history and cannot be deleted. Deactivate it instead.',
      );
    }
    await this.prisma.service.delete({ where: { id } });
  }

  private async ensureCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category does not exist');
  }
}