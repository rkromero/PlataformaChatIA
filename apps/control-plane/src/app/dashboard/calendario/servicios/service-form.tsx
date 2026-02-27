'use client';

import { useActionState, useState } from 'react';
import { createCalendarServiceAction } from '../actions';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

export function ServiceForm() {
  const [state, action, pending] = useActionState(createCalendarServiceAction, null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  return (
    <form action={action} className="card mb-4">
      <h3 className="text-sm font-semibold">Agregar servicio</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,120px,120px,auto,auto]">
        <input name="name" type="text" required placeholder="Nombre del servicio" className="input" />
        <input name="durationMinutes" type="number" required min={15} max={480} step={5} defaultValue={30} placeholder="Min" className="input" />
        <input name="price" type="number" min={0} step={0.01} placeholder="Precio" className="input" />

        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                selectedColor === c
                  ? 'scale-110 border-white shadow-lg'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <button type="submit" disabled={pending} className="btn-primary whitespace-nowrap">
          {pending ? 'Creando...' : 'Agregar'}
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
