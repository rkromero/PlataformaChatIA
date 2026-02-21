'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { acceptInviteAction } from './action';

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, formAction, pending] = useActionState(acceptInviteAction, null);

  if (!token) {
    return (
      <div className="card text-center">
        <p className="text-sm text-red-600">Link de invitación inválido.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">Aceptar invitación</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Creá tu contraseña para unirte al equipo
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="password" className="label">Contraseña</label>
          <input id="password" name="password" type="password" required minLength={6} className="input" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">Confirmar contraseña</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="input" />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{state.error}</p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
          Crear cuenta y unirme
        </button>
      </form>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="card p-8 text-center text-gray-400">Cargando...</div>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}
