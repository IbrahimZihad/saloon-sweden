import type {
  Appointment,
  AuthUser,
  BookAppointmentInput,
  BusinessHours,
  ContactInput,
  DatesResponse,
  GalleryImage,
  Paginated,
  PublicSettings,
  PublicStaff,
  Service,
  ServiceCategory,
  SlotsResponse,
  Testimonial,
} from './types';

function baseUrl(): string {
  if (typeof window === 'undefined') {
    const internal = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';
    return `${internal.replace(/\/$/, '')}/api`;
  }
  return (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, cache, headers } = options;
  const isServer = typeof window === 'undefined';
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      signal,
      credentials: 'include',
      cache: isServer ? 'no-store' : cache,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = extractMessage(data) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return null;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

export const publicApi = {
  settings: (signal?: AbortSignal) =>
    apiFetch<PublicSettings>('/public/settings', { signal }),
  categories: (signal?: AbortSignal) =>
    apiFetch<ServiceCategory[]>('/public/categories', { signal }),
  services: (category?: string, signal?: AbortSignal) =>
    apiFetch<Service[]>(`/public/services${qs({ category })}`, { signal }),
  staff: (signal?: AbortSignal) =>
    apiFetch<PublicStaff[]>('/public/staff', { signal }),
  businessHours: (signal?: AbortSignal) =>
    apiFetch<BusinessHours[]>('/public/business-hours', { signal }),
  testimonials: (signal?: AbortSignal) =>
    apiFetch<Testimonial[]>('/public/testimonials', { signal }),
  gallery: (signal?: AbortSignal) =>
    apiFetch<GalleryImage[]>('/public/gallery', { signal }),
  availableDates: (serviceIds: string[], staffId?: string, signal?: AbortSignal) =>
    apiFetch<DatesResponse>(
      `/public/availability/dates${qs({ serviceIds: serviceIds.join(','), staffId })}`,
      { signal },
    ),
  slots: (serviceIds: string[], date: string, staffId?: string, signal?: AbortSignal) =>
    apiFetch<SlotsResponse>(
      `/public/availability/slots${qs({ serviceIds: serviceIds.join(','), date, staffId })}`,
      { signal },
    ),
  book: (input: BookAppointmentInput) =>
    apiFetch<Appointment>('/public/appointments', { method: 'POST', body: input }),
  findByReference: (reference: string, email?: string) =>
    apiFetch<Appointment>(`/public/appointments/reference/${encodeURIComponent(reference)}${qs({ email })}`),
  contact: (input: ContactInput) =>
    apiFetch<{ id: string; message: string }>('/public/contact', { method: 'POST', body: input }),
};

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: (signal?: AbortSignal) => apiFetch<AuthUser>('/auth/me', { signal }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword },
    }),
};

export { qs };