'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatInTimeZone } from 'date-fns-tz';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, User } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { detailsSchema, type DetailsForm } from '@/lib/booking-schema';
import { publicApi, ApiError } from '@/lib/api';
import { DEFAULT_TZ, formatDateStr, formatDuration, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PublicSettings, PublicStaff, Service, TimeSlot } from '@/lib/types';

interface BookingWizardProps {
  services: Service[];
  staff: PublicStaff[];
  settings: PublicSettings | null;
}

const STEP_KEYS = ['service', 'staff', 'date', 'time', 'details', 'confirm'] as const;

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function BookingWizard({ services, staff, settings }: BookingWizardProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tz = settings?.timezone ?? DEFAULT_TZ;
  const todayStr = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
  const maxDateStr = addDaysStr(todayStr, settings?.maxAdvanceBookingDays ?? 60);

  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>(() => {
    const pre = searchParams.get('service');
    return pre && services.some((s) => s.id === pre) ? [pre] : [];
  });
  const [staffId, setStaffId] = useState<string>('any');
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);

  const [dates, setDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: '', email: '', phone: '', notes: '', consent: false as unknown as true },
  });

  const serviceKey = serviceIds.join(',');
  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds],
  );
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  const qualifiedStaff = useMemo(
    () => staff.filter((m) => serviceIds.every((id) => m.services.some((ss) => ss.serviceId === id))),
    [staff, serviceIds],
  );

  const serviceName = (s: Service) => (lang === 'sv' ? s.nameSv : s.nameEn);

  // Fetch available dates when entering the date step.
  useEffect(() => {
    if (step !== 2 || serviceIds.length === 0) return;
    const controller = new AbortController();
    setDatesLoading(true);
    setLoadError(null);
    publicApi
      .availableDates(serviceIds, staffId, controller.signal)
      .then((res) => setDates(res.dates))
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(err instanceof ApiError ? err.message : t('common.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDatesLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, serviceKey, staffId]);

  const refreshSlots = useCallback(() => {
    if (!date || serviceIds.length === 0) return;
    const controller = new AbortController();
    setSlotsLoading(true);
    setLoadError(null);
    publicApi
      .slots(serviceIds, date, staffId, controller.signal)
      .then((res) => setSlots(res.slots))
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(err instanceof ApiError ? err.message : t('common.error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, serviceKey, staffId]);

  useEffect(() => {
    if (step !== 3) return;
    const cleanup = refreshSlots();
    return cleanup;
  }, [step, refreshSlots]);

  const toggleService = (id: string) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setDate(null);
    setSlot(null);
  };

  const chooseStaff = (id: string) => {
    setStaffId(id);
    setDate(null);
    setSlot(null);
  };

  const chooseDate = (d: string) => {
    setDate(d);
    setSlot(null);
  };

  const canNext = (): boolean => {
    switch (step) {
      case 0: return serviceIds.length > 0;
      case 1: return true;
      case 2: return date !== null;
      case 3: return slot !== null;
      default: return true;
    }
  };

  const next = async () => {
    setSubmitError(null);
    if (step === 4) {
      const valid = await trigger();
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const back = () => {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async (values: DetailsForm) => {
    if (!slot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const appointment = await publicApi.book({
        serviceIds,
        staffId: slot.staffId,
        startsAt: slot.startsAt,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        notes: values.notes || undefined,
      });
      router.push(`/booking/confirmation?ref=${encodeURIComponent(appointment.bookingReference)}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('booking.error.generic');
      setSubmitError(message);
      if (err instanceof ApiError && (err.status === 409 || err.status === 400)) {
        setSlot(null);
        setStep(3);
        refreshSlots();
      }
      setSubmitting(false);
    }
  };

  const staffLabel =
    staffId === 'any' ? t('booking.staff.any') : staff.find((m) => m.id === staffId)?.name ?? '';

  return (
    <div className="container-luxe pb-24 pt-36 lg:pb-32 lg:pt-44">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-4">{t('booking.eyebrow')}</p>
        <h1 className="heading-display text-balance text-5xl sm:text-6xl">{t('booking.title')}</h1>
        <p className="mt-6 text-base leading-relaxed text-stone">{t('booking.subtitle')}</p>
      </div>

      {/* Stepper */}
      <ol className="mx-auto mt-14 flex max-w-3xl items-center justify-center gap-0">
        {STEP_KEYS.map((key, i) => (
          <li key={key} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center border text-sm transition-colors',
                  i < step
                    ? 'border-gold bg-gold text-white'
                    : i === step
                      ? 'border-charcoal bg-charcoal text-ivory'
                      : 'border-line text-stone-light',
                )}
              >
                {i < step ? <Check size={15} strokeWidth={2} /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-[0.62rem] uppercase tracking-[0.14em] sm:block',
                  i === step ? 'text-ink' : 'text-stone-light',
                )}
              >
                {t(`booking.step.${key}`)}
              </span>
            </button>
            {i < STEP_KEYS.length - 1 && (
              <span className={cn('mx-2 h-px flex-1', i < step ? 'bg-gold' : 'bg-line')} />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {/* STEP 0: services */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-3xl">{t('booking.service.title')}</h2>
              <p className="mt-2 text-sm text-stone">{t('booking.service.subtitle')}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {services.map((s) => {
                  const checked = serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={cn(
                        'flex items-start justify-between gap-4 border p-5 text-left transition-colors',
                        checked ? 'border-gold bg-cream' : 'border-line bg-white hover:border-sand-dark',
                      )}
                    >
                      <span>
                        <span className="block font-serif text-lg">{serviceName(s)}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-stone">
                          <Clock size={12} strokeWidth={1.5} />
                          {formatDuration(s.durationMinutes, lang)}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-2">
                        <span className="font-serif text-lg text-gold-dark">{formatMoney(s.price, lang)}</span>
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center border',
                            checked ? 'border-gold bg-gold text-white' : 'border-sand-dark',
                          )}
                        >
                          {checked && <Check size={12} strokeWidth={2.5} />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: staff */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-3xl">{t('booking.staff.title')}</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => chooseStaff('any')}
                  className={cn(
                    'flex items-center gap-4 border p-5 text-left transition-colors',
                    staffId === 'any' ? 'border-gold bg-cream' : 'border-line bg-white hover:border-sand-dark',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-sand-dark text-stone">
                    <User size={18} strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-serif text-lg">{t('booking.staff.any')}</span>
                    <span className="mt-1 block text-xs text-stone">{t('booking.staff.anyDesc')}</span>
                  </span>
                </button>
                {qualifiedStaff.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => chooseStaff(m.id)}
                    className={cn(
                      'flex items-center gap-4 border p-5 text-left transition-colors',
                      staffId === m.id ? 'border-gold bg-cream' : 'border-line bg-white hover:border-sand-dark',
                    )}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-sand-dark font-serif text-lg text-stone">
                      {m.name[0]}
                    </span>
                    <span>
                      <span className="block font-serif text-lg">{m.name}</span>
                      <span className="mt-1 block text-xs text-stone">{m.jobTitle}</span>
                    </span>
                  </button>
                ))}
              </div>
              {qualifiedStaff.length === 0 && (
                <p className="mt-6 text-sm text-stone">{t('booking.staff.none')}</p>
              )}
            </div>
          )}

          {/* STEP 2: date */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-3xl">{t('booking.date.title')}</h2>
              <p className="mt-2 text-sm text-stone">{t('booking.date.subtitle')}</p>
              <div className="mt-8">
                {datesLoading ? (
                  <Loading label={t('common.loading')} />
                ) : loadError ? (
                  <ErrorNote message={loadError} />
                ) : dates.length === 0 ? (
                  <p className="text-sm text-stone">{t('booking.date.none')}</p>
                ) : (
                  <BookingCalendar
                    availableDates={dates}
                    selected={date}
                    onSelect={chooseDate}
                    minDate={todayStr}
                    maxDate={maxDateStr}
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 3: time */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-3xl">{t('booking.time.title')}</h2>
              {date && <p className="mt-2 text-sm capitalize text-stone">{formatDateStr(date, lang)}</p>}
              <div className="mt-8">
                {slotsLoading ? (
                  <Loading label={t('booking.time.loading')} />
                ) : loadError ? (
                  <ErrorNote message={loadError} />
                ) : slots.length === 0 ? (
                  <p className="text-sm text-stone">{t('booking.time.none')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={`${s.startsAt}-${s.staffId}`}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={cn(
                          'border px-3 py-3 text-center transition-colors',
                          slot?.startsAt === s.startsAt && slot?.staffId === s.staffId
                            ? 'border-charcoal bg-charcoal text-ivory'
                            : 'border-line bg-white text-ink hover:border-sand-dark',
                        )}
                      >
                        <span className="block text-sm tabular-nums">{s.startTime}</span>
                        {staffId === 'any' && (
                          <span className="mt-0.5 block truncate text-[0.62rem] opacity-70">{s.staffName}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: details */}
          {step === 4 && (
            <form className="animate-fade-in" onSubmit={(e) => e.preventDefault()}>
              <h2 className="font-serif text-3xl">{t('booking.details.title')}</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="fullName">{t('booking.details.fullName')}</label>
                  <input id="fullName" className="field" autoComplete="name" {...register('fullName')} />
                  {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="field-label" htmlFor="email">{t('booking.details.email')}</label>
                  <input id="email" type="email" className="field" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="field-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="field-label" htmlFor="phone">{t('booking.details.phone')}</label>
                  <input id="phone" type="tel" className="field" autoComplete="tel" placeholder="+46 70 123 45 67" {...register('phone')} />
                  {errors.phone && <p className="field-error">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="notes">{t('booking.details.notes')}</label>
                  <textarea id="notes" rows={4} className="field" placeholder={t('booking.details.notesPlaceholder')} {...register('notes')} />
                  {errors.notes && <p className="field-error">{errors.notes.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 text-sm text-stone">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-[#b0925a]" {...register('consent')} />
                    <span>
                      {t('booking.details.consent')}{' '}
                      <Link href="/privacy" target="_blank" className="link-underline text-ink">
                        {t('booking.details.privacy')}
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.consent && <p className="field-error">{errors.consent.message}</p>}
                </div>
              </div>
            </form>
          )}

          {/* STEP 5: confirm */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="font-serif text-3xl">{t('booking.confirm.title')}</h2>
              <dl className="card-luxe mt-8 divide-y divide-line">
                <Row label={t('booking.confirm.service')}>
                  {selectedServices.map((s) => serviceName(s)).join(', ')}
                </Row>
                <Row label={t('booking.confirm.staff')}>{slot?.staffName ?? staffLabel}</Row>
                <Row label={t('booking.confirm.date')}>{date ? formatDateStr(date, lang) : ''}</Row>
                <Row label={t('booking.confirm.time')}>{slot ? `${slot.startTime} – ${slot.endTime}` : ''}</Row>
                <Row label={t('booking.confirm.duration')}>{formatDuration(totalDuration, lang)}</Row>
                <Row label={t('booking.confirm.total')}>
                  <span className="font-serif text-xl text-gold-dark">{formatMoney(totalPrice, lang)}</span>
                </Row>
              </dl>
              {submitError && <ErrorNote message={submitError} className="mt-6" />}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-4">
            <button type="button" onClick={back} disabled={step === 0 || submitting} className="btn btn-ghost">
              <ArrowLeft size={15} strokeWidth={1.5} />
              {t('booking.back')}
            </button>
            {step < 5 ? (
              <button type="button" onClick={next} disabled={!canNext()} className="btn btn-primary">
                {t('booking.next')}
                <ArrowRight size={15} strokeWidth={1.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={submitting}
                className="btn btn-gold"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2} />}
                {submitting ? t('booking.confirm.submitting') : t('booking.confirm.submit')}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="card-luxe h-fit p-7 lg:sticky lg:top-28">
          <p className="eyebrow">{t('booking.summary')}</p>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('booking.confirm.service')}</p>
              {selectedServices.length === 0 ? (
                <p className="mt-1 text-stone-light">—</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {selectedServices.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span>{serviceName(s)}</span>
                      <span className="tabular-nums text-stone">{formatMoney(s.price, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('booking.confirm.staff')}</span>
              <span>{slot?.staffName ?? staffLabel}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('booking.confirm.date')}</span>
              <span className="capitalize">{date ? formatDateStr(date, lang, 'd MMM') : '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('booking.confirm.time')}</span>
              <span className="tabular-nums">{slot ? slot.startTime : '—'}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <span className="text-xs uppercase tracking-[0.12em] text-stone-light">{t('booking.confirm.total')}</span>
            <span className="font-serif text-2xl text-gold-dark">{formatMoney(totalPrice, lang)}</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone">
            <Clock size={12} strokeWidth={1.5} />
            {formatDuration(totalDuration, lang)}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 px-6 py-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-stone-light">{label}</dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-stone">
      <Loader2 size={17} className="animate-spin text-gold-dark" />
      {label}
    </div>
  );
}

function ErrorNote({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn('border border-[#b23b3b]/30 bg-[#b23b3b]/5 px-4 py-3 text-sm text-[#b23b3b]', className)}>
      {message}
    </p>
  );
}