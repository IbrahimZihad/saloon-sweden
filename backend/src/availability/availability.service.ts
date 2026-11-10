import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Prisma, Service } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  addDaysToDateStr,
  ceilToInterval,
  localDateStr,
  localTimeStr,
  todayLocalStr,
  weekdayFromDateStr,
  zonedDateTimeToUtc,
} from '../common/utils/time.util';

export interface ResolvedServices {
  services: Service[];
  durationMinutes: number;
  totalPrice: Prisma.Decimal;
}

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
}

interface StaffContext {
  id: string;
  name: string;
  workingHours: { dayOfWeek: number; startMinutes: number; endMinutes: number }[];
  breaks: { dayOfWeek: number; startMinutes: number; endMinutes: number }[];
  timeOffs: { startsAt: Date; endsAt: Date }[];
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Validates services and computes the exact appointment duration and price. */
  async resolveServices(serviceIds: string[]): Promise<ResolvedServices> {
    const uniqueIds = [...new Set(serviceIds)];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('Select at least one service');
    }
    const services = await this.prisma.service.findMany({
      where: { id: { in: uniqueIds }, active: true, category: { active: true } },
    });
    if (services.length !== uniqueIds.length) {
      throw new BadRequestException('One or more selected services are unavailable');
    }
    const durationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    if (durationMinutes > 480) {
      throw new BadRequestException('Combined service duration exceeds the maximum appointment length');
    }
    const totalPrice = services.reduce((sum, s) => sum.plus(s.price), new Prisma.Decimal(0));
    return { services, durationMinutes, totalPrice };
  }

  /** Staff qualified for ALL selected services. */
  async qualifiedStaff(serviceIds: string[], staffId?: string): Promise<StaffContext[]> {
    const uniqueIds = [...new Set(serviceIds)];
    const where: Prisma.StaffWhereInput = {
      active: true,
      services: { some: { serviceId: { in: uniqueIds } } },
      ...(staffId && staffId !== 'any' ? { id: staffId } : {}),
    };
    const candidates = await this.prisma.staff.findMany({
      where,
      include: {
        services: { select: { serviceId: true } },
        workingHours: true,
        breaks: true,
        timeOffs: true,
      },
    });
    const qualified = candidates.filter((staff) => {
      const assigned = new Set(staff.services.map((s) => s.serviceId));
      return uniqueIds.every((id) => assigned.has(id));
    });
    if (staffId && staffId !== 'any' && qualified.length === 0) {
      throw new BadRequestException('Selected staff member cannot perform all chosen services');
    }
    return qualified.map((s) => ({
      id: s.id,
      name: s.name,
      workingHours: s.workingHours,
      breaks: s.breaks,
      timeOffs: s.timeOffs,
    }));
  }

  /** Local dates within the booking window that have at least one slot. */
  async getAvailableDates(serviceIds: string[], staffId?: string): Promise<{ dates: string[] }> {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const { durationMinutes } = await this.resolveServices(serviceIds);
    const staff = await this.qualifiedStaff(serviceIds, staffId);
    if (staff.length === 0) return { dates: [] };

    const businessHours = await this.prisma.businessHours.findMany();
    const hoursByDay = new Map(businessHours.map((h) => [h.dayOfWeek, h]));
    const today = todayLocalStr(tz);
    const now = new Date();
    const earliest = new Date(now.getTime() + settings.minBookingNoticeMinutes * 60_000);

    const dates: string[] = [];
    for (let offset = 0; offset <= settings.maxAdvanceBookingDays; offset++) {
      const dateStr = addDaysToDateStr(today, offset);
      const weekday = weekdayFromDateStr(dateStr);
      const business = hoursByDay.get(weekday);
      if (!business || business.isClosed) continue;

      const dayStart = zonedDateTimeToUtc(dateStr, 0, tz);
      const dayEnd = zonedDateTimeToUtc(addDaysToDateStr(dateStr, 1), 0, tz);
      const appointments = await this.prisma.appointment.findMany({
        where: {
          staffId: { in: staff.map((s) => s.id) },
          status: { in: this.reservingStatuses(settings.pendingReservesTime) },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { staffId: true, startsAt: true, endsAt: true },
      });

      const hasSlot = staff.some((member) => {
        const hours = member.workingHours.find((h) => h.dayOfWeek === weekday);
        if (!hours) return false;
        const slots = this.computeDaySlots(
          member,
          dateStr,
          durationMinutes,
          business,
          appointments.filter((a) => a.staffId === member.id),
          settings.appointmentIntervalMinutes,
          earliest,
          tz,
        );
        return slots.length > 0;
      });
      if (hasSlot) dates.push(dateStr);
    }
    return { dates };
  }

  /** Real bookable start times for one local date. */
  async getSlots(serviceIds: string[], dateStr: string, staffId?: string): Promise<{
    date: string;
    durationMinutes: number;
    slots: TimeSlot[];
  }> {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const today = todayLocalStr(tz);
    if (dateStr < today) {
      throw new BadRequestException('Cannot book dates in the past');
    }
    if (dateStr > addDaysToDateStr(today, settings.maxAdvanceBookingDays)) {
      throw new BadRequestException('Date is beyond the maximum advance booking period');
    }

    const { durationMinutes } = await this.resolveServices(serviceIds);
    const staff = await this.qualifiedStaff(serviceIds, staffId);
    const weekday = weekdayFromDateStr(dateStr);
    const business = await this.prisma.businessHours.findUnique({ where: { dayOfWeek: weekday } });

    const dayStart = zonedDateTimeToUtc(dateStr, 0, tz);
    const dayEnd = zonedDateTimeToUtc(addDaysToDateStr(dateStr, 1), 0, tz);
    const appointments = staff.length
      ? await this.prisma.appointment.findMany({
          where: {
            staffId: { in: staff.map((s) => s.id) },
            status: { in: this.reservingStatuses(settings.pendingReservesTime) },
            startsAt: { lt: dayEnd },
            endsAt: { gt: dayStart },
          },
          select: { staffId: true, startsAt: true, endsAt: true },
        })
      : [];

    const earliest = new Date(Date.now() + settings.minBookingNoticeMinutes * 60_000);
    const slots: TimeSlot[] = [];

    if (business && !business.isClosed) {
      for (const member of staff) {
        const computed = this.computeDaySlots(
          member,
          dateStr,
          durationMinutes,
          business,
          appointments.filter((a) => a.staffId === member.id),
          settings.appointmentIntervalMinutes,
          earliest,
          tz,
        );
        for (const slot of computed) {
          slots.push({
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
            startTime: localTimeStr(slot.startsAt, tz),
            endTime: localTimeStr(slot.endsAt, tz),
            staffId: member.id,
            staffName: member.name,
          });
        }
      }
    }

    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.staffName.localeCompare(b.staffName, 'sv'));
    return { date: dateStr, durationMinutes, slots };
  }

  /**
   * Revalidates a concrete interval inside the booking transaction.
   * The caller must already hold the staff/day schedule lock.
   * `tx` is the interactive transaction client.
   */
  async assertSlotAvailable(
    tx: Prisma.TransactionClient,
    params: {
      staffId: string;
      serviceIds: string[];
      startsAt: Date;
      endsAt: Date;
      durationMinutes: number;
      excludeAppointmentId?: string;
      /** Admin/phone bookings may bypass notice and advance-window rules. */
      privileged?: boolean;
    },
  ): Promise<void> {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const { staffId, startsAt, endsAt, durationMinutes } = params;
    const now = new Date();

    if (endsAt.getTime() - startsAt.getTime() !== durationMinutes * 60_000) {
      throw new BadRequestException('Appointment interval does not match the service duration');
    }
    if (!params.privileged) {
      if (startsAt.getTime() < now.getTime() + settings.minBookingNoticeMinutes * 60_000) {
        throw new BadRequestException('The selected time is too soon. Please choose a later slot.');
      }
      const today = todayLocalStr(tz);
      if (localDateStr(startsAt, tz) > addDaysToDateStr(today, settings.maxAdvanceBookingDays)) {
        throw new BadRequestException('The selected date is beyond the booking window');
      }
    }
    if (startsAt < now) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    const dateStr = localDateStr(startsAt, tz);
    if (localDateStr(endsAt, tz) !== dateStr) {
      throw new BadRequestException('Appointments must start and end on the same day');
    }
    const weekday = weekdayFromDateStr(dateStr);

    const business = await tx.businessHours.findUnique({ where: { dayOfWeek: weekday } });
    if (!business || business.isClosed) {
      throw new BadRequestException('The salon is closed on the selected day');
    }

    const staff = await tx.staff.findUnique({
      where: { id: staffId },
      include: { workingHours: true, breaks: true, timeOffs: true, services: true },
    });
    if (!staff || !staff.active) {
      throw new BadRequestException('Staff member is not available');
    }
    const assigned = new Set(staff.services.map((s) => s.serviceId));
    if (!params.serviceIds.every((id) => assigned.has(id))) {
      throw new BadRequestException('Staff member is not qualified for all selected services');
    }

    const hours = staff.workingHours.find((h) => h.dayOfWeek === weekday);
    if (!hours) {
      throw new BadRequestException('Staff member does not work on the selected day');
    }

    const openUtc = zonedDateTimeToUtc(dateStr, Math.max(business.openMinutes, hours.startMinutes), tz);
    const closeUtc = zonedDateTimeToUtc(dateStr, Math.min(business.closeMinutes, hours.endMinutes), tz);
    if (startsAt < openUtc || endsAt > closeUtc) {
      throw new BadRequestException('The appointment does not fit within opening hours');
    }

    const startMinutes = this.minutesOfLocal(startsAt, tz);
    const endMinutes = this.minutesOfLocal(endsAt, tz);
    const hitsBreak = staff.breaks.some(
      (b) => b.dayOfWeek === weekday && startMinutes < b.endMinutes && b.startMinutes < endMinutes,
    );
    if (hitsBreak) {
      throw new BadRequestException('The selected time overlaps a staff break');
    }

    const hitsTimeOff = staff.timeOffs.some((t) => startsAt < t.endsAt && t.startsAt < endsAt);
    if (hitsTimeOff) {
      throw new BadRequestException('Staff member is on leave during the selected time');
    }

    const overlapping = await tx.appointment.findFirst({
      where: {
        staffId,
        id: params.excludeAppointmentId ? { not: params.excludeAppointmentId } : undefined,
        // COMPLETED/NO_SHOW visits also occupy their time slot — only
        // CANCELLED appointments release time.
        status: { not: 'CANCELLED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });
    if (overlapping) {
      throw new BadRequestException('The selected time has just been booked. Please choose another slot.');
    }
  }

  reservingStatuses(pendingReservesTime: boolean): AppointmentStatus[] {
    return pendingReservesTime
      ? ['PENDING', 'CONFIRMED']
      : ['CONFIRMED'];
  }

  private minutesOfLocal(instant: Date, tz: string): number {
    const dateStr = localDateStr(instant, tz);
    const midnight = zonedDateTimeToUtc(dateStr, 0, tz);
    return Math.round((instant.getTime() - midnight.getTime()) / 60_000);
  }

  private computeDaySlots(
    staff: StaffContext,
    dateStr: string,
    durationMinutes: number,
    business: { openMinutes: number; closeMinutes: number; isClosed: boolean },
    appointments: { startsAt: Date; endsAt: Date }[],
    intervalMinutes: number,
    earliest: Date,
    tz: string,
  ): { startsAt: Date; endsAt: Date }[] {
    const weekday = weekdayFromDateStr(dateStr);
    const hours = staff.workingHours.find((h) => h.dayOfWeek === weekday);
    if (!hours || business.isClosed) return [];

    const openMinutes = Math.max(business.openMinutes, hours.startMinutes);
    const closeMinutes = Math.min(business.closeMinutes, hours.endMinutes);
    if (closeMinutes - openMinutes < durationMinutes) return [];

    const breaks = staff.breaks
      .filter((b) => b.dayOfWeek === weekday)
      .map((b) => ({
        startsAt: zonedDateTimeToUtc(dateStr, b.startMinutes, tz),
        endsAt: zonedDateTimeToUtc(dateStr, b.endMinutes, tz),
      }));
    const dayStart = zonedDateTimeToUtc(dateStr, 0, tz);
    const dayEnd = zonedDateTimeToUtc(addDaysToDateStr(dateStr, 1), 0, tz);
    const timeOffs = staff.timeOffs.filter((t) => t.startsAt < dayEnd && t.endsAt > dayStart);

    const busy = [...appointments, ...breaks, ...timeOffs].sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );

    const openUtc = zonedDateTimeToUtc(dateStr, openMinutes, tz);
    const closeUtc = zonedDateTimeToUtc(dateStr, closeMinutes, tz);
    let cursor = ceilToInterval(openUtc.getTime() < earliest.getTime() ? earliest : openUtc, intervalMinutes, tz);

    const slots: { startsAt: Date; endsAt: Date }[] = [];
    while (cursor.getTime() + durationMinutes * 60_000 <= closeUtc.getTime()) {
      const candidateEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
      const conflict = busy.find((b) => cursor < b.endsAt && b.startsAt < candidateEnd);
      if (conflict) {
        // Jump past the conflicting block, aligned to the slot grid.
        cursor = ceilToInterval(conflict.endsAt, intervalMinutes, tz);
        continue;
      }
      slots.push({ startsAt: new Date(cursor), endsAt: candidateEnd });
      cursor = new Date(cursor.getTime() + intervalMinutes * 60_000);
    }
    return slots;
  }
}