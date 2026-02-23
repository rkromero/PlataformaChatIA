'use client';

import { useState, useCallback } from 'react';

interface DataPoint {
  date: string;
  messages: number;
}

export function AnalyticsChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.messages), 1);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight' && index < data.length - 1) {
        e.preventDefault();
        setFocusedIndex(index + 1);
        (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        setFocusedIndex(index - 1);
        (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
      }
    },
    [data.length],
  );

  return (
    <div role="img" aria-label={`Gráfico de mensajes por día. Máximo: ${max} mensajes`}>
      <div className="flex items-end gap-1" style={{ height: 200 }} role="group" aria-label="Barras del gráfico">
        {data.map((d, i) => {
          const height = Math.max((d.messages / max) * 100, 1);
          const isActive = focusedIndex === i;

          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center"
              role="button"
              tabIndex={i === 0 ? 0 : -1}
              aria-label={`${d.date}: ${d.messages} mensajes`}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              onMouseEnter={() => setFocusedIndex(i)}
              onMouseLeave={() => setFocusedIndex(null)}
            >
              <div
                className={`pointer-events-none absolute -top-8 z-10 rounded bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-700 ${
                  isActive ? 'block' : 'hidden'
                }`}
              >
                {d.messages} msg
                <br />
                {d.date}
              </div>
              <div
                className={`w-full rounded-t transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-400 dark:bg-brand-500'
                    : 'bg-brand-500 dark:bg-brand-600'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % 5 === 0 && (
              <span className="text-[9px] text-gray-400">{d.date.slice(5)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
