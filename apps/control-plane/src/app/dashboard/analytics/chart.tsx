'use client';

interface DataPoint {
  date: string;
  messages: number;
}

export function AnalyticsChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.messages), 1);

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 200 }}>
        {data.map((d) => {
          const height = Math.max((d.messages / max) * 100, 1);
          const dayLabel = d.date.slice(8);

          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center">
              <div className="absolute -top-8 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-700">
                {d.messages} msg
                <br />
                {d.date}
              </div>
              <div
                className="w-full rounded-t bg-brand-500 transition-all hover:bg-brand-400 dark:bg-brand-600 dark:hover:bg-brand-500"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1">
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
