import type { Metadata } from 'next';
import { ContactSection } from '@/components/contact/ContactSection';
import { publicApi } from '@/lib/api';
import type { BusinessHours, PublicSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontakta oss — adress, telefon, e-post och öppettider. Skicka ett meddelande direkt via formuläret.',
};

async function load<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([
    load(publicApi.settings(), null as PublicSettings | null),
    load(publicApi.businessHours(), [] as BusinessHours[]),
  ]);

  return <ContactSection settings={settings} hours={hours} />;
}