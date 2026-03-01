'use client';

import { useState } from 'react';

interface StageMetric {
  key: string;
  label: string;
  color: string;
  count: number;
  avgDaysInStage: number | null;
}

interface FunnelMetricsProps {
  stages: StageMetric[];
  totalLeads: number;
  conversionRate: number;
  avgCycleTime: number | null;
}

export function FunnelMetrics({ stages, totalLeads, conversionRate, avgCycleTime }: FunnelMetricsProps) {
  const [expanded, setExpanded] = useState(false);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  if (totalLeads === 0) return null;

  return (
    <div className="card mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-3 sm:items-center"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Embudo de ventas</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span>{totalLeads} leads</span>
            <span className="text-emerald-400">{conversionRate.toFixed(1)}% conversión</span>
            {avgCycleTime !== null && (
              <span>{avgCycleTime.toFixed(0)}d ciclo promedio</span>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Funnel bars */}
          <div className="space-y-2">
            {stages.map((stage, i) => {
              const pct = totalLeads > 0 ? ((stage.count / totalLeads) * 100) : 0;
              const prevCount = i > 0 ? stages[i - 1].count : totalLeads;
              const stageConversion = prevCount > 0 ? ((stage.count / prevCount) * 100) : 0;

              return (
                <div key={stage.key} className="rounded-lg border border-white/[0.06] p-2 sm:border-0 sm:p-0">
                  <div className="mb-1 flex items-center justify-between sm:hidden">
                    <span className="text-xs font-medium">{stage.label}</span>
                    {stage.avgDaysInStage !== null ? (
                      <span className="text-[10px] text-gray-400">{stage.avgDaysInStage.toFixed(0)}d prom.</span>
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden w-24 text-right sm:block">
                      <span className="text-xs font-medium">{stage.label}</span>
                    </div>
                    <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-white/5">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-md ${stage.color} transition-all duration-500`}
                      style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 3 : 0)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="relative z-10 text-xs font-semibold text-white mix-blend-difference">
                        {stage.count}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {pct.toFixed(0)}%
                        {i > 0 && stage.count > 0 && (
                          <span className="ml-1">
                            ({stageConversion.toFixed(0)}% del anterior)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                    <div className="hidden w-16 text-right sm:block">
                    {stage.avgDaysInStage !== null ? (
                      <span className="text-[10px] text-gray-400">{stage.avgDaysInStage.toFixed(0)}d prom.</span>
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-brand-600">{totalLeads}</p>
              <p className="text-[10px] text-gray-400">Total leads</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400">Tasa de cierre</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-gray-300">
                {avgCycleTime !== null ? `${avgCycleTime.toFixed(0)}d` : '—'}
              </p>
              <p className="text-[10px] text-gray-400">Ciclo promedio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
