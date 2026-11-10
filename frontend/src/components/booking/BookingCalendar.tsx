'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  availableDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
  minDate: string;
  maxDate: string;
}

function parse(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m: m - 1, d };
}

function toStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function BookingCalendar({ availableDates, selected, onSelect, minDate, maxDate }: BookingCalendarProps) {
  const { t, lang } = useLanguage();
  const initial = parse(selected ?? minDate);
  const [view, setView] = useState({ y: initial.y, m: initial.m });

  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const min = parse(minDate);
  const max = parse(maxDate);

  const monthLabel = new Intl.DateTimeFormat(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(view.y, view.m, 1));

  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const canPrev = view.y > min.y || (view.y === min.y && view.m > min.m);
  const canNext = view.y < max.y || (view.y === max.y && view.m < max.m);

  const shift = (delta: number) => {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: total % 12 };
    });
  };

  return (
    <div className="card-luxe p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center border border-line text-stone transition-colors hover:border-charcoal hover:text-ink disabled:opacity-30"
        >
          <ChevronLeft size={17} strokeWidth={1.5} />
        </button>
        <p className="font-serif text-xl capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canNext}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center border border-line text-stone transition-colors hover:border-charcoal hover:text-ink disabled:opacity-30"
        >
          <ChevronRight size={17} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="pb-2 text-[0.65rem] uppercase tracking-[0.12em] text-stone-light">
            {t(`day.short.${i}`)}
          </span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toStr(view.y, view.m, day);
          const isAvailable = available.has(dateStr);
          const isSelected = selected === dateStr;
          return (
            <button
              key={day}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(dateStr)}
              className={cn(
                'aspect-square text-sm tabular-nums transition-colors',
                isSelected
                  ? 'bg-charcoal text-ivory'
                  : isAvailable
                    ? 'text-ink hover:bg-cream'
                    : 'cursor-not-allowed text-sand-dark line-through decoration-sand-dark/60',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}