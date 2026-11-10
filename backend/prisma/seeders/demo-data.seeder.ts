import { AppointmentStatus, Prisma, PrismaClient } from '@prisma/client';
import { addDaysToDateStr, todayLocalStr, weekdayFromDateStr, zonedDateTimeToUtc } from '../../src/common/utils/time.util';

const DEMO_CUSTOMERS = [
  { fullName: 'Erika Ek (demo)', email: 'erika.demo@example.com', phone: '+46 70 000 10 01' },
  { fullName: 'Lars Larsson (demo)', email: 'lars.demo@example.com', phone: '+46 70 000 10 02' },
  { fullName: 'Maja Majasson (demo)', email: 'maja.demo@example.com', phone: '+46 70 000 10 03' },
  { fullName: 'Nils Nilsson (demo)', email: 'nils.demo@example.com', phone: '+46 70 000 10 04' },
  { fullName: 'Olivia Ohlsson (demo)', email: 'olivia.demo@example.com', phone: '+46 70 000 10 05' },
];

interface DemoSlot {
  dayOffset: number;
  startMinutes: number;
  staffSlug: string;
  serviceSlugs: string[];
  status: AppointmentStatus;
  customerIndex: number;
}

// All fictional. Offsets are relative to the current date so demos always look alive.
const DEMO_APPOINTMENTS: DemoSlot[] = [
  { dayOffset: 1, startMinutes: 600, staffSlug: 'anna', serviceSlugs: ['womens-haircut'], status: 'CONFIRMED', customerIndex: 0 },
  { dayOffset: 1, startMinutes: 840, staffSlug: 'emma', serviceSlugs: ['root-coloring'], status: 'CONFIRMED', customerIndex: 1 },
  { dayOffset: 2, startMinutes: 660, staffSlug: 'sofia', serviceSlugs: ['mens-haircut', 'wash-blow-dry'], status: 'CONFIRMED', customerIndex: 2 },
  { dayOffset: 3, startMinutes: 600, staffSlug: 'emma', serviceSlugs: ['highlights'], status: 'PENDING', customerIndex: 3 },
  { dayOffset: 5, startMinutes: 630, staffSlug: 'anna', serviceSlugs: ['hair-styling'], status: 'CONFIRMED', customerIndex: 4 },
  { dayOffset: -2, startMinutes: 600, staffSlug: 'anna', serviceSlugs: ['womens-haircut'], status: 'COMPLETED', customerIndex: 0 },
  { dayOffset: -3, startMinutes: 840, staffSlug: 'emma', serviceSlugs: ['full-hair-coloring'], status: 'COMPLETED', customerIndex: 1 },
  { dayOffset: -5, startMinutes: 660, staffSlug: 'sofia', serviceSlugs: ['mens-haircut'], status: 'COMPLETED', customerIndex: 2 },
  { dayOffset: -7, startMinutes: 600, staffSlug: 'sofia', serviceSlugs: ['wash-blow-dry'], status: 'NO_SHOW', customerIndex: 3 },
  { dayOffset: -4, startMinutes: 900, staffSlug: 'anna', serviceSlugs: ['deep-conditioning'], status: 'CANCELLED', customerIndex: 4 },
];

/**
 * Optional demo data (SEED_DEMO=true). Never part of the production seed.
 * Slots are validated against staff working hours, breaks and existing
 * appointments; anything that does not fit is skipped rather than forced.
 */
export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  const settings = await prisma.businessSettings.findUnique({ where: { id: 'singleton' } });
  const tz = settings?.timezone ?? 'Europe/Stockholm';
  const today = todayLocalStr(tz);

  const customers = [];
  for (const data of DEMO_CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    });
    customers.push(customer);
  }

  let created = 0;
  let skipped = 0;
  let refCounter = 0;

  for (const slot of DEMO_APPOINTMENTS) {
    const dateStr = addDaysToDateStr(today, slot.dayOffset);
    const weekday = weekdayFromDateStr(dateStr);

    const staff = await prisma.staff.findUnique({
      where: { slug: slot.staffSlug },
      include: { services: { include: { service: true } } },
    });
    if (!staff || !staff.active) { skipped++; continue; }

    const hours = await prisma.staffWorkingHours.findUnique({
      where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek: weekday } },
    });
    if (!hours) { skipped++; continue; }

    const services = slot.serviceSlugs
      .map((slug) => staff.services.find((s) => s.service.slug === slug)?.service)
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.active));
    if (services.length !== slot.serviceSlugs.length) { skipped++; continue; }

    const duration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const startMinutes = slot.startMinutes;
    const endMinutes = startMinutes + duration;
    if (startMinutes < hours.startMinutes || endMinutes > hours.endMinutes) { skipped++; continue; }

    const breaks = await prisma.staffBreak.findMany({
      where: { staffId: staff.id, dayOfWeek: weekday },
    });
    const hitsBreak = breaks.some((b) => startMinutes < b.endMinutes && b.startMinutes < endMinutes);
    if (hitsBreak) { skipped++; continue; }

    const startsAt = zonedDateTimeToUtc(dateStr, startMinutes, tz);
    const endsAt = zonedDateTimeToUtc(dateStr, endMinutes, tz);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        staffId: staff.id,
        status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (overlapping) { skipped++; continue; }

    const customer = customers[slot.customerIndex];
    const totalPrice = services.reduce((sum, s) => sum.plus(s.price), new Prisma.Decimal(0));
    refCounter += 1;
    const bookingReference = `DEMO-${dateStr.replace(/-/g, '')}-${String(refCounter).padStart(3, '0')}`;

    const existing = await prisma.appointment.findUnique({ where: { bookingReference } });
    if (existing) { skipped++; continue; }

    await prisma.appointment.create({
      data: {
        bookingReference,
        customerId: customer.id,
        staffId: staff.id,
        startsAt,
        endsAt,
        durationMinutes: duration,
        totalPrice,
        status: slot.status,
        source: slot.dayOffset < 0 ? 'ONLINE' : 'PHONE',
        customerNotes: 'Fiktisk demobokning.',
        cancelledAt: slot.status === 'CANCELLED' ? startsAt : null,
        cancelReason: slot.status === 'CANCELLED' ? 'Demo: avbokad av kund' : null,
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            serviceNameSv: s.nameSv,
            serviceNameEn: s.nameEn,
            durationMinutes: s.durationMinutes,
            price: s.price,
          })),
        },
      },
    });
    created++;
  }

  console.log(`[seed:demo] Demo data ready: ${customers.length} customers, ${created} appointments created, ${skipped} skipped (did not fit schedules).`);
}