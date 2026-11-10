export type Role = 'ADMIN' | 'STAFF';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentSource = 'ONLINE' | 'PHONE' | 'ADMIN';
export type Language = 'sv' | 'en';

export interface ServiceCategory {
  id: string;
  slug: string;
  nameSv: string;
  nameEn: string;
  sortOrder: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  slug: string;
  nameSv: string;
  nameEn: string;
  descriptionSv: string | null;
  descriptionEn: string | null;
  price: string;
  durationMinutes: number;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  category: ServiceCategory;
}

export interface PublicStaff {
  id: string;
  name: string;
  slug: string;
  jobTitle: string;
  bio: string | null;
  imageUrl: string | null;
  services: { serviceId: string }[];
}

export interface BusinessHours {
  id: string;
  dayOfWeek: number;
  openMinutes: number;
  closeMinutes: number;
  isClosed: boolean;
}

export interface PublicSettings {
  salonName: string;
  descriptionSv: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  mapEmbedUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  secondaryLanguage: string;
  appointmentIntervalMinutes: number;
  minBookingNoticeMinutes: number;
  maxAdvanceBookingDays: number;
  pendingReservesTime: boolean;
  cancellationPolicySv: string | null;
  cancellationPolicyEn: string | null;
}

export interface Testimonial {
  id: string;
  authorName: string;
  textSv: string;
  textEn: string | null;
  rating: number;
  sortOrder: number;
  active: boolean;
}

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
}

export interface SlotsResponse {
  date: string;
  durationMinutes: number;
  slots: TimeSlot[];
}

export interface DatesResponse {
  dates: string[];
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string | null;
  marketingConsent: boolean;
  createdAt: string;
}

export interface AppointmentServiceSnapshot {
  id: string;
  serviceId: string | null;
  serviceNameSv: string;
  serviceNameEn: string;
  durationMinutes: number;
  price: string;
}

export interface AppointmentStaff {
  id: string;
  name: string;
  jobTitle: string;
  imageUrl: string | null;
}

export interface EmailNotificationSummary {
  id: string;
  type: string;
  status: string;
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
}

export interface Appointment {
  id: string;
  bookingReference: string;
  customerId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  totalPrice: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  customerNotes: string | null;
  internalNotes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  customer: Customer;
  staff: AppointmentStaff;
  services: AppointmentServiceSnapshot[];
  notifications?: EmailNotificationSummary[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  staffId?: string;
}

export interface BookAppointmentInput {
  serviceIds: string[];
  staffId?: string;
  startsAt: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Admin shapes
// ---------------------------------------------------------------------------

export interface StaffWorkingHours {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

export interface StaffBreak {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  label: string | null;
}

export interface StaffTimeOff {
  id: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}

export interface AdminStaff {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  bio: string | null;
  imageUrl: string | null;
  active: boolean;
  services: { serviceId: string; service: { id: string; nameSv: string; nameEn: string; active: boolean } }[];
  workingHours: StaffWorkingHours[];
  breaks: StaffBreak[];
  timeOffs?: StaffTimeOff[];
}

export interface AdminService extends Service {
  _count?: { staff: number };
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string | null;
  marketingConsent: boolean;
  createdAt: string;
  _count: { appointments: number };
  appointments: { startsAt: string; status: AppointmentStatus }[];
}

export interface CustomerDetail extends Customer {
  appointments: Appointment[];
}

export interface DashboardOverview {
  today: {
    date: string;
    total: number;
    appointments: (Appointment & {
      customer: { fullName: string; phone: string };
      staff: { id: string; name: string };
      services: { serviceNameSv: string }[];
    })[];
  };
  totals: {
    all: number;
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
    upcoming: number;
  };
  revenue: { completedTotal: string; currency: string };
  statistics: {
    weeklyBookings: number;
    monthlyBookings: number;
    daily: { date: string; bookings: number; revenue: number; cancelled: number }[];
  };
  upcoming: (Appointment & {
    customer: { fullName: string; phone: string };
    staff: { id: string; name: string };
    services: { serviceNameSv: string }[];
  })[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  altSv: string | null;
  altEn: string | null;
  sortOrder: number;
  active: boolean;
}