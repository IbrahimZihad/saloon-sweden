import { Hero } from '@/components/home/Hero';
import { ServicesPreview } from '@/components/home/ServicesPreview';
import { WhyUs } from '@/components/home/WhyUs';
import { Testimonials } from '@/components/home/Testimonials';
import { Gallery } from '@/components/home/Gallery';
import { TeamSection } from '@/components/home/TeamSection';
import { HoursVisit } from '@/components/home/HoursVisit';
import { getPublicSiteData, SALON_FALLBACK_NAME } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getPublicSiteData();

  return (
    <>
      <Hero salonName={data.settings?.salonName ?? SALON_FALLBACK_NAME} />
      <ServicesPreview services={data.services} />
      <WhyUs />
      <Testimonials testimonials={data.testimonials} />
      <Gallery images={data.gallery} />
      <TeamSection staff={data.staff} />
      <HoursVisit hours={data.hours} settings={data.settings} />
    </>
  );
}