/**
 * Domain enums shared by the models, DTOs, services and guards.
 *
 * These mirror the values that previously lived in the Prisma schema. Keeping
 * the string values identical means existing databases remain compatible.
 */

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentSource {
  ONLINE = 'ONLINE',
  PHONE = 'PHONE',
  ADMIN = 'ADMIN',
}

export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  CANCELLATION = 'CANCELLATION',
  RESCHEDULE = 'RESCHEDULE',
  REMINDER = 'REMINDER',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export const ROLE_VALUES = Object.values(Role);
export const APPOINTMENT_STATUS_VALUES = Object.values(AppointmentStatus);
export const APPOINTMENT_SOURCE_VALUES = Object.values(AppointmentSource);
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const NOTIFICATION_STATUS_VALUES = Object.values(NotificationStatus);
