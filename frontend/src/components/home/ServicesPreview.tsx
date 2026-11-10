'use client';

import { MediaImage } from '@/components/ui/MediaImage';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { formatDuration, formatMoney } from '@/lib/format';
import { serviceImage } from '@/lib/service-image';
import type { Service } from '@/lib/types';

export function ServicesPreview({ services }: { services: Service[] }) {
  const { t, lang } = useLanguage();
  const featured = services.slice(0, 3);

  return (
    <section id="services" className="bg-ivory py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={t('services.eyebrow')}
          title={t('services.title')}
          subtitle={t('services.subtitle')}
        />

        {featured.length > 0 ? (
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {featured.map((service, i) => (
              <Reveal as="article" key={service.id} delay={i * 120} className="group card-luxe flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <MediaImage
                    src={serviceImage(service, i)}
                    alt={lang === 'sv' ? service.nameSv : service.nameEn}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <p className="eyebrow">
                    {lang === 'sv' ? service.category.nameSv : service.category.nameEn}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl">
                    {lang === 'sv' ? service.nameSv : service.nameEn}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-stone">
                    {lang === 'sv' ? service.descriptionSv : service.descriptionEn}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                    <span className="font-serif text-xl text-gold-dark">{formatMoney(service.price, lang)}</span>
                    <span className="flex items-center gap-1.5 text-xs text-stone">
                      <Clock size={14} strokeWidth={1.5} />
                      {formatDuration(service.durationMinutes, lang)}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-16 text-center text-stone">{t('services.page.empty')}</p>
        )}

        <div className="mt-14 text-center">
          <Link href="/services" className="btn btn-outline">
            {t('services.viewAll')}
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}