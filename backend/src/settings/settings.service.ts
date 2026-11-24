import { NotFoundException } from '../common/http-exceptions';
import { BusinessSettings } from '../database/models';
import { UpdateSettingsDto } from './dto/update-settings.dto';

/**
 * Settings are read on almost every request (time zone, booking window, notice
 * period, reservation rules) and change very rarely. Each read is a database
 * round trip, so a short in-process cache keeps it off the critical path. The
 * TTL bounds staleness if several instances run, and an update always
 * invalidates the cache immediately.
 */
const SETTINGS_CACHE_MS = 30_000;

export class SettingsService {
  private cache: { settings: BusinessSettings; loadedAt: number } | null = null;

  async getSettings(): Promise<BusinessSettings> {
    if (this.cache && Date.now() - this.cache.loadedAt < SETTINGS_CACHE_MS) {
      return this.cache.settings;
    }
    const settings = await BusinessSettings.findByPk('singleton');
    if (!settings) {
      throw new NotFoundException('Business settings not found. Run the database seeder.');
    }
    this.cache = { settings, loadedAt: Date.now() };
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<BusinessSettings> {
    const settings = await this.getSettings();
    await settings.update({ ...dto });
    this.cache = null;
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
