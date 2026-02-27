'use client';

import { useActionState } from 'react';
import { saveCalendarConfigAction } from '../actions';

interface ChannelOption {
  value: string;
  label: string;
}

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '1 día' },
  { value: 2880, label: '2 días' },
];

interface Props {
  config?: {
    timezone: string;
    slotBufferMinutes: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    reminderChannel: string | null;
    reminderMinutes1: number;
    reminderMinutes2: number | null;
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

      <fieldset className="space-y-3 rounded-lg border border-white/[0.06] p-4">
        <legend className="px-2 text-sm font-semibold">Recordatorios automáticos</legend>

        <div>
          <label htmlFor="reminderChannel" className="label">Canal de envío</label>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reminderMinutes1" className="label">Primer recordatorio</label>
            <select
              id="reminderMinutes1"
              name="reminderMinutes1"
              defaultValue={config?.reminderMinutes1 ?? 60}
              className="input"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} antes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reminderMinutes2" className="label">Segundo recordatorio (opcional)</label>
            <select
              id="reminderMinutes2"
              name="reminderMinutes2"
              defaultValue={config?.reminderMinutes2 ?? ''}
              className="input"
            >
              <option value="">Sin segundo recordatorio</option>
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} antes
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Solo se muestran los canales que tenés configurados. Si el canal es &quot;Desactivado&quot;, no se envían recordatorios.
        </p>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      {(state as { success?: boolean } | null)?.success && (
        <p className="text-sm text-emerald-400">Configuración guardada</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  );
}
