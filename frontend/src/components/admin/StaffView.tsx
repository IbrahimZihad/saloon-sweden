'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Pencil, Plus, UserX } from 'lucide-react';
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
  Toggle,
} from '@/components/admin/ui';
import { StaffScheduleModal } from '@/components/admin/StaffScheduleModal';
import { MediaImage } from '@/components/ui/MediaImage';
import { useAdminText } from '@/lib/admin-i18n';
import type { AdminService, AdminStaff } from '@/lib/types';

interface FormState {
  name: string;
  slug: string;
  email: string;
  phone: string;
  jobTitle: string;
  bio: string;
  imageUrl: string;
  active: boolean;
  serviceIds: string[];
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  email: '',
  phone: '',
  jobTitle: '',
  bio: '',
  imageUrl: '',
  active: true,
  serviceIds: [],
};

export function StaffView() {
  const tr = useAdminText();
  const [items, setItems] = useState<AdminStaff[] | null>(null);
  const [services, setServices] = useState<AdminService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminStaff | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(() => {
    Promise.all([adminApi.staff(), adminApi.services()])
      .then(([staff, svc]) => {
        setItems(staff);
        setServices(svc);
      })
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta personal.'));
  }, []);

  useEffect(load, [load]);

  function openNew() {
    setForm(EMPTY);
    setFormError(null);
    setEditing('new');
  }

  function openEdit(s: AdminStaff) {
    setForm({
      name: s.name,
      slug: s.slug,
      email: s.email,
      phone: s.phone ?? '',
      jobTitle: s.jobTitle,
      bio: s.bio ?? '',
      imageUrl: s.imageUrl ?? '',
      active: s.active,
      serviceIds: s.services.map((x) => x.serviceId),
    });
    setFormError(null);
    setEditing(s);
  }

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        jobTitle: form.jobTitle,
        bio: form.bio || undefined,
        imageUrl: form.imageUrl || undefined,
        active: form.active,
        serviceIds: form.serviceIds,
      };
      if (editing === 'new') await adminApi.createStaff({ ...body, slug: form.slug });
      else if (editing) await adminApi.updateStaff(editing.id, body);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Kunde inte spara.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(s: AdminStaff) {
    if (!confirm(tr(`Avaktivera "{name}"? Personen döljs från bokningen men historiken behålls.`).replace('{name}', s.name))) return;
    setError(null);
    try {
      await adminApi.deactivateStaff(s.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte avaktivera.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Personal"
        subtitle="Hantera stylister, deras tjänster och arbetsscheman."
        action={<Button onClick={openNew}><Plus size={16} /> Ny personal</Button>}
      />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message="Ingen personal upplagd ännu." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <Card key={s.id} className="flex h-full flex-col p-6">
              <div className="flex min-h-16 items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-cream">
                  {s.imageUrl ? (
                    <MediaImage src={s.imageUrl} alt={s.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-serif text-2xl text-gold-dark">
                      {s.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-serif text-xl text-ink">{s.name}</h2>
                    {!s.active && <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-stone-light">{tr('Inaktiv')}</span>}
                  </div>
                  <p className="text-sm text-gold-dark">{s.jobTitle}</p>
                  <p className="truncate text-xs text-stone">{s.email}</p>
                </div>
              </div>
              <div className="mt-4 min-h-11 content-start flex flex-wrap gap-1">
                {s.services.slice(0, 4).map((x) => (
                  <span key={x.serviceId} className="bg-cream px-2 py-0.5 text-[0.65rem] text-stone">{x.service.nameSv}</span>
                ))}
                {s.services.length > 4 && <span className="px-2 py-0.5 text-[0.65rem] text-stone-light">+{s.services.length - 4}</span>}
                {s.services.length === 0 && <span className="text-xs text-stone-light">{tr('Inga tjänster tilldelade')}</span>}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                <Button variant="outline" onClick={() => openEdit(s)} className="flex-1 px-3 py-1.5 text-xs"><Pencil size={13} /> Redigera</Button>
                <Button variant="outline" onClick={() => setSchedule({ id: s.id, name: s.name })} className="flex-1 px-3 py-1.5 text-xs"><CalendarClock size={13} /> Schema</Button>
                <button onClick={() => deactivate(s)} aria-label={tr('Avaktivera')} className="p-2 text-stone hover:text-[#b23b3b]"><UserX size={16} strokeWidth={1.5} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Ny personal' : 'Redigera personal'} wide>
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Namn">
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            {editing === 'new' ? (
              <Field label="Slug (kebab-case)">
                <input className="field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="anna" />
              </Field>
            ) : (
              <Field label="Slug">
                <input className="field bg-cream/60 font-mono text-xs" value={form.slug} disabled />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-post">
              <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefon (valfritt)">
              <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Yrkestitel">
            <input className="field" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Senior stylist" />
          </Field>
          <Field label="Biografi (valfritt)">
            <textarea className="field min-h-24" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <ImageField label="Profilbild" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />

          <div>
            <p className="field-label mb-2">{tr('Tilldelade tjänster')}</p>
            {services.length === 0 ? (
              <p className="text-sm text-stone-light">{tr('Skapa tjänster först för att tilldela dem.')}</p>
            ) : (
              <div className="grid max-h-48 gap-1 overflow-y-auto border border-line bg-white p-3 sm:grid-cols-2">
                {services.map((svc) => (
                  <label key={svc.id} className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
                    <input
                      type="checkbox"
                      className="accent-gold"
                      checked={form.serviceIds.includes(svc.id)}
                      onChange={() => toggleService(svc.id)}
                    />
                    <span className={svc.active ? '' : 'text-stone-light'}>{svc.nameSv}{!svc.active && ' (dold)'}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Aktiv (visas i bokningen)" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Avbryt</Button>
            <Button onClick={save} loading={saving}>Spara</Button>
          </div>
        </div>
      </Modal>

      {schedule && (
        <StaffScheduleModal
          staffId={schedule.id}
          staffName={schedule.name}
          onClose={() => setSchedule(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}