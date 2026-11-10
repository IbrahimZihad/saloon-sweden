'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  ImageField,
  Modal,
  PageHeader,
  Spinner,
  Td,
  Th,
  Toggle,
} from '@/components/admin/ui';
import { MediaImage } from '@/components/ui/MediaImage';
import { formatDuration, formatMoney } from '@/lib/format';
import { useAdminText } from '@/lib/admin-i18n';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { AdminService, ServiceCategory } from '@/lib/types';

interface FormState {
  categoryId: string;
  slug: string;
  nameSv: string;
  nameEn: string;
  descriptionSv: string;
  descriptionEn: string;
  price: string;
  durationMinutes: number;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
}

const EMPTY: FormState = {
  categoryId: '',
  slug: '',
  nameSv: '',
  nameEn: '',
  descriptionSv: '',
  descriptionEn: '',
  price: '',
  durationMinutes: 60,
  imageUrl: '',
  active: true,
  sortOrder: 0,
};

export function ServicesView() {
  const tr = useAdminText();
  const { lang } = useLanguage();
  const [items, setItems] = useState<AdminService[] | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminService | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([adminApi.services(), adminApi.categories()])
      .then(([services, cats]) => {
        setItems(services);
        setCategories(cats);
      })
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta tjänster.'));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(
    () => (items ?? []).filter((s) => !filter || s.categoryId === filter),
    [items, filter],
  );

  function openNew() {
    setForm({ ...EMPTY, categoryId: filter || categories[0]?.id || '' });
    setFormError(null);
    setEditing('new');
  }

  function openEdit(s: AdminService) {
    setForm({
      categoryId: s.categoryId,
      slug: s.slug,
      nameSv: s.nameSv,
      nameEn: s.nameEn,
      descriptionSv: s.descriptionSv ?? '',
      descriptionEn: s.descriptionEn ?? '',
      price: String(s.price),
      durationMinutes: s.durationMinutes,
      imageUrl: s.imageUrl ?? '',
      active: s.active,
      sortOrder: s.sortOrder,
    });
    setFormError(null);
    setEditing(s);
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        categoryId: form.categoryId,
        nameSv: form.nameSv,
        nameEn: form.nameEn,
        descriptionSv: form.descriptionSv || undefined,
        descriptionEn: form.descriptionEn || undefined,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        imageUrl: form.imageUrl || undefined,
        active: form.active,
        sortOrder: Number(form.sortOrder),
      };
      if (editing === 'new') await adminApi.createService({ ...body, slug: form.slug });
      else if (editing) await adminApi.updateService(editing.id, body);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Kunde inte spara.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: AdminService) {
    if (!confirm(tr('Ta bort tjänsten "{name}"? Tjänster med bokningshistorik kan endast avaktiveras.').replace('{name}', s.nameSv))) return;
    setError(null);
    try {
      await adminApi.deleteService(s.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ta bort.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Tjänster"
        subtitle="Hantera tjänster, priser och längd."
        action={<Button onClick={openNew} disabled={categories.length === 0}><Plus size={16} /> Ny tjänst</Button>}
      />

      {categories.length === 0 && items && (
        <div className="mb-4"><ErrorNote message="Skapa minst en kategori innan du lägger till tjänster." /></div>
      )}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip label="Alla" active={filter === ''} onClick={() => setFilter('')} />
          {categories.map((c) => (
            <FilterChip key={c.id} label={lang === 'en' ? c.nameEn : c.nameSv} active={filter === c.id} onClick={() => setFilter(c.id)} />
          ))}
        </div>
      )}

      {!items ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState message="Inga tjänster i denna kategori." />
      ) : (
        <Card>
          <table className="w-full">
            <thead className="bg-cream/60">
              <tr>
                <Th>Tjänst</Th>
                <Th>Kategori</Th>
                <Th className="text-right">Pris</Th>
                <Th className="text-center">Längd</Th>
                <Th className="text-center">Personal</Th>
                <Th>Status</Th>
                <Th className="text-right">Åtgärder</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {s.imageUrl && (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-line">
                          <MediaImage src={s.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      )}
                      <div>
                        <span className="text-ink">{lang === 'en' ? s.nameEn : s.nameSv}</span>
                        <span className="block text-xs text-stone-light">{lang === 'en' ? s.nameSv : s.nameEn}</span>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-stone">{lang === 'en' ? s.category?.nameEn : s.category?.nameSv}</Td>
                  <Td className="text-right tabular-nums text-ink">{formatMoney(s.price)}</Td>
                  <Td className="text-center tabular-nums text-stone">{formatDuration(s.durationMinutes)}</Td>
                  <Td className="text-center tabular-nums text-stone">{s._count?.staff ?? 0}</Td>
                  <Td>
                    <span className={s.active ? 'text-[#3e6b4f]' : 'text-stone-light'}>{s.active ? 'Aktiv' : 'Dold'}</span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)} aria-label={tr('Redigera')} className="p-2 text-stone hover:text-ink">
                        <Pencil size={15} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => remove(s)} aria-label={tr('Ta bort')} className="p-2 text-stone hover:text-[#b23b3b]">
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Ny tjänst' : 'Redigera tjänst'} wide>
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <select className="field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{lang === 'en' ? c.nameEn : c.nameSv}</option>)}
              </select>
            </Field>
            {editing === 'new' ? (
              <Field label="Slug (kebab-case)">
                <input className="field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="womens-haircut" />
              </Field>
            ) : (
              <Field label="Slug">
                <input className="field bg-cream/60 font-mono text-xs" value={form.slug} disabled />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Namn (svenska)">
              <input className="field" value={form.nameSv} onChange={(e) => setForm({ ...form, nameSv: e.target.value })} />
            </Field>
            <Field label="Namn (engelska)">
              <input className="field" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            </Field>
          </div>
          <Field label="Beskrivning (svenska)">
            <textarea className="field min-h-20" value={form.descriptionSv} onChange={(e) => setForm({ ...form, descriptionSv: e.target.value })} />
          </Field>
          <Field label="Beskrivning (engelska)">
            <textarea className="field min-h-20" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Pris (SEK)">
              <input type="number" min={0} step="0.01" className="field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Längd (minuter)">
              <input type="number" min={5} max={480} className="field" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Sorteringsordning">
              <input type="number" min={0} className="field" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </Field>
          </div>
          <ImageField label="Bild" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Aktiv (visas på webbplatsen)" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Avbryt</Button>
            <Button onClick={save} loading={saving}>Spara</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const tr = useAdminText();
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'border border-gold bg-gold/15 px-4 py-1.5 text-xs uppercase tracking-[0.1em] text-gold-dark'
          : 'border border-line bg-white px-4 py-1.5 text-xs uppercase tracking-[0.1em] text-stone hover:border-gold/50'
      }
    >
      {tr(label)}
    </button>
  );
}