import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { publicApi } from '@/lib/api';
import type { PublicSettings, PublicStaff, Service } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Boka tid',
  description: 'Boka din frisörtid online — välj tjänst, stylist och tid som passar dig.',
};

async function load<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function BookingPage() {
  const [services, staff, settings] = await Promise.all([
    load(publicApi.services(), [] as Service[]),
    load(publicApi.staff(), [] as PublicStaff[]),
    load(publicApi.settings(), null as PublicSettings | null),
  ]);

  // No Suspense boundary: the page is `force-dynamic`, so `useSearchParams` in
  // the wizard resolves on the server render. Rendering the wizard inline also
  // means the form is real HTML in the first paint instead of a streamed
  // boundary that relies on requestAnimationFrame to swap in.
  return <BookingWizard services={services} staff={staff} settings={settings} />;
}