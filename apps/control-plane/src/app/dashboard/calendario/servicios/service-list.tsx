'use client';

import { useActionState, useState } from 'react';
import { deleteCalendarServiceAction, updateCalendarServiceAction } from '../actions';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number | null;
  color: string;
  isActive: boolean;
}

function DeleteButton({ serviceId }: { serviceId: string }) {
  const [, action, pending] = useActionState(deleteCalendarServiceAction, null);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={serviceId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        aria-label="Eliminar servicio"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </form>
  );
}

function EditableService({ service }: { service: ServiceItem }) {
  const [editing, setEditing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(service.color);
  const [state, action, pending] = useActionState(updateCalendarServiceAction, null);

  if (!editing) {
    return (
      <div className="card flex items-center gap-3">
        <div className="h-8 w-2 rounded-full" style={{ backgroundColor: service.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{service.name}</p>
          <p className="text-xs text-gray-400">
            {service.durationMinutes} min
            {service.price != null ? ` · $${service.price.toLocaleString('es-AR')}` : ''}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-300"
          aria-label="Editar servicio"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </button>
        <DeleteButton serviceId={service.id} />
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
      className="card space-y-3"
    >
      <input type="hidden" name="id" value={service.id} />
      <input type="hidden" name="color" value={selectedColor} />
      <div className="grid gap-3 sm:grid-cols-[1fr,100px,100px]">
        <input name="name" type="text" required defaultValue={service.name} className="input" placeholder="Nombre" />
        <input name="durationMinutes" type="number" required min={15} max={480} step={5} defaultValue={service.durationMinutes} className="input" placeholder="Min" />
        <input name="price" type="number" min={0} step={0.01} defaultValue={service.price ?? ''} className="input" placeholder="Precio" />
      </div>
      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedColor(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${
              selectedColor === c
                ? 'scale-110 border-white shadow-lg'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-sm">
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ServiceList({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) {
    return <p className="text-sm text-gray-400">Sin servicios creados.</p>;
  }

  return (
    <div className="space-y-2">
      {services.map((s) => (
        <EditableService key={s.id} service={s} />
      ))}
    </div>
  );
}
