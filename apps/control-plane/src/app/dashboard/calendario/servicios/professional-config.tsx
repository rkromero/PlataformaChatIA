'use client';

import { useState, useTransition, useCallback } from 'react';
import { saveProfessionalServicesAction, saveScheduleAction } from '../actions';
import { SlidePanel } from '@/components/slide-panel';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
  const [openProfId, setOpenProfId] = useState<string | null>(null);

  const handleClose = useCallback(() => setOpenProfId(null), []);

  if (professionals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay miembros en el equipo.</p>
      </div>
    );
  }

  const openProf = professionals.find((p) => p.id === openProfId) ?? null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((prof) => {
          const serviceCount = prof.serviceIds.length;
          const dayCount = prof.schedules.length;
          const assignedNames = services
            .filter((s) => prof.serviceIds.includes(s.id))
            .map((s) => s.name);
          const activeDays = prof.schedules
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((s) => DAY_ABBR[s.dayOfWeek]);

          return (
            <button
              key={prof.id}
              type="button"
              onClick={() => setOpenProfId(prof.id)}
              className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-brand-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    {prof.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {prof.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {serviceCount} servicio{serviceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {assignedNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {assignedNames.slice(0, 3).map((name) => (
                    <span key={name} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {name}
                    </span>
                  ))}
                  {assignedNames.length > 3 && (
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      +{assignedNames.length - 3}
                    </span>
                  )}
                </div>
              )}

              {activeDays.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {DAY_ABBR.map((abbr, idx) => {
                    const isActive = prof.schedules.some((s) => s.dayOfWeek === idx);
                    return (
                      <span
                        key={idx}
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-medium ${
                          isActive
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                            : 'bg-gray-50 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
                        }`}
                      >
                        {abbr.charAt(0)}
                      </span>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {openProf && (
        <SlidePanel
          open={!!openProfId}
          onClose={handleClose}
          title={openProf.label}
          width="max-w-md"
        >
          <ProfessionalEditor
            key={openProf.id}
            professional={openProf}
            services={services}
            onSaved={handleClose}
          />
        </SlidePanel>
      )}
    </>
  );
}

function ProfessionalEditor({
  professional,
  services,
  onSaved,
}: {
  professional: Professional;
  services: Service[];
  onSaved: () => void;
}) {
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(professional.serviceIds));
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(
    professional.schedules.length > 0
      ? professional.schedules
      : [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: '09:00', endTime: '18:00', breakStart: null, breakEnd: null })),
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDay(day: number) {
    setScheduleEntries((prev) => {
      const exists = prev.find((e) => e.dayOfWeek === day);
      if (exists) return prev.filter((e) => e.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startTime: '09:00', endTime: '18:00', breakStart: null, breakEnd: null }]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }

  function updateEntry(day: number, field: keyof ScheduleEntry, value: string) {
    setScheduleEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === day ? { ...e, [field]: value || null } : e)),
    );
  }

  function saveAll() {
    startTransition(async () => {
      const [svcResult, schedResult] = await Promise.all([
        saveProfessionalServicesAction(professional.id, Array.from(selectedServices)),
        saveScheduleAction(professional.id, scheduleEntries),
      ]);

      const error = svcResult?.error || schedResult?.error;
      if (error) {
        setFeedback({ type: 'error', text: error });
      } else {
        setFeedback({ type: 'success', text: 'Configuración guardada' });
        setTimeout(() => onSaved(), 600);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Services section */}
      <section>
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Servicios asignados
        </h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Seleccioná qué servicios puede atender este profesional.
        </p>

        <div className="space-y-1.5">
          {services.map((s) => {
            const isChecked = selectedServices.has(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-150 ${
                  isChecked
                    ? 'border-brand-300 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleService(s.id)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`text-sm ${isChecked ? 'font-medium text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {s.name}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Schedule section */}
      <section>
        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Horario semanal
        </h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Definí los días y horarios de trabajo.
        </p>

        <div className="space-y-1">
          {DAY_LABELS.map((label, idx) => {
            const entry = scheduleEntries.find((e) => e.dayOfWeek === idx);
            const isActive = !!entry;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-150 ${
                  isActive
                    ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60'
                    : 'border-transparent bg-gray-50 dark:bg-gray-800/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`Toggle ${label}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    {isActive ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    )}
                  </svg>
                </button>

                <span className={`w-20 text-sm ${isActive ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                  {label}
                </span>

                {isActive && entry ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <input
                      type="time"
                      step="900"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(idx, 'startTime', e.target.value)}
                      className="w-[5.5rem] rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <span className="text-xs text-gray-400">a</span>
                    <input
                      type="time"
                      step="900"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(idx, 'endTime', e.target.value)}
                      className="w-[5.5rem] rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <span className="flex-1 text-xs text-gray-400 dark:text-gray-500">
                    No trabaja
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feedback + Save */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        {feedback && (
          <p className={`mb-3 text-sm ${feedback.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {feedback.text}
          </p>
        )}
        <button
          type="button"
          onClick={saveAll}
          disabled={isPending}
          className="btn-primary w-full justify-center"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </span>
          ) : (
            'Guardar configuración'
          )}
        </button>
      </div>
    </div>
  );
}
