'use client';

import { useActionState, useState } from 'react';
import { createBlockedTimeAction, deleteBlockedTimeAction } from '../actions';

interface BlockedTimeItem {
  id: string;
  professionalName: string;
  startAt: string;
  endAt: string;
  reason: string | null;
}

interface Props {
  professionals: Array<{ id: string; label: string }>;
  blockedTimes: BlockedTimeItem[];
}

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function DeleteBlockedButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(deleteBlockedTimeAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        aria-label="Eliminar bloqueo"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </form>
  );
}

export function BlockedTimes({ professionals, blockedTimes }: Props) {
  const [state, createAction, createPending] = useActionState(createBlockedTimeAction, null);
  const [selectedProfessional, setSelectedProfessional] = useState('');

  return (
    <div className="space-y-6">
      <form action={createAction} className="card space-y-4">
        <h3 className="text-sm font-semibold">Nuevo bloqueo de horario</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Profesional</label>
            <select
              name="professionalId"
              required
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="input"
            >
              <option value="">Seleccionar...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Motivo (opcional)</label>
            <input name="reason" type="text" className="input" placeholder="Vacaciones, feriado..." />
          </div>

          <div>
            <label className="label">Desde</label>
            <input name="startAt" type="datetime-local" required className="input" />
          </div>

          <div>
            <label className="label">Hasta</label>
            <input name="endAt" type="datetime-local" required className="input" />
          </div>
        </div>

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button type="submit" disabled={createPending} className="btn-primary text-sm">
          {createPending ? 'Guardando...' : 'Bloquear horario'}
        </button>
      </form>

      {blockedTimes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Sin bloqueos registrados.</p>
      ) : (
        <div className="space-y-2">
          {blockedTimes.map((bt) => (
            <div key={bt.id} className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{bt.professionalName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {dateFmt.format(new Date(bt.startAt))} — {dateFmt.format(new Date(bt.endAt))}
                </p>
                {bt.reason && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{bt.reason}</p>
                )}
              </div>
              <DeleteBlockedButton id={bt.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
