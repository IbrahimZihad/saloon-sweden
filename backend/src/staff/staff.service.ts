import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStaffDto,
  CreateTimeOffDto,
  SetBreaksDto,
  SetWorkingHoursDto,
  UpdateStaffDto,
} from './dto/staff.dto';

const staffInclude = {
  services: { include: { service: { select: { id: true, nameSv: true, nameEn: true, active: true } } } },
  workingHours: { orderBy: { dayOfWeek: 'asc' as const } },
  breaks: { orderBy: [{ dayOfWeek: 'asc' as const }, { startMinutes: 'asc' as const }] },
} satisfies Prisma.StaffInclude;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.staff.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        jobTitle: true,
        bio: true,
        imageUrl: true,
        services: { select: { serviceId: true } },
      },
    });
  }

  findAll() {
    return this.prisma.staff.findMany({
      orderBy: { name: 'asc' },
      include: staffInclude,
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        ...staffInclude,
        timeOffs: { orderBy: { startsAt: 'asc' } },
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const { serviceIds, ...data } = dto;
    if (serviceIds?.length) await this.ensureServicesExist(serviceIds);
    return this.prisma.staff.create({
      data: {
        ...data,
        services: serviceIds?.length
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
      include: staffInclude,
    });
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);
    const { serviceIds, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (serviceIds) {
        await this.ensureServicesExist(serviceIds, tx);
        await tx.staffService.deleteMany({ where: { staffId: id } });
        if (serviceIds.length) {
          await tx.staffService.createMany({
            data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
          });
        }
      }
      return tx.staff.update({ where: { id }, data, include: staffInclude });
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.staff.update({ where: { id }, data: { active: false } });
  }

  async setWorkingHours(id: string, dto: SetWorkingHoursDto) {
    await this.findOne(id);
    for (const item of dto.hours) {
      if (item.startMinutes >= item.endMinutes) {
        throw new BadRequestException('Working hours must start before they end');
      }
    }
    const days = dto.hours.map((h) => h.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new BadRequestException('Duplicate weekday in schedule');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.staffWorkingHours.deleteMany({ where: { staffId: id } });
      if (dto.hours.length) {
        await tx.staffWorkingHours.createMany({
          data: dto.hours.map((h) => ({ staffId: id, ...h })),
        });
      }
      return tx.staffWorkingHours.findMany({
        where: { staffId: id },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  async setBreaks(id: string, dto: SetBreaksDto) {
    await this.findOne(id);
    for (const item of dto.breaks) {
      if (item.startMinutes >= item.endMinutes) {
        throw new BadRequestException('Break must start before it ends');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.staffBreak.deleteMany({ where: { staffId: id } });
      if (dto.breaks.length) {
        await tx.staffBreak.createMany({
          data: dto.breaks.map((b) => ({ staffId: id, ...b })),
        });
      }
      return tx.staffBreak.findMany({ where: { staffId: id } });
    });
  }

  async addTimeOff(id: string, dto: CreateTimeOffDto) {
    await this.findOne(id);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException('Time off must start before it ends');
    }
    return this.prisma.staffTimeOff.create({
      data: { staffId: id, startsAt, endsAt, reason: dto.reason },
    });
  }

  async removeTimeOff(staffId: string, timeOffId: string): Promise<void> {
    const timeOff = await this.prisma.staffTimeOff.findFirst({
      where: { id: timeOffId, staffId },
    });
    if (!timeOff) throw new NotFoundException('Time off not found');
    await this.prisma.staffTimeOff.delete({ where: { id: timeOffId } });
  }

  private async ensureServicesExist(
    serviceIds: string[],
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const count = await tx.service.count({ where: { id: { in: serviceIds } } });
    if (count !== new Set(serviceIds).size) {
      throw new BadRequestException('One or more services do not exist');
    }
  }
}