import { publicApi } from './api';
import type {
  BusinessHours,
  GalleryImage,
  PublicSettings,
  PublicStaff,
  Service,
  ServiceCategory,
  Testimonial,
} from './types';

export interface PublicSiteData {
  settings: PublicSettings | null;
  categories: ServiceCategory[];
  services: Service[];
  staff: PublicStaff[];
  hours: BusinessHours[];
  testimonials: Testimonial[];
  gallery: GalleryImage[];
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/** Fetches all public content. Never throws — missing backend yields empty data. */
export async function getPublicSiteData(): Promise<PublicSiteData> {
  const [settings, categories, services, staff, hours, testimonials, gallery] = await Promise.all([
    safe(publicApi.settings(), null as PublicSettings | null),
    safe(publicApi.categories(), [] as ServiceCategory[]),
    safe(publicApi.services(), [] as Service[]),
    safe(publicApi.staff(), [] as PublicStaff[]),
    safe(publicApi.businessHours(), [] as BusinessHours[]),
    safe(publicApi.testimonials(), [] as Testimonial[]),
    safe(publicApi.gallery(), [] as GalleryImage[]),
  ]);
  return { settings, categories, services, staff, hours, testimonials, gallery };
}

export const SALON_FALLBACK_NAME = 'Salong Sweden';