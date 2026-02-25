'use client';

import { useActionState } from 'react';
import { createCalendarServiceAction } from '../actions';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

export function ServiceForm() {
  const [state, action, pending] = useActionState(createCalendarServiceAction, null);

  return (
    <form action={action} className="card mb-4">
      <h3 className="text-sm font-semibold">Agregar servicio</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,120px,120px,80px,auto]">
        <input name="name" type="text" required placeholder="Nombre del servicio" className="input" />
        <input name="durationMinutes" type="number" required min={15} max={480} step={5} defaultValue={30} placeholder="Min" className="input" />
        <input name="price" type="number" min={0} step={0.01} placeholder="Precio" className="input" />
        <select name="color" defaultValue="#6366f1" className="input">
          {COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="btn-primary whitespace-nowrap">
          {pending ? 'Creando...' : 'Agregar'}
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}
