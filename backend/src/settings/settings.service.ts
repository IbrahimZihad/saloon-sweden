import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<BusinessSettings> {
    const settings = await this.prisma.businessSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings) {
      throw new NotFoundException('Business settings not found. Run the database seeder.');
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<BusinessSettings> {
    await this.getSettings();
    return this.prisma.businessSettings.update({
      where: { id: 'singleton' },
      data: dto,
    });
  }

  /** Fields safe to expose on the public website. */
  async getPublicSettings(): Promise<Partial<BusinessSettings>> {
    const settings = await this.getSettings();
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...publicFields
    } = settings;
    return publicFields;
  }
}