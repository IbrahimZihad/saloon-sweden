import { BadRequestException, NotFoundException } from '../common/http-exceptions';
import { Op, Transaction, type Includeable } from 'sequelize';
import { DatabaseService } from '../database/database.service';
import {
  Service,
  Staff,
  StaffBreak,
  StaffService as StaffServiceModel,
  StaffTimeOff,
  StaffWorkingHours,
} from '../database/models';
import {
  CreateStaffDto,
  CreateTimeOffDto,
  SetBreaksDto,
  SetWorkingHoursDto,
  UpdateStaffDto,
} from './dto/staff.dto';

const staffIncludes: Includeable[] = [
  {
    model: StaffServiceModel,
    as: 'services',
    include: [{ model: Service, as: 'service', attributes: ['id', 'nameSv', 'nameEn', 'active'] }],
  },
  { model: StaffWorkingHours, as: 'workingHours', order: [['dayOfWeek', 'ASC']] },
  {
    model: StaffBreak,
    as: 'breaks',
    order: [
      ['dayOfWeek', 'ASC'],
      ['startMinutes', 'ASC'],
    ],
  },
];

export class StaffService {
  constructor(private readonly database: DatabaseService) {}

  findPublic() {
    return Staff.findAll({
      where: { active: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'slug', 'jobTitle', 'bio', 'imageUrl'],
      include: [{ model: StaffServiceModel, as: 'services', attributes: ['serviceId'] }],
    });
  }

  findAll() {
    return Staff.findAll({ order: [['name', 'ASC']], include: staffIncludes });
  }

  async findOne(id: string) {
    const staff = await Staff.findByPk(id, {
      include: [
        ...staffIncludes,
        { model: StaffTimeOff, as: 'timeOffs', order: [['startsAt', 'ASC']] },
      ],
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const { serviceIds, ...data } = dto;
    if (serviceIds?.length) await this.ensureServicesExist(serviceIds);
    const staff = await Staff.create({ ...data });
    if (serviceIds?.length) {
      await StaffServiceModel.bulkCreate(
        serviceIds.map((serviceId) => ({ staffId: staff.id, serviceId })),
      );
    }
    return Staff.findByPk(staff.id, { include: staffIncludes });
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);
    const { serviceIds, ...data } = dto;

    await this.database.transaction(async (transaction) => {
      if (serviceIds) {
        await this.ensureServicesExist(serviceIds, transaction);
        await StaffServiceModel.destroy({ where: { staffId: id }, transaction });
        if (serviceIds.length) {
          await StaffServiceModel.bulkCreate(
            serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
            { transaction },
          );
        }
      }
      await Staff.update(data, { where: { id }, transaction });
    });

    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    await Staff.update({ active: false }, { where: { id } });
    return Staff.findByPk(id);
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

    await this.database.transaction(async (transaction) => {
      await StaffWorkingHours.destroy({ where: { staffId: id }, transaction });
      if (dto.hours.length) {
        await StaffWorkingHours.bulkCreate(
          dto.hours.map((h) => ({ staffId: id, ...h })),
          { transaction },
        );
      }
    });

    return StaffWorkingHours.findAll({
      where: { staffId: id },
      order: [['dayOfWeek', 'ASC']],
    });
  }

  async setBreaks(id: string, dto: SetBreaksDto) {
    await this.findOne(id);
    for (const item of dto.breaks) {
      if (item.startMinutes >= item.endMinutes) {
        throw new BadRequestException('Break must start before it ends');
      }
    }

    await this.database.transaction(async (transaction) => {
      await StaffBreak.destroy({ where: { staffId: id }, transaction });
      if (dto.breaks.length) {
        await StaffBreak.bulkCreate(
          dto.breaks.map((b) => ({ staffId: id, ...b })),
          { transaction },
        );
      }
    });

    return StaffBreak.findAll({ where: { staffId: id } });
  }

  async addTimeOff(id: string, dto: CreateTimeOffDto) {
    await this.findOne(id);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException('Time off must start before it ends');
    }
    return StaffTimeOff.create({
      staffId: id,
      startsAt,
      endsAt,
      reason: dto.reason ?? null,
    });
  }

  async removeTimeOff(staffId: string, timeOffId: string): Promise<void> {
    const timeOff = await StaffTimeOff.findOne({
      where: { id: timeOffId, staffId },
    });
    if (!timeOff) throw new NotFoundException('Time off not found');
    await timeOff.destroy();
  }

  private async ensureServicesExist(
    serviceIds: string[],
    transaction?: Transaction,
  ): Promise<void> {
    const count = await Service.count({
      where: { id: { [Op.in]: serviceIds } },
      ...(transaction ? { transaction } : {}),
    });
    if (count !== new Set(serviceIds).size) {
      throw new BadRequestException('One or more services do not exist');
    }
  }
}
