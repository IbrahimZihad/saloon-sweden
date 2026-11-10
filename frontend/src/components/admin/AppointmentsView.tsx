'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Search } from 'lucide-react';
import { adminApi, type AppointmentFilter } from '@/lib/admin-api';
import { AppointmentDetailModal } from '@/components/admin/AppointmentDetailModal';
import { NewAppointmentModal } from '@/components/admin/NewAppointmentModal';
import { Card, EmptyState, ErrorNote, PageHeader, Spinner, StatusBadge, Td, Th } from '@/components/admin/ui';
import { DEFAULT_TZ, formatLocalDate, formatLocalTime, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAdminText } from '@/lib/admin-i18n';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { AdminService, AdminStaff, Appointment, AppointmentStatus, Paginated } from '@/lib/types';

const STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Väntande', CONFIRMED: 'Bekräftad', COMPLETED: 'Genomförd', CANCELLED: 'Avbokad', NO_SHOW: 'Utebliven',
};

function monthRange(y: number, m: number): { from: string; to: string } {
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

export function AppointmentsView() {
  const tr = useAdminText();
  const { lang } = useLanguage();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<AppointmentFilter>({});
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Paginated<Appointment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [monthData, setMonthData] = useState<Appointment[]>([]);

  useEffect(() => {
    adminApi.staff().then(setStaff).catch(() => undefined);
    adminApi.services().then(setServices).catch(() => undefined);
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .appointments({ ...filter, page, limit: 15 })
      .then(setList)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta bokningar.'))
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => {
    if (view === 'list') loadList();
  }, [view, loadList]);

  useEffect(() => {
    if (view !== 'calendar') return;
    const { from, to } = monthRange(month.y, month.m);
    setLoading(true);
    adminApi
      .appointments({ from, to, limit: 200 })
      .then((res) => setMonthData(res.data))
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta kalender.'))
      .finally(() => setLoading(false));
  }, [view, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of monthData) {
      const key = formatInTimeZone(new Date(a.startsAt), DEFAULT_TZ, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [monthData]);

  const setFilterField = (patch: Partial<AppointmentFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const firstWeekday = (new Date(month.y, month.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(lang === 'sv' ? 'sv-SE' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(month.y, month.m, 1));

  return (
    <div>
      <PageHeader
        title="Bokningar"
        subtitle="Hantera bokningar — bekräfta, omboka, avboka eller skapa manuellt."
        action={
          <button onClick={() => setShowNew(true)} className="btn btn-primary !py-2.5">
            <Plus size={15} strokeWidth={1.5} /> {tr('Ny bokning')}
          </button>
        }
      />

      {/* Filters */}
      <Card className="mb-6 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
          <input
            className="field !pl-9"
            placeholder={tr('Sök namn, telefon, e-post eller referens…')}
            value={filter.search ?? ''}
            onChange={(e) => setFilterField({ search: e.target.value })}
          />
        </div>
        <select className="field" value={filter.status ?? ''} onChange={(e) => setFilterField({ status: (e.target.value || undefined) as AppointmentStatus | undefined })}>
          <option value="">{tr('Alla statusar')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tr(STATUS_LABEL[s])}</option>)}
        </select>
        <select className="field" value={filter.staffId ?? ''} onChange={(e) => setFilterField({ staffId: e.target.value || undefined })}>
          <option value="">{tr('Alla stylister')}</option>
          {staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="date" className="field" value={filter.date ?? ''} onChange={(e) => setFilterField({ date: e.target.value || undefined })} />
        <div className="flex border border-line">
          <button onClick={() => setView('list')} className={cn('flex items-center gap-2 px-4 py-2 text-xs', view === 'list' ? 'bg-charcoal text-ivory' : 'text-stone')} aria-label={tr('Listvy')}>
            <List size={15} /> {tr('Lista')}
          </button>
          <button onClick={() => setView('calendar')} className={cn('flex items-center gap-2 px-4 py-2 text-xs', view === 'calendar' ? 'bg-charcoal text-ivory' : 'text-stone')} aria-label={tr('Kalendervy')}>
            <CalendarDays size={15} /> {tr('Kalender')}
          </button>
        </div>
      </Card>

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      {view === 'list' ? (
        <Card>
          {loading ? (
            <Spinner />
          ) : !list || list.data.length === 0 ? (
            <EmptyState message="Inga bokningar matchar filtret." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-cream/60">
                    <tr><Th>Datum & tid</Th><Th>Kund</Th><Th>Tjänst</Th><Th>Stylist</Th><Th>Pris</Th><Th>Status</Th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.data.map((a) => (
                      <tr key={a.id} onClick={() => setDetailId(a.id)} className="cursor-pointer transition-colors hover:bg-cream/50">
                        <Td>
                          <span className="block capitalize">{formatLocalDate(a.startsAt, DEFAULT_TZ)}</span>
                          <span className="text-xs tabular-nums text-stone">{formatLocalTime(a.startsAt, DEFAULT_TZ)}–{formatLocalTime(a.endsAt, DEFAULT_TZ)}</span>
                        </Td>
                        <Td>
                          <span className="block">{a.customer.fullName}</span>
                          <span className="text-xs text-stone">{a.customer.phone}</span>
                        </Td>
                        <Td className="max-w-[200px] truncate text-stone">{a.services.map((s) => s.serviceNameSv).join(', ')}</Td>
                        <Td className="text-stone">{a.staff.name}</Td>
                        <Td className="tabular-nums">{formatMoney(a.totalPrice)}</Td>
                        <Td><StatusBadge status={a.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-stone">
                <span>{tr('Sida')} {list.page} {tr('av')} {list.totalPages} · {list.total} {tr('bokningar')}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-outline !px-3 !py-1.5 disabled:opacity-30"><ChevronLeft size={15} /></button>
                  <button disabled={page >= list.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-outline !px-3 !py-1.5 disabled:opacity-30"><ChevronRight size={15} /></button>
                </div>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setMonth((v) => { const t = v.y * 12 + v.m - 1; return { y: Math.floor(t / 12), m: t % 12 }; })} className="btn btn-outline !px-3 !py-2"><ChevronLeft size={15} /></button>
            <p className="font-serif text-xl capitalize">{monthLabel}</p>
            <button onClick={() => setMonth((v) => { const t = v.y * 12 + v.m + 1; return { y: Math.floor(t / 12), m: t % 12 }; })} className="btn btn-outline !px-3 !py-2"><ChevronRight size={15} /></button>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((d) => (
                <span key={d} className="pb-2 text-center text-[0.65rem] uppercase tracking-[0.12em] text-stone-light">{tr(d)}</span>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => <span key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const items = byDay.get(key) ?? [];
                return (
                  <button
                    key={day}
                    onClick={() => { setFilterField({ date: key }); setView('list'); }}
                    className="min-h-[84px] border border-line p-1.5 text-left align-top transition-colors hover:border-gold"
                  >
                    <span className="text-xs tabular-nums text-stone">{day}</span>
                    <span className="mt-1 block space-y-1">
                      {items.slice(0, 3).map((a) => (
                        <span key={a.id} className="block truncate bg-cream px-1 py-0.5 text-[0.6rem] text-charcoal">
                          {formatLocalTime(a.startsAt, DEFAULT_TZ)} {a.customer.fullName}
                        </span>
                      ))}
                      {items.length > 3 && <span className="block text-[0.6rem] text-gold-dark">+{items.length - 3} {tr('till')}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <AppointmentDetailModal appointmentId={detailId} onClose={() => setDetailId(null)} onChanged={() => { loadList(); if (view === 'calendar') setMonth((m) => ({ ...m })); }} />
      <NewAppointmentModal open={showNew} onClose={() => setShowNew(false)} services={services} staff={staff} onCreated={() => { setShowNew(false); loadList(); }} />
    </div>
  );
}