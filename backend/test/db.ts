import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { seedAdmin } from '../prisma/seeders/admin.seeder';
import { seedSettings } from '../prisma/seeders/settings.seeder';
import { seedBusinessHours } from '../prisma/seeders/business-hours.seeder';
import { seedCategories } from '../prisma/seeders/categories.seeder';
import { seedServices } from '../prisma/seeders/services.seeder';
import { seedStaff } from '../prisma/seeders/staff.seeder';
import { seedTestimonials } from '../prisma/seeders/testimonials.seeder';

// setup-env.ts points DATABASE_URL at TEST_DATABASE_URL before this module loads,
// so this client only ever touches the isolated test database.
export const prisma = new PrismaClient();

function testUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL must be set to run integration tests.');
  return url;
}

/**
 * Drops and recreates the test schema by re-applying every version-controlled
 * migration. This doubles as a migration correctness check. The development
 * database is never referenced here.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$disconnect();
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    env: { ...process.env, DATABASE_URL: testUrl() },
    stdio: 'inherit',
  });
}

/** Runs the production seeders (no demo data) against the test database. */
export async function seedAll(): Promise<void> {
  await seedAdmin(prisma);
  await seedSettings(prisma);
  await seedBusinessHours(prisma);
  await seedCategories(prisma);
  await seedServices(prisma);
  await seedStaff(prisma);
  await seedTestimonials(prisma);
}