'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { SlotPicker } from '@/components/admin/SlotPicker';
import { ErrorNote, Modal, Spinner, StatusBadge } from '@/components/admin/ui';
import { formatLocalDateTime, formatMoney } from '@/lib/format';
import { DEFAULT_TZ } from '@/lib/format';
import { useAdminText } from '@/lib/admin-i18n';
import type { Appointment, AppointmentStatus, TimeSlot } from '@/lib/types';

interface DetailProps {
  appointmentId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export function AppointmentDetailModal({ appointmentId, onClose, onChanged }: DetailProps) {
  const tr = useAdminText();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    if (!appointmentId) return;
    setAppointment(null);
    setError(null);
    adminApi
      .appointment(appointmentId)
      .then(setAppointment)
      .catch((e) => setError(e?.message ?? 'Kunde inte hämta bokning.'));
  }, [appointmentId]);

  useEffect(() => {
    setRescheduling(false);
    setCancelling(false);
    setNewSlot(null);
    setReason('');
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
      load();
      setRescheduling(false);
      setCancelling(false);
    } catch (e) {
      setError((e as Error)?.message ?? 'Åtgärden misslyckades.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status: AppointmentStatus) => act(() => adminApi.updateStatus(appointmentId!, status));
  const cancel = () => act(() => adminApi.cancel(appointmentId!, reason || undefined));
  const reschedule = () => {
    if (!newSlot) return;
    act(() => adminApi.reschedule(appointmentId!, newSlot.startsAt, newSlot.staffId));
  };

  const serviceIds = appointment?.services.map((s) => s.serviceId).filter((x): x is string => !!x) ?? [];

  return (
    <Modal open={!!appointmentId} onClose={onClose} title="Bokningsdetaljer" wide>
      {!appointment ? (
        error ? <ErrorNote message={error} /> : <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-serif text-2xl tracking-wide text-gold-dark">{appointment.bookingReference}</span>
            <StatusBadge status={appointment.status} />
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Kund">{appointment.customer.fullName}</Info>
            <Info label="Tid">
              <span className="capitalize">{formatLocalDateTime(appointment.startsAt, DEFAULT_TZ)}</span>
            </Info>
            <Info label="E-post">{appointment.customer.email}</Info>
            <Info label="Telefon">{appointment.customer.phone}</Info>
            <Info label="Stylist">{appointment.staff.name}</Info>
            <Info label="Pris">{formatMoney(appointment.totalPrice)}</Info>
            <Info label="Tjänster">
              {appointment.services.map((s) => s.serviceNameSv).join(', ')}
            </Info>
            <Info label="Källa">{appointment.source}</Info>
          </dl>

          {appointment.customerNotes && <Info label="Kundanteckning">{appointment.customerNotes}</Info>}
          {appointment.internalNotes && <Info label="Intern anteckning">{appointment.internalNotes}</Info>}
          {appointment.cancelReason && <Info label="Avbokningsorsak">{appointment.cancelReason}</Info>}

          {appointment.notifications && appointment.notifications.length > 0 && (
            <div>
              <p className="field-label">{tr('E-postutskick')}</p>
              <ul className="space-y-1 text-xs text-stone">
                {appointment.notifications.map((n) => (
                  <li key={n.id} className="flex justify-between gap-3">
                    <span>{n.type}</span>
                    <span className="uppercase tracking-[0.1em]">{n.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <ErrorNote message={error} />}

          {/* Reschedule */}
          {rescheduling && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
            <div className="border border-line bg-cream/50 p-4">
              <SlotPicker serviceIds={serviceIds} staffId={appointment.staffId} value={newSlot?.startsAt ?? null} onChange={setNewSlot} />
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setRescheduling(false)} className="btn btn-ghost !py-2">{tr('Avbryt')}</button>
                <button type="button" onClick={reschedule} disabled={!newSlot || busy} className="btn btn-primary !py-2">
                  {busy && <Loader2 size={14} className="animate-spin" />} Spara ny tid
                </button>
              </div>
            </div>
          )}

          {/* Cancel */}
          {cancelling && (
            <div className="border border-[#b23b3b]/30 bg-[#b23b3b]/5 p-4">
              <label className="field-label">{tr('Anledning (valfritt)')}</label>
              <textarea rows={2} className="field" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setCancelling(false)} className="btn btn-ghost !py-2">{tr('Avbryt')}</button>
                <button type="button" onClick={cancel} disabled={busy} className="btn !bg-[#b23b3b] !py-2 text-white hover:!bg-[#8f2f2f]">
                  {busy && <Loader2 size={14} className="animate-spin" />} Bekräfta avbokning
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!rescheduling && !cancelling && (
            <div className="flex flex-wrap gap-3 border-t border-line pt-5">
              {appointment.status === 'PENDING' && (
                <button onClick={() => setStatus('CONFIRMED')} disabled={busy} className="btn btn-primary !py-2.5">{tr('Bekräfta')}</button>
              )}
              {appointment.status === 'CONFIRMED' && (
                <>
                  <button onClick={() => setStatus('COMPLETED')} disabled={busy} className="btn btn-primary !py-2.5">{tr('Genomförd')}</button>
                  <button onClick={() => setStatus('NO_SHOW')} disabled={busy} className="btn btn-outline !py-2.5">{tr('Utebliven')}</button>
                </>
              )}
              {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                <>
                  <button onClick={() => setRescheduling(true)} disabled={busy} className="btn btn-outline !py-2.5">{tr('Omboka')}</button>
                  <button onClick={() => setCancelling(true)} disabled={busy} className="btn !py-2.5 text-[#b23b3b] hover:bg-[#b23b3b]/10">{tr('Avboka')}</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-stone-light">{label}</p>
      <p className="mt-1 text-sm text-ink">{children}</p>
    </div>
  );
}