import Decimal from 'decimal.js';
import { Op, col, fn } from 'sequelize';
import {
  Appointment,
  AppointmentService,
  Customer,
  Staff,
} from '../database/models';
import { SettingsService } from '../settings/settings.service';
import { addDaysToDateStr, localDateStr, todayLocalStr, zonedDateTimeToUtc } from '../common/utils/time.util';

const appointmentIncludes = [
  { model: Customer, as: 'customer', attributes: ['fullName', 'phone'] },
  { model: Staff, as: 'staff', attributes: ['id', 'name'] },
  { model: AppointmentService, as: 'services', attributes: ['serviceNameSv'] },
];

export class DashboardService {
  constructor(private readonly settings: SettingsService) {}

  async overview() {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const today = todayLocalStr(tz);
    const now = new Date();
    const todayStart = zonedDateTimeToUtc(today, 0, tz);
    const tomorrowStart = zonedDateTimeToUtc(addDaysToDateStr(today, 1), 0, tz);

    const [statusCounts, todayAppointments, upcoming, revenueRow, upcomingCount] =
      await Promise.all([
        Appointment.findAll({
          attributes: ['status', [fn('COUNT', col('id')), 'count']],
          group: ['status'],
          raw: true,
        }) as unknown as Promise<Array<{ status: string; count: string | number }>>,
        Appointment.findAll({
          where: { startsAt: { [Op.gte]: todayStart, [Op.lt]: tomorrowStart } },
          include: appointmentIncludes,
          order: [['startsAt', 'ASC']],
        }),
        Appointment.findAll({
          where: { startsAt: { [Op.gte]: now }, status: { [Op.in]: ['PENDING', 'CONFIRMED'] } },
          include: appointmentIncludes,
          order: [['startsAt', 'ASC']],
          limit: 8,
        }),
        Appointment.findOne({
          attributes: [[fn('SUM', col('totalPrice')), 'total']],
          where: { status: 'COMPLETED' },
          raw: true,
        }) as unknown as Promise<{ total: string | number | null } | null>,
        Appointment.count({
          where: { startsAt: { [Op.gte]: now }, status: { [Op.in]: ['PENDING', 'CONFIRMED'] } },
        }),
      ]);

    const counts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };
    let total = 0;
    for (const row of statusCounts) {
      const count = Number(row.count);
      counts[row.status] = count;
      total += count;
    }

    // Daily bookings + revenue for the last 30 local days.
    const monthStartStr = addDaysToDateStr(today, -29);
    const monthStart = zonedDateTimeToUtc(monthStartStr, 0, tz);
    const recent = await Appointment.findAll({
      where: { startsAt: { [Op.gte]: monthStart, [Op.lt]: tomorrowStart } },
      attributes: ['startsAt', 'status', 'totalPrice'],
    });

    const dailyMap = new Map<string, { bookings: number; revenue: number; cancelled: number }>();
    for (let i = 0; i < 30; i++) {
      dailyMap.set(addDaysToDateStr(monthStartStr, i), { bookings: 0, revenue: 0, cancelled: 0 });
    }
    let weeklyBookings = 0;
    let monthlyBookings = 0;
    const weekStartStr = addDaysToDateStr(today, -6);
    for (const appointment of recent) {
      const dateStr = localDateStr(appointment.startsAt, tz);
      const entry = dailyMap.get(dateStr);
      if (!entry) continue;
      if (appointment.status === 'CANCELLED') {
        entry.cancelled += 1;
        continue;
      }
      entry.bookings += 1;
      if (appointment.status === 'COMPLETED') {
        entry.revenue += Number(appointment.totalPrice);
      }
      monthlyBookings += 1;
      if (dateStr >= weekStartStr) weeklyBookings += 1;
    }

    const completedTotal = new Decimal(revenueRow?.total ?? 0).toFixed(2);

    return {
      today: {
        date: today,
        total: todayAppointments.length,
        appointments: todayAppointments,
      },
      totals: {
        all: total,
        ...counts,
        upcoming: upcomingCount,
      },
      revenue: {
        completedTotal,
        currency: settings.currency,
      },
      statistics: {
        weeklyBookings,
        monthlyBookings,
        daily: [...dailyMap.entries()].map(([date, value]) => ({ date, ...value })),
      },
      upcoming,
    };
  }
}
