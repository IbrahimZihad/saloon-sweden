import { PrismaClient } from '@prisma/client';
import { seedAdmin } from './seeders/admin.seeder';
import { seedSettings } from './seeders/settings.seeder';
import { seedBusinessHours } from './seeders/business-hours.seeder';
import { seedCategories } from './seeders/categories.seeder';
import { seedServices } from './seeders/services.seeder';
import { seedStaff } from './seeders/staff.seeder';
import { seedTestimonials } from './seeders/testimonials.seeder';
import { seedDemoData } from './seeders/demo-data.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('[seed] Starting idempotent seed…');

  await seedAdmin(prisma);
  await seedSettings(prisma);
  await seedBusinessHours(prisma);
  await seedCategories(prisma);
  await seedServices(prisma);
  await seedStaff(prisma);
  await seedTestimonials(prisma);

  const demoEnabled = (process.env.SEED_DEMO ?? 'false').toLowerCase() === 'true';
  if (demoEnabled) {
    await seedDemoData(prisma);
  } else {
    console.log('[seed] Demo data disabled (set SEED_DEMO=true to add fictional customers/appointments).');
  }

  console.log('[seed] Done. Safe to re-run at any time — existing records are not overwritten.');
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });