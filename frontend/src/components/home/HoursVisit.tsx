'use client';

import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { minutesToTime } from '@/lib/format';
import type { BusinessHours, PublicSettings } from '@/lib/types';

interface HoursVisitProps {
  hours: BusinessHours[];
  settings: PublicSettings | null;
}

export function HoursVisit({ hours, settings }: HoursVisitProps) {
  const { t } = useLanguage();
  const location = [settings?.address, settings?.postalCode, settings?.city].filter(Boolean).join(', ');
  const mapSearch = location || settings?.salonName || '';
  const mapEmbedUrl =
    settings?.mapEmbedUrl ||
    (mapSearch ? `https://www.google.com/maps?q=${encodeURIComponent(mapSearch)}&output=embed` : null);
  const mapLink = mapSearch
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearch)}`
    : settings?.mapEmbedUrl;

  return (
    <section id="visit" className="bg-ivory py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading eyebrow={t('hours.eyebrow')} title={t('hours.title')} />

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <Reveal className="card-luxe p-8 lg:p-10">
            <div className="flex items-center gap-3">
              <Clock size={20} strokeWidth={1.5} className="text-gold-dark" />
              <h3 className="font-serif text-2xl">{t('hours.eyebrow')}</h3>
            </div>
            <ul className="mt-7 divide-y divide-line">
              {hours.length === 0 ? (
                <li className="py-3 text-stone">—</li>
              ) : (
                hours.map((h) => (
                  <li key={h.dayOfWeek} className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-stone">{t(`day.${h.dayOfWeek}`)}</span>
                    <span className="text-sm tabular-nums text-ink">
                      {h.isClosed ? (
                        <span className="text-stone-light">{t('hours.closed')}</span>
                      ) : (
                        `${minutesToTime(h.openMinutes)} – ${minutesToTime(h.closeMinutes)}`
                      )}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <Link href="/booking" className="btn btn-primary mt-8 w-full">
              {t('hours.bookCta')}
            </Link>
          </Reveal>

          <Reveal delay={120} className="card-luxe flex flex-col overflow-hidden">
            <div className="relative min-h-[240px] flex-1 bg-sand">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  title={t('hours.visit')}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <MapPin size={28} strokeWidth={1.4} className="text-gold-dark" />
                  <p className="font-serif text-xl text-ink">{settings?.salonName ?? ''}</p>
                  <p className="text-sm text-stone">
                    {settings?.address}
                    {settings?.address && <br />}
                    {settings?.postalCode} {settings?.city}
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-4 border-t border-line p-8 sm:grid-cols-2">
              {settings?.phone && (
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm text-stone hover:text-ink">
                  <Phone size={17} strokeWidth={1.5} className="text-gold-dark" />
                  {settings.phone}
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-sm text-stone hover:text-ink">
                  <Mail size={17} strokeWidth={1.5} className="text-gold-dark" />
                  {settings.email}
                </a>
              )}
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-stone hover:text-ink"
                >
                  <MapPin size={17} strokeWidth={1.5} className="text-gold-dark" />
                  {t('hours.openMaps')}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}