'use client';

import { MediaImage } from '@/components/ui/MediaImage';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import type { GalleryImage } from '@/lib/types';

const FALLBACK = [
  { src: '/images/salon-color.jpg', alt: 'Stylist i salongen' },
  { src: '/images/haircut.jpg', alt: 'Klippning' },
  { src: '/images/styling.jpg', alt: 'Styling' },
  { src: '/images/hair-wash.jpg', alt: 'Hårtvätt' },
  { src: '/images/hair-detail.jpg', alt: 'Hårdetalj' },
];

export function Gallery({ images }: { images: GalleryImage[] }) {
  const { t, lang } = useLanguage();

  const items =
    images.length > 0
      ? images.slice(0, 5).map((img) => ({
          src: img.imageUrl,
          alt: (lang === 'sv' ? img.altSv : img.altEn) ?? img.altSv ?? '',
        }))
      : FALLBACK;

  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading eyebrow={t('gallery.eyebrow')} title={t('gallery.title')} />

        <div className="mt-16 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((img, i) => (
            <Reveal
              key={`${img.src}-${i}`}
              delay={i * 80}
              className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <MediaImage
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/15" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}