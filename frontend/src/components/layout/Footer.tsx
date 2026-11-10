'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { minutesToTime } from '@/lib/format';
import type { BusinessHours, PublicSettings } from '@/lib/types';

interface FooterProps {
  settings: PublicSettings | null;
  hours: BusinessHours[];
}

export function Footer({ settings, hours }: FooterProps) {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();
  const name = settings?.salonName ?? 'Salong Sweden';

  const socials = [
    { url: settings?.instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: settings?.facebookUrl, icon: Facebook, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <footer className="border-t border-line bg-charcoal text-ivory/80">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div>
          <p className="font-serif text-3xl text-ivory">{name}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">{t('footer.tagline')}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center border border-ivory/20 text-ivory/70 transition-colors hover:border-gold hover:text-gold"
                >
                  <Icon size={17} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow !text-gold">{t('footer.explore')}</p>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { href: '/', label: t('nav.home') },
              { href: '/services', label: t('nav.services') },
              { href: '/booking', label: t('nav.booking') },
              { href: '/contact', label: t('nav.contact') },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline text-ivory/70 hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow !text-gold">{t('footer.contact')}</p>
          <ul className="mt-5 space-y-4 text-sm text-ivory/70">
            {settings?.address && (
              <li className="flex gap-3">
                <MapPin size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  {settings.address}
                  <br />
                  {settings.postalCode} {settings.city}
                </span>
              </li>
            )}
            {settings?.phone && (
              <li className="flex gap-3">
                <Phone size={17} strokeWidth={1.5} className="shrink-0 text-gold" />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-ivory">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.email && (
              <li className="flex gap-3">
                <Mail size={17} strokeWidth={1.5} className="shrink-0 text-gold" />
                <a href={`mailto:${settings.email}`} className="hover:text-ivory">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="eyebrow !text-gold">{t('footer.hours')}</p>
          <ul className="mt-5 space-y-2 text-sm">
            {hours.length === 0 ? (
              <li className="text-ivory/50">—</li>
            ) : (
              hours.map((h) => (
                <li key={h.dayOfWeek} className="flex justify-between gap-4 text-ivory/70">
                  <span>{t(`day.${h.dayOfWeek}`)}</span>
                  <span className="tabular-nums text-ivory/90">
                    {h.isClosed ? t('hours.closed') : `${minutesToTime(h.openMinutes)}–${minutesToTime(h.closeMinutes)}`}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 text-xs text-ivory/50 sm:flex-row">
          <p>© {year} {name}. {t('footer.rights')}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ivory">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-ivory">{t('footer.terms')}</Link>
            <Link href="/admin" className="hover:text-ivory">{t('footer.admin')}</Link>
            <span className="uppercase tracking-[0.12em]">{lang === 'sv' ? 'Svenska' : 'English'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}