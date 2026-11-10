'use client';

import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { publicApi } from '@/lib/api';
import { DEFAULT_TZ } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ErrorNote, Spinner } from '@/components/admin/ui';
import { useAdminText } from '@/lib/admin-i18n';
import type { TimeSlot } from '@/lib/types';

interface SlotPickerProps {
  serviceIds: string[];
  staffId?: string;
  value: string | null;
  onChange: (slot: TimeSlot) => void;
  tz?: string;
}

export function SlotPicker({ serviceIds, staffId, value, onChange, tz = DEFAULT_TZ }: SlotPickerProps) {
  const tr = useAdminText();
  const [date, setDate] = useState(() => formatInTimeZone(new Date(), tz, 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = serviceIds.join(',');

  useEffect(() => {
    if (serviceIds.length === 0 || !date) {
      setSlots([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    publicApi
      .slots(serviceIds, date, staffId, controller.signal)
      .then((res) => setSlots(res.slots))
      .catch((e) => {
        if (!controller.signal.aborted) {
          setSlots([]);
          setError(e?.message ?? 'Kunde inte hämta tider.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, date, staffId]);

  return (
    <div>
      <label className="field-label">{tr('Datum')}</label>
      <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="mt-4">
        {serviceIds.length === 0 ? (
          <p className="text-sm text-stone-light">{tr('Välj tjänst först.')}</p>
        ) : loading ? (
          <Spinner label="Hämtar tider…" />
        ) : error ? (
          <ErrorNote message={error} />
        ) : slots.length === 0 ? (
          <p className="text-sm text-stone-light">{tr('Inga lediga tider detta datum.')}</p>
        ) : (
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
            {slots.map((s) => (
              <button
                key={`${s.startsAt}-${s.staffId}`}
                type="button"
                onClick={() => onChange(s)}
                className={cn(
                  'border px-2 py-2 text-center text-xs tabular-nums transition-colors',
                  value === s.startsAt
                    ? 'border-charcoal bg-charcoal text-ivory'
                    : 'border-line bg-white hover:border-sand-dark',
                )}
              >
                {s.startTime}
                <span className="block truncate text-[0.6rem] opacity-70">{s.staffName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}