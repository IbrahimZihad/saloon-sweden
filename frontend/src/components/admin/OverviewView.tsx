'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarCheck, CalendarClock, Clock, TrendingUp, Wallet } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { Card, EmptyState, ErrorNote, PageHeader, Spinner, StatusBadge, Td, Th } from '@/components/admin/ui';
import { formatLocalTime, formatMoney } from '@/lib/format';
import { DEFAULT_TZ } from '@/lib/format';
import { useAdminText } from '@/lib/admin-i18n';
import type { DashboardOverview } from '@/lib/types';

export function OverviewView() {
  const tr = useAdminText();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta översikt.'));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Spinner />;

  const chart = data.statistics.daily.map((d) => ({
    date: d.date.slice(5),
    [tr('Bokningar')]: d.bookings,
    [tr('Intäkter')]: d.revenue,
  }));

  return (
    <div>
      <PageHeader title="Översikt" subtitle={`${tr('Dagens datum')}: ${data.today.date}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarCheck} label={tr('Bokningar idag')} value={String(data.today.total)} />
        <Stat icon={CalendarClock} label={tr('Kommande')} value={String(data.totals.upcoming)} />
        <Stat icon={TrendingUp} label={tr('Bokningar 30 dagar')} value={String(data.statistics.monthlyBookings)} />
        <Stat icon={Wallet} label={tr('Intäkter (genomförda)')} value={formatMoney(data.revenue.completedTotal)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const).map((s) => (
          <Card key={s} className="p-4">
            <StatusBadge status={s} />
            <p className="mt-3 font-serif text-2xl text-ink">{data.totals[s]}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp size={17} strokeWidth={1.5} className="text-gold-dark" />
          <h2 className="font-serif text-xl">{tr('Bokningar senaste 30 dagarna')}</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b0925a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#b0925a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4dccf" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a9184' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#9a9184' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ border: '1px solid #e4dccf', borderRadius: 0, fontSize: 12 }} />
              <Area type="monotone" dataKey={tr('Bokningar')} stroke="#b0925a" strokeWidth={2} fill="url(#goldFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-serif text-xl">{tr('Dagens bokningar')}</h2>
            <Link href="/admin/appointments" className="text-xs uppercase tracking-[0.14em] text-gold-dark hover:text-ink">
              {tr('Alla')}
            </Link>
          </div>
          {data.today.appointments.length === 0 ? (
            <EmptyState message="Inga bokningar idag." />
          ) : (
            <table className="w-full">
              <thead className="bg-cream/60">
                <tr><Th>Tid</Th><Th>Kund</Th><Th>Stylist</Th><Th>Status</Th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.today.appointments.map((a) => (
                  <tr key={a.id}>
                    <Td className="tabular-nums">{formatLocalTime(a.startsAt, DEFAULT_TZ)}</Td>
                    <Td>{a.customer.fullName}</Td>
                    <Td className="text-stone">{a.staff.name}</Td>
                    <Td><StatusBadge status={a.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-line px-6 py-4">
            <Clock size={17} strokeWidth={1.5} className="text-gold-dark" />
            <h2 className="font-serif text-xl">{tr('Närmast kommande')}</h2>
          </div>
          {data.upcoming.length === 0 ? (
            <EmptyState message="Inga kommande bokningar." />
          ) : (
            <ul className="divide-y divide-line">
              {data.upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm text-ink">{a.customer.fullName}</p>
                    <p className="mt-0.5 text-xs text-stone">
                      {a.services.map((s) => s.serviceNameSv).join(', ')} · {a.staff.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-stone">
                    {formatLocalTime(a.startsAt, DEFAULT_TZ)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold/40 bg-cream text-gold-dark">
        <Icon size={19} strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p className="min-h-5 text-sm leading-5 text-stone">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold leading-8 tabular-nums text-ink">{value}</p>
      </div>
    </Card>
  );
}