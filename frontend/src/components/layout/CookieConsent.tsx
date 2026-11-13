'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

// The site only uses essential storage, so this is an informational notice
// rather than a consent prompt. The key is kept for continuity with earlier
// versions of the banner.
const STORAGE_KEY = 'salon_cookie_consent';

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const acknowledge = () => {
    window.localStorage.setItem(STORAGE_KEY, 'acknowledged');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie notice"
      className="animate-fade-in fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-ivory/95 backdrop-blur-md"
    >
      <div className="container-luxe flex flex-col items-start gap-5 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl gap-4">
          <Cookie size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm leading-relaxed text-stone">
            {t('cookie.text')}{' '}
            <Link href="/privacy" className="link-underline text-ink">
              {t('cookie.readMore')}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0">
          <button onClick={acknowledge} className="btn btn-primary !px-5 !py-2.5 text-[0.7rem]">
            {t('cookie.ok')}
          </button>
        </div>
      </div>
    </aside>
  );
}
