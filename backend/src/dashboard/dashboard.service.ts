import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { addDaysToDateStr, localDateStr, todayLocalStr, zonedDateTimeToUtc } from '../common/utils/time.util';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async overview() {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const today = todayLocalStr(tz);
    const now = new Date();
    const todayStart = zonedDateTimeToUtc(today, 0, tz);
    const tomorrowStart = zonedDateTimeToUtc(addDaysToDateStr(today, 1), 0, tz);

    const [statusCounts, todayAppointments, upcoming, revenueAgg, upcomingCount] =
      await this.prisma.$transaction([
        this.prisma.appointment.groupBy({
          by: ['status'],
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.appointment.findMany({
          where: { startsAt: { gte: todayStart, lt: tomorrowStart } },
          include: {
            customer: { select: { fullName: true, phone: true } },
            staff: { select: { id: true, name: true } },
            services: { select: { serviceNameSv: true } },
          },
          orderBy: { startsAt: 'asc' },
        }),
        this.prisma.appointment.findMany({
          where: { startsAt: { gte: now }, status: { in: ['PENDING', 'CONFIRMED'] } },
          include: {
            customer: { select: { fullName: true, phone: true } },
            staff: { select: { id: true, name: true } },
            services: { select: { serviceNameSv: true } },
          },
          orderBy: { startsAt: 'asc' },
          take: 8,
        }),
        this.prisma.appointment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalPrice: true },
        }),
        this.prisma.appointment.count({
          where: { startsAt: { gte: now }, status: { in: ['PENDING', 'CONFIRMED'] } },
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
      const count = typeof row._count === 'object' ? (row._count._all ?? 0) : 0;
      counts[row.status] = count;
      total += count;
    }

    // Daily bookings + revenue for the last 30 local days.
    const monthStartStr = addDaysToDateStr(today, -29);
    const monthStart = zonedDateTimeToUtc(monthStartStr, 0, tz);
    const recent = await this.prisma.appointment.findMany({
      where: { startsAt: { gte: monthStart, lt: tomorrowStart } },
      select: { startsAt: true, status: true, totalPrice: true },
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
        completedTotal: revenueAgg._sum.totalPrice ?? new Prisma.Decimal(0),
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