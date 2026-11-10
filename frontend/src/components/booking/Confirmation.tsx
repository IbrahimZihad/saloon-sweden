'use client';

import Link from 'next/link';
import { CalendarCheck, MapPin, Scissors, User } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { formatLocalDateTime, formatMoney } from '@/lib/format';
import { DEFAULT_TZ } from '@/lib/format';
import type { Appointment, PublicSettings } from '@/lib/types';

interface ConfirmationProps {
  appointment: Appointment;
  settings: PublicSettings | null;
}

export function Confirmation({ appointment, settings }: ConfirmationProps) {
  const { t, lang } = useLanguage();
  const tz = settings?.timezone ?? DEFAULT_TZ;

  return (
    <div className="container-luxe flex flex-col items-center pb-24 pt-36 text-center lg:pb-32 lg:pt-44">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-dark">
        <CalendarCheck size={28} strokeWidth={1.4} />
      </span>
      <p className="eyebrow mt-8">{t('confirmation.eyebrow')}</p>
      <h1 className="heading-display mt-4 text-balance text-5xl sm:text-6xl">{t('confirmation.title')}</h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-stone">{t('confirmation.subtitle')}</p>

      <div className="card-luxe mt-12 w-full max-w-xl divide-y divide-line text-left">
        <div className="flex items-center justify-between bg-cream px-7 py-5">
          <span className="text-xs uppercase tracking-[0.16em] text-stone">{t('confirmation.reference')}</span>
          <span className="font-serif text-2xl tracking-wide text-gold-dark">{appointment.bookingReference}</span>
        </div>
        <div className="space-y-5 px-7 py-7">
          <Detail icon={CalendarCheck} label={t('confirmation.when')}>
            <span className="capitalize">{formatLocalDateTime(appointment.startsAt, tz, lang)}</span>
          </Detail>
          <Detail icon={User} label={t('confirmation.with')}>
            {appointment.staff.name}
          </Detail>
          <Detail icon={Scissors} label={t('confirmation.what')}>
            {appointment.services.map((s) => (lang === 'sv' ? s.serviceNameSv : s.serviceNameEn)).join(', ')}
          </Detail>
          {settings?.address && (
            <Detail icon={MapPin} label={t('confirmation.where')}>
              {settings.address}, {settings.postalCode} {settings.city}
            </Detail>
          )}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <span className="text-xs uppercase tracking-[0.16em] text-stone">{t('confirmation.total')}</span>
            <span className="font-serif text-2xl text-gold-dark">{formatMoney(appointment.totalPrice, lang)}</span>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-md text-sm text-stone">{t('confirmation.cancelNote')}</p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/" className="btn btn-outline">{t('confirmation.backHome')}</Link>
        <Link href="/booking" className="btn btn-primary">{t('confirmation.bookAnother')}</Link>
      </div>
    </div>
  );
}

export function MissingBooking() {
  const { t } = useLanguage();
  return (
    <div className="container-luxe flex flex-col items-center pb-24 pt-40 text-center lg:pb-32 lg:pt-48">
      <h1 className="heading-display text-4xl">{t('confirmation.notFound')}</h1>
      <Link href="/booking" className="btn btn-primary mt-10">
        {t('confirmation.bookAnother')}
      </Link>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-dark" />
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-stone-light">{label}</p>
        <p className="mt-1 text-sm text-ink">{children}</p>
      </div>
    </div>
  );
}