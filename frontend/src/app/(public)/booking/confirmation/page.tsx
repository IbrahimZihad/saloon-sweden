import type { Metadata } from 'next';
import { Confirmation, MissingBooking } from '@/components/booking/Confirmation';
import { publicApi } from '@/lib/api';
import type { Appointment, PublicSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bokningsbekräftelse',
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) return <MissingBooking />;

  let appointment: Appointment | null = null;
  let settings: PublicSettings | null = null;
  try {
    appointment = await publicApi.findByReference(ref);
    settings = await publicApi.settings().catch(() => null);
  } catch {
    appointment = null;
  }

  if (!appointment) return <MissingBooking />;
  return <Confirmation appointment={appointment} settings={settings} />;
}