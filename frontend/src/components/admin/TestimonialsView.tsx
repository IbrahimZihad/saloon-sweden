'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
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
  Toggle,
} from '@/components/admin/ui';
import { useAdminText } from '@/lib/admin-i18n';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { Testimonial } from '@/lib/types';

interface FormState {
  authorName: string;
  textSv: string;
  textEn: string;
  rating: number;
  sortOrder: number;
  active: boolean;
}

const EMPTY: FormState = { authorName: '', textSv: '', textEn: '', rating: 5, sortOrder: 0, active: true };

export function TestimonialsView() {
  const tr = useAdminText();
  const { lang } = useLanguage();
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi
      .testimonials()
      .then(setItems)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta omdömen.'));
  }, []);

  useEffect(load, [load]);

  function openNew() {
    setForm(EMPTY);
    setFormError(null);
    setEditing('new');
  }

  function openEdit(t: Testimonial) {
    setForm({
      authorName: t.authorName,
      textSv: t.textSv,
      textEn: t.textEn ?? '',
      rating: t.rating,
      sortOrder: t.sortOrder,
      active: t.active,
    });
    setFormError(null);
    setEditing(t);
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const body = { ...form, textEn: form.textEn || undefined };
      if (editing === 'new') await adminApi.createTestimonial(body);
      else if (editing) await adminApi.updateTestimonial(editing.id, body);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Kunde inte spara.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: Testimonial) {
    if (!confirm(tr(`Ta bort omdömet från "{name}"?`).replace('{name}', t.authorName))) return;
    setError(null);
    try {
      await adminApi.deleteTestimonial(t.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte ta bort.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Omdömen"
        subtitle="Kundomdömen som visas på startsidan."
        action={<Button onClick={openNew}><Plus size={16} /> Nytt omdöme</Button>}
      />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message="Inga omdömen ännu." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="flex flex-col p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < t.rating ? 'fill-gold' : 'text-sand-dark'} strokeWidth={1.5} />
                  ))}
                </div>
                <span className={t.active ? 'text-xs text-[#3e6b4f]' : 'text-xs text-stone-light'}>
                  {tr(t.active ? 'Aktiv' : 'Dold')}
                </span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal">“{lang === 'en' ? t.textEn ?? t.textSv : t.textSv}”</p>
              <p className="mt-4 font-serif text-lg text-ink">{t.authorName}</p>
              <div className="mt-4 flex items-center justify-end gap-1 border-t border-line pt-3">
                <button onClick={() => openEdit(t)} aria-label={tr('Redigera')} className="p-2 text-stone hover:text-ink">
                  <Pencil size={15} strokeWidth={1.5} />
                </button>
                <button onClick={() => remove(t)} aria-label={tr('Ta bort')} className="p-2 text-stone hover:text-[#b23b3b]">
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nytt omdöme' : 'Redigera omdöme'}>
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <Field label="Namn">
            <input className="field" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
          </Field>
          <Field label="Text (svenska)">
            <textarea className="field min-h-24" value={form.textSv} onChange={(e) => setForm({ ...form, textSv: e.target.value })} />
          </Field>
          <Field label="Text (engelska, valfritt)">
            <textarea className="field min-h-24" value={form.textEn} onChange={(e) => setForm({ ...form, textEn: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Betyg (1–5)">
              <input
                type="number"
                min={1}
                max={5}
                className="field"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
            </Field>
            <Field label="Sorteringsordning">
              <input
                type="number"
                min={0}
                className="field"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </Field>
          </div>
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