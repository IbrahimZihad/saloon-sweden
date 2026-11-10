import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateBookingReference } from '../common/utils/booking-reference.util';
import {
  addDaysToDateStr,
  localDateStr,
  zonedDateTimeToUtc,
} from '../common/utils/time.util';
import { paginated, skipTake } from '../common/dto/pagination.dto';
import {
  AppointmentFilterDto,
  BookAppointmentDto,
  CreateAdminAppointmentDto,
  RescheduleAppointmentDto,
  UpdateStatusDto,
} from './dto/appointment.dto';

const appointmentInclude = {
  customer: true,
  staff: { select: { id: true, name: true, jobTitle: true, imageUrl: true } },
  services: true,
} satisfies Prisma.AppointmentInclude;

function cleanText(value?: string): string | undefined {
  if (value === undefined) return undefined;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

interface BookParams {
  serviceIds: string[];
  staffId?: string;
  startsAt: Date;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  internalNotes?: string;
  source: 'ONLINE' | 'PHONE' | 'ADMIN';
  status: AppointmentStatus;
  privileged: boolean;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  // -------------------------------------------------------------------------
  // Public booking
  // -------------------------------------------------------------------------

  async bookPublic(dto: BookAppointmentDto) {
    const appointment = await this.book({
      serviceIds: dto.serviceIds,
      staffId: dto.staffId,
      startsAt: new Date(dto.startsAt),
      fullName: cleanText(dto.fullName) ?? dto.fullName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      notes: cleanText(dto.notes),
      source: 'ONLINE',
      status: 'CONFIRMED',
      privileged: false,
    });
    void this.notifications.queueForAppointment(appointment.id, 'BOOKING_CONFIRMATION');
    return this.findOne(appointment.id);
  }

  async findByReference(reference: string, email?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { bookingReference: reference.toUpperCase() },
      include: appointmentInclude,
    });
    if (!appointment) throw new NotFoundException('Booking not found');
    if (email && appointment.customer.email.toLowerCase() !== email.toLowerCase()) {
      throw new NotFoundException('Booking not found');
    }
    return appointment;
  }

  // -------------------------------------------------------------------------
  // Admin operations
  // -------------------------------------------------------------------------

  async createAdmin(dto: CreateAdminAppointmentDto) {
    const appointment = await this.book({
      serviceIds: dto.serviceIds,
      staffId: dto.staffId,
      startsAt: new Date(dto.startsAt),
      fullName: cleanText(dto.fullName) ?? dto.fullName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      notes: cleanText(dto.notes),
      internalNotes: cleanText(dto.internalNotes),
      source: dto.source ?? 'PHONE',
      status: dto.status ?? 'CONFIRMED',
      privileged: true,
    });
    void this.notifications.queueForAppointment(appointment.id, 'BOOKING_CONFIRMATION');
    return this.findOne(appointment.id);
  }

  async findAll(query: AppointmentFilterDto) {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 200);

    const where: Prisma.AppointmentWhereInput = {};
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { bookingReference: { contains: search } },
        { customer: { fullName: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { customer: { email: { contains: search } } },
      ];
    }
    if (query.staffId) where.staffId = query.staffId;
    if (query.status) where.status = query.status;
    if (query.serviceId) where.services = { some: { serviceId: query.serviceId } };
    if (query.date) {
      where.startsAt = {
        gte: zonedDateTimeToUtc(query.date, 0, tz),
        lt: zonedDateTimeToUtc(addDaysToDateStr(query.date, 1), 0, tz),
      };
    } else if (query.from || query.to) {
      where.startsAt = {
        ...(query.from ? { gte: zonedDateTimeToUtc(query.from, 0, tz) } : {}),
        ...(query.to ? { lt: zonedDateTimeToUtc(addDaysToDateStr(query.to, 1), 0, tz) } : {}),
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { startsAt: 'desc' },
        ...skipTake(page, limit),
      }),
    ]);
    return paginated(data, total, page, limit);
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        ...appointmentInclude,
        notifications: {
          select: { id: true, type: true, status: true, sentAt: true, attempts: true, lastError: true },
        },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const existing = await this.findOne(id);
    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED' || existing.status === 'NO_SHOW') {
      throw new BadRequestException('Only pending or confirmed appointments can be rescheduled');
    }

    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + existing.durationMinutes * 60_000);
    const staffId = dto.staffId ?? existing.staffId;
    const serviceIds = existing.services
      .map((s) => s.serviceId)
      .filter((sid): sid is string => sid !== null);

    const dateStr = localDateStr(startsAt, tz);
    await this.prisma.$transaction(
      async (tx) => {
        await this.lockStaffDay(tx, staffId, dateStr);
        if (staffId !== existing.staffId) {
          await this.lockStaffDay(tx, existing.staffId, localDateStr(existing.startsAt, tz));
        }
        await this.availability.assertSlotAvailable(tx, {
          staffId,
          serviceIds,
          startsAt,
          endsAt,
          durationMinutes: existing.durationMinutes,
          excludeAppointmentId: id,
          privileged: true,
        });
        await tx.appointment.update({
          where: { id },
          data: { staffId, startsAt, endsAt },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
    );

    // Reset any previous reschedule notification so the customer gets the new time.
    await this.prisma.emailNotification.deleteMany({
      where: { appointmentId: id, type: 'RESCHEDULE', status: { not: 'PENDING' } },
    });
    void this.notifications.queueForAppointment(id, 'RESCHEDULE');
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const appointment = await this.findOne(id);
    const next = dto.status;
    const current = appointment.status;

    const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };
    if (current === next) return appointment;
    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Cannot change status from ${current} to ${next}`);
    }

    const data: Prisma.AppointmentUpdateInput = { status: next };
    if (next === 'CANCELLED') {
      data.cancelledAt = new Date();
      data.cancelReason = cleanText(dto.reason);
    }
    await this.prisma.appointment.update({ where: { id }, data });

    if (next === 'CONFIRMED') {
      void this.notifications.queueForAppointment(id, 'APPOINTMENT_CONFIRMATION');
    }
    if (next === 'CANCELLED') {
      void this.notifications.queueForAppointment(id, 'CANCELLATION');
    }
    return this.findOne(id);
  }

  async cancel(id: string, reason?: string) {
    return this.updateStatus(id, { status: 'CANCELLED', reason });
  }

  // -------------------------------------------------------------------------
  // Core transactional booking
  // -------------------------------------------------------------------------

  private async book(params: BookParams) {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const resolved = await this.availability.resolveServices(params.serviceIds);
    const serviceIds = resolved.services.map((s) => s.id);

    let candidates = await this.availability.qualifiedStaff(serviceIds, params.staffId);
    if (candidates.length === 0) {
      throw new BadRequestException('No staff member is available for the selected services');
    }
    const dateStr = localDateStr(params.startsAt, tz);
    if (params.staffId && params.staffId !== 'any') {
      candidates = candidates.filter((c) => c.id === params.staffId);
    } else {
      // Prefer the least-loaded qualified stylist for the requested day.
      const dayStart = zonedDateTimeToUtc(dateStr, 0, tz);
      const dayEnd = zonedDateTimeToUtc(addDaysToDateStr(dateStr, 1), 0, tz);
      const loads = await this.prisma.appointment.groupBy({
        by: ['staffId'],
        where: {
          staffId: { in: candidates.map((c) => c.id) },
          status: { not: 'CANCELLED' },
          startsAt: { gte: dayStart, lt: dayEnd },
        },
        _count: { _all: true },
        orderBy: { staffId: 'asc' },
      });
      const loadMap = new Map(
        loads.map((l) => [l.staffId, typeof l._count === 'object' ? (l._count._all ?? 0) : 0]),
      );
      candidates = [...candidates].sort(
        (a, b) => (loadMap.get(a.id) ?? 0) - (loadMap.get(b.id) ?? 0) || a.name.localeCompare(b.name, 'sv'),
      );
    }

    const endsAt = new Date(params.startsAt.getTime() + resolved.durationMinutes * 60_000);
    let lastError: Error | null = null;

    for (const candidate of candidates) {
      try {
        const appointment = await this.prisma.$transaction(
          async (tx) => {
            // Serialize all bookings for this staff member + day. The row lock
            // makes the overlap revalidation below race-free under concurrency.
            await this.lockStaffDay(tx, candidate.id, dateStr);

            await this.availability.assertSlotAvailable(tx, {
              staffId: candidate.id,
              serviceIds,
              startsAt: params.startsAt,
              endsAt,
              durationMinutes: resolved.durationMinutes,
              privileged: params.privileged,
            });

            const customer = await tx.customer.upsert({
              where: { email: params.email },
              update: { fullName: params.fullName, phone: params.phone },
              create: {
                fullName: params.fullName,
                email: params.email,
                phone: params.phone,
              },
            });

            let created = null;
            for (let attempt = 0; attempt < 5 && !created; attempt++) {
              try {
                created = await tx.appointment.create({
                  data: {
                    bookingReference: generateBookingReference(),
                    customerId: customer.id,
                    staffId: candidate.id,
                    startsAt: params.startsAt,
                    endsAt,
                    durationMinutes: resolved.durationMinutes,
                    totalPrice: resolved.totalPrice,
                    status: params.status,
                    source: params.source,
                    customerNotes: params.notes,
                    internalNotes: params.internalNotes,
                    services: {
                      create: resolved.services.map((service) => ({
                        serviceId: service.id,
                        serviceNameSv: service.nameSv,
                        serviceNameEn: service.nameEn,
                        durationMinutes: service.durationMinutes,
                        price: service.price,
                      })),
                    },
                  },
                });
              } catch (error) {
                if (
                  error instanceof Prisma.PrismaClientKnownRequestError &&
                  error.code === 'P2002'
                ) {
                  continue; // booking reference collision — regenerate
                }
                throw error;
              }
            }
            if (!created) {
              throw new ConflictException('Could not generate a unique booking reference, please retry');
            }
            return created;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
        );
        return appointment;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002')
        ) {
          lastError = new ConflictException('The selected time was just booked. Please choose another slot.');
          continue;
        }
        if (error instanceof BadRequestException) {
          lastError = error;
          // With "any staff", try the next qualified stylist; otherwise stop.
          if (params.staffId && params.staffId !== 'any') throw error;
          continue;
        }
        throw error;
      }
    }

    this.logger.warn(`Booking failed for all candidates at ${params.startsAt.toISOString()}`);
    throw lastError ?? new ConflictException('The selected time is no longer available');
  }

  /**
   * Acquires a row-level lock for (staff, local date). The upsert creates the
   * lock row if missing; the subsequent SELECT ... FOR UPDATE blocks
   * concurrent transactions until this one commits.
   */
  private async lockStaffDay(
    tx: Prisma.TransactionClient,
    staffId: string,
    dateStr: string,
  ): Promise<void> {
    await tx.staffScheduleLock.upsert({
      where: { staffId_lockDate: { staffId, lockDate: dateStr } },
      update: {},
      create: { staffId, lockDate: dateStr },
    });
    await tx.$queryRaw`SELECT id FROM StaffScheduleLock WHERE staffId = ${staffId} AND lockDate = ${dateStr} FOR UPDATE`;
  }
}