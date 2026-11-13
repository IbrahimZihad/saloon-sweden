'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { publicApi } from '@/lib/api';
import { fillLegalDocument, legalDocuments, legalPlaceholders } from '@/lib/legal';
import type { PublicSettings } from '@/lib/types';

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    if (kind !== 'privacy') return;
    const controller = new AbortController();
    publicApi
      .settings(controller.signal)
      .then(setSettings)
      .catch(() => {
        // Fall back to generic wording if the settings request fails.
      });
    return () => controller.abort();
  }, [kind]);

  const doc =
    kind === 'privacy'
      ? fillLegalDocument(legalDocuments.privacy[lang], legalPlaceholders(settings, lang))
      : legalDocuments[kind][lang];

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
