'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Mail, Phone, RotateCcw } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { Button, Card, EmptyState, ErrorNote, PageHeader, Spinner } from '@/components/admin/ui';
import { formatLocalDateTime, DEFAULT_TZ } from '@/lib/format';
import { useAdminText } from '@/lib/admin-i18n';
import type { ContactMessage, Paginated } from '@/lib/types';

export function MessagesView() {
  const tr = useAdminText();
  const [result, setResult] = useState<Paginated<ContactMessage> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    adminApi
      .contactMessages(p)
      .then(setResult)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta meddelanden.'));
  }, []);

  useEffect(() => load(page), [load, page]);

  async function toggle(m: ContactMessage) {
    setBusy(m.id);
    setError(null);
    try {
      await adminApi.markHandled(m.id);
      load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte uppdatera.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Meddelanden" subtitle="Förfrågningar från kontaktformuläret på webbplatsen." />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!result ? (
        <Spinner />
      ) : result.data.length === 0 ? (
        <EmptyState message="Inga meddelanden ännu." />
      ) : (
        <>
          <div className="space-y-4">
            {result.data.map((m) => (
              <Card key={m.id} className={m.handled ? 'p-6 opacity-70' : 'p-6'}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-xl text-ink">{m.name}</h2>
                      {m.handled && (
                        <span className="inline-flex items-center gap-1 bg-[#3e6b4f]/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-[#3e6b4f]">
                          <Check size={11} /> {tr('Hanterad')}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-gold-dark">
                        <Mail size={12} /> {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-gold-dark">
                          <Phone size={12} /> {m.phone}
                        </a>
                      )}
                      <span className="text-stone-light">{formatLocalDateTime(m.createdAt, DEFAULT_TZ)}</span>
                    </div>
                  </div>
                  <Button
                    variant={m.handled ? 'ghost' : 'outline'}
                    loading={busy === m.id}
                    onClick={() => toggle(m)}
                    className="px-3 py-1.5 text-xs"
                  >
                    {m.handled ? <><RotateCcw size={13} /> Markera oläst</> : <><Check size={13} /> Markera hanterad</>}
                  </Button>
                </div>
                <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-charcoal">
                  {m.message}
                </p>
              </Card>
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-stone">{tr('Sida')} {result.page} {tr('av')} {result.totalPages} · {result.total} {tr('meddelanden')}</p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-xs">Föregående</Button>
                <Button variant="outline" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-xs">Nästa</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}