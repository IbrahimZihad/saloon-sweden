'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { authApi } from '@/lib/api';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  ImageField,
  PageHeader,
  Spinner,
  Toggle,
} from '@/components/admin/ui';
import { minutesToTime } from '@/lib/format';
import type { BusinessHours, PublicSettings } from '@/lib/types';

const WEEKDAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface HourRow {
  isClosed: boolean;
  open: string;
  close: string;
}

export function SettingsView() {
  const [form, setForm] = useState<PublicSettings | null>(null);
  const [hours, setHours] = useState<HourRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [hoursMsg, setHoursMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([adminApi.settings(), adminApi.businessHours()])
      .then(([settings, bh]) => {
        setForm(settings);
        setHours(
          WEEKDAYS.map((_, i) => {
            const row = bh.find((h) => h.dayOfWeek === i);
            return row
              ? { isClosed: row.isClosed, open: minutesToTime(row.openMinutes), close: minutesToTime(row.closeMinutes) }
              : { isClosed: i === 6, open: '09:00', close: '18:00' };
          }),
        );
      })
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta inställningar.'));
  }, []);

  useEffect(load, [load]);

  function set<K extends keyof PublicSettings>(key: K, value: PublicSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSettingsMsg(null);
  }

  async function saveSettings() {
    if (!form) return;
    setSavingSettings(true);
    setError(null);
    setSettingsMsg(null);
    try {
      const optionalUrl = (v: string | null) => (v && v.trim() ? v.trim() : undefined);
      await adminApi.updateSettings({
        salonName: form.salonName,
        descriptionSv: form.descriptionSv ?? '',
        descriptionEn: form.descriptionEn ?? '',
        logoUrl: optionalUrl(form.logoUrl),
        address: form.address ?? '',
        postalCode: form.postalCode ?? '',
        city: form.city ?? '',
        country: form.country,
        phone: form.phone ?? '',
        email: form.email && form.email.trim() ? form.email.trim() : undefined,
        mapEmbedUrl: optionalUrl(form.mapEmbedUrl),
        instagramUrl: optionalUrl(form.instagramUrl),
        facebookUrl: optionalUrl(form.facebookUrl),
        tiktokUrl: optionalUrl(form.tiktokUrl),
        currency: form.currency,
        timezone: form.timezone,
        defaultLanguage: form.defaultLanguage,
        secondaryLanguage: form.secondaryLanguage,
        appointmentIntervalMinutes: Number(form.appointmentIntervalMinutes),
        minBookingNoticeMinutes: Number(form.minBookingNoticeMinutes),
        maxAdvanceBookingDays: Number(form.maxAdvanceBookingDays),
        pendingReservesTime: form.pendingReservesTime,
        cancellationPolicySv: form.cancellationPolicySv ?? '',
        cancellationPolicyEn: form.cancellationPolicyEn ?? '',
      });
      setSettingsMsg('Inställningar sparade.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara inställningar.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveHours() {
    setSavingHours(true);
    setError(null);
    setHoursMsg(null);
    try {
      const payload = hours.map((h, i) => ({
        dayOfWeek: i,
        openMinutes: timeToMinutes(h.open),
        closeMinutes: timeToMinutes(h.close),
        isClosed: h.isClosed,
      }));
      for (const p of payload) {
        if (!p.isClosed && p.openMinutes >= p.closeMinutes) throw new Error('Öppningstid måste vara före stängningstid.');
      }
      await adminApi.setBusinessHours(payload);
      setHoursMsg('Öppettider sparade.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara öppettider.');
    } finally {
      setSavingHours(false);
    }
  }

  if (error && !form) return <ErrorNote message={error} />;
  if (!form) return <Spinner />;

  return (
    <div>
      <PageHeader title="Inställningar" subtitle="Företagsuppgifter, bokningsregler och öppettider." />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <div className="space-y-6">
        <Card className="p-6">
          <SectionTitle>Salong & profil</SectionTitle>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salongsnamn">
                <input className="field" value={form.salonName} onChange={(e) => set('salonName', e.target.value)} />
              </Field>
              <ImageField label="Logotyp" value={form.logoUrl ?? ''} onChange={(url) => set('logoUrl', url || null)} />
            </div>
            <Field label="Beskrivning (svenska)">
              <textarea className="field min-h-20" value={form.descriptionSv ?? ''} onChange={(e) => set('descriptionSv', e.target.value)} />
            </Field>
            <Field label="Beskrivning (engelska)">
              <textarea className="field min-h-20" value={form.descriptionEn ?? ''} onChange={(e) => set('descriptionEn', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle>Kontakt & plats</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Adress">
              <input className="field" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Postnummer">
              <input className="field" value={form.postalCode ?? ''} onChange={(e) => set('postalCode', e.target.value)} />
            </Field>
            <Field label="Stad">
              <input className="field" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="Land">
              <input className="field" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </Field>
            <Field label="Telefon">
              <input className="field" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="E-post">
              <input type="email" className="field" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Google Maps embed-URL">
              <input className="field" placeholder="https://www.google.com/maps/embed?…" value={form.mapEmbedUrl ?? ''} onChange={(e) => set('mapEmbedUrl', e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Instagram-URL">
              <input className="field" value={form.instagramUrl ?? ''} onChange={(e) => set('instagramUrl', e.target.value)} />
            </Field>
            <Field label="Facebook-URL">
              <input className="field" value={form.facebookUrl ?? ''} onChange={(e) => set('facebookUrl', e.target.value)} />
            </Field>
            <Field label="TikTok-URL">
              <input className="field" value={form.tiktokUrl ?? ''} onChange={(e) => set('tiktokUrl', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle>Bokningsregler</SectionTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Tidsintervall (min, 5–60)">
              <input type="number" min={5} max={60} className="field" value={form.appointmentIntervalMinutes} onChange={(e) => set('appointmentIntervalMinutes', Number(e.target.value))} />
            </Field>
            <Field label="Minsta framförhållning (min)">
              <input type="number" min={0} className="field" value={form.minBookingNoticeMinutes} onChange={(e) => set('minBookingNoticeMinutes', Number(e.target.value))} />
            </Field>
            <Field label="Max dagar i förväg">
              <input type="number" min={1} max={365} className="field" value={form.maxAdvanceBookingDays} onChange={(e) => set('maxAdvanceBookingDays', Number(e.target.value))} />
            </Field>
          </div>
          <div className="mt-4">
            <Toggle checked={form.pendingReservesTime} onChange={(v) => set('pendingReservesTime', v)} label="Väntande bokningar reserverar tid" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Avbokningspolicy (svenska)">
              <textarea className="field min-h-20" value={form.cancellationPolicySv ?? ''} onChange={(e) => set('cancellationPolicySv', e.target.value)} />
            </Field>
            <Field label="Avbokningspolicy (engelska)">
              <textarea className="field min-h-20" value={form.cancellationPolicyEn ?? ''} onChange={(e) => set('cancellationPolicyEn', e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Field label="Valuta">
              <input className="field" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
            </Field>
            <Field label="Tidszon">
              <input className="field" value={form.timezone} onChange={(e) => set('timezone', e.target.value)} />
            </Field>
            <Field label="Standardspråk">
              <input className="field" value={form.defaultLanguage} onChange={(e) => set('defaultLanguage', e.target.value)} />
            </Field>
            <Field label="Andraspråk">
              <input className="field" value={form.secondaryLanguage} onChange={(e) => set('secondaryLanguage', e.target.value)} />
            </Field>
          </div>
          <SaveRow msg={settingsMsg} saving={savingSettings} onClick={saveSettings} label="Spara inställningar" />
        </Card>

        <Card className="p-6">
          <SectionTitle>Öppettider</SectionTitle>
          <p className="mt-1 text-xs text-stone">Salongens allmänna öppettider. Personalens individuella scheman styr sedan tillgängligheten.</p>
          <div className="mt-4 space-y-2">
            {hours.map((h, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 border border-line bg-white px-4 py-2.5">
                <span className="w-24 text-sm text-charcoal">{WEEKDAYS[i]}</span>
                <Toggle checked={!h.isClosed} onChange={(v) => setHours(hours.map((x, j) => (j === i ? { ...x, isClosed: !v } : x)))} label={h.isClosed ? 'Stängt' : 'Öppet'} />
                <input type="time" className="field w-32" disabled={h.isClosed} value={h.open} onChange={(e) => setHours(hours.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))} />
                <span className="text-stone-light">–</span>
                <input type="time" className="field w-32" disabled={h.isClosed} value={h.close} onChange={(e) => setHours(hours.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <SaveRow msg={hoursMsg} saving={savingHours} onClick={saveHours} label="Spara öppettider" />
        </Card>

        <PasswordCard />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-xl text-ink">{children}</h2>;
}

function SaveRow({ msg, saving, onClick, label }: { msg: string | null; saving: boolean; onClick: () => void; label: string }) {
  return (
    <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
      {msg && <span className="text-sm text-[#3e6b4f]">{msg}</span>}
      <Button onClick={onClick} loading={saving}><Save size={15} /> {label}</Button>
    </div>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (next !== confirmPw) {
      setError('De nya lösenorden matchar inte.');
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      setMsg('Lösenordet har ändrats.');
      setCurrent('');
      setNext('');
      setConfirmPw('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ändra lösenord.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle>Byt lösenord</SectionTitle>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <ErrorNote message={error} />}
        {msg && <p className="text-sm text-[#3e6b4f]">{msg}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nuvarande lösenord">
            <input type="password" className="field" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="Nytt lösenord">
            <input type="password" className="field" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Bekräfta nytt lösenord">
            <input type="password" className="field" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <div className="flex justify-end"><Button type="submit" loading={busy} variant="outline">Byt lösenord</Button></div>
      </form>
    </Card>
  );
}