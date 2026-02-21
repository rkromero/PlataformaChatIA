'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { forgotPasswordAction } from './action';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ingresá tu email y te enviamos un link para restablecer tu contraseña
            </p>
          </div>

          {state?.success ? (
            <div className="rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-500/10">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Si existe una cuenta con ese email, vas a recibir un link para restablecer tu contraseña.
              </p>
              <Link href="/login" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-500">
                Volver al login
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="tu@email.com" />
              </div>

              {state?.error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{state.error}</p>
              )}

              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                Enviar link
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500">← Volver al login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
