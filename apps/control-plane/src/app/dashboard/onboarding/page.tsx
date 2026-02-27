'use client';

import { useState, useEffect, useTransition } from 'react';
import { saveOnboardingBotAction, completeOnboardingAction } from './actions';
import { connectWhatsAppAction } from '../channels/connect-whatsapp/actions';
import { BUSINESS_TYPE_PROMPTS } from '@/lib/default-prompts';

const BUSINESS_TYPES = [
  { label: 'Restaurante', iconKey: 'restaurant', promptKey: 'restaurant' },
  { label: 'E-commerce', iconKey: 'ecommerce', promptKey: 'ecommerce' },
  { label: 'Clínica / Salud', iconKey: 'health', promptKey: 'health' },
  { label: 'Inmobiliaria', iconKey: 'realestate', promptKey: 'realestate' },
  { label: 'Servicios', iconKey: 'services', promptKey: 'services' },
  { label: 'Otro', iconKey: 'other', promptKey: 'other' },
];

const ICONS: Record<string, string> = {
  restaurant: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z',
  ecommerce: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z',
  health: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
  realestate: 'm2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  services: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0',
  other: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z',
};

const STEPS = [
  { label: 'Tu negocio', icon: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z' },
  { label: 'WhatsApp', icon: 'M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
  { label: 'Listo', icon: 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z' },
];

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [saving, startSaving] = useTransition();
  const [showPrompt, setShowPrompt] = useState(false);

  const [waSubStep, setWaSubStep] = useState(0);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState<{ inboxId?: number; webhookUrl?: string } | null>(null);
  const [waConnecting, startWaConnecting] = useTransition();

  function selectBusinessType(index: number) {
    setSelectedType(index);
    const key = BUSINESS_TYPES[index].promptKey;
    const builder = BUSINESS_TYPE_PROMPTS[key] ?? BUSINESS_TYPE_PROMPTS.other;
    setPrompt(builder(businessName || '{nombre}'));
    setShowPrompt(false);
  }

  useEffect(() => {
    if (selectedType !== null) {
      const key = BUSINESS_TYPES[selectedType].promptKey;
      const builder = BUSINESS_TYPE_PROMPTS[key] ?? BUSINESS_TYPE_PROMPTS.other;
      setPrompt(builder(businessName || '{nombre}'));
    }
  }, [businessName, selectedType]);

  function handleStep1Next() {
    setError('');
    if (!businessName.trim() || businessName.trim().length < 2) {
      setError('Ingresá el nombre de tu negocio (mínimo 2 caracteres)');
      return;
    }
    if (selectedType === null) {
      setError('Elegí el tipo de negocio');
      return;
    }
    if (!prompt || prompt.length < 10) {
      setError('El prompt debe tener al menos 10 caracteres');
      return;
    }

    const fd = new FormData();
    fd.set('businessName', businessName.trim());
    fd.set('systemPrompt', prompt);

    startSaving(async () => {
      const result = await saveOnboardingBotAction(null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setStep(1);
      }
    });
  }

  function handleConnectWhatsApp(formData: FormData) {
    setWaError('');
    startWaConnecting(async () => {
      const result = await connectWhatsAppAction(null, formData);
      if (result?.error) {
        setWaError(result.error);
      } else if (result?.success) {
        setWaSuccess({ inboxId: result.inboxId, webhookUrl: result.webhookUrl });
      }
    });
  }

  const step1Ready = businessName.trim().length >= 2 && selectedType !== null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Progress bar */}
      <nav className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                  i < step
                    ? 'bg-brand-600 text-white'
                    : i === step
                      ? 'bg-brand-600 text-white ring-4 ring-brand-600/20'
                      : 'bg-white/5 text-gray-500'
                }`}>
                  {i < step ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium transition-colors ${
                  i <= step ? 'text-brand-400' : 'text-gray-500'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < step ? 'bg-brand-600' : 'bg-white/5'
                }`} />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ═══ STEP 1: Configure Bot ═══ */}
      {step === 0 && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Configurá tu bot</h2>
            <p className="mt-2 text-sm text-gray-400">
              En 2 minutos vas a tener un asistente virtual listo para atender clientes.
            </p>
          </div>

          {/* Business name */}
          <div className="card">
            <label htmlFor="businessName" className="text-sm font-medium text-gray-300">
              ¿Cómo se llama tu negocio?
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input mt-2"
              placeholder="Ej: Mi Tienda Online"
              autoFocus
            />
          </div>

          {/* Business type */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-300">
              ¿Qué tipo de negocio tenés?
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {BUSINESS_TYPES.map((type, i) => (
                <button
                  key={type.label}
                  onClick={() => selectBusinessType(i)}
                  className={`group cursor-pointer rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                    selectedType === i
                      ? 'border-brand-400 bg-brand-500/10 shadow-sm'
                      : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                    <svg className={`h-6 w-6 transition-colors ${selectedType === i ? 'text-brand-400' : 'text-gray-400 group-hover:text-gray-300'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[type.iconKey]} />
                  </svg>
                  <span className={`mt-2 block text-sm font-medium transition-colors ${selectedType === i ? 'text-brand-300' : ''}`}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt preview (collapsed by default) */}
          {selectedType !== null && (
            <div className="card space-y-3">
              <button
                type="button"
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-300">
                    Prompt del bot
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Auto-generado
                  </span>
                </div>
                <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showPrompt && (
                <div className="space-y-2">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={10}
                    className="input resize-y font-mono text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-400">
                    Este prompt se genera automáticamente según tu tipo de negocio. Podés editarlo ahora o después desde "Mi Bot".
                  </p>
                </div>
              )}

              {!showPrompt && (
                <p className="text-xs text-gray-400">
                  Generamos un prompt optimizado para {BUSINESS_TYPES[selectedType].label.toLowerCase()}. Podés verlo y editarlo, o dejarlo como está.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Next */}
          <button
            onClick={handleStep1Next}
            disabled={!step1Ready || saving}
            className="btn-primary w-full py-3 text-base"
          >
            {saving ? <Spinner /> : null}
            {saving ? 'Guardando...' : 'Siguiente →'}
          </button>
        </div>
      )}

      {/* ═══ STEP 2: Connect WhatsApp ═══ */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Conectá tu WhatsApp</h2>
            <p className="mt-2 text-sm text-gray-400">
              Elegí cómo querés conectar tu número para que el bot empiece a atender.
            </p>
          </div>

          {/* Method selection */}
          {waSubStep === 0 && !waSuccess && (
            <div className="space-y-3">
              <button
                onClick={() => setWaSubStep(1)}
                className="group w-full cursor-pointer rounded-xl border-2 border-brand-500/20 bg-brand-500/5 p-5 text-left transition-all duration-150 hover:border-brand-500/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
                    <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-300">WhatsApp Business API</h3>
                    <p className="mt-0.5 text-sm text-brand-400/80">
                      Conectá con tu Phone Number ID, WABA ID y Access Token de Meta.
                    </p>
                  </div>
                  <svg className="ml-auto h-5 w-5 text-brand-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>

              <div className="rounded-xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">¿Necesitás ayuda?</h3>
                    <p className="mt-0.5 text-sm text-gray-400">
                      Escribinos y te configuramos todo gratis.
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:soporte@chatplatform.com?subject=Conectar WhatsApp&body=Hola, quiero conectar mi WhatsApp al chatbot."
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300"
                >
                  Contactar soporte
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">
                  ← Volver
                </button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1">
                  Omitir por ahora →
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp form */}
          {waSubStep === 1 && !waSuccess && (
            <div>
              <div className="card mb-4">
                <p className="mb-3 text-sm text-gray-400">
                  Abrí{' '}
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-400 underline decoration-brand-600/30 hover:text-brand-300">
                    developers.facebook.com/apps
                  </a>
                  {' '}y buscá estos datos en WhatsApp &gt; API Setup:
                </p>
                <div className="space-y-2">
                  {[
                    { n: '1', label: 'Phone Number ID', desc: 'debajo del número seleccionado' },
                    { n: '2', label: 'WABA ID', desc: 'WhatsApp Business Account ID' },
                    { n: '3', label: 'Access Token', desc: 'hacé clic en "Generate" o creá uno permanente' },
                  ].map((item) => (
                    <div key={item.n} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[10px] font-bold text-brand-400">{item.n}</span>
                      <span>
                        <strong>{item.label}</strong>
                        <span className="text-gray-400"> — {item.desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <form action={handleConnectWhatsApp} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ob-phone" className="label">Teléfono</label>
                    <input id="ob-phone" name="phoneNumber" type="tel" required className="input" placeholder="+5491112345678" />
                  </div>
                  <div>
                    <label htmlFor="ob-pnid" className="label">Phone Number ID</label>
                    <input id="ob-pnid" name="phoneNumberId" type="text" required className="input font-mono text-xs" placeholder="123456789012345" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ob-waba" className="label">WABA ID</label>
                    <input id="ob-waba" name="wabaId" type="text" required className="input font-mono text-xs" placeholder="987654321098765" />
                  </div>
                  <div>
                    <label htmlFor="ob-token" className="label">Access Token</label>
                    <input id="ob-token" name="accessToken" type="password" required className="input font-mono text-xs" placeholder="EAAx..." />
                  </div>
                </div>

                {waError && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-400">{waError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setWaSubStep(0)} className="btn-secondary flex-1">
                    ← Volver
                  </button>
                  <button type="submit" disabled={waConnecting} className="btn-primary flex-1">
                    {waConnecting ? <Spinner /> : null}
                    {waConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* WhatsApp success */}
          {waSuccess && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <div>
                  <p className="font-medium text-emerald-300">WhatsApp conectado</p>
                  <p className="mt-0.5 text-sm text-emerald-400">Inbox ID: {waSuccess.inboxId}</p>
                </div>
              </div>

              <div className="card space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm font-medium">Configurá el webhook en Meta</p>
                </div>
                <p className="text-xs text-gray-400">
                  En tu app de Meta &gt; WhatsApp &gt; Configuration &gt; Webhook, pegá esta URL:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-white/5 px-3 py-2 font-mono text-xs">
                    {waSuccess.webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(waSuccess.webhookUrl || '')}
                    className="flex-shrink-0 rounded-lg border border-white/[0.06] p-2 text-gray-400 transition-colors hover:bg-white/5"
                    title="Copiar URL"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                    </svg>
                  </button>
                </div>
              </div>

              <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-base">
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 3: All set ═══ */}
      {step === 2 && (
        <div className="space-y-8 text-center">
          <div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">¡Tu bot está listo!</h2>
            <p className="mt-2 text-gray-400">
              Configurado y preparado para atender a tus clientes.
            </p>
          </div>

          <div className="mx-auto max-w-md space-y-3 text-left">
            {[
              { icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z', label: 'Probá tu bot desde el Sandbox', desc: 'Mandá mensajes de prueba sin necesidad de WhatsApp.' },
              { icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25', label: 'Cargá tu base de conocimiento', desc: 'Precios, menú, horarios — todo lo que el bot necesita saber.' },
              { icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75', label: 'Ajustá el prompt', desc: 'Personalizá cómo responde desde "Mi Bot" en el panel.' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-surface-2 p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                  <svg className="h-4.5 w-4.5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">{item.label}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <form action={completeOnboardingAction}>
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Ir a mi panel →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
