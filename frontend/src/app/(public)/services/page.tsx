import type { Metadata } from 'next';
import { ServicesCatalog } from '@/components/services/ServicesCatalog';
import { publicApi } from '@/lib/api';
import type { Service, ServiceCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tjänster & priser',
  description: 'Se våra tjänster och priser — klippning, färgning, styling och hårbehandlingar.',
};

async function load<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([
    load(publicApi.categories(), [] as ServiceCategory[]),
    load(publicApi.services(), [] as Service[]),
  ]);

  return <ServicesCatalog categories={categories} services={services} />;
}