'use client';

import Link from 'next/link';
import { useState, useActionState } from 'react';
import { connectWhatsAppAction } from './actions';

const WIZARD_STEPS = [
  'Requisitos',
  'Credenciales de Meta',
  'Conectar',
  'Webhook',
];

export default function ConnectWhatsAppPage() {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(connectWhatsAppAction, null);

  const showWebhookStep = state?.success;
  const activeStep = showWebhookStep ? 3 : step;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/channels"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a Canales
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Conectar WhatsApp</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Seguí estos pasos para conectar tu número de WhatsApp Business
      </p>

      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    i <= activeStep
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {i < activeStep ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="mt-1.5 hidden text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:block">{label}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 transition-colors ${
                  i < activeStep ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Prerequisites */}
      {activeStep === 0 && (
        <div>
          <h2 className="text-lg font-semibold">Antes de empezar, necesitás:</h2>
          <div className="mt-4 space-y-3">
            <Requirement
              number={1}
              title="Cuenta de Meta Business"
              description="Creala gratis en business.facebook.com si aún no tenés una."
              link="https://business.facebook.com"
            />
            <Requirement
              number={2}
              title="App de WhatsApp en Meta Developers"
              description="Entrá a developers.facebook.com, creá una app y seleccioná 'WhatsApp' como producto."
              link="https://developers.facebook.com/apps"
            />
            <Requirement
              number={3}
              title="Número de teléfono verificado"
              description="En la sección WhatsApp > Getting Started, Meta te da un número de prueba o podés agregar el tuyo propio."
            />
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              ¿No querés hacer esto vos?
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Escribinos a soporte@chatplatform.com y te lo configuramos gratis.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => setStep(1)} className="btn-primary">
              Ya tengo todo, siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Get credentials */}
      {activeStep === 1 && (
        <div>
          <h2 className="text-lg font-semibold">Obtené tus credenciales de Meta</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Seguí estos pasos en tu panel de Meta Developers:
          </p>

          <div className="mt-6 space-y-4">
            <InstructionStep
              number={1}
              title="Abrí tu app en Meta Developers"
              description="Andá a developers.facebook.com/apps y seleccioná tu app."
            />
            <InstructionStep
              number={2}
              title="Entrá a WhatsApp > API Setup"
              description="En el menú lateral, buscá 'WhatsApp' y hacé clic en 'API Setup' o 'Getting Started'."
            />
            <InstructionStep
              number={3}
              title="Copiá el Phone Number ID"
              description="Aparece debajo del número de teléfono seleccionado. Es un número largo como '123456789012345'."
              highlight="Phone Number ID"
            />
            <InstructionStep
              number={4}
              title="Copiá el WhatsApp Business Account ID (WABA ID)"
              description="Aparece en la sección 'WhatsApp Business Account ID' o en la URL de la página. Es un número como '987654321098765'."
              highlight="WABA ID"
            />
            <InstructionStep
              number={5}
              title="Generá un Access Token permanente"
              description="En 'API Setup', hacé clic en 'Generate' para obtener un token temporal. Para producción, creá un token permanente desde Business Settings > System Users."
              highlight="Access Token"
            />
          </div>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Tip:</span> El token temporal dura 24hs. Para un setup permanente,
              creá un System User en Business Settings con permiso <code className="rounded bg-blue-100 px-1 py-0.5 text-xs dark:bg-blue-900">whatsapp_business_messaging</code>.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary">← Volver</button>
            <button onClick={() => setStep(2)} className="btn-primary">Tengo las credenciales →</button>
          </div>
        </div>
      )}

      {/* Step 3: Connect form */}
      {activeStep === 2 && !showWebhookStep && (
        <div>
          <h2 className="text-lg font-semibold">Ingresá tus datos de WhatsApp</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pegá las credenciales que copiaste de Meta Developer Console
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="label">Número de teléfono (con código de país)</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="input"
                placeholder="+5491112345678"
              />
              <p className="mt-1 text-xs text-gray-500">Formato: +código_país + número, sin espacios ni guiones</p>
            </div>

            <div>
              <label htmlFor="phoneNumberId" className="label">Phone Number ID</label>
              <input
                id="phoneNumberId"
                name="phoneNumberId"
                type="text"
                required
                className="input font-mono"
                placeholder="123456789012345"
              />
            </div>

            <div>
              <label htmlFor="wabaId" className="label">WhatsApp Business Account ID (WABA ID)</label>
              <input
                id="wabaId"
                name="wabaId"
                type="text"
                required
                className="input font-mono"
                placeholder="987654321098765"
              />
            </div>

            <div>
              <label htmlFor="accessToken" className="label">Access Token</label>
              <input
                id="accessToken"
                name="accessToken"
                type="password"
                required
                className="input font-mono"
                placeholder="EAAx..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Se guarda cifrado con AES-256-GCM. Nunca se muestra en texto plano.
              </p>
            </div>

            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {state.error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Volver</button>
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? (
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

      {/* Step 4: Webhook configuration */}
      {showWebhookStep && (
        <div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">WhatsApp conectado correctamente</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Inbox ID: {state.inboxId}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">Último paso: Configurar webhook en Meta</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Para que los mensajes lleguen al bot, necesitás configurar el webhook en Meta Developer Console:
            </p>

            <div className="mt-4 space-y-4">
              <InstructionStep
                number={1}
                title="Andá a tu app en Meta Developers"
                description="Entrá a developers.facebook.com/apps y seleccioná tu app."
              />
              <InstructionStep
                number={2}
                title="Configurá el Webhook"
                description="En WhatsApp > Configuration, buscá la sección 'Webhook' y hacé clic en 'Edit'."
              />
              <InstructionStep
                number={3}
                title="Pegá esta Callback URL"
                description=""
              />
            </div>

            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Callback URL:</p>
              <code className="block break-all text-sm font-mono text-gray-900 dark:text-gray-100">
                {state.webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(state.webhookUrl || '')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                Copiar
              </button>
            </div>

            <div className="mt-4">
              <InstructionStep
                number={4}
                title="Suscribite a los eventos"
                description="En 'Webhook fields', asegurate de suscribirte a 'messages'. Esto permite que los mensajes entrantes lleguen a tu bot."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/dashboard/channels" className="btn-primary">
              Ir a Canales →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Requirement({
  number,
  title,
  description,
  link,
}: {
  number: number;
  title: string;
  description: string;
  link?: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
        {number}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
            Abrir →
          </a>
        )}
      </div>
    </div>
  );
}

function InstructionStep({
  number,
  title,
  description,
  highlight,
}: {
  number: number;
  title: string;
  description: string;
  highlight?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {number}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
        {highlight && (
          <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Copiá: {highlight}
          </span>
        )}
      </div>
    </div>
  );
}
