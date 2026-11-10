'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Reveal } from '@/components/ui/Reveal';
import { formatDuration, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Service, ServiceCategory } from '@/lib/types';

interface ServicesCatalogProps {
  categories: ServiceCategory[];
  services: Service[];
}

export function ServicesCatalog({ categories, services }: ServicesCatalogProps) {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState<string>('all');

  const visibleCategories = useMemo(
    () => (active === 'all' ? categories : categories.filter((c) => c.slug === active)),
    [active, categories],
  );

  const name = (c: ServiceCategory) => (lang === 'sv' ? c.nameSv : c.nameEn);

  return (
    <div className="container-luxe pb-24 pt-36 lg:pb-32 lg:pt-44">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-4">{t('services.eyebrow')}</p>
        <h1 className="heading-display text-balance text-5xl sm:text-6xl">{t('services.page.title')}</h1>
        <p className="mt-6 text-base leading-relaxed text-stone">{t('services.page.subtitle')}</p>
        <div className="mx-auto mt-8 h-px w-16 bg-gold" />
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActive('all')}
          className={cn(
            'border px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.16em] transition-colors',
            active === 'all'
              ? 'border-charcoal bg-charcoal text-ivory'
              : 'border-line bg-transparent text-stone hover:border-charcoal hover:text-ink',
          )}
        >
          {t('services.page.all')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.slug)}
            className={cn(
              'border px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.16em] transition-colors',
              active === c.slug
                ? 'border-charcoal bg-charcoal text-ivory'
                : 'border-line bg-transparent text-stone hover:border-charcoal hover:text-ink',
            )}
          >
            {name(c)}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-4xl space-y-16">
        {visibleCategories.map((category) => {
          const items = services.filter((s) => s.categoryId === category.id);
          if (items.length === 0) return null;
          return (
            <Reveal as="section" key={category.id}>
              <div className="flex items-baseline justify-between border-b border-charcoal/20 pb-4">
                <h2 className="font-serif text-3xl">{name(category)}</h2>
                <span className="text-xs uppercase tracking-[0.16em] text-stone-light">
                  {items.length} {lang === 'sv' ? 'tjänster' : 'services'}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((service) => (
                  <li key={service.id} className="group flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                      <h3 className="font-serif text-xl transition-colors group-hover:text-gold-dark">
                        {lang === 'sv' ? service.nameSv : service.nameEn}
                      </h3>
                      {(lang === 'sv' ? service.descriptionSv : service.descriptionEn) && (
                        <p className="mt-2 text-sm leading-relaxed text-stone">
                          {lang === 'sv' ? service.descriptionSv : service.descriptionEn}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-stone-light">
                        <Clock size={13} strokeWidth={1.5} />
                        {formatDuration(service.durationMinutes, lang)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-6">
                      <span className="font-serif text-2xl text-gold-dark">{formatMoney(service.price, lang)}</span>
                      <Link
                        href={`/booking?service=${service.id}`}
                        className="btn btn-outline !px-5 !py-2.5 text-[0.68rem]"
                      >
                        {t('services.book')}
                        <ArrowRight size={14} strokeWidth={1.5} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        })}

        {services.length === 0 && (
          <p className="text-center text-stone">{t('services.page.empty')}</p>
        )}
      </div>
    </div>
  );
}