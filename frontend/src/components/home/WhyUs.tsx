'use client';

import Image from 'next/image';
import { Armchair, Gem, HeartHandshake, Scissors } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Reveal } from '@/components/ui/Reveal';

const ICONS = [Scissors, Gem, HeartHandshake, Armchair];

export function WhyUs() {
  const { t } = useLanguage();

  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="container-luxe grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative order-2 aspect-[4/5] overflow-hidden lg:order-1">
          <Image
            src="/images/salon-chair.jpg"
            alt="Salongsmiljö"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute bottom-6 left-6 right-6 border border-ivory/30 bg-ink/40 p-6 backdrop-blur-sm">
            <p className="font-serif text-2xl text-ivory">{t('why.title')}</p>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-4">{t('why.eyebrow')}</p>
          <h2 className="heading-display text-balance text-4xl sm:text-5xl">{t('why.title')}</h2>
          <div className="mt-7 h-px w-16 bg-gold" />

          <div className="mt-10 space-y-9">
            {ICONS.map((Icon, i) => (
              <Reveal key={i} delay={i * 100} className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold/40 text-gold-dark">
                  <Icon size={21} strokeWidth={1.4} />
                </span>
                <div>
                  <h3 className="font-serif text-xl">{t(`why.${i + 1}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone">{t(`why.${i + 1}.text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}