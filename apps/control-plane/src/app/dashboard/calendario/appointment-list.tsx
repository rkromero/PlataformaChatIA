'use client';

import { useActionState, useState } from 'react';
import { updateAppointmentStatusAction, rescheduleAppointmentAction } from './actions';

interface AppointmentItem {
  id: string;
  clientName: string;
  clientPhone: string | null;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  serviceName: string;
  serviceColor: string;
  professionalName: string;
}

interface Props {
  appointments: AppointmentItem[];
  statusLabels: Record<string, { label: string; color: string }>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatusButton({ appointmentId, status, label }: { appointmentId: string; status: string; label: string }) {
  const [, action, pending] = useActionState(updateAppointmentStatusAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={appointmentId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        className="rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {label}
      </button>
    </form>
  );
}

function RescheduleButton({ appointmentId, currentStart }: { appointmentId: string; currentStart: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(rescheduleAppointmentAction, null);

  const defaultValue = currentStart.slice(0, 16);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
      >
        Reprogramar
      </button>
    );
  }

  return (
    <form action={async (fd) => { await action(fd); setOpen(false); }} className="flex items-center gap-1">
      <input type="hidden" name="id" value={appointmentId} />
      <input
        type="datetime-local"
        name="startAt"
        step="900"
        defaultValue={defaultValue}
        className="rounded border border-gray-300 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800"
      />
      <button type="submit" disabled={pending} className="rounded bg-brand-600 px-2 py-0.5 text-xs text-white hover:bg-brand-700">
        {pending ? '...' : 'OK'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
        ✕
      </button>
      {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

export function AppointmentList({ appointments, statusLabels }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay turnos esta semana.</p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="space-y-2">
      {appointments.map((apt) => {
        const date = formatDate(apt.startAt);
        const showDate = date !== lastDate;
        lastDate = date;
        const statusInfo = statusLabels[apt.status] ?? { label: apt.status, color: 'bg-gray-100 text-gray-600' };
        const canReschedule = apt.status === 'pending' || apt.status === 'confirmed';

        return (
          <div key={apt.id}>
            {showDate && (
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {date}
              </p>
            )}
            <div className="card flex items-center gap-4">
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{ backgroundColor: apt.serviceColor }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatTime(apt.startAt)} – {formatTime(apt.endAt)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-sm font-medium">{apt.clientName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {apt.serviceName} · {apt.professionalName}
                  {apt.clientPhone ? ` · ${apt.clientPhone}` : ''}
                </p>
                {apt.notes && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{apt.notes}</p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-1">
                {canReschedule && (
                  <RescheduleButton appointmentId={apt.id} currentStart={apt.startAt} />
                )}
                {apt.status === 'pending' && (
                  <>
                    <StatusButton appointmentId={apt.id} status="confirmed" label="Confirmar" />
                    <StatusButton appointmentId={apt.id} status="cancelled" label="Cancelar" />
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <>
                    <StatusButton appointmentId={apt.id} status="completed" label="Completar" />
                    <StatusButton appointmentId={apt.id} status="no_show" label="No asistió" />
                    <StatusButton appointmentId={apt.id} status="cancelled" label="Cancelar" />
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
