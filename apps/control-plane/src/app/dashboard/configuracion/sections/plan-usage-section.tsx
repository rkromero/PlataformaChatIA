'use client';

import { PlanSelector } from '../../plan/plan-selector';
import type { PlanUsageData } from '../types';

export function PlanUsageSection({ data }: { data: PlanUsageData }) {
  const { isTrial, isTrialExpired, trialDaysLeft, messagesUsed, messagesLimit, messagesPercent } = data;

  return (
    <div className="space-y-6">
      {/* Trial alerts */}
      {isTrial && !isTrialExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-800 bg-brand-500/10 px-5 py-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-brand-100">
              Período de prueba — {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
            </p>
            <p className="mt-0.5 text-xs text-brand-300">
              Probá todas las funciones con {messagesLimit.toLocaleString()} mensajes. Elegí un plan abajo para desbloquear todo.
            </p>
          </div>
        </div>
      )}
      {isTrial && isTrialExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-red-800 bg-red-500/10 px-5 py-4">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-100">Tu período de prueba terminó</p>
            <p className="mt-0.5 text-xs text-red-300">
              Tu bot dejó de responder. Elegí un plan abajo para reactivar todo al instante.
            </p>
          </div>
        </div>
      )}

      {/* Usage cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard
          label="Mensajes este mes"
          current={messagesUsed}
          limit={messagesLimit}
          percent={messagesPercent}
        />
        <UsageCard
          label="Canales activos"
          current={data.channelCount}
          limit={data.channelLimit}
          percent={data.channelLimit === -1 ? 0 : (data.channelCount / data.channelLimit) * 100}
          unlimited={data.channelLimit === -1}
        />
        <UsageCard
          label="Usuarios"
          current={data.userCount}
          limit={data.userLimit}
          percent={data.userLimit === -1 ? 0 : (data.userCount / data.userLimit) * 100}
          unlimited={data.userLimit === -1}
        />
      </div>

      {/* Plan selector */}
      <div>
        <h2 className="mb-4 text-base font-semibold">
          Tu plan actual: {data.planName}
          {isTrial && !isTrialExpired && (
            <span className="ml-2 text-sm font-normal text-brand-400">(prueba gratuita)</span>
          )}
        </h2>
        <PlanSelector
          currentPlan={data.currentPlan}
          plans={data.plans}
          isTrialExpired={isTrialExpired}
        />
      </div>
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  percent,
  unlimited = false,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
  unlimited?: boolean;
}) {
  const isWarning = percent >= 80 && percent < 100;
  const isDanger = percent >= 100;
  const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-brand-600';

  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{current.toLocaleString()}</span>
        <span className="text-sm text-gray-400">/ {unlimited ? '\u221E' : limit.toLocaleString()}</span>
      </div>
      {!unlimited && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
      {isDanger && <p className="mt-2 text-xs font-medium text-red-500">Límite alcanzado</p>}
      {isWarning && <p className="mt-2 text-xs font-medium text-amber-500">Casi al límite</p>}
    </div>
  );
}
