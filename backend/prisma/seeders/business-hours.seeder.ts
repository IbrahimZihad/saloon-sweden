import { PrismaClient } from '@prisma/client';

// dayOfWeek: 0 = Monday ... 6 = Sunday
const HOURS = [
  { dayOfWeek: 0, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Mon 09-18
  { dayOfWeek: 1, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Tue 09-18
  { dayOfWeek: 2, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Wed 09-18
  { dayOfWeek: 3, openMinutes: 540, closeMinutes: 1200, isClosed: false }, // Thu 09-20
  { dayOfWeek: 4, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Fri 09-18
  { dayOfWeek: 5, openMinutes: 600, closeMinutes: 960, isClosed: false }, //  Sat 10-16
  { dayOfWeek: 6, openMinutes: 0, closeMinutes: 0, isClosed: true }, //      Sun closed
];

export async function seedBusinessHours(prisma: PrismaClient): Promise<void> {
  for (const hours of HOURS) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: {},
      create: hours,
    });
  }
  console.log('[seed] Business hours ready (Mon-Fri 09-18, Thu 09-20, Sat 10-16, Sun closed).');
}