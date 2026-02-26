'use client';

import { useActionState, useState } from 'react';
import { createAgentAction } from './actions';

export function InviteForm() {
  const [state, action, pending] = useActionState(createAgentAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-500 transition-all duration-150 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:bg-brand-500/5 dark:hover:text-brand-400"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
        Agregar miembro al equipo
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/10">
            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nuevo miembro</h2>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Cerrar formulario"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form action={action}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="invite-name" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Nombre completo
            </label>
            <input
              id="invite-name"
              name="name"
              type="text"
              required
              placeholder="Juan Pérez"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
            />
          </div>
          <div>
            <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="juan@empresa.com"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
            />
          </div>
          <div>
            <label htmlFor="invite-password" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="invite-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Rol
            </label>
            <select
              id="invite-role"
              name="role"
              className="w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
            >
              <option value="agent">Agente — acceso limitado</option>
              <option value="admin">Admin — acceso completo</option>
            </select>
          </div>
        </div>

        {state?.error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {state.message}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-500 disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            Crear miembro
          </button>
        </div>
      </form>
    </div>
  );
}
