'use client';

import { useState, useActionState } from 'react';
import { saveOnboardingBotAction, completeOnboardingAction } from './actions';
import { connectWhatsAppAction } from '../channels/connect-whatsapp/actions';

const BUSINESS_ICONS: Record<string, React.ReactNode> = {
  restaurant: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" />
    </svg>
  ),
  ecommerce: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
  health: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
  realestate: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  services: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  other: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
    </svg>
  ),
};

const BUSINESS_TYPES = [
  {
    label: 'Restaurante',
    iconKey: 'restaurant',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con el menú, precios, horarios de atención, reservas y pedidos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'E-commerce',
    iconKey: 'ecommerce',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de productos, precios, estado de pedidos, políticas de envío y devoluciones. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Clínica / Salud',
    iconKey: 'health',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los pacientes con información de servicios, turnos, horarios y ubicación. No des diagnósticos médicos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Inmobiliaria',
    iconKey: 'realestate',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de propiedades disponibles, precios, ubicaciones y requisitos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Servicios',
    iconKey: 'services',
    prompt: 'Eres el asistente virtual de {nombre}. Ayudás a los clientes con información de servicios, precios, disponibilidad y presupuestos. Respondé de forma breve, amable y en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
  {
    label: 'Otro',
    iconKey: 'other',
    prompt: 'Eres el asistente virtual de {nombre}. Respondé las consultas de los clientes de forma breve, amable y profesional en español. Si no sabés algo, ofrecé transferir a un humano.',
  },
];

const STEPS = ['Configurá tu bot', 'Conectá WhatsApp', 'Todo listo'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState('');
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
          <h2 className="text-xl font-semibold">Contanos tu negocio</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Esto lo usamos para personalizar tu bot y el panel.
          </p>

          <div className="mt-4">
            <label htmlFor="businessName" className="label">Nombre del negocio</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input"
              placeholder="Ej: Mi Tienda Online"
              required
            />
          </div>

          <h3 className="mt-6 text-lg font-semibold">¿Qué tipo de negocio tenés?</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Elegí una categoría y te sugerimos un prompt ideal para tu bot.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BUSINESS_TYPES.map((type, i) => (
              <button
                key={type.label}
                onClick={() => selectBusinessType(i)}
                className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-150 ${
                  selectedType === i
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-brand-600 dark:text-brand-400">{BUSINESS_ICONS[type.iconKey]}</span>
                <span className="mt-2 block text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>

          {selectedType !== null && (
            <form action={botAction} className="mt-6">
              <input type="hidden" name="businessName" value={businessName} />
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
              {!businessName.trim() && (
                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Completá el nombre del negocio para continuar.
                </p>
              )}

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
                <button type="submit" disabled={botPending || !businessName.trim()} className="btn-primary">
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
