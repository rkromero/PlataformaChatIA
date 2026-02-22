'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

type Step = 'intro' | 'scanning' | 'connected' | 'error';

export default function ConnectQrPage() {
  const [step, setStep] = useState<Step>('intro');
  const [instanceName, setInstanceName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [qrBase64, setQrBase64] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');

  const checkStatus = useCallback(async () => {
    if (!instanceName || step !== 'scanning') return;
    try {
      const res = await fetch(`/api/evolution?action=status&instance=${instanceName}`);
      const data = await res.json();
      setStatus(data.state ?? 'unknown');

      if (data.state === 'open') {
        await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm', instanceName, channelId }),
        });
        setStep('connected');
      }
    } catch {}
  }, [instanceName, channelId, step]);

  useEffect(() => {
    if (step !== 'scanning') return;
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [checkStatus, step]);

  async function refreshQr() {
    if (!instanceName) return;
    try {
      const res = await fetch(`/api/evolution?action=qr&instance=${instanceName}`);
      const data = await res.json();
      if (data.base64) setQrBase64(data.base64);
    } catch {}
  }

  async function handleStart() {
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear instancia');
        setStep('error');
        return;
      }

      setInstanceName(data.instanceName);
      setChannelId(data.channelId);
      if (data.qrBase64) setQrBase64(data.qrBase64);
      setStep('scanning');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setStep('error');
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel() {
    if (instanceName) {
      try {
        await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', instanceName, channelId }),
        });
      } catch {}
    }
    setStep('intro');
    setInstanceName('');
    setChannelId('');
    setQrBase64('');
    setError('');
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard/channels"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a Canales
      </Link>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Conectar WhatsApp (QR)</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Escaneá el código QR con tu teléfono para conectar tu WhatsApp
      </p>

      {/* Intro */}
      {step === 'intro' && (
        <div>
          <div className="card space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Conexión rápida por QR</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Conectá cualquier WhatsApp personal o Business escaneando un código QR. Sin necesidad de API oficial ni verificación de Meta.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Cómo funciona:</p>
              <ol className="mt-2 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">1</span>
                  Hacé clic en "Generar QR"
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">2</span>
                  Abrí WhatsApp en tu teléfono → Dispositivos vinculados → Vincular dispositivo
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">3</span>
                  Escaneá el QR que aparece en pantalla
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">4</span>
                  Listo — el bot empieza a funcionar automáticamente
                </li>
              </ol>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Importante:</span> Este método no usa la API oficial de Meta. WhatsApp podría limitar cuentas que lo usen de forma intensiva. Para uso profesional, recomendamos la conexión vía API oficial.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleStart} disabled={creating} className="btn-primary">
              {creating ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generando...
                </>
              ) : (
                'Generar código QR'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scanning */}
      {step === 'scanning' && (
        <div className="text-center">
          <div className="card">
            <p className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
              Escaneá este código con tu WhatsApp
            </p>

            {qrBase64 ? (
              <div className="mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-2 dark:border-gray-700">
                <img
                  src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                  alt="QR Code"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-600/30 border-t-brand-600" />
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                status === 'open' ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
              }`} />
              <span className="text-xs text-gray-500">
                {status === 'open' ? 'Conectado' : 'Esperando escaneo...'}
              </span>
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              Abrí WhatsApp → Configuración → Dispositivos vinculados → Vincular dispositivo
            </p>

            <div className="mt-4 flex justify-center gap-2">
              <button onClick={refreshQr} className="btn-secondary text-xs">
                Regenerar QR
              </button>
              <button onClick={handleCancel} className="btn-secondary text-xs text-red-600 hover:text-red-700 dark:text-red-400">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected */}
      {step === 'connected' && (
        <div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
              <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-emerald-900 dark:text-emerald-300">
              WhatsApp conectado
            </h2>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
              Tu WhatsApp fue vinculado exitosamente. Los mensajes entrantes serán procesados por el bot automáticamente.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Tip:</span> No cierres sesión en WhatsApp del teléfono.
              La conexión se mantiene activa mientras tu teléfono tenga internet.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Link href="/dashboard/channels" className="btn-primary">
              Ir a Canales →
            </Link>
          </div>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
            <p className="font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep('intro')} className="btn-secondary">
              Intentar de nuevo
            </button>
            <Link href="/dashboard/channels" className="btn-secondary">
              Volver a Canales
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
