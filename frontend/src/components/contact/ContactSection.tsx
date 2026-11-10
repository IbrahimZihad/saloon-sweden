'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Facebook, Instagram, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { publicApi } from '@/lib/api';
import { minutesToTime } from '@/lib/format';
import type { BusinessHours, PublicSettings } from '@/lib/types';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(190),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(5000),
});
type ContactForm = z.infer<typeof contactSchema>;

interface ContactSectionProps {
  settings: PublicSettings | null;
  hours: BusinessHours[];
}

export function ContactSection({ settings, hours }: ContactSectionProps) {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactForm) => {
    setError(null);
    try {
      await publicApi.contact({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        message: values.message,
      });
      setSent(true);
      reset();
    } catch {
      setError(t('contact.form.error'));
    }
  };

  const socials = [
    { url: settings?.instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: settings?.facebookUrl, icon: Facebook, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <div className="container-luxe pb-24 pt-36 lg:pb-32 lg:pt-44">
      <SectionHeading
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
      />

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="card-luxe p-8 lg:p-10">
          {sent ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-cream text-gold-dark">
                <Check size={24} strokeWidth={1.6} />
              </span>
              <p className="max-w-md text-base text-stone">{t('contact.form.success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="c-name">{t('contact.form.name')}</label>
                <input id="c-name" className="field" autoComplete="name" {...register('name')} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="c-email">{t('contact.form.email')}</label>
                <input id="c-email" type="email" className="field" autoComplete="email" {...register('email')} />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="c-phone">{t('contact.form.phone')}</label>
                <input id="c-phone" type="tel" className="field" autoComplete="tel" {...register('phone')} />
                {errors.phone && <p className="field-error">{errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="c-message">{t('contact.form.message')}</label>
                <textarea id="c-message" rows={6} className="field" {...register('message')} />
                {errors.message && <p className="field-error">{errors.message.message}</p>}
              </div>
              {error && <p className="field-error sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={1.5} />}
                  {isSubmitting ? t('contact.form.sending') : t('contact.form.send')}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-8">
          <div className="card-luxe p-8">
            <ul className="space-y-5 text-sm">
              {settings?.address && (
                <li className="flex gap-4">
                  <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-dark" />
                  <span className="text-stone">
                    <span className="block text-xs uppercase tracking-[0.12em] text-stone-light">{t('contact.address')}</span>
                    <span className="mt-1 block text-ink">{settings.address}<br />{settings.postalCode} {settings.city}</span>
                  </span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex gap-4">
                  <Phone size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-dark" />
                  <span>
                    <span className="block text-xs uppercase tracking-[0.12em] text-stone-light">{t('contact.phone')}</span>
                    <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="mt-1 block text-ink hover:text-gold-dark">{settings.phone}</a>
                  </span>
                </li>
              )}
              {settings?.email && (
                <li className="flex gap-4">
                  <Mail size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-dark" />
                  <span>
                    <span className="block text-xs uppercase tracking-[0.12em] text-stone-light">{t('contact.email')}</span>
                    <a href={`mailto:${settings.email}`} className="mt-1 block text-ink hover:text-gold-dark">{settings.email}</a>
                  </span>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('contact.follow')}</p>
                <div className="mt-4 flex gap-3">
                  {socials.map(({ url, icon: Icon, label }) => (
                    <a key={label} href={url!} target="_blank" rel="noopener noreferrer" aria-label={label}
                      className="flex h-10 w-10 items-center justify-center border border-line text-stone transition-colors hover:border-gold hover:text-gold-dark">
                      <Icon size={17} strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-luxe p-8">
            <p className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('footer.hours')}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {hours.map((h) => (
                <li key={h.dayOfWeek} className="flex justify-between gap-4">
                  <span className="text-stone">{t(`day.${h.dayOfWeek}`)}</span>
                  <span className="tabular-nums text-ink">
                    {h.isClosed ? t('hours.closed') : `${minutesToTime(h.openMinutes)}–${minutesToTime(h.closeMinutes)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}