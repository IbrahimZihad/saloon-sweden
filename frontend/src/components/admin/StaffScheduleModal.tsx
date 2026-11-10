'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { fromZonedTime } from 'date-fns-tz';
import { adminApi } from '@/lib/admin-api';
import { Button, ErrorNote, Modal, Spinner, Toggle } from '@/components/admin/ui';
import { minutesToTime, DEFAULT_TZ, formatLocalDateTime } from '@/lib/format';
import type { AdminStaff } from '@/lib/types';

const WEEKDAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface DayConfig {
  enabled: boolean;
  start: string;
  end: string;
}

interface BreakRow {
  dayOfWeek: number;
  start: string;
  end: string;
  label: string;
}

type Tab = 'hours' | 'breaks' | 'timeoff';

export function StaffScheduleModal({
  staffId,
  staffName,
  onClose,
  onChanged,
}: {
  staffId: string;
  staffName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [staff, setStaff] = useState<AdminStaff | null>(null);
  const [tab, setTab] = useState<Tab>('hours');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [days, setDays] = useState<DayConfig[]>([]);
  const [breaks, setBreaks] = useState<BreakRow[]>([]);

  const [offStart, setOffStart] = useState('');
  const [offEnd, setOffEnd] = useState('');
  const [offReason, setOffReason] = useState('');

  const load = useCallback(() => {
    adminApi
      .staffMember(staffId)
      .then((s) => {
        setStaff(s);
        setDays(
          WEEKDAYS.map((_, i) => {
            const wh = s.workingHours.find((h) => h.dayOfWeek === i);
            return wh
              ? { enabled: true, start: minutesToTime(wh.startMinutes), end: minutesToTime(wh.endMinutes) }
              : { enabled: false, start: '09:00', end: '18:00' };
          }),
        );
        setBreaks(
          s.breaks.map((b) => ({
            dayOfWeek: b.dayOfWeek,
            start: minutesToTime(b.startMinutes),
            end: minutesToTime(b.endMinutes),
            label: b.label ?? '',
          })),
        );
      })
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta schema.'));
  }, [staffId]);

  useEffect(load, [load]);

  async function saveHours() {
    setSaving(true);
    setError(null);
    try {
      const hours = days
        .map((d, i) => ({ ...d, dayOfWeek: i }))
        .filter((d) => d.enabled)
        .map((d) => ({ dayOfWeek: d.dayOfWeek, startMinutes: timeToMinutes(d.start), endMinutes: timeToMinutes(d.end) }));
      for (const h of hours) {
        if (h.startMinutes >= h.endMinutes) throw new Error('Starttid måste vara före sluttid.');
      }
      await adminApi.setWorkingHours(staffId, hours);
      onChanged();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara arbetstider.');
    } finally {
      setSaving(false);
    }
  }

  async function saveBreaks() {
    setSaving(true);
    setError(null);
    try {
      const payload = breaks.map((b) => ({
        dayOfWeek: b.dayOfWeek,
        startMinutes: timeToMinutes(b.start),
        endMinutes: timeToMinutes(b.end),
        label: b.label || undefined,
      }));
      for (const b of payload) {
        if (b.startMinutes >= b.endMinutes) throw new Error('Starttid måste vara före sluttid.');
      }
      await adminApi.setBreaks(staffId, payload);
      onChanged();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara raster.');
    } finally {
      setSaving(false);
    }
  }

  async function addTimeOff() {
    if (!offStart || !offEnd) {
      setError('Ange både start- och sluttid för ledigheten.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const startsAt = fromZonedTime(offStart, DEFAULT_TZ).toISOString();
      const endsAt = fromZonedTime(offEnd, DEFAULT_TZ).toISOString();
      if (new Date(startsAt) >= new Date(endsAt)) throw new Error('Start måste vara före slut.');
      await adminApi.addTimeOff(staffId, startsAt, endsAt, offReason || undefined);
      setOffStart('');
      setOffEnd('');
      setOffReason('');
      onChanged();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte lägga till ledighet.');
    } finally {
      setSaving(false);
    }
  }

  async function removeTimeOff(id: string) {
    setError(null);
    try {
      await adminApi.removeTimeOff(staffId, id);
      onChanged();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ta bort ledighet.');
    }
  }

  return (
    <Modal open onClose={onClose} title={`Schema · ${staffName}`} wide>
      {!staff ? (
        <Spinner />
      ) : (
        <div>
          <div className="mb-6 flex gap-1 border-b border-line">
            {([['hours', 'Arbetstider'], ['breaks', 'Raster'], ['timeoff', 'Ledighet']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(null); }}
                className={
                  tab === key
                    ? 'border-b-2 border-gold px-4 py-2 text-sm text-ink'
                    : 'border-b-2 border-transparent px-4 py-2 text-sm text-stone hover:text-ink'
                }
              >
                {label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4"><ErrorNote message={error} /></div>}

          {tab === 'hours' && (
            <div className="space-y-3">
              <p className="text-xs text-stone">Aktivera de dagar personalen arbetar. Dagar som lämnas av är lediga.</p>
              {days.map((d, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 border border-line bg-white px-4 py-3">
                  <div className="w-24"><Toggle checked={d.enabled} onChange={(v) => setDays(days.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} label={WEEKDAYS[i]} /></div>
                  <input
                    type="time"
                    className="field w-32"
                    disabled={!d.enabled}
                    value={d.start}
                    onChange={(e) => setDays(days.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                  />
                  <span className="text-stone-light">–</span>
                  <input
                    type="time"
                    className="field w-32"
                    disabled={!d.enabled}
                    value={d.end}
                    onChange={(e) => setDays(days.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2"><Button onClick={saveHours} loading={saving}>Spara arbetstider</Button></div>
            </div>
          )}

          {tab === 'breaks' && (
            <div className="space-y-3">
              <p className="text-xs text-stone">Återkommande raster (t.ex. lunch) per veckodag. Ersätter alla tidigare raster.</p>
              {breaks.length === 0 && <p className="text-sm text-stone-light">Inga raster inlagda.</p>}
              {breaks.map((b, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 border border-line bg-white px-4 py-3">
                  <select
                    className="field w-32"
                    value={b.dayOfWeek}
                    onChange={(e) => setBreaks(breaks.map((x, j) => (j === i ? { ...x, dayOfWeek: Number(e.target.value) } : x)))}
                  >
                    {WEEKDAYS.map((w, di) => <option key={di} value={di}>{w}</option>)}
                  </select>
                  <input type="time" className="field w-28" value={b.start} onChange={(e) => setBreaks(breaks.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                  <span className="text-stone-light">–</span>
                  <input type="time" className="field w-28" value={b.end} onChange={(e) => setBreaks(breaks.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
                  <input className="field min-w-32 flex-1" placeholder="Etikett (t.ex. Lunch)" value={b.label} onChange={(e) => setBreaks(breaks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <button onClick={() => setBreaks(breaks.filter((_, j) => j !== i))} aria-label="Ta bort rast" className="p-2 text-stone hover:text-[#b23b3b]"><Trash2 size={15} /></button>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => setBreaks([...breaks, { dayOfWeek: 0, start: '12:00', end: '13:00', label: 'Lunch' }])} className="px-3 py-1.5 text-xs"><Plus size={13} /> Lägg till rast</Button>
                <Button onClick={saveBreaks} loading={saving}>Spara raster</Button>
              </div>
            </div>
          )}

          {tab === 'timeoff' && (
            <div className="space-y-5">
              <div className="border border-line bg-white p-4">
                <p className="field-label mb-3">Lägg till ledighet / semester</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-stone">Start (lokal tid)</label>
                    <input type="datetime-local" className="field" value={offStart} onChange={(e) => setOffStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone">Slut (lokal tid)</label>
                    <input type="datetime-local" className="field" value={offEnd} onChange={(e) => setOffEnd(e.target.value)} />
                  </div>
                </div>
                <input className="field mt-3" placeholder="Anledning (valfritt)" value={offReason} onChange={(e) => setOffReason(e.target.value)} />
                <div className="mt-3 flex justify-end"><Button onClick={addTimeOff} loading={saving} className="px-3 py-1.5 text-xs"><Plus size={13} /> Lägg till</Button></div>
              </div>

              <div>
                <p className="field-label mb-2">Inlagd ledighet</p>
                {(staff.timeOffs ?? []).length === 0 ? (
                  <p className="text-sm text-stone-light">Ingen ledighet inlagd.</p>
                ) : (
                  <div className="divide-y divide-line border border-line">
                    {(staff.timeOffs ?? []).map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm text-ink">{formatLocalDateTime(t.startsAt, DEFAULT_TZ)} → {formatLocalDateTime(t.endsAt, DEFAULT_TZ)}</p>
                          {t.reason && <p className="text-xs text-stone">{t.reason}</p>}
                        </div>
                        <button onClick={() => removeTimeOff(t.id)} aria-label="Ta bort ledighet" className="p-2 text-stone hover:text-[#b23b3b]"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}