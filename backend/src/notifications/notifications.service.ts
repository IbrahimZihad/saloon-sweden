import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Appointment, NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { PrismaService } from '../prisma/prisma.service';
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

type AppointmentWithRelations = Appointment & {
  customer: { fullName: string; email: string };
  staff: { name: string };
  services: { serviceNameSv: string; durationMinutes: number; price: Prisma.Decimal }[];
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  async queueForAppointment(
    appointmentId: string,
    type: NotificationType,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: { select: { fullName: true, email: true } },
        staff: { select: { name: true } },
        services: true,
      },
    });
    if (!appointment) return;

    const settings = await this.settings.getSettings();
    const data = this.buildEmailData(appointment, settings.salonName, settings.timezone, settings.currency, settings.phone, settings.address);
    const template = this.templateFor(type, data);

    const status: NotificationStatus = this.mail.isConfigured() ? 'PENDING' : 'SKIPPED';
    try {
      const notification = await this.prisma.emailNotification.upsert({
        where: { appointmentId_type: { appointmentId, type } },
        update: {},
        create: {
          appointmentId,
          type,
          status,
          toEmail: appointment.customer.email,
          subject: template.subject,
          htmlBody: template.html,
        },
      });
      if (notification.status === 'PENDING') {
        // Fire-and-forget: a mail outage must never fail the booking itself.
        void this.attemptSend(notification.id);
      }
    } catch (error) {
      this.logger.error(`Failed to queue ${type} for appointment ${appointmentId}`, error as Error);
    }
  }

  async attemptSend(notificationId: string): Promise<void> {
    const notification = await this.prisma.emailNotification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.status !== 'PENDING') return;
    if (!this.mail.isConfigured()) {
      await this.prisma.emailNotification.update({
        where: { id: notificationId },
        data: { status: 'SKIPPED' },
      });
      return;
    }

    try {
      await this.mail.sendMail(notification.toEmail, notification.subject, notification.htmlBody);
      await this.prisma.emailNotification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attempts = notification.attempts + 1;
      await this.prisma.emailNotification.update({
        where: { id: notificationId },
        data: {
          attempts,
          lastError: message.slice(0, 2000),
          status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
        },
      });
      this.logger.warn(`Email ${notificationId} attempt ${attempts} failed: ${message}`);
    }
  }

  /** Retries pending notifications that failed transiently. */
  @Cron('*/5 * * * *')
  async retryPending(): Promise<void> {
    const pending = await this.prisma.emailNotification.findMany({
      where: { status: 'PENDING', attempts: { lt: MAX_ATTEMPTS } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    for (const notification of pending) {
      await this.attemptSend(notification.id);
    }
  }

  /** Daily reminders for tomorrow's confirmed appointments. */
  @Cron('0 8 * * *', { timeZone: 'Europe/Stockholm' })
  async sendDailyReminders(): Promise<void> {
    const settings = await this.settings.getSettings();
    const tz = settings.timezone;
    const tomorrowStr = addDaysToDateStr(todayLocalStr(tz), 1);
    const dayAfterStr = addDaysToDateStr(tomorrowStr, 1);
    const startUtc = zonedDateTimeToUtc(tomorrowStr, 0, tz);
    const endUtc = zonedDateTimeToUtc(dayAfterStr, 0, tz);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        startsAt: { gte: startUtc, lt: endUtc },
        notifications: { none: { type: 'REMINDER' } },
      },
      select: { id: true },
    });
    for (const appointment of appointments) {
      await this.queueForAppointment(appointment.id, 'REMINDER');
    }
  }

  private templateFor(type: NotificationType, data: AppointmentEmailData) {
    switch (type) {
      case 'BOOKING_CONFIRMATION':
        return bookingConfirmationEmail(data);
      case 'APPOINTMENT_CONFIRMATION':
        return appointmentConfirmedEmail(data);
      case 'CANCELLATION':
        return cancellationEmail(data);
      case 'RESCHEDULE':
        return rescheduleEmail(data);
      case 'REMINDER':
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
      services: appointment.services.map((s) => ({
        name: s.serviceNameSv,
        durationMinutes: s.durationMinutes,
        price: s.price.toFixed(2),
      })),
      staffName: appointment.staff.name,
      dateLabel: format(start, 'EEEE d MMMM yyyy', { locale: sv }),
      timeLabel: format(start, 'HH:mm'),
      endTimeLabel: format(end, 'HH:mm'),
      durationMinutes: appointment.durationMinutes,
      totalPrice: appointment.totalPrice.toFixed(2),
      currency,
      salonPhone: phone,
      salonAddress: address,
    };
  }
}