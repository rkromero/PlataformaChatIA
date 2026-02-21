'use client';

import { useState, useActionState } from 'react';
import { saveOnboardingBotAction, completeOnboardingAction } from './actions';
import { connectWhatsAppAction } from '../channels/connect-whatsapp/actions';

const BUSINESS_TYPES = [
  {
    label: 'Restaurante',
    icon: '🍕',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con el menú, precios, horarios de atención, reservas y pedidos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'E-commerce',
    icon: '🛒',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de productos, precios, estado de pedidos, políticas de envío y devoluciones. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Clínica / Salud',
    icon: '🏥',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los pacientes con información de servicios, turnos, horarios y ubicación. No des diagnósticos médicos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Inmobiliaria',
    icon: '🏠',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de propiedades disponibles, precios, ubicaciones y requisitos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Servicios',
    icon: '💼',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de servicios, precios, disponibilidad y presupuestos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Otro',
    icon: '✨',
    prompt: 'Eres el asistente virtual de {nombre}. Respondé las consultas de los clientes de forma breve, amable y profesional en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
];

const STEPS = ['Configurá tu bot', 'Conectá WhatsApp', 'Todo listo'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [botState, botAction, botPending] = useActionState(saveOnboardingBotAction, null);
  const [waState, waAction, waPending] = useActionState(connectWhatsAppAction, null);
  const [waSubStep, setWaSubStep] = useState(0);

  function selectBusinessType(index: number) {
    setSelectedType(index);
    setPrompt(BUSINESS_TYPES[index].prompt);
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i <= step
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {i < step ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 transition-colors ${
                    i < step ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Configure bot */}
      {step === 0 && (
        <div>
          <h2 className="text-xl font-semibold">¿Qué tipo de negocio tenés?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Elegí una categoría y te sugerimos un prompt ideal para tu bot.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BUSINESS_TYPES.map((type, i) => (
              <button
                key={type.label}
                onClick={() => selectBusinessType(i)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedType === i
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="mt-2 block text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>

          {selectedType !== null && (
            <form action={botAction} className="mt-6">
              <label className="label">Prompt de tu bot (podés editarlo)</label>
              <textarea
                name="systemPrompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tip: Reemplazá {'{nombre}'} con el nombre real de tu negocio y agregá detalles como precios, horarios, etc.
              </p>

              {botState?.error && (
                <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {botState.error}
                </p>
              )}

              {botState?.success && (
                <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Prompt guardado correctamente
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button type="submit" disabled={botPending} className="btn-primary">
                  {botPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  Guardar prompt
                </button>
                {botState?.success && (
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                    Siguiente →
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 2: Connect WhatsApp */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold">Conectá tu WhatsApp</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Para que el bot atienda por WhatsApp, necesitás conectar tu número.
          </p>

          {/* Sub-step: Choose method */}
          {waSubStep === 0 && !waState?.success && (
            <div className="mt-6 space-y-4">
              <button
                onClick={() => setWaSubStep(1)}
                className="w-full rounded-xl border-2 border-brand-200 bg-brand-50 p-5 text-left transition-all hover:border-brand-400 dark:border-brand-500/20 dark:bg-brand-500/10 dark:hover:border-brand-500/40"
              >
                <h3 className="font-medium text-brand-900 dark:text-brand-300">Configurar ahora (guiado)</h3>
                <p className="mt-1 text-sm text-brand-700 dark:text-brand-400">
                  Te guiamos paso a paso para conectar tu WhatsApp Business API. Necesitás Phone Number ID, WABA ID y Access Token de Meta.
                </p>
              </button>

              <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <h3 className="font-medium">¿Preferís que te lo configuremos?</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Escribinos y te ayudamos a conectar tu número en minutos. Es gratis con tu plan.
                </p>
                <a
                  href="mailto:soporte@chatplatform.com?subject=Conectar WhatsApp&body=Hola, quiero conectar mi WhatsApp al chatbot."
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                >
                  Contactar soporte →
                </a>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">← Volver</button>
                <button onClick={() => setStep(2)} className="btn-secondary">Omitir por ahora →</button>
              </div>
            </div>
          )}

          {/* Sub-step: Instructions */}
          {waSubStep === 1 && !waState?.success && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Abrí <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">developers.facebook.com/apps</a> y buscá estos datos en WhatsApp &gt; API Setup:
              </p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold dark:bg-gray-800">1</span>
                  <span><strong>Phone Number ID</strong> — debajo del número seleccionado</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold dark:bg-gray-800">2</span>
                  <span><strong>WABA ID</strong> — en WhatsApp Business Account ID</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold dark:bg-gray-800">3</span>
                  <span><strong>Access Token</strong> — hacé clic en &quot;Generate&quot; (dura 24h) o creá uno permanente</span>
                </div>
              </div>

              <form action={waAction} className="space-y-3">
                <div>
                  <label htmlFor="ob-phone" className="label">Número de teléfono</label>
                  <input id="ob-phone" name="phoneNumber" type="tel" required className="input" placeholder="+5491112345678" />
                </div>
                <div>
                  <label htmlFor="ob-pnid" className="label">Phone Number ID</label>
                  <input id="ob-pnid" name="phoneNumberId" type="text" required className="input font-mono" placeholder="123456789012345" />
                </div>
                <div>
                  <label htmlFor="ob-waba" className="label">WABA ID</label>
                  <input id="ob-waba" name="wabaId" type="text" required className="input font-mono" placeholder="987654321098765" />
                </div>
                <div>
                  <label htmlFor="ob-token" className="label">Access Token</label>
                  <input id="ob-token" name="accessToken" type="password" required className="input font-mono" placeholder="EAAx..." />
                </div>

                {waState?.error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {waState.error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setWaSubStep(0)} className="btn-secondary">← Volver</button>
                  <button type="submit" disabled={waPending} className="btn-primary">
                    {waPending ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Conectando...
                      </>
                    ) : (
                      'Conectar WhatsApp'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-step: Success */}
          {waState?.success && (
            <div className="mt-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="font-medium text-emerald-900 dark:text-emerald-300">WhatsApp conectado correctamente</p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">Inbox ID: {waState.inboxId}</p>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Configurá el webhook en Meta:</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">En tu app de Meta &gt; WhatsApp &gt; Configuration &gt; Webhook, pegá esta URL:</p>
                <code className="mt-2 block break-all rounded bg-white p-2 text-xs font-mono dark:bg-gray-900">
                  {waState.webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(waState.webhookUrl || '')}
                  className="mt-2 text-xs font-medium text-amber-700 underline dark:text-amber-400"
                >
                  Copiar URL
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setStep(2)} className="btn-primary">Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: All set */}
      {step === 2 && (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>

          <h2 className="mt-6 text-xl font-semibold">¡Todo listo!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Tu bot está configurado y listo para atender clientes.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-200 p-5 text-left dark:border-gray-700">
            <h3 className="font-medium">Próximos pasos:</h3>
            <ul className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">1</span>
                <span>Conectá tu WhatsApp (si aún no lo hiciste, contactanos)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">2</span>
                <span>Mandá un mensaje de prueba a tu número de WhatsApp</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">3</span>
                <span>Ajustá el prompt desde &quot;Mi Bot&quot; en tu panel</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">← Volver</button>
            <form action={completeOnboardingAction}>
              <button type="submit" className="btn-primary">
                Ir a mi panel →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
