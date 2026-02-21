'use client';

import { useActionState } from 'react';
import { inviteTeamMemberAction } from './actions';

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteTeamMemberAction, null);

  return (
    <form action={action} className="card">
      <h2 className="mb-3 text-sm font-semibold">Invitar miembro</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="email@ejemplo.com"
          className="input flex-1"
        />
        <select name="role" className="input sm:w-32">
          <option value="agent">Agente</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={pending} className="btn-primary whitespace-nowrap">
          {pending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          Invitar
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{state.message}</p>
      )}
    </form>
  );
}
