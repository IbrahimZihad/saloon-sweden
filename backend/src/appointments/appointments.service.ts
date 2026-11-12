import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { Op, QueryTypes, Transaction, UniqueConstraintError, col, fn } from 'sequelize';
import { DatabaseService } from '../database/database.service';
import { AppointmentStatus } from '../database/enums';
import {
  Appointment,
  AppointmentService,
  Customer,
  EmailNotification,
  Staff,
  StaffScheduleLock,
} from '../database/models';
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

const appointmentIncludes = [
  { model: Customer, as: 'customer' },
  { model: Staff, as: 'staff', attributes: ['id', 'name', 'jobTitle', 'imageUrl'] },
  { model: AppointmentService, as: 'services' },
];

function cleanText(value?: string): string | undefined {
  if (value === undefined) return undefined;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function isRetryableTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const original = (error as { original?: { code?: string; errno?: number } }).original;
  return (
    original?.code === 'ER_LOCK_DEADLOCK' ||
    original?.errno === 1213 ||
    error.name === 'SequelizeTimeoutError'
  );
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
    private readonly database: DatabaseService,
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
      status: AppointmentStatus.CONFIRMED,
      privileged: false,
    });
    void this.notifications.queueForAppointment(
      appointment.id,
      'BOOKING_CONFIRMATION',
    );
    return this.findOne(appointment.id);
  }

  async findByReference(reference: string, email?: string) {
    const appointment = await Appointment.findOne({
      where: { bookingReference: reference.toUpperCase() },
      include: appointmentIncludes,
    });
    if (!appointment) throw new NotFoundException('Booking not found');
    if (email && appointment.customer?.email.toLowerCase() !== email.toLowerCase()) {
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
      status: dto.status ?? AppointmentStatus.CONFIRMED,
      privileged: true,
    });
    void this.notifications.queueForAppointment(
      appointment.id,
      'BOOKING_CONFIRMATION',
    );
    return this.findOne(appointment.id);
  }

  async findAll(query: AppointmentFilterDto) {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 200);

    const where: Record<string | symbol, unknown> = {};
    if (query.search) {
      const search = query.search.trim();
      const customers = (await Customer.findAll({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
        raw: true,
      })) as unknown as Array<{ id: string }>;

      where[Op.or] = [
        { bookingReference: { [Op.like]: `%${search}%` } },
        ...(customers.length ? [{ customerId: { [Op.in]: customers.map((c) => c.id) } }] : []),
      ];
    }
    if (query.staffId) where.staffId = query.staffId;
    if (query.status) where.status = query.status;
    if (query.serviceId) {
      const matches = (await AppointmentService.findAll({
        where: { serviceId: query.serviceId },
        attributes: ['appointmentId'],
        raw: true,
      })) as unknown as Array<{ appointmentId: string }>;
      where.id = { [Op.in]: matches.map((match) => match.appointmentId) };
    }
    if (query.date) {
      where.startsAt = {
        [Op.gte]: zonedDateTimeToUtc(query.date, 0, tz),
        [Op.lt]: zonedDateTimeToUtc(addDaysToDateStr(query.date, 1), 0, tz),
      };
    } else if (query.from || query.to) {
      where.startsAt = {
        ...(query.from ? { [Op.gte]: zonedDateTimeToUtc(query.from, 0, tz) } : {}),
        ...(query.to ? { [Op.lt]: zonedDateTimeToUtc(addDaysToDateStr(query.to, 1), 0, tz) } : {}),
      };
    }

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: appointmentIncludes,
      order: [['startsAt', 'DESC']],
      ...skipTake(page, limit),
      distinct: true,
    });
    return paginated(rows, count, page, limit);
  }

  async findOne(id: string) {
    const appointment = await Appointment.findByPk(id, {
      include: [
        ...appointmentIncludes,
        {
          model: EmailNotification,
          as: 'notifications',
          attributes: ['id', 'type', 'status', 'sentAt', 'attempts', 'lastError'],
        },
      ],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const existing = await this.findOne(id);
    if (
      existing.status === AppointmentStatus.CANCELLED ||
      existing.status === AppointmentStatus.COMPLETED ||
      existing.status === AppointmentStatus.NO_SHOW
    ) {
      throw new BadRequestException('Only pending or confirmed appointments can be rescheduled');
    }

    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + existing.durationMinutes * 60_000);
    const staffId = dto.staffId ?? existing.staffId;
    const serviceIds = (existing.services ?? [])
      .map((service) => service.serviceId)
      .filter((serviceId): serviceId is string => serviceId !== null);

    const dateStr = localDateStr(startsAt, tz);
    await this.database.transaction(async (transaction) => {
      await this.lockStaffDay(transaction, staffId, dateStr);
      if (staffId !== existing.staffId) {
        await this.lockStaffDay(
          transaction,
          existing.staffId,
          localDateStr(existing.startsAt, tz),
        );
      }
      await this.availability.assertSlotAvailable(transaction, {
        staffId,
        serviceIds,
        startsAt,
        endsAt,
        durationMinutes: existing.durationMinutes,
        excludeAppointmentId: id,
        privileged: true,
      });
      await existing.update({ staffId, startsAt, endsAt }, { transaction });
    });

    // Reset any previous reschedule notification so the customer gets the new time.
    await EmailNotification.destroy({
      where: { appointmentId: id, type: 'RESCHEDULE', status: { [Op.ne]: 'PENDING' } },
    });
    void this.notifications.queueForAppointment(id, 'RESCHEDULE');
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const appointment = await this.findOne(id);
    const next = dto.status;
    const current = appointment.status;

    const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };
    if (current === next) return appointment;
    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`Cannot change status from ${current} to ${next}`);
    }

    await appointment.update({
      status: next,
      ...(next === AppointmentStatus.CANCELLED
        ? { cancelledAt: new Date(), cancelReason: cleanText(dto.reason) ?? null }
        : {}),
    });

    if (next === AppointmentStatus.CONFIRMED) {
      void this.notifications.queueForAppointment(id, 'APPOINTMENT_CONFIRMATION');
    }
    if (next === AppointmentStatus.CANCELLED) {
      void this.notifications.queueForAppointment(id, 'CANCELLATION');
    }
    return this.findOne(id);
  }

  async cancel(id: string, reason?: string) {
    return this.updateStatus(id, { status: AppointmentStatus.CANCELLED, reason });
  }

  // -------------------------------------------------------------------------
  // Core transactional booking
  // -------------------------------------------------------------------------

  private async book(params: BookParams) {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const resolved = await this.availability.resolveServices(params.serviceIds);
    const serviceIds = resolved.services.map((service) => service.id);

    let candidates = await this.availability.qualifiedStaff(serviceIds, params.staffId);
    if (candidates.length === 0) {
      throw new BadRequestException('No staff member is available for the selected services');
    }
    const dateStr = localDateStr(params.startsAt, tz);
    if (params.staffId && params.staffId !== 'any') {
      candidates = candidates.filter((candidate) => candidate.id === params.staffId);
    } else {
      // Prefer the least-loaded qualified stylist for the requested day.
      const dayStart = zonedDateTimeToUtc(dateStr, 0, tz);
      const dayEnd = zonedDateTimeToUtc(addDaysToDateStr(dateStr, 1), 0, tz);
      const loads = (await Appointment.findAll({
        attributes: ['staffId', [fn('COUNT', col('id')), 'count']],
        where: {
          staffId: { [Op.in]: candidates.map((candidate) => candidate.id) },
          status: { [Op.ne]: AppointmentStatus.CANCELLED },
          startsAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd },
        },
        group: ['staffId'],
        raw: true,
      })) as unknown as Array<{ staffId: string; count: string | number }>;
      const loadMap = new Map(
        loads.map((load) => [load.staffId, Number(load.count)]),
      );
      candidates = [...candidates].sort(
        (a, b) =>
          (loadMap.get(a.id) ?? 0) - (loadMap.get(b.id) ?? 0) ||
          a.name.localeCompare(b.name, 'sv'),
      );
    }

    const endsAt = new Date(params.startsAt.getTime() + resolved.durationMinutes * 60_000);
    let lastError: Error | null = null;

    for (const candidate of candidates) {
      try {
        const appointment = await this.database.transaction(async (transaction) => {
          // Serialize all bookings for this staff member + day. The row lock
          // makes the overlap revalidation below race-free under concurrency.
          await this.lockStaffDay(transaction, candidate.id, dateStr);

          await this.availability.assertSlotAvailable(transaction, {
            staffId: candidate.id,
            serviceIds,
            startsAt: params.startsAt,
            endsAt,
            durationMinutes: resolved.durationMinutes,
            privileged: params.privileged,
          });

          const customer = await this.upsertCustomer(transaction, params);

          let created: Appointment | null = null;
          for (let attempt = 0; attempt < 5 && !created; attempt++) {
            try {
              created = await Appointment.create(
                {
                  bookingReference: generateBookingReference(),
                  customerId: customer.id,
                  staffId: candidate.id,
                  startsAt: params.startsAt,
                  endsAt,
                  durationMinutes: resolved.durationMinutes,
                  totalPrice: resolved.totalPrice.toFixed(2),
                  status: params.status,
                  source: params.source,
                  customerNotes: params.notes ?? null,
                  internalNotes: params.internalNotes ?? null,
                },
                { transaction },
              );
            } catch (error) {
              if (error instanceof UniqueConstraintError) {
                continue; // booking reference collision — regenerate
              }
              throw error;
            }
          }
          if (!created) {
            throw new ConflictException('Could not generate a unique booking reference, please retry');
          }

          await AppointmentService.bulkCreate(
            resolved.services.map((service) => ({
              appointmentId: created!.id,
              serviceId: service.id,
              serviceNameSv: service.nameSv,
              serviceNameEn: service.nameEn,
              durationMinutes: service.durationMinutes,
              price: service.price,
            })),
            { transaction },
          );

          return created;
        });
        return appointment;
      } catch (error) {
        if (error instanceof UniqueConstraintError || isRetryableTransactionError(error)) {
          lastError = new ConflictException(
            'The selected time was just booked. Please choose another slot.',
          );
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
   * Acquires a row-level lock for (staff, local date). The find-or-create
   * creates the lock row if missing; the subsequent SELECT ... FOR UPDATE
   * blocks concurrent transactions until this one commits.
   */
  private async lockStaffDay(
    transaction: Transaction,
    staffId: string,
    dateStr: string,
  ): Promise<void> {
    await StaffScheduleLock.findOrCreate({
      where: { staffId, lockDate: dateStr },
      defaults: { staffId, lockDate: dateStr },
      transaction,
    });
    await this.database.query(
      'SELECT id FROM StaffScheduleLock WHERE staffId = ? AND lockDate = ? FOR UPDATE',
      { replacements: [staffId, dateStr], transaction, type: QueryTypes.SELECT },
    );
  }

  private async upsertCustomer(transaction: Transaction, params: BookParams): Promise<Customer> {
    const [customer, created] = await Customer.findOrCreate({
      where: { email: params.email },
      defaults: {
        fullName: params.fullName,
        email: params.email,
        phone: params.phone,
      },
      transaction,
    });
    if (!created) {
      await customer.update(
        { fullName: params.fullName, phone: params.phone },
        { transaction },
      );
    }
    return customer;
  }
}
