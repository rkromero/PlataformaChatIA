'use client';

import { useState, useActionState } from 'react';
import { saveOnboardingBotAction, completeOnboardingAction } from './actions';

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

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/20 dark:bg-brand-500/10">
              <h3 className="font-medium text-brand-900 dark:text-brand-300">Opción recomendada: Te lo configuramos</h3>
              <p className="mt-2 text-sm text-brand-700 dark:text-brand-400">
                Escribinos por WhatsApp o email y te ayudamos a conectar tu número en minutos. Es gratis y está incluido en tu plan.
              </p>
              <a
                href="mailto:soporte@chatplatform.com?subject=Conectar WhatsApp&body=Hola, quiero conectar mi WhatsApp al chatbot."
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Contactar soporte
              </a>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <h3 className="font-medium">Configuración manual (avanzado)</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Si ya tenés un número de WhatsApp Business API con Meta, podés configurarlo vos mismo desde la sección Canales del dashboard.
              </p>
              <h4 className="mt-3 text-sm font-medium">Requisitos:</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Cuenta de Meta Business verificada
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Número de WhatsApp Business API
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Phone Number ID, WABA ID y Access Token de Meta
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary">← Volver</button>
            <button onClick={() => setStep(2)} className="btn-primary">Siguiente →</button>
          </div>
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
