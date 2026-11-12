import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  AppointmentService,
  Service,
  ServiceCategory,
  Staff,
  StaffService,
} from '../database/models';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

const categoryInclude = { model: ServiceCategory, as: 'category', required: true };

function sortByCategoryAndOrder<
  T extends { sortOrder: number; category?: { sortOrder: number } | null },
>(rows: T[]): T[] {
  return rows.sort(
    (a, b) =>
      (a.category?.sortOrder ?? 0) - (b.category?.sortOrder ?? 0) || a.sortOrder - b.sortOrder,
  );
}

@Injectable()
export class ServicesService {
  async findPublic(categorySlug?: string) {
    const services = await Service.findAll({
      where: { active: true },
      include: [
        {
          ...categoryInclude,
          where: { active: true, ...(categorySlug ? { slug: categorySlug } : {}) },
        },
      ],
    });
    return sortByCategoryAndOrder(
      services.map((service) => service.get({ plain: true })) as Array<{
        sortOrder: number;
        category: { sortOrder: number };
      }>,
    );
  }

  async findAll(includeInactive = true) {
    const services = await Service.findAll({
      where: includeInactive ? undefined : { active: true },
      include: [
        { model: ServiceCategory, as: 'category', required: true },
        { model: StaffService, as: 'staff', attributes: ['staffId'], required: false },
      ],
    });

    return sortByCategoryAndOrder(
      services.map((service) => {
        const plain = service.get({ plain: true }) as Record<string, unknown> & {
          staff?: unknown[];
          category: { sortOrder: number };
          sortOrder: number;
        };
        const staffCount = plain.staff?.length ?? 0;
        delete plain.staff;
        return { ...plain, _count: { staff: staffCount } };
      }),
    );
  }

  async findOne(id: string) {
    const service = await Service.findByPk(id, {
      include: [
        { model: ServiceCategory, as: 'category' },
        {
          model: StaffService,
          as: 'staff',
          include: [{ model: Staff, as: 'staff' }],
        },
      ],
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto) {
    await this.ensureCategory(dto.categoryId);
    const { price, ...rest } = dto;
    const service = await Service.create({
      ...rest,
      price: new Decimal(price).toFixed(2),
    });
    return Service.findByPk(service.id, { include: [categoryInclude] });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await Service.findByPk(id);
    if (!service) throw new NotFoundException('Service not found');
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    const { price, ...rest } = dto;
    await service.update({
      ...rest,
      ...(price !== undefined ? { price: new Decimal(price).toFixed(2) } : {}),
    });
    return Service.findByPk(id, { include: [categoryInclude] });
  }

  async remove(id: string): Promise<void> {
    const service = await Service.findByPk(id);
    if (!service) throw new NotFoundException('Service not found');
    const appointmentCount = await AppointmentService.count({ where: { serviceId: id } });
    if (appointmentCount > 0) {
      throw new BadRequestException(
        'Service has appointment history and cannot be deleted. Deactivate it instead.',
      );
    }
    await service.destroy();
  }

  private async ensureCategory(categoryId: string): Promise<void> {
    const category = await ServiceCategory.findByPk(categoryId);
    if (!category) throw new BadRequestException('Category does not exist');
  }
}
