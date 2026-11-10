'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Modal,
  PageHeader,
  Spinner,
  StatusBadge,
  Td,
  Th,
} from '@/components/admin/ui';
import { formatLocalDateTime, formatMoney, DEFAULT_TZ } from '@/lib/format';
import type { AdminCustomer, CustomerDetail, Paginated } from '@/lib/types';

export function CustomersView() {
  const { user } = useAdminAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [result, setResult] = useState<Paginated<AdminCustomer> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback((p: number, q: string) => {
    adminApi
      .customers(p, q || undefined)
      .then(setResult)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta kunder.'));
  }, []);

  useEffect(() => load(page, query), [load, page, query]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    setActionError(null);
    setDetail(null);
    try {
      setDetail(await adminApi.customer(id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Kunde inte hämta kund.');
      setDetailLoading(false);
    }
  }

  async function exportData(c: CustomerDetail) {
    setActionError(null);
    try {
      const data = await adminApi.exportCustomer(c.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-${c.id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Export misslyckades.');
    }
  }

  async function erase(c: CustomerDetail) {
    if (!confirm(`Anonymisera all persondata för "${c.fullName}"? Detta kan inte ångras (GDPR-radering). Bokningshistorik behålls anonymiserad.`)) return;
    setActionError(null);
    try {
      await adminApi.eraseCustomer(c.id);
      setDetail(null);
      setDetailLoading(false);
      load(page, query);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Radering misslyckades.');
    }
  }

  const modalOpen = detailLoading || detail !== null;

  return (
    <div>
      <PageHeader title="Kunder" subtitle="Kundregister och bokningshistorik." />

      <form onSubmit={submitSearch} className="mb-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" strokeWidth={1.5} />
          <input
            className="field pl-9"
            placeholder="Sök namn, e-post eller telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">Sök</Button>
      </form>

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!result ? (
        <Spinner />
      ) : result.data.length === 0 ? (
        <EmptyState message={query ? 'Inga kunder matchar sökningen.' : 'Inga kunder ännu.'} />
      ) : (
        <>
          <Card>
            <table className="w-full">
              <thead className="bg-cream/60">
                <tr>
                  <Th>Kund</Th>
                  <Th>Kontakt</Th>
                  <Th className="text-center">Besök</Th>
                  <Th>Senaste bokning</Th>
                  <Th className="text-right">Åtgärder</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.data.map((c) => {
                  const last = c.appointments?.[0];
                  return (
                    <tr key={c.id} className="cursor-pointer hover:bg-cream/40" onClick={() => openDetail(c.id)}>
                      <Td>
                        <span className="text-ink">{c.fullName}</span>
                        {c.marketingConsent && <span className="ml-2 text-[0.6rem] uppercase tracking-wide text-gold-dark">Marknadsföring</span>}
                      </Td>
                      <Td className="text-stone">
                        <span className="block">{c.email}</span>
                        <span className="block text-xs text-stone-light">{c.phone}</span>
                      </Td>
                      <Td className="text-center tabular-nums">{c._count.appointments}</Td>
                      <Td className="text-stone">
                        {last ? (
                          <span className="flex items-center gap-2">
                            <StatusBadge status={last.status} />
                            <span className="text-xs">{formatLocalDateTime(last.startsAt, DEFAULT_TZ)}</span>
                          </span>
                        ) : '—'}
                      </Td>
                      <Td className="text-right text-xs uppercase tracking-[0.1em] text-gold-dark">Visa</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {result.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-stone">Sida {result.page} av {result.totalPages} · {result.total} kunder</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs">Föregående</Button>
                <Button variant="outline" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs">Nästa</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setDetail(null); setDetailLoading(false); }} title={detail?.fullName ?? 'Kund'} wide>
        {detailLoading && !detail ? (
          <Spinner />
        ) : detail ? (
          <div className="space-y-6">
            {actionError && <ErrorNote message={actionError} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="E-post" value={detail.email} />
              <Info label="Telefon" value={detail.phone} />
              <Info label="Kund sedan" value={formatLocalDateTime(detail.createdAt, DEFAULT_TZ)} />
              <Info label="Marknadsföringssamtycke" value={detail.marketingConsent ? 'Ja' : 'Nej'} />
            </div>
            {detail.notes && (
              <div>
                <p className="field-label">Anteckningar</p>
                <p className="whitespace-pre-wrap text-sm text-charcoal">{detail.notes}</p>
              </div>
            )}

            <div>
              <p className="field-label mb-2">Bokningshistorik ({detail.appointments.length})</p>
              {detail.appointments.length === 0 ? (
                <p className="text-sm text-stone-light">Inga bokningar.</p>
              ) : (
                <div className="divide-y divide-line border border-line">
                  {detail.appointments.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-sm text-ink">{a.services.map((s) => s.serviceNameSv).join(', ')}</p>
                        <p className="text-xs text-stone">{formatLocalDateTime(a.startsAt, DEFAULT_TZ)} · {a.staff?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-stone">{formatMoney(a.totalPrice)}</span>
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-stone-light">GDPR-verktyg</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportData(detail)} className="px-3 py-1.5 text-xs">
                    <Download size={13} /> Exportera data
                  </Button>
                  <Button variant="danger" onClick={() => erase(detail)} className="px-3 py-1.5 text-xs">
                    <Trash2 size={13} /> Anonymisera
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          actionError && <ErrorNote message={actionError} />
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="text-sm text-charcoal">{value}</p>
    </div>
  );
}