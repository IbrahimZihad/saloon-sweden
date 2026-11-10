'use client';

import { MediaImage } from '@/components/ui/MediaImage';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import type { PublicStaff } from '@/lib/types';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TeamSection({ staff }: { staff: PublicStaff[] }) {
  const { t } = useLanguage();
  if (staff.length === 0) return null;

  return (
    <section id="team" className="bg-ivory py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={t('team.eyebrow')}
          title={t('team.title')}
          subtitle={t('team.subtitle')}
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member, i) => (
            <Reveal as="article" key={member.id} delay={i * 120} className="group text-center">
              <div className="relative mx-auto aspect-[3/4] max-w-sm overflow-hidden bg-sand">
                {member.imageUrl ? (
                  <MediaImage
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-serif text-6xl text-stone-light">{initials(member.name)}</span>
                  </div>
                )}
              </div>
              <h3 className="mt-6 font-serif text-2xl">{member.name}</h3>
              <p className="eyebrow mt-2">{member.jobTitle}</p>
              {member.bio && (
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-stone">{member.bio}</p>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}