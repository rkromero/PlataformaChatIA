'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createChannelAction } from '../actions';

export default function NewChannelPage() {
  const [state, formAction, pending] = useActionState(createChannelAction, null);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/channels"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Channel WhatsApp</h1>
      </div>

      <form action={formAction} className="card max-w-xl space-y-5">
        <input type="hidden" name="type" value="whatsapp" />

        <div>
          <label htmlFor="chatwootInboxId" className="label">Chatwoot Inbox ID</label>
          <input
            id="chatwootInboxId"
            name="chatwootInboxId"
            type="number"
            required
            className="input"
            placeholder="1"
          />
        </div>

        <div>
          <label htmlFor="phoneNumberId" className="label">Phone Number ID (Meta)</label>
          <input
            id="phoneNumberId"
            name="phoneNumberId"
            type="text"
            required
            className="input"
            placeholder="1234567890"
          />
        </div>

        <div>
          <label htmlFor="wabaId" className="label">WABA ID</label>
          <input
            id="wabaId"
            name="wabaId"
            type="text"
            required
            className="input"
            placeholder="9876543210"
          />
        </div>

        <div>
          <label htmlFor="accessToken" className="label">Access Token</label>
          <input
            id="accessToken"
            name="accessToken"
            type="password"
            required
            className="input"
            placeholder="EAAx..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Se guarda cifrado con AES-256-GCM
          </p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Crear channel
        </button>
      </form>
    </div>
  );
}
