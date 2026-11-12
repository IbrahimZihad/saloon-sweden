import Decimal from 'decimal.js';
import { Op } from 'sequelize';
import {
  addDaysToDateStr,
  todayLocalStr,
  weekdayFromDateStr,
  zonedDateTimeToUtc,
} from '../../common/utils/time.util';
import { AppointmentStatus } from '../enums';
import {
  Appointment,
  AppointmentService,
  BusinessSettings,
  Customer,
  Service,
  Staff,
  StaffBreak,
  StaffService,
  StaffWorkingHours,
} from '../models';

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
  { dayOffset: 1, startMinutes: 600, staffSlug: 'anna', serviceSlugs: ['womens-haircut'], status: AppointmentStatus.CONFIRMED, customerIndex: 0 },
  { dayOffset: 1, startMinutes: 840, staffSlug: 'emma', serviceSlugs: ['root-coloring'], status: AppointmentStatus.CONFIRMED, customerIndex: 1 },
  { dayOffset: 2, startMinutes: 660, staffSlug: 'sofia', serviceSlugs: ['mens-haircut', 'wash-blow-dry'], status: AppointmentStatus.CONFIRMED, customerIndex: 2 },
  { dayOffset: 3, startMinutes: 600, staffSlug: 'emma', serviceSlugs: ['highlights'], status: AppointmentStatus.PENDING, customerIndex: 3 },
  { dayOffset: 5, startMinutes: 630, staffSlug: 'anna', serviceSlugs: ['hair-styling'], status: AppointmentStatus.CONFIRMED, customerIndex: 4 },
  { dayOffset: -2, startMinutes: 600, staffSlug: 'anna', serviceSlugs: ['womens-haircut'], status: AppointmentStatus.COMPLETED, customerIndex: 0 },
  { dayOffset: -3, startMinutes: 840, staffSlug: 'emma', serviceSlugs: ['full-hair-coloring'], status: AppointmentStatus.COMPLETED, customerIndex: 1 },
  { dayOffset: -5, startMinutes: 660, staffSlug: 'sofia', serviceSlugs: ['mens-haircut'], status: AppointmentStatus.COMPLETED, customerIndex: 2 },
  { dayOffset: -7, startMinutes: 600, staffSlug: 'sofia', serviceSlugs: ['wash-blow-dry'], status: AppointmentStatus.NO_SHOW, customerIndex: 3 },
  { dayOffset: -4, startMinutes: 900, staffSlug: 'anna', serviceSlugs: ['deep-conditioning'], status: AppointmentStatus.CANCELLED, customerIndex: 4 },
];

/**
 * Optional demo data (SEED_DEMO=true). Never part of the production seed.
 * Slots are validated against staff working hours, breaks and existing
 * appointments; anything that does not fit is skipped rather than forced.
 */
export async function seedDemoData(): Promise<void> {
  const settings = await BusinessSettings.findByPk('singleton');
  const tz = settings?.timezone ?? 'Europe/Stockholm';
  const today = todayLocalStr(tz);

  const customers: Customer[] = [];
  for (const data of DEMO_CUSTOMERS) {
    const [customer] = await Customer.findOrCreate({
      where: { email: data.email },
      defaults: data,
    });
    customers.push(customer);
  }

  let created = 0;
  let skipped = 0;
  let refCounter = 0;

  for (const slot of DEMO_APPOINTMENTS) {
    const dateStr = addDaysToDateStr(today, slot.dayOffset);
    const weekday = weekdayFromDateStr(dateStr);

    const staff = await Staff.findOne({
      where: { slug: slot.staffSlug },
      include: [
        {
          model: StaffService,
          as: 'services',
          include: [{ model: Service, as: 'service' }],
        },
      ],
    });
    if (!staff || !staff.active) { skipped++; continue; }

    const hours = await StaffWorkingHours.findOne({
      where: { staffId: staff.id, dayOfWeek: weekday },
    });
    if (!hours) { skipped++; continue; }

    const serviceRows = staff.services ?? [];
    const services = slot.serviceSlugs
      .map((slug) => serviceRows.find((row) => row.service?.slug === slug)?.service)
      .filter((service): service is Service => Boolean(service && service.active));
    if (services.length !== slot.serviceSlugs.length) { skipped++; continue; }

    const duration = services.reduce((sum, service) => sum + service.durationMinutes, 0);
    const startMinutes = slot.startMinutes;
    const endMinutes = startMinutes + duration;
    if (startMinutes < hours.startMinutes || endMinutes > hours.endMinutes) { skipped++; continue; }

    const breaks = await StaffBreak.findAll({
      where: { staffId: staff.id, dayOfWeek: weekday },
    });
    const hitsBreak = breaks.some(
      (item) => startMinutes < item.endMinutes && item.startMinutes < endMinutes,
    );
    if (hitsBreak) { skipped++; continue; }

    const startsAt = zonedDateTimeToUtc(dateStr, startMinutes, tz);
    const endsAt = zonedDateTimeToUtc(dateStr, endMinutes, tz);

    const overlapping = await Appointment.findOne({
      where: {
        staffId: staff.id,
        status: {
          [Op.in]: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
          ],
        },
        startsAt: { [Op.lt]: endsAt },
        endsAt: { [Op.gt]: startsAt },
      },
    });
    if (overlapping) { skipped++; continue; }

    const customer = customers[slot.customerIndex];
    const totalPrice = services.reduce(
      (sum, service) => sum.plus(new Decimal(service.price)),
      new Decimal(0),
    );
    refCounter += 1;
    const bookingReference = `DEMO-${dateStr.replace(/-/g, '')}-${String(refCounter).padStart(3, '0')}`;

    const existing = await Appointment.findOne({ where: { bookingReference } });
    if (existing) { skipped++; continue; }

    const appointment = await Appointment.create({
      bookingReference,
      customerId: customer.id,
      staffId: staff.id,
      startsAt,
      endsAt,
      durationMinutes: duration,
      totalPrice: totalPrice.toFixed(2),
      status: slot.status,
      source: slot.dayOffset < 0 ? 'ONLINE' : 'PHONE',
      customerNotes: 'Fiktisk demobokning.',
      cancelledAt: slot.status === AppointmentStatus.CANCELLED ? startsAt : null,
      cancelReason: slot.status === AppointmentStatus.CANCELLED ? 'Demo: avbokad av kund' : null,
    });

    await AppointmentService.bulkCreate(
      services.map((service) => ({
        appointmentId: appointment.id,
        serviceId: service.id,
        serviceNameSv: service.nameSv,
        serviceNameEn: service.nameEn,
        durationMinutes: service.durationMinutes,
        price: service.price,
      })),
    );
    created++;
  }

  console.log(`[seed:demo] Demo data ready: ${customers.length} customers, ${created} appointments created, ${skipped} skipped (did not fit schedules).`);
}
