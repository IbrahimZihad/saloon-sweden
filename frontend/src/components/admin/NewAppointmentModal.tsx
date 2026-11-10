'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi, type CreateAdminAppointmentInput } from '@/lib/admin-api';
import { SlotPicker } from '@/components/admin/SlotPicker';
import { ErrorNote, Field, Modal } from '@/components/admin/ui';
import { cn } from '@/lib/utils';
import { useAdminText } from '@/lib/admin-i18n';
import type { AdminService, AdminStaff, Appointment, AppointmentSource, AppointmentStatus, TimeSlot } from '@/lib/types';

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (a: Appointment) => void;
  services: AdminService[];
  staff: AdminStaff[];
}

export function NewAppointmentModal({ open, onClose, onCreated, services, staff }: NewAppointmentModalProps) {
  const tr = useAdminText();
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState('');
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [source, setSource] = useState<AppointmentSource>('PHONE');
  const [status, setStatus] = useState<AppointmentStatus>('CONFIRMED');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const qualified = staff.filter((m) => m.active && serviceIds.every((id) => m.services.some((s) => s.serviceId === id)));

  const reset = () => {
    setServiceIds([]); setStaffId(''); setSlot(null); setFullName(''); setEmail(''); setPhone('');
    setNotes(''); setInternalNotes(''); setSource('PHONE'); setStatus('CONFIRMED'); setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) { setError('Välj en tid.'); return; }
    if (!staffId && !slot.staffId) { setError('Välj en stylist.'); return; }
    setBusy(true);
    setError(null);
    const input: CreateAdminAppointmentInput = {
      serviceIds,
      staffId: slot.staffId || staffId,
      startsAt: slot.startsAt,
      fullName, email, phone,
      notes: notes || undefined,
      internalNotes: internalNotes || undefined,
      source, status,
    };
    try {
      const created = await adminApi.createAppointment(input);
      reset();
      onCreated(created);
    } catch (err) {
      setError((err as Error)?.message ?? 'Kunde inte skapa bokning.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ny bokning (telefon/admin)" wide>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="field-label">{tr('Tjänster')}</label>
          <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
            {services.filter((s) => s.active).map((s) => (
              <label key={s.id} className={cn('flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm', serviceIds.includes(s.id) ? 'border-gold bg-cream' : 'border-line')}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#b0925a]"
                  checked={serviceIds.includes(s.id)}
                  onChange={() => { setSlot(null); setServiceIds((p) => p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]); }}
                />
                {s.nameSv}
              </label>
            ))}
          </div>
        </div>

        <Field label="Stylist">
          <select className="field" value={staffId} onChange={(e) => { setStaffId(e.target.value); setSlot(null); }}>
            <option value="">{tr('Välj stylist…')}</option>
            {qualified.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>

        <SlotPicker serviceIds={serviceIds} staffId={staffId || undefined} value={slot?.startsAt ?? null} onChange={setSlot} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Namn"><input className="field" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="E-post"><input type="email" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Telefon"><input className="field" required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Källa">
            <select className="field" value={source} onChange={(e) => setSource(e.target.value as AppointmentSource)}>
              <option value="PHONE">{tr('Telefon')}</option>
              <option value="ADMIN">{tr('Admin')}</option>
              <option value="ONLINE">{tr('Online')}</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
              <option value="CONFIRMED">{tr('Bekräftad')}</option>
              <option value="PENDING">{tr('Väntande')}</option>
            </select>
          </Field>
        </div>
        <Field label="Kundanteckning"><textarea rows={2} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Field label="Intern anteckning"><textarea rows={2} className="field" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} /></Field>

        {error && <ErrorNote message={error} />}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost">{tr('Avbryt')}</button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy && <Loader2 size={15} className="animate-spin" />} Skapa bokning
          </button>
        </div>
      </form>
    </Modal>
  );
}