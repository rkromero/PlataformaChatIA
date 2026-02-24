'use client';

import { useActionState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MODELS = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];

type FormAction = (prev: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean } | void>;

interface Props {
  action: FormAction;
  settings: {
    enabled: boolean;
    model: string;
    systemPrompt: string;
    handoffKeywords: string;
    handoffTag: string;
  };
}

export function AiSettingsForm({ action, settings }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      toast.success('Configuración guardada');
    }
  }, [state]);

  return (
    <form action={formAction} className="card max-w-2xl space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium">IA Habilitada</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cuando está desactivada, la IA no responde mensajes
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings.enabled}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full dark:bg-gray-700" />
        </label>
      </div>

      <div>
        <label htmlFor="model" className="label">Modelo</label>
        <select id="model" name="model" defaultValue={settings.model} className="input">
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="systemPrompt" className="label">System Prompt</label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={5}
          defaultValue={settings.systemPrompt}
          className="input resize-y"
          placeholder="Eres un asistente..."
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <label htmlFor="handoffKeywords" className="label mb-0">Keywords de handoff</label>
          <div className="group relative">
            <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.835a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
              Si el cliente detecta estas palabras, la IA dejará de responder y marcará el chat como "Pendiente" para un humano.
            </div>
          </div>
        </div>
        <input
          id="handoffKeywords"
          name="handoffKeywords"
          type="text"
          defaultValue={settings.handoffKeywords}
          className="input"
          placeholder="humano, asesor, agente, persona"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Separadas por coma.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <label htmlFor="handoffTag" className="label mb-0">Tag de handoff en Chatwoot</label>
          <div className="group relative">
            <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.835a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
              Esta etiqueta se aplicará automáticamente a la conversación en tu panel de Chatwoot.
            </div>
          </div>
        </div>
        <input
          id="handoffTag"
          name="handoffTag"
          type="text"
          defaultValue={settings.handoffTag}
          className="input"
          placeholder="human_handoff"
        />
      </div>

      {state && 'error' in state && state.error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        Guardar configuración
      </button>
    </form>
  );
}
