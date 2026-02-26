'use client';

import { useActionState } from 'react';
import { saveCalendarConfigAction } from '../actions';

interface ChannelOption {
  value: string;
  label: string;
}

interface Props {
  config?: {
    timezone: string;
    slotBufferMinutes: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    reminderChannel: string | null;
  };
  availableChannels: ChannelOption[];
}

export function CalendarConfigForm({ config, availableChannels }: Props) {
  const [state, action, pending] = useActionState(saveCalendarConfigAction, null);

  return (
    <form action={action} className="card max-w-xl space-y-4">
      <div>
        <label htmlFor="timezone" className="label">Zona horaria</label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          required
          defaultValue={config?.timezone ?? 'America/Argentina/Buenos_Aires'}
          className="input"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="slotBufferMinutes" className="label">Buffer entre turnos (min)</label>
          <input
            id="slotBufferMinutes"
            name="slotBufferMinutes"
            type="number"
            min={0}
            max={120}
            defaultValue={config?.slotBufferMinutes ?? 15}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="minAdvanceHours" className="label">Anticipación mínima (hs)</label>
          <input
            id="minAdvanceHours"
            name="minAdvanceHours"
            type="number"
            min={0}
            max={168}
            defaultValue={config?.minAdvanceHours ?? 2}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="maxAdvanceDays" className="label">Máx días de anticipación</label>
          <input
            id="maxAdvanceDays"
            name="maxAdvanceDays"
            type="number"
            min={1}
            max={365}
            defaultValue={config?.maxAdvanceDays ?? 30}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reminderChannel" className="label">Canal de recordatorios</label>
        <select
          id="reminderChannel"
          name="reminderChannel"
          defaultValue={config?.reminderChannel ?? 'none'}
          className="input"
        >
          <option value="none">Desactivado</option>
          {availableChannels.map((ch) => (
            <option key={ch.value} value={ch.value}>
              {ch.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Seleccioná por qué canal enviar los recordatorios automáticos (1 hora antes del turno).
          Solo se muestran los canales que tenés configurados.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {(state as { success?: boolean } | null)?.success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Configuración guardada</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  );
}
