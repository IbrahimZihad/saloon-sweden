import { apiFetch, qs } from './api';
import type {
  AdminCustomer,
  AdminService,
  AdminStaff,
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  BookingNotification,
  BusinessHours,
  ContactMessage,
  CustomerDetail,
  DashboardOverview,
  GalleryImage,
  Paginated,
  PublicSettings,
  ServiceCategory,
  Testimonial,
} from './types';

export interface AppointmentFilter {
  page?: number;
  limit?: number;
  search?: string;
  date?: string;
  from?: string;
  to?: string;
  staffId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
}

export interface CreateAdminAppointmentInput {
  serviceIds: string[];
  staffId: string;
  startsAt: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  internalNotes?: string;
  source?: AppointmentSource;
  status?: AppointmentStatus;
}

export const adminApi = {
  dashboard: () => apiFetch<DashboardOverview>('/admin/dashboard/overview'),

  appointments: (filter: AppointmentFilter = {}) =>
    apiFetch<Paginated<Appointment>>(`/admin/appointments${qs({ ...filter })}`),
  bookingNotifications: (since: string) =>
    apiFetch<{ items: BookingNotification[]; serverTime: string }>(
      `/admin/appointments/notifications${qs({ since })}`,
    ),
  appointment: (id: string) => apiFetch<Appointment>(`/admin/appointments/${id}`),
  createAppointment: (input: CreateAdminAppointmentInput) =>
    apiFetch<Appointment>('/admin/appointments', { method: 'POST', body: input }),
  reschedule: (id: string, startsAt: string, staffId?: string) =>
    apiFetch<Appointment>(`/admin/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: { startsAt, staffId },
    }),
  updateStatus: (id: string, status: AppointmentStatus, reason?: string) =>
    apiFetch<Appointment>(`/admin/appointments/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    }),
  cancel: (id: string, reason?: string) =>
    apiFetch<Appointment>(`/admin/appointments/${id}/cancel`, { method: 'POST', body: { reason } }),

  services: () => apiFetch<AdminService[]>('/admin/services'),
  createService: (body: Record<string, unknown>) =>
    apiFetch<AdminService>('/admin/services', { method: 'POST', body }),
  updateService: (id: string, body: Record<string, unknown>) =>
    apiFetch<AdminService>(`/admin/services/${id}`, { method: 'PUT', body }),
  deleteService: (id: string) => apiFetch<void>(`/admin/services/${id}`, { method: 'DELETE' }),

  categories: () => apiFetch<ServiceCategory[]>('/admin/categories'),
  createCategory: (body: Record<string, unknown>) =>
    apiFetch<ServiceCategory>('/admin/categories', { method: 'POST', body }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    apiFetch<ServiceCategory>(`/admin/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id: string) => apiFetch<void>(`/admin/categories/${id}`, { method: 'DELETE' }),

  staff: () => apiFetch<AdminStaff[]>('/admin/staff'),
  staffMember: (id: string) => apiFetch<AdminStaff>(`/admin/staff/${id}`),
  createStaff: (body: Record<string, unknown>) =>
    apiFetch<AdminStaff>('/admin/staff', { method: 'POST', body }),
  updateStaff: (id: string, body: Record<string, unknown>) =>
    apiFetch<AdminStaff>(`/admin/staff/${id}`, { method: 'PUT', body }),
  deactivateStaff: (id: string) => apiFetch<void>(`/admin/staff/${id}`, { method: 'DELETE' }),
  setWorkingHours: (id: string, hours: { dayOfWeek: number; startMinutes: number; endMinutes: number }[]) =>
    apiFetch<AdminStaff>(`/admin/staff/${id}/working-hours`, { method: 'PUT', body: { hours } }),
  setBreaks: (id: string, breaks: { dayOfWeek: number; startMinutes: number; endMinutes: number; label?: string }[]) =>
    apiFetch<AdminStaff>(`/admin/staff/${id}/breaks`, { method: 'PUT', body: { breaks } }),
  addTimeOff: (id: string, startsAt: string, endsAt: string, reason?: string) =>
    apiFetch<AdminStaff>(`/admin/staff/${id}/time-off`, { method: 'POST', body: { startsAt, endsAt, reason } }),
  removeTimeOff: (id: string, timeOffId: string) =>
    apiFetch<void>(`/admin/staff/${id}/time-off/${timeOffId}`, { method: 'DELETE' }),

  customers: (page = 1, search?: string) =>
    apiFetch<Paginated<AdminCustomer>>(`/admin/customers${qs({ page, limit: 20, search })}`),
  customer: (id: string) => apiFetch<CustomerDetail>(`/admin/customers/${id}`),
  exportCustomer: (id: string) => apiFetch<Record<string, unknown>>(`/admin/customers/${id}/export`),
  eraseCustomer: (id: string) => apiFetch<{ message: string }>(`/admin/customers/${id}`, { method: 'DELETE' }),

  settings: () => apiFetch<PublicSettings & { id: string }>('/admin/settings'),
  updateSettings: (body: Record<string, unknown>) =>
    apiFetch<PublicSettings>('/admin/settings', { method: 'PUT', body }),

  businessHours: () => apiFetch<BusinessHours[]>('/admin/business-hours'),
  setBusinessHours: (hours: { dayOfWeek: number; openMinutes: number; closeMinutes: number; isClosed: boolean }[]) =>
    apiFetch<BusinessHours[]>('/admin/business-hours', { method: 'PUT', body: { hours } }),

  testimonials: () => apiFetch<Testimonial[]>('/admin/testimonials'),
  createTestimonial: (body: Record<string, unknown>) =>
    apiFetch<Testimonial>('/admin/testimonials', { method: 'POST', body }),
  updateTestimonial: (id: string, body: Record<string, unknown>) =>
    apiFetch<Testimonial>(`/admin/testimonials/${id}`, { method: 'PUT', body }),
  deleteTestimonial: (id: string) => apiFetch<void>(`/admin/testimonials/${id}`, { method: 'DELETE' }),

  contactMessages: (page = 1) =>
    apiFetch<Paginated<ContactMessage>>(`/admin/contact-messages${qs({ page, limit: 20 })}`),
  markHandled: (id: string) =>
    apiFetch<ContactMessage>(`/admin/contact-messages/${id}/handle`, { method: 'PATCH' }),

  gallery: () => apiFetch<GalleryImage[]>('/public/gallery'),
  deleteGallery: (id: string) => apiFetch<void>(`/admin/gallery/${id}`, { method: 'DELETE' }),
};

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');
  const res = await fetch(`${base}/admin/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? 'Upload failed');
  }
  return res.json();
}

export async function uploadGalleryImage(file: File, altSv?: string, altEn?: string): Promise<GalleryImage> {
  const form = new FormData();
  form.append('file', file);
  if (altSv) form.append('altSv', altSv);
  if (altEn) form.append('altEn', altEn);
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');
  const res = await fetch(`${base}/admin/gallery`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? 'Upload failed');
  }
  return res.json();
}