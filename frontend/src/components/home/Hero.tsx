'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function Hero({ salonName }: { salonName: string }) {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-salon.jpg"
        alt="Salongens interiör"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/75" />

      <div className="container-luxe relative z-10 flex flex-col items-center py-32 text-center">
        <p className="fade-up eyebrow !text-gold" style={{ animationDelay: '100ms' }}>
          {t('hero.eyebrow')} {salonName}
        </p>
        <h1
          className="fade-up heading-display mt-6 max-w-4xl text-balance text-5xl !text-ivory sm:text-6xl lg:text-7xl"
          style={{ animationDelay: '220ms' }}
        >
          {t('hero.title')}
        </h1>
        <p
          className="fade-up mt-7 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg"
          style={{ animationDelay: '340ms' }}
        >
          {t('hero.subtitle')}
        </p>
        <div
          className="fade-up mt-11 flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: '460ms' }}
        >
          <Link href="/booking" className="btn btn-gold min-w-[220px]">
            {t('hero.cta')}
          </Link>
          <Link
            href="/services"
            className="btn min-w-[220px] border border-ivory/40 text-ivory hover:bg-ivory hover:text-ink"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </div>
      </div>

      <Link
        href="#services"
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory/70 transition-colors hover:text-ivory"
        aria-label={t('hero.scroll')}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.24em]">{t('hero.scroll')}</span>
        <ArrowDown size={18} strokeWidth={1.5} className="animate-bounce" />
      </Link>
    </section>
  );
}