'use client';

import { useState, useMemo, useCallback } from 'react';

interface DataPoint {
  date: string;
  messages: number;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const CHART_HEIGHT = 180;
const MIN_BAR_PX = 6;

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function formatRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${s.toLocaleDateString('es-AR', opts)} — ${e.toLocaleDateString('es-AR', opts)}`;
}

export function AnalyticsChart({ data }: { data: DataPoint[] }) {
  const weeks = useMemo(() => {
    const map = new Map<string, DataPoint[]>();
    for (const d of data) {
      const wk = getWeekStart(d.date);
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk)!.push(d);
    }
    return Array.from(map.entries()).map(([weekStart, days]) => ({ weekStart, days }));
  }, [data]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWeekStart = getWeekStart(todayStr);
  const defaultIdx = weeks.findIndex((w) => w.weekStart === todayWeekStart);
  const [weekIndex, setWeekIndex] = useState(defaultIdx >= 0 ? defaultIdx : weeks.length - 1);

  const week = weeks[weekIndex];
  const weekDays = week?.days ?? [];
  const max = Math.max(...weekDays.map((d) => d.messages), 1);
  const weekTotal = weekDays.reduce((s, d) => s + d.messages, 0);
  const lastDay = weekDays[weekDays.length - 1]?.date ?? '';
  const rangeLabel = week ? formatRange(week.weekStart, lastDay) : '';

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight' && index < weekDays.length - 1) {
        e.preventDefault();
        setFocusedIndex(index + 1);
        (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        setFocusedIndex(index - 1);
        (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
      }
    },
    [weekDays.length],
  );

  const canPrev = weekIndex > 0;
  const canNext = weekIndex < weeks.length - 1;

  return (
    <div>
      {/* Week navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => canPrev && setWeekIndex(weekIndex - 1)}
          disabled={!canPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-800"
          aria-label="Semana anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold">{rangeLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {weekTotal} mensaje{weekTotal !== 1 ? 's' : ''} esta semana
          </p>
        </div>

        <button
          onClick={() => canNext && setWeekIndex(weekIndex + 1)}
          disabled={!canNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-800"
          aria-label="Semana siguiente"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div role="img" aria-label={`Gráfico semanal. ${rangeLabel}. Total: ${weekTotal} mensajes`}>
        <div className="flex items-end gap-3 px-2" style={{ height: CHART_HEIGHT }}>
          {weekDays.map((d, i) => {
            const barPx = d.messages === 0
              ? MIN_BAR_PX
              : Math.max(Math.round((d.messages / max) * CHART_HEIGHT), MIN_BAR_PX + 4);
            const isActive = focusedIndex === i;
            const hasMessages = d.messages > 0;

            return (
              <div
                key={d.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: CHART_HEIGHT }}
                role="button"
                tabIndex={i === 0 ? 0 : -1}
                aria-label={`${DAY_NAMES[new Date(d.date + 'T12:00:00').getDay()]} ${d.date}: ${d.messages} mensajes`}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                onMouseEnter={() => setFocusedIndex(i)}
                onMouseLeave={() => setFocusedIndex(null)}
              >
                {/* Tooltip */}
                <div
                  className={`pointer-events-none absolute -top-12 z-10 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700 ${
                    isActive ? 'block' : 'hidden'
                  }`}
                >
                  <span className="font-bold">{d.messages}</span> mensaje{d.messages !== 1 ? 's' : ''}
                  <br />
                  <span className="text-gray-300">{d.date}</span>
                </div>

                {/* Message count above bar */}
                {hasMessages && (
                  <span className="mb-1 text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                    {d.messages}
                  </span>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-150 ${
                    !hasMessages
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : isActive
                        ? 'bg-brand-400 dark:bg-brand-400'
                        : 'bg-brand-500 dark:bg-brand-500'
                  }`}
                  style={{ height: barPx }}
                />
              </div>
            );
          })}
        </div>

        {/* Day labels */}
        <div className="mt-3 flex gap-3 px-2">
          {weekDays.map((d) => {
            const dow = DAY_NAMES[new Date(d.date + 'T12:00:00').getDay()];
            const isToday = d.date === todayStr;
            return (
              <div key={d.date} className="flex-1 text-center">
                <span className={`text-xs font-medium ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {dow}
                </span>
                <br />
                <span className={`text-[10px] ${isToday ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
                  {d.date.slice(8)}/{d.date.slice(5, 7)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
