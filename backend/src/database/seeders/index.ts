import { seedAdmin } from './admin.seeder';
import { seedBusinessHours } from './business-hours.seeder';
import { seedCategories } from './categories.seeder';
import { seedDemoData } from './demo-data.seeder';
import { seedServices } from './services.seeder';
import { seedSettings } from './settings.seeder';
import { seedStaff } from './staff.seeder';
import { seedTestimonials } from './testimonials.seeder';

export { seedAdmin, seedBusinessHours, seedCategories, seedDemoData, seedServices, seedSettings, seedStaff, seedTestimonials };

/** Runs every idempotent seeder. Safe to call repeatedly. */
export async function seedAll(): Promise<void> {
  await seedAdmin();
  await seedSettings();
  await seedBusinessHours();
  await seedCategories();
  await seedServices();
  await seedStaff();
  await seedTestimonials();

  if ((process.env.SEED_DEMO ?? 'false').toLowerCase() === 'true') {
    await seedDemoData();
  }
}

export function logSeedStart(): void {
  console.log('[seed] Starting idempotent seed…');
}

export function logSeedDemoState(): void {
  const enabled = (process.env.SEED_DEMO ?? 'false').toLowerCase() === 'true';
  if (!enabled) {
    console.log('[seed] Demo data disabled (set SEED_DEMO=true to add fictional customers/appointments).');
  }
}
