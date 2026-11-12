import { hash } from 'bcryptjs';
import {
  BusinessHours,
  BusinessSettings,
  Service,
  ServiceCategory,
  Staff,
  StaffBreak,
  StaffService,
  StaffWorkingHours,
  Testimonial,
  User,
} from '../src/database/models';
import { closeDatabase, resetDatabase, seedAll, sequelize } from './db';

async function counts() {
  return {
    user: await User.count(),
    category: await ServiceCategory.count(),
    service: await Service.count(),
    staff: await Staff.count(),
    staffService: await StaffService.count(),
    workingHours: await StaffWorkingHours.count(),
    break: await StaffBreak.count(),
    businessHours: await BusinessHours.count(),
    settings: await BusinessSettings.count(),
    testimonial: await Testimonial.count(),
  };
}

describe('schema sync & seeder idempotency (isolated test database)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await resetDatabase();
    await seedAll();
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  });

  it('creates every model table with foreign keys', async () => {
    // Windows MySQL commonly runs with lower_case_table_names=1, so compare
    // case-insensitively; Aiven (Linux) preserves the PascalCase names.
    const tables = (await sequelize.getQueryInterface().showAllTables()).map((table) =>
      String(table).toLowerCase(),
    );
    expect(tables).toEqual(
      expect.arrayContaining(
        [
          'User',
          'Customer',
          'Staff',
          'ServiceCategory',
          'Service',
          'StaffService',
          'StaffWorkingHours',
          'StaffBreak',
          'StaffTimeOff',
          'Appointment',
          'AppointmentService',
          'StaffScheduleLock',
          'BusinessSettings',
          'BusinessHours',
          'Testimonial',
          'GalleryImage',
          'ContactMessage',
          'EmailNotification',
        ].map((table) => table.toLowerCase()),
      ),
    );
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
    const admin = await User.findOne({ where: { email } });
    expect(admin).not.toBeNull();
    const originalHash = admin!.passwordHash;

    await seedAll();
    const afterReseed = await User.findOne({ where: { email } });
    expect(afterReseed!.passwordHash).toBe(originalHash);

    // Simulate the owner having changed their password, then re-seed.
    const changedHash = await hash('AChangedPassword123!', 12);
    await admin!.update({ passwordHash: changedHash });
    await seedAll();
    const preserved = await User.findByPk(admin!.id);
    expect(preserved!.passwordHash).toBe(changedHash);
  });
});
