'use client';

import { useState, useActionState, useRef, useEffect } from 'react';
import { createLeadAction } from './actions';

export function NewLeadButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createLeadAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo Potencial
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Nuevo Potencial</h2>

            <form ref={formRef} action={formAction} className="space-y-4">
              <div>
                <label htmlFor="contactName" className="label">Nombre *</label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  className="input"
                  placeholder="Juan Pérez"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">Teléfono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <div>
                <label htmlFor="notes" className="label">Notas</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="input"
                  placeholder="Info adicional sobre el potencial cliente..."
                />
              </div>

              {state?.error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
