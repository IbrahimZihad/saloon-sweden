import { Appointment } from './appointment.model';
import { AppointmentService } from './appointment-service.model';
import { BusinessHours } from './business-hours.model';
import { BusinessSettings } from './business-settings.model';
import { ContactMessage } from './contact-message.model';
import { Customer } from './customer.model';
import { EmailNotification } from './email-notification.model';
import { GalleryImage } from './gallery-image.model';
import { Service } from './service.model';
import { ServiceCategory } from './service-category.model';
import { Staff } from './staff.model';
import { StaffBreak } from './staff-break.model';
import { StaffScheduleLock } from './staff-schedule-lock.model';
import { StaffService } from './staff-service.model';
import { StaffTimeOff } from './staff-time-off.model';
import { StaffWorkingHours } from './staff-working-hours.model';
import { Testimonial } from './testimonial.model';
import { User } from './user.model';

export {
  Appointment,
  AppointmentService,
  BusinessHours,
  BusinessSettings,
  ContactMessage,
  Customer,
  EmailNotification,
  GalleryImage,
  Service,
  ServiceCategory,
  Staff,
  StaffBreak,
  StaffScheduleLock,
  StaffService,
  StaffTimeOff,
  StaffWorkingHours,
  Testimonial,
  User,
};

/**
 * Every model that belongs to the application's single Sequelize instance.
 * `Transaction` ordering matters for `sync()`: parents come before children.
 */
export const models = [
  User,
  Customer,
  ServiceCategory,
  Staff,
  Service,
  StaffService,
  StaffWorkingHours,
  StaffBreak,
  StaffTimeOff,
  BusinessHours,
  BusinessSettings,
  Appointment,
  AppointmentService,
  StaffScheduleLock,
  Testimonial,
  GalleryImage,
  ContactMessage,
  EmailNotification,
];
