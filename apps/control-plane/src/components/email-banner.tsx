'use client';

import { useState } from 'react';

export function EmailBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center justify-between bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
      <span>
        Tu email no está verificado. Revisá tu casilla ({email}).
      </span>
      {sent ? (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Enviado</span>
      ) : (
        <button
          onClick={resend}
          disabled={sending}
          className="font-medium underline hover:no-underline"
        >
          {sending ? 'Enviando...' : 'Reenviar email'}
        </button>
      )}
    </div>
  );
}
