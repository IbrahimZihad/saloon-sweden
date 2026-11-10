'use client';

import { Star } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import type { Testimonial } from '@/lib/types';

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const { t, lang } = useLanguage();
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-ivory py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading eyebrow={t('testimonials.eyebrow')} title={t('testimonials.title')} />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
            <Reveal as="article" key={item.id} delay={i * 120} className="card-luxe flex flex-col p-8">
              <div className="flex gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={15}
                    strokeWidth={1.5}
                    fill={s < item.rating ? 'currentColor' : 'none'}
                    className={s < item.rating ? '' : 'text-sand-dark'}
                  />
                ))}
              </div>
              <blockquote className="mt-6 flex-1 font-serif text-lg italic leading-relaxed text-charcoal">
                “{lang === 'sv' ? item.textSv : item.textEn ?? item.textSv}”
              </blockquote>
              <footer className="mt-6 border-t border-line pt-5">
                <p className="text-sm uppercase tracking-[0.14em] text-stone">{item.authorName}</p>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}