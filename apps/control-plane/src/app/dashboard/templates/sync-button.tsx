'use client';

import { useState, useTransition } from 'react';
import { syncTemplatesAction } from './actions';

export function SyncButton({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleSync() {
    startTransition(async () => {
      const res = await syncTemplatesAction();
      if (res.success) {
        setResult(`${res.count} plantilla(s) sincronizada(s)`);
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult(res.error ?? 'Error');
        setTimeout(() => setResult(null), 5000);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-gray-500">{result}</span>}
      <button
        onClick={handleSync}
        disabled={disabled || isPending}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        {isPending ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  );
}
