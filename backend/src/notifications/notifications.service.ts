import { Logger } from '../common/http-exceptions';
import Decimal from 'decimal.js';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { Op } from 'sequelize';
import { NotificationStatus, NotificationType } from '../database/enums';
import {
  Appointment,
  AppointmentService,
  Customer,
  EmailNotification,
  Staff,
} from '../database/models';
import { SettingsService } from '../settings/settings.service';
import { addDaysToDateStr, todayLocalStr, zonedDateTimeToUtc } from '../common/utils/time.util';
import { MailService } from './mail.service';
import {
  AppointmentEmailData,
  appointmentConfirmedEmail,
  bookingConfirmationEmail,
  cancellationEmail,
  reminderEmail,
  rescheduleEmail,
} from './templates/appointment-emails';

const MAX_ATTEMPTS = 3;

interface AppointmentWithRelations {
  bookingReference: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  totalPrice: string;
  customer: { fullName: string; email: string };
  staff: { name: string };
  services: { serviceNameSv: string; durationMinutes: number; price: string }[];
}

const appointmentIncludes = [
  { model: Customer, as: 'customer', attributes: ['fullName', 'email'] },
  { model: Staff, as: 'staff', attributes: ['name'] },
  { model: AppointmentService, as: 'services' },
];

export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  async queueForAppointment(
    appointmentId: string,
    type: NotificationType,
  ): Promise<void> {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: appointmentIncludes,
    });
    if (!appointment) return;

    const settings = await this.settings.getSettings();
    const data = this.buildEmailData(
      appointment.get({ plain: true }) as AppointmentWithRelations,
      settings.salonName,
      settings.timezone,
      settings.currency,
      settings.phone,
      settings.address,
    );
    const template = this.templateFor(type, data);

    const status: NotificationStatus = this.mail.isConfigured()
      ? NotificationStatus.PENDING
      : NotificationStatus.SKIPPED;
    try {
      const [notification] = await EmailNotification.findOrCreate({
        where: { appointmentId, type },
        defaults: {
          appointmentId,
          type,
          status,
          toEmail: appointment.customer?.email ?? '',
          subject: template.subject,
          htmlBody: template.html,
        },
      });
      if (notification.status === NotificationStatus.PENDING) {
        // Fire-and-forget: a mail outage must never fail the booking itself.
        void this.attemptSend(notification.id);
      }
    } catch (error) {
      this.logger.error(`Failed to queue ${type} for appointment ${appointmentId}`, error as Error);
    }
  }

  async attemptSend(notificationId: string): Promise<void> {
    const notification = await EmailNotification.findByPk(notificationId);
    if (!notification || notification.status !== NotificationStatus.PENDING) return;
    if (!this.mail.isConfigured()) {
      await notification.update({ status: NotificationStatus.SKIPPED });
      return;
    }

    try {
      await this.mail.sendMail(notification.toEmail, notification.subject, notification.htmlBody);
      await notification.update({
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        attempts: notification.attempts + 1,
        lastError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = notification.attempts + 1;
      await notification.update({
        attempts,
        lastError: message.slice(0, 2000),
        status:
          attempts >= MAX_ATTEMPTS ? NotificationStatus.FAILED : NotificationStatus.PENDING,
      });
      this.logger.warn(`Email ${notificationId} attempt ${attempts} failed: ${message}`);
    }
  }

  /** Retries pending notifications that failed transiently. */
  async retryPending(): Promise<void> {
    const pending = await EmailNotification.findAll({
      where: { status: NotificationStatus.PENDING, attempts: { [Op.lt]: MAX_ATTEMPTS } },
      order: [['createdAt', 'ASC']],
      limit: 20,
    });
    for (const notification of pending) {
      await this.attemptSend(notification.id);
    }
  }

  /** Daily reminders for tomorrow's confirmed appointments. */
  async sendDailyReminders(): Promise<void> {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const tomorrowStr = addDaysToDateStr(todayLocalStr(tz), 1);
    const dayAfterStr = addDaysToDateStr(tomorrowStr, 1);
    const startUtc = zonedDateTimeToUtc(tomorrowStr, 0, tz);
    const endUtc = zonedDateTimeToUtc(dayAfterStr, 0, tz);

    const appointments = await Appointment.findAll({
      where: {
        status: { [Op.in]: ['CONFIRMED', 'PENDING'] },
        startsAt: { [Op.gte]: startUtc, [Op.lt]: endUtc },
      },
      attributes: ['id'],
    });
    const ids = appointments.map((appointment) => appointment.id);
    const existing = ids.length
      ? ((await EmailNotification.findAll({
          where: { type: NotificationType.REMINDER, appointmentId: { [Op.in]: ids } },
          attributes: ['appointmentId'],
          raw: true,
        })) as unknown as Array<{ appointmentId: string | null }>)
      : [];
    const reminded = new Set(existing.map((notification) => notification.appointmentId));

    for (const appointment of appointments) {
      if (!reminded.has(appointment.id)) {
        await this.queueForAppointment(appointment.id, NotificationType.REMINDER);
      }
    }
  }

  private templateFor(
    type: NotificationType,
    data: AppointmentEmailData,
  ): { subject: string; html: string } {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMATION:
        return bookingConfirmationEmail(data);
      case NotificationType.APPOINTMENT_CONFIRMATION:
        return appointmentConfirmedEmail(data);
      case NotificationType.CANCELLATION:
        return cancellationEmail(data);
      case NotificationType.RESCHEDULE:
        return rescheduleEmail(data);
      case NotificationType.REMINDER:
        return reminderEmail(data);
    }
  }

  private buildEmailData(
    appointment: AppointmentWithRelations,
    salonName: string,
    tz: string,
    currency: string,
    phone?: string | null,
    address?: string | null,
  ): AppointmentEmailData {
    const start = toZonedTime(appointment.startsAt, tz);
    const end = toZonedTime(appointment.endsAt, tz);
    return {
      salonName,
      customerName: appointment.customer.fullName,
      bookingReference: appointment.bookingReference,
      services: appointment.services.map((service) => ({
        name: service.serviceNameSv,
        durationMinutes: service.durationMinutes,
        price: new Decimal(service.price).toFixed(2),
      })),
      staffName: appointment.staff.name,
      dateLabel: format(start, 'EEEE d MMMM yyyy', { locale: sv }),
      timeLabel: format(start, 'HH:mm'),
      endTimeLabel: format(end, 'HH:mm'),
      durationMinutes: appointment.durationMinutes,
      totalPrice: new Decimal(appointment.totalPrice).toFixed(2),
      currency,
      salonPhone: phone,
      salonAddress: address,
    };
  }
}
