import { hash } from 'bcryptjs';
import { prisma, resetDatabase, seedAll } from './db';

async function counts() {
  return {
    user: await prisma.user.count(),
    category: await prisma.serviceCategory.count(),
    service: await prisma.service.count(),
    staff: await prisma.staff.count(),
    staffService: await prisma.staffService.count(),
    workingHours: await prisma.staffWorkingHours.count(),
    break: await prisma.staffBreak.count(),
    businessHours: await prisma.businessHours.count(),
    settings: await prisma.businessSettings.count(),
    testimonial: await prisma.testimonial.count(),
  };
}

describe('migrations & seeder idempotency (isolated test database)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await resetDatabase();
    await seedAll();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('applies every version-controlled migration cleanly', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`SELECT migration_name, finished_at FROM _prisma_migrations`;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.finished_at !== null)).toBe(true);
    expect(rows.some((r) => r.migration_name.includes('init'))).toBe(true);
  });

  it('seeds the expected baseline records', async () => {
    const c = await counts();
    expect(c.user).toBeGreaterThanOrEqual(4); // 1 admin + 3 staff logins
    expect(c.category).toBe(5);
    expect(c.service).toBe(10);
    expect(c.staff).toBe(3);
    expect(c.businessHours).toBe(7);
    expect(c.settings).toBe(1);
    expect(c.testimonial).toBeGreaterThan(0);
    expect(c.staffService).toBeGreaterThan(0);
    expect(c.workingHours).toBeGreaterThan(0);
    expect(c.break).toBeGreaterThan(0);
  });

  it('is idempotent — re-running creates no duplicates', async () => {
    const before = await counts();
    await seedAll();
    await seedAll();
    const after = await counts();
    expect(after).toEqual(before);
  });

  it('never overwrites an existing admin password', async () => {
    const email = process.env.ADMIN_EMAIL!.toLowerCase();
    const admin = await prisma.user.findUniqueOrThrow({ where: { email } });
    const originalHash = admin.passwordHash;

    await seedAll();
    const afterReseed = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(afterReseed.passwordHash).toBe(originalHash);

    // Simulate the owner having changed their password, then re-seed.
    const changedHash = await hash('AChangedPassword123!', 12);
    await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: changedHash } });
    await seedAll();
    const preserved = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(preserved.passwordHash).toBe(changedHash);
  });
});