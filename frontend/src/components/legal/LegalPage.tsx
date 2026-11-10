'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { legalDocuments } from '@/lib/legal';

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { lang } = useLanguage();
  const doc = legalDocuments[kind][lang];

  return (
    <div className="container-luxe pb-24 pt-36 lg:pb-32 lg:pt-44">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-4">{doc.updated}</p>
        <h1 className="heading-display text-balance text-5xl sm:text-6xl">{doc.title}</h1>
        <div className="mt-8 h-px w-16 bg-gold" />

        <div className="mt-12 space-y-12">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-stone">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}