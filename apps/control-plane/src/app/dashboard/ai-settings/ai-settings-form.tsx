'use client';

import { useActionState, useEffect } from 'react';
import toast from 'react-hot-toast';

const MODELS = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', desc: 'Rápido y económico' },
  { value: 'gpt-4.1', label: 'GPT-4.1', desc: 'Equilibrio calidad/costo' },
  { value: 'gpt-4o', label: 'GPT-4o', desc: 'Más potente' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Ligero y veloz' },
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
    removeOpeningSigns: boolean;
    splitLongMessages: boolean;
    messageWindowSeconds: number;
    disableReactionReplies: boolean;
  };
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="group/tip relative inline-flex">
      <svg className="h-4 w-4 cursor-help text-gray-500 transition-colors duration-150 group-hover/tip:text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.835a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-surface-3 px-3 py-2 text-xs leading-relaxed text-gray-200 shadow-lg group-hover/tip:block">
        {text}
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-surface-3" />
      </div>
    </div>
  );
}

export function AiSettingsForm({ action, settings }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      toast.success('Configuración guardada');
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      {/* Row 1: Status + Model */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot Status Card */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
              <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-100">Estado del bot</h3>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-medium text-gray-100">IA Habilitada</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Cuando está desactivada, la IA no responde mensajes
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        {/* Model Card */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-100">Modelo de IA</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODELS.map((m) => (
              <label
                key={m.value}
                className="group/model flex cursor-pointer items-center gap-3 rounded-lg border border-white/[0.06] px-3.5 py-3 transition-all duration-150 has-[:checked]:border-brand-500/40 has-[:checked]:bg-brand-500/5 has-[:checked]:ring-1 has-[:checked]:ring-brand-500/20 hover:border-white/10 hover:bg-white/[0.02]"
              >
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  defaultChecked={settings.model === m.value}
                  className="sr-only"
                />
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-600 transition-colors duration-150 group-has-[:checked]/model:border-brand-400 group-has-[:checked]/model:bg-brand-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-white opacity-0 transition-opacity duration-150 group-has-[:checked]/model:opacity-100" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100">{m.label}</p>
                  <p className="text-[11px] text-gray-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: System Prompt */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Personalidad del bot</h3>
            <p className="text-xs text-gray-500">Definí cómo se comporta y responde tu asistente</p>
          </div>
        </div>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          rows={8}
          defaultValue={settings.systemPrompt}
          className="input resize-y font-mono text-[13px] leading-relaxed"
          placeholder="Eres un asistente virtual amable y profesional..."
        />
        <p className="mt-2 text-[11px] text-gray-500">
          Este prompt define la personalidad, tono y reglas de tu bot. Sé específico con el contexto de tu negocio.
        </p>
      </div>

      {/* Row 3: Handoff Settings */}
      <div className="card">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Transferencia a humano</h3>
            <p className="text-xs text-gray-500">Configurá cuándo la IA transfiere la conversación a un agente</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label htmlFor="handoffKeywords" className="text-sm font-medium text-gray-300">Keywords de handoff</label>
              <Tooltip text="Si el cliente dice alguna de estas palabras, la IA dejará de responder y marcará el chat como pendiente para un humano." />
            </div>
            <input
              id="handoffKeywords"
              name="handoffKeywords"
              type="text"
              defaultValue={settings.handoffKeywords}
              className="input"
              placeholder="humano, asesor, agente, persona"
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              Separadas por coma
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label htmlFor="handoffTag" className="text-sm font-medium text-gray-300">Tag en Chatwoot</label>
              <Tooltip text="Esta etiqueta se aplicará automáticamente a la conversación en tu panel de Chatwoot cuando ocurra una transferencia." />
            </div>
            <input
              id="handoffTag"
              name="handoffTag"
              type="text"
              defaultValue={settings.handoffTag}
              className="input"
              placeholder="human_handoff"
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              Etiqueta asignada al chat transferido
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: Message Processing Options */}
      <div className="card">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
            <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Opciones de mensaje</h3>
            <p className="text-xs text-gray-500">Configurá cómo se procesan las respuestas del bot</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Message Window */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-100">Ventana de segundos entre mensajes</p>
                  <Tooltip text="La cantidad de segundos que el bot esperará para responder. Todos los mensajes enviados dentro de ese rango de tiempo se combinan en uno solo y el chatbot responde a todos juntos." />
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Si el cliente envía varios mensajes seguidos, el bot espera esta cantidad de segundos antes de responder a todos juntos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="messageWindowSeconds"
                  defaultValue={settings.messageWindowSeconds}
                  min={0}
                  max={60}
                  className="input w-20 text-center tabular-nums"
                />
                <span className="text-sm text-gray-500">seg</span>
              </div>
            </div>
          </div>

          {/* Remove opening signs */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-medium text-gray-100">Desactivar signos de apertura</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Elimina los signos de apertura &lsquo;&iquest;&rsquo; y &lsquo;&iexcl;&rsquo; de las respuestas generadas por el bot
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" name="removeOpeningSigns" defaultChecked={settings.removeOpeningSigns} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Split long messages */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-medium text-gray-100">Dividir mensajes largos en partes</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Envía múltiples mensajes en lugar de uno solo si el mensaje es demasiado largo. Si está habilitada, el mensaje contará como uno solo al momento de calcular el costo.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" name="splitLongMessages" defaultChecked={settings.splitLongMessages} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Disable reaction replies */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-100">Desactivar respuestas a reacciones</p>
                <Tooltip text="WhatsApp puede enviar reacciones como mensajes comunes. Si esta opción está activa, el bot ignora mensajes que sean solo emoji y estén respondiendo a un mensaje anterior." />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Evita que el bot responda a mensajes de reacción como 👍, ❤️ o 😂 cuando son reply a un mensaje anterior.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" name="disableReactionReplies" defaultChecked={settings.disableReactionReplies} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </div>

      {/* Error + Submit */}
      {state && 'error' in state && state.error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm font-medium text-red-400">{state.error}</p>
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Los cambios se aplican inmediatamente a las nuevas conversaciones.
        </p>
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
          {pending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
          {pending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  );
}
