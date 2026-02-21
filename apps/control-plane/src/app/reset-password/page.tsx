'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { resetPasswordAction } from './action';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);

  if (!token) {
    return (
      <div className="card text-center">
        <p className="text-sm text-red-600">Link inválido. Pedí un nuevo link de recuperación.</p>
        <Link href="/forgot-password" className="mt-3 inline-block text-sm font-medium text-brand-600">Recuperar contraseña</Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="card text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-medium">Contraseña actualizada</p>
        <Link href="/login" className="mt-3 inline-block text-sm font-medium text-brand-600">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="mb-6 text-center text-xl font-semibold">Nueva contraseña</h1>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label htmlFor="password" className="label">Nueva contraseña</label>
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
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="card p-8 text-center text-gray-400">Cargando...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
