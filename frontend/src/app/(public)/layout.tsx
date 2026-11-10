import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { publicApi } from '@/lib/api';
import { SALON_FALLBACK_NAME } from '@/lib/server-data';
import type { BusinessHours, PublicSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function load<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, hours] = await Promise.all([
    load(publicApi.settings(), null as PublicSettings | null),
    load(publicApi.businessHours(), [] as BusinessHours[]),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar salonName={settings?.salonName ?? SALON_FALLBACK_NAME} logoUrl={settings?.logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} hours={hours} />
    </div>
  );
}