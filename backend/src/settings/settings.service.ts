import { NotFoundException } from '../common/http-exceptions';
import { BusinessSettings } from '../database/models';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export class SettingsService {
  async getSettings(): Promise<BusinessSettings> {
    const settings = await BusinessSettings.findByPk('singleton');
    if (!settings) {
      throw new NotFoundException('Business settings not found. Run the database seeder.');
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<BusinessSettings> {
    const settings = await this.getSettings();
    await settings.update({ ...dto });
    return settings;
  }

  /** Fields safe to expose on the public website. */
  async getPublicSettings(): Promise<Partial<BusinessSettings>> {
    const settings = await this.getSettings();
    const plain = settings.get({ plain: true }) as Record<string, unknown>;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...publicFields } = plain;
    return publicFields as Partial<BusinessSettings>;
  }
}
