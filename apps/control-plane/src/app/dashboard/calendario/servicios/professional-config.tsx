'use client';

import { useState, useTransition } from 'react';
import { saveProfessionalServicesAction, saveScheduleAction } from '../actions';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

interface Professional {
  id: string;
  label: string;
  serviceIds: string[];
  schedules: ScheduleEntry[];
}

interface Service {
  id: string;
  name: string;
}

export function ProfessionalConfig({
  professionals,
  services,
}: {
  professionals: Professional[];
  services: Service[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (professionals.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No hay miembros en el equipo.</p>;
  }

  return (
    <div className="space-y-2">
      {professionals.map((prof) => (
        <div key={prof.id} className="card">
          <button
            type="button"
            onClick={() => setExpanded(expanded === prof.id ? null : prof.id)}
            className="flex w-full cursor-pointer items-center justify-between text-left"
          >
            <span className="text-sm font-medium">{prof.label}</span>
            <span className="text-xs text-gray-500">
              {prof.serviceIds.length} servicio{prof.serviceIds.length !== 1 ? 's' : ''} ·{' '}
              {prof.schedules.length} día{prof.schedules.length !== 1 ? 's' : ''}
            </span>
          </button>

          {expanded === prof.id && (
            <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <ProfessionalServicesPicker
                professionalId={prof.id}
                services={services}
                initialServiceIds={prof.serviceIds}
              />
              <ScheduleEditor
                professionalId={prof.id}
                initialSchedules={prof.schedules}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfessionalServicesPicker({
  professionalId,
  services,
  initialServiceIds,
}: {
  professionalId: string;
  services: Service[];
  initialServiceIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialServiceIds));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveProfessionalServicesAction(professionalId, Array.from(selected));
      setMessage(result?.error ?? 'Guardado');
      setTimeout(() => setMessage(''), 2000);
    });
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Servicios que ofrece</p>
      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
            />
            {s.name}
          </label>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={save} disabled={isPending} className="btn-primary text-xs">
          {isPending ? 'Guardando...' : 'Guardar servicios'}
        </button>
        {message && <span className="text-xs text-gray-500">{message}</span>}
      </div>
    </div>
  );
}

function ScheduleEditor({
  professionalId,
  initialSchedules,
}: {
  professionalId: string;
  initialSchedules: ScheduleEntry[];
}) {
  const [entries, setEntries] = useState<ScheduleEntry[]>(
    initialSchedules.length > 0
      ? initialSchedules
      : [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: '09:00', endTime: '18:00', breakStart: null, breakEnd: null })),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  function toggleDay(day: number) {
    setEntries((prev) => {
      const exists = prev.find((e) => e.dayOfWeek === day);
      if (exists) return prev.filter((e) => e.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startTime: '09:00', endTime: '18:00', breakStart: null, breakEnd: null }].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }

  function updateEntry(day: number, field: keyof ScheduleEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === day ? { ...e, [field]: value || null } : e)),
    );
  }

  function save() {
    startTransition(async () => {
      const result = await saveScheduleAction(professionalId, entries);
      setMessage(result?.error ?? 'Guardado');
      setTimeout(() => setMessage(''), 2000);
    });
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Horario semanal</p>
      <div className="space-y-2">
        {DAY_LABELS.map((label, idx) => {
          const entry = entries.find((e) => e.dayOfWeek === idx);
          return (
            <div key={idx} className="flex items-center gap-3">
              <label className="flex w-24 cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!entry}
                  onChange={() => toggleDay(idx)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
                />
                {label}
              </label>
              {entry ? (
                <div className="flex items-center gap-1 text-xs">
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => updateEntry(idx, 'startTime', e.target.value)}
                    className="input w-24 py-1 text-xs"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => updateEntry(idx, 'endTime', e.target.value)}
                    className="input w-24 py-1 text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400">No trabaja</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={save} disabled={isPending} className="btn-primary text-xs">
          {isPending ? 'Guardando...' : 'Guardar horario'}
        </button>
        {message && <span className="text-xs text-gray-500">{message}</span>}
      </div>
    </div>
  );
}
