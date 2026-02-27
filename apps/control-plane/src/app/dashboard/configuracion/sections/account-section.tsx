'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { setLeadScoringEnabledAction } from '../actions';
import type { AccountData } from '../types';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  admin: 'Admin',
  agent: 'Agente',
};

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className={`text-sm font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

export function AccountSection({ data }: { data: AccountData }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleLeadScoring(enabled: boolean) {
    startTransition(async () => {
      const result = await setLeadScoringEnabledAction(enabled);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(enabled ? 'Calificación automática activada' : 'Calificación automática desactivada');
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Business info */}
      <section className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10">
            <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-100">Información del negocio</h2>
        </div>
        <dl className="divide-y divide-white/[0.06]">
          <InfoRow label="Nombre" value={data.tenantName} />
          <InfoRow label="Owner" value={`${data.ownerName} (${data.ownerEmail})`} />
          <InfoRow label="Estado" value={data.status === 'active' ? 'Activo' : data.status} />
          <InfoRow label="Onboarding" value={data.onboardingCompleted ? 'Completado' : 'Pendiente'} />
        </dl>
      </section>

      {/* Session info */}
      <section className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-100">Mi sesión</h2>
        </div>
        <dl className="divide-y divide-white/[0.06]">
          <InfoRow label="Email" value={data.sessionEmail} />
          <InfoRow label="Rol" value={ROLE_LABELS[data.sessionRole] ?? data.sessionRole} />
          <InfoRow label="Tenant ID" value={data.tenantId} mono />
        </dl>
      </section>

      {/* AI & Technical config */}
      <section className="card lg:col-span-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-100">Configuración técnica</h2>
        </div>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          <ConfigCard
            label="IA habilitada"
            value={data.aiEnabled ? 'Sí' : 'No'}
            status={data.aiEnabled ? 'success' : 'neutral'}
          />
          <ConfigCard label="Modelo IA" value={data.aiModel || 'N/D'} />
          <ConfigCard label="Plan" value={data.plan} />
          <ConfigCard label="Última actualización" value={data.lastUpdated || 'N/D'} />
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Para cambiar reglas de IA y horarios, podés hacerlo desde <span className="font-medium text-gray-300">Mi Bot</span>.
        </p>

        <div className="mt-5 border-t border-white/[0.06] pt-5">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-medium text-gray-100">Calificación automática de leads</p>
              <p className="mt-1 text-xs text-gray-400">
                Puntúa cada lead por intención de compra y lo clasifica en frío, tibio o caliente para priorizar ventas.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                defaultChecked={data.leadScoringEnabled}
                onChange={(e) => handleToggleLeadScoring(e.target.checked)}
                disabled={isPending}
              />
              <div className="h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:duration-200 after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: 'success' | 'neutral';
}) {
  return (
    <div className="border-b border-r border-white/[0.06] p-4 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(4n)]:border-r-0">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {status === 'success' && (
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
        <p className="text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
