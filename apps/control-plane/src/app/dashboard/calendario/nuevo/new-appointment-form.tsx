'use client';

import { useActionState, useMemo, useState } from 'react';
import { createAppointmentAction } from '../actions';

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

interface Professional {
  id: string;
  label: string;
  serviceIds: string[];
}

export function NewAppointmentForm({
  services,
  professionals,
}: {
  services: Service[];
  professionals: Professional[];
}) {
  const [state, action, pending] = useActionState(createAppointmentAction, null);
  const [selectedService, setSelectedService] = useState(services[0]?.id ?? '');

  const filteredProfessionals = useMemo(
    () => professionals.filter((p) => p.serviceIds.includes(selectedService)),
    [professionals, selectedService],
  );

  return (
    <form action={action} className="card max-w-xl space-y-5">
      <div>
        <label htmlFor="serviceId" className="label">Servicio</label>
        <select
          id="serviceId"
          name="serviceId"
          required
          className="input"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMinutes} min)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="professionalId" className="label">Profesional</label>
        <select id="professionalId" name="professionalId" required className="input">
          {filteredProfessionals.length === 0 ? (
            <option value="">Sin profesionales para este servicio</option>
          ) : (
            filteredProfessionals.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))
          )}
        </select>
      </div>

      <div>
        <label htmlFor="clientName" className="label">Nombre del cliente</label>
        <input id="clientName" name="clientName" type="text" required className="input" placeholder="Juan Pérez" />
      </div>

      <div>
        <label htmlFor="clientPhone" className="label">Teléfono (opcional)</label>
        <input id="clientPhone" name="clientPhone" type="tel" className="input" placeholder="+54 11 1234-5678" />
      </div>

      <div>
        <label htmlFor="startAt" className="label">Fecha y hora</label>
        <input id="startAt" name="startAt" type="datetime-local" required className="input" />
      </div>

      <div>
        <label htmlFor="notes" className="label">Notas (opcional)</label>
        <textarea id="notes" name="notes" rows={3} className="input" placeholder="Ej: Cliente prefiere producto sin amoniaco" />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      )}
      {(state as { success?: boolean } | null)?.success && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          Turno creado correctamente
        </p>
      )}

      <button type="submit" disabled={pending || filteredProfessionals.length === 0} className="btn-primary">
        {pending ? 'Agendando...' : 'Agendar turno'}
      </button>
    </form>
  );
}
