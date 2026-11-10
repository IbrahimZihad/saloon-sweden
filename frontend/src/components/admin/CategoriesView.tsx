'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Modal,
  PageHeader,
  Spinner,
  Td,
  Th,
  Toggle,
} from '@/components/admin/ui';
import { useAdminText } from '@/lib/admin-i18n';
import type { ServiceCategory } from '@/lib/types';

type AdminCategory = ServiceCategory & { _count?: { services: number } };

interface FormState {
  slug: string;
  nameSv: string;
  nameEn: string;
  sortOrder: number;
  active: boolean;
}

const EMPTY: FormState = { slug: '', nameSv: '', nameEn: '', sortOrder: 0, active: true };

export function CategoriesView() {
  const tr = useAdminText();
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi
      .categories()
      .then((data) => setItems(data as AdminCategory[]))
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta kategorier.'));
  }, []);

  useEffect(load, [load]);

  function openNew() {
    setForm(EMPTY);
    setFormError(null);
    setEditing('new');
  }

  function openEdit(c: AdminCategory) {
    setForm({ slug: c.slug, nameSv: c.nameSv, nameEn: c.nameEn, sortOrder: c.sortOrder, active: c.active });
    setFormError(null);
    setEditing(c);
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      if (editing === 'new') {
        await adminApi.createCategory({ ...form });
      } else if (editing) {
        const { slug: _slug, ...rest } = form;
        await adminApi.updateCategory(editing.id, rest);
      }
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Kunde inte spara.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: AdminCategory) {
    if (!confirm(tr(`Ta bort kategorin "{name}"? Detta går endast om den saknar tjänster.`).replace('{name}', c.nameSv))) return;
    setDeleting(c.id);
    setError(null);
    try {
      await adminApi.deleteCategory(c.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ta bort.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kategorier"
        subtitle="Gruppera tjänster i kategorier som visas på webbplatsen."
        action={<Button onClick={openNew}><Plus size={16} /> Ny kategori</Button>}
      />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message="Inga kategorier ännu. Skapa den första för att börja lägga till tjänster." />
      ) : (
        <Card>
          <table className="w-full">
            <thead className="bg-cream/60">
              <tr>
                <Th>Kategori</Th>
                <Th>Slug</Th>
                <Th className="text-center">Tjänster</Th>
                <Th className="text-center">Ordning</Th>
                <Th>Status</Th>
                <Th className="text-right">Åtgärder</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <span className="text-ink">{c.nameSv}</span>
                    <span className="block text-xs text-stone-light">{c.nameEn}</span>
                  </Td>
                  <Td className="font-mono text-xs text-stone">{c.slug}</Td>
                  <Td className="text-center tabular-nums">{c._count?.services ?? 0}</Td>
                  <Td className="text-center tabular-nums text-stone">{c.sortOrder}</Td>
                  <Td>
                    <span className={c.active ? 'text-[#3e6b4f]' : 'text-stone-light'}>
                      {c.active ? 'Aktiv' : 'Dold'}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} aria-label={tr('Redigera')} className="p-2 text-stone hover:text-ink">
                        <Pencil size={15} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        disabled={deleting === c.id}
                        aria-label={tr('Ta bort')}
                        className="p-2 text-stone hover:text-[#b23b3b] disabled:opacity-40"
                      >
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

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Ny kategori' : 'Redigera kategori'}
      >
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          {editing === 'new' && (
            <Field label="Slug (kebab-case, t.ex. haircuts)">
              <input
                className="field"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="haircuts"
              />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Namn (svenska)">
              <input className="field" value={form.nameSv} onChange={(e) => setForm({ ...form, nameSv: e.target.value })} />
            </Field>
            <Field label="Namn (engelska)">
              <input className="field" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            </Field>
          </div>
          <Field label="Sorteringsordning">
            <input
              type="number"
              min={0}
              className="field"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </Field>
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